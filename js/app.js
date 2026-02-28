/**
 * MGS BOARD GAME COMPANION - APP
 * Intro video → PS1 Main Menu → Stage system + Soundboard
 */

const App = {
    currentScreen: 'press-start-screen',
    currentStage: null,
    currentMusicBtn: null,
    currentAmbientBtn: null,
    currentVideoBtn: null,
    lastMusicId: null,
    musicIntroTimer: null,
    newGameMode: false,

    // Seamless loop players
    musicLoop: null,
    ambientLoop: null,
    alertLoop: null,
    evasionLoop: null,
    menuMusicLoop: null,

    // Web Audio API
    _audioCtx: null,
    _bufferCache: {},

    // Alert system
    alertState: 'normal',
    discoveryAudio: null,

    // Listener intro-ended (tracciato per poterlo rimuovere se l'intro viene stoppata)
    _introEndedListener: null,
    // Flag: outro in corso (per sbloccare NEXT anche se stoppato manualmente)
    _outroPlaying: false,
    // Flag: not-save outro in corso (per tornare a stage-active anche se stoppato manualmente)
    _notSaveOutroActive: false,
    // Flag: video save terminato naturalmente (distingue stop manuale da fine naturale)
    _saveVideoEnding: false,
    // Contatore chiamate Mei Ling senza salvare (reset a 0 quando si salva)
    _noSaveCount: 0,
    // Flag: salvataggio avvenuto nella visita corrente alla schermata save
    _savedThisVisit: false,
    // Volumi salvati prima del ducking video (null = nessun duck attivo)
    _duckVolumes: null,

    // Save system
    session: null,
    cardScreenMode: 'save',
    cardReturnScreen: 'main-menu',
    selectedCard: 1,
    selectedBlock: null,
    pendingNextStageId: null,
    cardPhase: 'card',       // 'card' | 'block' (solo save mode)
    focusedBlock: null,      // blockId attualmente in focus (fase blocchi)
    _visibleBlockIds: [],    // lista ordinata dei blockId mostrati (per navigazione tastiera)

    FADE_DURATION: 1500,
    LOOP_OVERLAP: 0.15,

    // ============================================
    // WEB AUDIO API
    // AudioContext creato durante un gesto utente per evitare stato suspended.
    // I buffer decodificati vengono cachati per evitare refetch.
    // ============================================
    _initAudioCtx() {
        if (!this._audioCtx) {
            this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            // Prima creazione: precarica tutti i menu sounds nel buffer cache (thread audio)
            Object.values(CONFIG.menuSounds).forEach(s => {
                this._loadBuffer(s.file).catch(() => {});
            });
        }
        if (this._audioCtx.state === 'suspended') {
            this._audioCtx.resume().catch(() => {});
        }
        return this._audioCtx;
    },

    _loadBuffer(file) {
        if (this._bufferCache[file]) return Promise.resolve(this._bufferCache[file]);
        return fetch(file)
            .then(r => r.arrayBuffer())
            .then(ab => this._audioCtx.decodeAudioData(ab))
            .then(buf => { this._bufferCache[file] = buf; return buf; });
    },

    // Menu system
    menuItems: [
        { label: 'NEW GAME',    action: 'newGame' },
        { label: 'LOAD GAME',   action: 'loadGame' },
        { label: 'BRIEFING',    action: 'briefing' },
        { label: 'VR TRAINING', action: 'vrTraining' },
    ],
    menuIndex: 0,
    menuLocked: false,

    // ============================================
    // SEAMLESS LOOP PLAYER
    // Prova Web Audio API (AudioBufferSourceNode.loop = true, zero gap).
    // Se WA non è pronto o fetch fallisce, usa il fallback dual-buffer new Audio().
    // ============================================
    _cfgLoopPoints(cfg) {
        return (cfg.loopStart != null || cfg.loopEnd != null)
            ? { introStart: cfg.introStart ?? null, start: cfg.loopStart ?? 0, end: cfg.loopEnd ?? 0 } : null;
    },

    createSeamlessLoop(file, volume, overlapOverride, loopPoints) {
        const ctx = this._audioCtx;

        if (ctx) {
            const gainNode = ctx.createGain();
            gainNode.gain.value = volume;
            gainNode.connect(ctx.destination);
            let source = null;
            let active = false;
            let currentVolume = volume;
            let legacy = null;

            // Se WA fallisce (fetch error, decode error), passa al dual-buffer legacy
            const fallbackToLegacy = () => {
                gainNode.disconnect();
                legacy = App._loopLegacy(file, currentVolume, overlapOverride);
                if (active) legacy.play();
            };

            return {
                play() {
                    active = true;
                    if (legacy) { legacy.play(); return; }
                    // Il buffer è già in cache se pre-warmato → _loadBuffer ritorna istantaneamente
                    App._loadBuffer(file).then(buffer => {
                        if (!active) return;
                        if (source) { try { source.stop(0); } catch(e) {} }
                        source = ctx.createBufferSource();
                        source.buffer = buffer;
                        source.loop = true;
                        if (loopPoints) {
                            source.loopStart = loopPoints.start ?? 0;
                            source.loopEnd   = loopPoints.end   ?? 0;
                        }
                        source.connect(gainNode);
                        const startOffset = loopPoints
                            ? (loopPoints.introStart ?? loopPoints.start ?? 0)
                            : 0;
                        source.start(0, startOffset);
                    }).catch(e => {
                        console.warn('WA loop fallback:', file, e.message);
                        fallbackToLegacy();
                    });
                },
                stop() {
                    active = false;
                    gainNode.gain.value = 0;
                    if (source) { try { source.stop(0); } catch(e) {} source = null; }
                    if (legacy) { legacy.stop(); }
                },
                setVolume(v) {
                    currentVolume = v;
                    gainNode.gain.value = v;
                    if (legacy) legacy.setVolume(v);
                },
                getVolume() { return currentVolume; },
                isPlaying() { return legacy ? legacy.isPlaying() : (active && source !== null); },
            };
        }

        return this._loopLegacy(file, volume, overlapOverride);
    },

    _loopLegacy(file, volume, overlapOverride) {
        const self = this;
        const overlap = (overlapOverride !== undefined) ? overlapOverride : self.LOOP_OVERLAP;
        const loop = {
            file, volume,
            audioA: new Audio(file),
            audioB: new Audio(file),
            current: 'A',
            active: true,
            rafId: null,
        };
        loop.audioA.volume = volume;
        loop.audioB.volume = volume;

        const switchToNext = (current, next) => {
            if (!loop.active) return;
            next.currentTime = 0;
            next.volume = loop.volume;
            next.play().catch(e => console.warn(e.message));
            loop.current = loop.current === 'A' ? 'B' : 'A';
            scheduleNext();
        };

        const scheduleNext = () => {
            if (!loop.active) return;
            const current = loop.current === 'A' ? loop.audioA : loop.audioB;
            const next    = loop.current === 'A' ? loop.audioB : loop.audioA;
            let fired = false;

            const onEnded = () => {
                if (!loop.active || fired) return;
                fired = true;
                if (loop.rafId) { cancelAnimationFrame(loop.rafId); loop.rafId = null; }
                switchToNext(current, next);
            };
            current.addEventListener('ended', onEnded, { once: true });

            const check = () => {
                if (!loop.active) return;
                const remaining = current.duration - current.currentTime;
                if (!isNaN(current.duration) && remaining > 0 && remaining <= overlap) {
                    if (fired) return;
                    fired = true;
                    current.removeEventListener('ended', onEnded);
                    switchToNext(current, next);
                } else {
                    loop.rafId = requestAnimationFrame(check);
                }
            };
            loop.rafId = requestAnimationFrame(check);
        };

        return {
            play() {
                loop.active = true;
                loop.audioA.currentTime = 0;
                loop.audioA.volume = loop.volume;
                loop.audioA.play().then(() => { loop.current = 'A'; scheduleNext(); }).catch(e => console.warn(e.message));
            },
            stop() {
                loop.active = false;
                if (loop.rafId) { cancelAnimationFrame(loop.rafId); loop.rafId = null; }
                loop.audioA.pause(); loop.audioA.currentTime = 0;
                loop.audioB.pause(); loop.audioB.currentTime = 0;
            },
            setVolume(v) { loop.volume = v; loop.audioA.volume = v; loop.audioB.volume = v; },
            getVolume() { return loop.volume; },
            isPlaying() { return loop.active && (!loop.audioA.paused || !loop.audioB.paused); },
        };
    },

    // ============================================
    // PRESS START → INTRO VIDEO → MENU
    // ============================================
    startIntroVideo() {
        this._initAudioCtx(); // deve essere chiamato durante un gesto utente
        const video = document.getElementById('intro-video');

        // Show intro screen
        this.showScreen('intro-screen');

        if (video) {
            // If video fails to load, skip to menu
            video.addEventListener('error', () => {
                this.goToMainMenu();
            }, { once: true });

            video.addEventListener('ended', () => {
                this.goToMainMenu();
            }, { once: true });

            video.play().catch(e => {
                console.warn('Intro error:', e.message);
                this.goToMainMenu();
            });
        } else {
            this.goToMainMenu();
        }
    },

    skipIntro() {
        const video = document.getElementById('intro-video');
        if (video) {
            video.pause();
            video.removeAttribute('src');
            video.load();
        }
        this.goToMainMenu();
    },

    goToMainMenu() {
        this.menuLocked = true;
        this.showScreen('main-menu');

        // Reset animations
        const splash = document.getElementById('menu-splash');
        const wheel = document.getElementById('menu-wheel');
        if (splash) splash.classList.remove('appear');
        if (wheel) wheel.classList.remove('appear');

        // Wait for screen to become active
        setTimeout(() => {
            this.updateMenuWheel();

            // Start audio immediately
            this.startMenuMusic();

            // Step 1: Splash fades in slowly (3s)
            if (splash) {
                void splash.offsetHeight;
                splash.classList.add('appear');
            }

            // Step 2: After splash is mostly visible, show menu wheel
            setTimeout(() => {
                if (wheel) {
                    void wheel.offsetHeight;
                    wheel.classList.add('appear');
                }
                // Unlock menu interaction
                setTimeout(() => {
                    this.menuLocked = false;
                }, 800);
            }, 2500);
        }, 150);
    },

    // Hide wheel when leaving menu
    hideMenuWheel() {
        const wheel = document.getElementById('menu-wheel');
        if (wheel) wheel.classList.remove('appear');
    },

    // ============================================
    // MAIN MENU
    // ============================================
    startMenuMusic() {
        this.stopMenuMusic();
        this._initAudioCtx();
        const cfg = CONFIG.music['introduction'];
        if (!cfg) return;
        if (this._audioCtx) this._loadBuffer(cfg.file).catch(() => {});
        this.menuMusicLoop = this.createSeamlessLoop(cfg.file, 0.35, cfg.loopOverlap, this._cfgLoopPoints(cfg));
        this.menuMusicLoop.play();
    },

    stopMenuMusic() {
        if (this.menuMusicLoop) { this.menuMusicLoop.stop(); this.menuMusicLoop = null; }
    },

    updateMenuWheel() {
        const items = this.menuItems;
        const len = items.length;
        const prevIdx = (this.menuIndex - 1 + len) % len;
        const nextIdx = (this.menuIndex + 1) % len;

        const prevEl = document.getElementById('menu-prev');
        const labelEl = document.getElementById('menu-label');
        const nextEl = document.getElementById('menu-next');

        if (prevEl) prevEl.textContent = items[prevIdx].label;
        if (labelEl) labelEl.textContent = items[this.menuIndex].label;
        if (nextEl) nextEl.textContent = items[nextIdx].label;
    },

    menuNav(dir) {
        if (this.menuLocked) return;
        this.menuLocked = true;

        const wheel = document.getElementById('menu-wheel');
        const len = this.menuItems.length;

        // Play choice sound
        this.playSfx(CONFIG.menuSounds['choice'].file);

        // Add slide class to trigger CSS transition
        if (wheel) {
            wheel.classList.add(dir > 0 ? 'slide-up' : 'slide-down');
        }

        // After transition, update content and reset
        setTimeout(() => {
            this.menuIndex = (this.menuIndex + dir + len) % len;

            if (wheel) {
                // Disable ALL transitions for instant reset
                const items = wheel.querySelectorAll('.menu-item');
                items.forEach(item => item.style.transition = 'none');
                wheel.classList.remove('slide-up', 'slide-down');
            }

            this.updateMenuWheel();

            if (wheel) {
                // Force reflow then re-enable transitions
                void wheel.offsetHeight;
                const items = wheel.querySelectorAll('.menu-item');
                items.forEach(item => item.style.transition = '');
            }
            this.menuLocked = false;
        }, 450);
    },

    menuConfirm() {
        if (this.menuLocked) return;

        const item = this.menuItems[this.menuIndex];
        if (!item) return;

        // Play confirm sound
        this.playSfx(CONFIG.menuSounds['confirm'].file);

        setTimeout(() => {
            this.hideMenuWheel();
            switch (item.action) {
                case 'newGame':
                    this.stopMenuMusic();
                    this.newGameMode = true;
                    this._noSaveCount = 0;
                    this.session = this._newSession();
                    this._persistSession();
                    this.showBlackTransition(() => {
                        this.selectStage(1);
                    });
                    break;
                case 'loadGame':
                    this.stopMenuMusic();
                    this.newGameMode = true;
                    this.showLoadScreen();
                    break;
                case 'briefing':
                    this.stopMenuMusic();
                    this.showBriefing();
                    break;
                case 'vrTraining':
                    this.stopMenuMusic();
                    this.showScreen('vr-screen');
                    break;
            }
        }, 300);
    },

    playMenuReturn() {
        this.playSfx(CONFIG.menuSounds['return'].file);
        this.startMenuMusic();
        this.menuLocked = true;

        // Re-show splash and wheel when returning to menu
        setTimeout(() => {
            this.updateMenuWheel();
            const splash = document.getElementById('menu-splash');
            const wheel = document.getElementById('menu-wheel');
            if (splash) {
                splash.classList.remove('appear');
                void splash.offsetHeight;
                splash.classList.add('appear');
            }
            if (wheel) {
                void wheel.offsetHeight;
                wheel.classList.add('appear');
            }
            setTimeout(() => {
                this.menuLocked = false;
            }, 400);
        }, 250);
    },

    showBlackTransition(callback) {
        const div = document.createElement('div');
        div.className = 'black-transition';
        document.body.appendChild(div);

        // Hold black screen for 2 seconds, then fade out and execute callback
        setTimeout(() => {
            if (callback) callback();
            div.classList.add('fade-out');
            setTimeout(() => {
                div.remove();
            }, 500);
        }, 2000);
    },

    // ============================================
    // BRIEFING
    // ============================================
    showBriefing() {
        this.showScreen('briefing-screen');
        const video = document.getElementById('briefing-video');
        if (video) {
            video.src = 'video/briefing.mp4';
            video.play().catch(e => console.warn(e.message));
        }
    },

    stopBriefing() {
        const video = document.getElementById('briefing-video');
        if (video) {
            video.pause();
            video.removeAttribute('src');
            video.load();
        }
    },

    // ============================================
    // SCREEN MANAGEMENT
    // ============================================
    showScreen(screenId) {
        const current = document.querySelector('.screen.active');
        if (current) current.classList.remove('active');

        setTimeout(() => {
            const next = document.getElementById(screenId);
            if (next) {
                next.classList.add('active');
                this.currentScreen = screenId;
                window.scrollTo(0, 0);
            }
        }, 100);
    },

    // ============================================
    // STAGE SELECT
    // ============================================
    initStageGrid() {
        const grid = document.getElementById('stage-grid');
        if (!grid) return;

        grid.innerHTML = CONFIG.stages.map(stage => {
            const hasIntro = stage.intro && stage.intro.length > 0;
            const hasOutro = stage.outro && stage.outro.length > 0;
            const hasIndicators = hasIntro || hasOutro;

            return `
                <div class="stage-card" onclick="App.selectStage(${stage.id})" role="button" tabindex="0">
                    <div class="stage-card-number">STAGE ${String(stage.id).padStart(2, '0')}</div>
                    <div class="stage-card-name">${stage.name}</div>
                    <div class="stage-card-type ${stage.isBoss ? 'boss' : ''}">${stage.type}</div>
                    ${hasIndicators ? `
                        <div class="stage-card-indicators">
                            ${hasIntro ? '<span class="indicator has-intro">INTRO</span>' : ''}
                            ${hasOutro ? '<span class="indicator has-outro">OUTRO</span>' : ''}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    },

    selectStage(stageId) {
        const stage = CONFIG.stages.find(s => s.id === stageId);
        if (!stage) return;

        this._initAudioCtx();
        this.currentStage = stage;
        this.stopAllAudio();
        this.lastMusicId = null;
        this.alertState = 'normal';
        if (this.session) { this.session.stage = stage.id; this._persistSession(); }

        const title = document.getElementById('active-stage-title');
        if (title) title.textContent = `STAGE ${String(stage.id).padStart(2, '0')} — ${stage.name.toUpperCase()}`;

        const status = document.getElementById('stage-status');
        if (status) {
            status.textContent = stage.isBoss ? 'BOSS BATTLE' : 'SNEAKING MISSION';
            status.style.color = stage.isBoss ? 'var(--codec-red)' : 'var(--codec-orange)';
            status.style.borderColor = stage.isBoss ? 'rgba(255, 58, 58, 0.3)' : 'rgba(255, 140, 58, 0.3)';
        }

        // Back button: ◄ MENU in newGameMode, ◄ MISSIONI in loadGame
        const btnBack = document.getElementById('btn-stage-back');
        if (btnBack) btnBack.textContent = this.newGameMode ? '◄ MENU' : '◄ MISSIONI';

        const btnIntro = document.getElementById('btn-intro');
        const btnOutro = document.getElementById('btn-outro');
        if (btnIntro) {
            const hasIntro = stage.intro && stage.intro.length > 0;
            btnIntro.disabled = !hasIntro;
            btnIntro.style.opacity = hasIntro ? '1' : '0.3';
        }
        if (btnOutro) {
            const hasOutro = stage.outro && stage.outro.length > 0;
            btnOutro.disabled = !hasOutro;
            btnOutro.style.opacity = hasOutro ? '1' : '0.3';
        }

        // MEI LING: label "SALVATAGGIO" nel titolo ALERT visibile dal 2° stage in poi
        const meiLingSection = document.getElementById('mei-ling-section');
        if (meiLingSection) meiLingSection.style.display = stage.id >= 2 ? '' : 'none';

        // NEXT STAGE button: visibile solo in newGameMode, disabilitato finché outro non visto
        const btnNext = document.getElementById('btn-next-stage');
        if (btnNext) {
            const hasNextStage = !!CONFIG.stages.find(s => s.id === stage.id + 1);
            if (this.newGameMode && hasNextStage) {
                btnNext.style.display = '';
                btnNext.disabled = true;
                btnNext.style.opacity = '0.3';
            } else {
                btnNext.style.display = 'none';
            }
        }

        this.stopVideo();
        this.buildEventButtons(stage);
        this.buildMusicButtons(stage);
        this.buildAmbientButtons(stage);
        this.buildGameOverButton(stage);
        this.buildAlertSection(stage);
        this.buildGuardSection(stage);

        this.showScreen('stage-active');

        if (stage.intro && stage.intro.length > 0) {
            setTimeout(() => {
                this.playIntroThenMusic();
            }, 300);
        } else {
            setTimeout(() => {
                this.playFirstAmbient();
                this.playFirstMusic();
            }, 300);
        }
    },

    // ============================================
    // VIDEO PLAYER
    // ============================================
    setActiveVideoBtn(btn) {
        if (this.currentVideoBtn) this.currentVideoBtn.classList.remove('playing');
        this.currentVideoBtn = btn || null;
        if (this.currentVideoBtn) this.currentVideoBtn.classList.add('playing');
    },

    _duckAudio() {
        const DUCK = 0.15;
        this._duckVolumes = {};
        const loops = { musicLoop: this.musicLoop, ambientLoop: this.ambientLoop, alertLoop: this.alertLoop, evasionLoop: this.evasionLoop };
        for (const [key, loop] of Object.entries(loops)) {
            if (loop && loop.isPlaying()) {
                this._duckVolumes[key] = loop.getVolume();
                loop.setVolume(this._duckVolumes[key] * DUCK);
            }
        }
    },

    _unduckAudio() {
        if (!this._duckVolumes) return;
        const loops = { musicLoop: this.musicLoop, ambientLoop: this.ambientLoop, alertLoop: this.alertLoop, evasionLoop: this.evasionLoop };
        for (const [key, vol] of Object.entries(this._duckVolumes)) {
            const loop = loops[key];
            if (loop && loop.isPlaying()) loop.setVolume(vol);
        }
        this._duckVolumes = null;
    },

    playVideo(src) {
        if (!src || src.length === 0) return;

        this._duckAudio();
        const wrapper = document.getElementById('video-wrapper');
        const player = document.getElementById('video-player');
        const placeholder = document.getElementById('video-placeholder');
        const stopBtn = document.getElementById('btn-stop-video');

        if (wrapper) wrapper.style.display = '';
        if (placeholder) placeholder.style.display = 'none';
        if (player) {
            player.src = src;
            player.style.display = 'block';
            player.play().catch(e => console.warn('Video:', e.message));
            // Rimuove l'highlight quando il video finisce naturalmente
            player.addEventListener('ended', () => this.stopVideo(), { once: true });
        }
        if (stopBtn) stopBtn.style.display = '';
        document.getElementById('stage-active')?.classList.add('stage-video-active');
    },

    buildEventButtons(stage) {
        const container = document.getElementById('event-buttons');
        if (!container) return;
        const events = stage.events || [];
        container.innerHTML = events.map(ev => `
            <button class="btn-codec btn-video" id="btn-event-${ev.id}" onclick="App.playEvent('${ev.id}')">
                <span class="btn-inner">▶ EVENTO ${ev.id}</span>
            </button>
        `).join('');
    },

    playEvent(id) {
        if (!this.currentStage) return;
        const ev = (this.currentStage.events || []).find(e => e.id === id);
        if (!ev || !ev.file) return;
        if (ev.stopMusic) {
            this.stopMusic();
            this.stopAlertSystem();
        }
        this.setActiveVideoBtn(document.getElementById(`btn-event-${id}`));
        this.playVideo(ev.file);
    },

    _afterIntroEnd() {
        if (this.musicIntroTimer) {
            clearTimeout(this.musicIntroTimer);
            this.musicIntroTimer = null;
        }
        if (!this.ambientLoop || !this.ambientLoop.isPlaying()) this.playFirstAmbient();
        if (this.currentStage && this.currentStage.startInAlert) {
            this.triggerAlert();
        } else if (this.musicLoop && this.musicLoop.isPlaying()) {
            this.fadeMusicToNormalVolume();
        } else if (!this.musicLoop || !this.musicLoop.isPlaying()) {
            this.playFirstMusic();
        }
    },

    playIntroThenMusic() {
        if (!this.currentStage) return;
        const stage = this.currentStage;
        const player = document.getElementById('video-player');
        const ids = stage.musicIds || [];

        // Rimuovi eventuale listener rimasto da un'intro precedente non completata
        if (player && this._introEndedListener) {
            player.removeEventListener('ended', this._introEndedListener);
            this._introEndedListener = null;
        }

        if (stage.musicDuringIntro && ids.length > 0) {
            const delay = stage.musicIntroDelay || 0;
            const introVolume = (stage.musicIntroVolume || 20) / 100;
            this.musicIntroTimer = setTimeout(() => {
                this.playMusicAtVolume(ids[0], introVolume);
            }, delay);
        }

        this._introEndedListener = () => {
            this._introEndedListener = null;
            this.stopVideo();
            this._afterIntroEnd();
        };

        if (player) {
            player.addEventListener('ended', this._introEndedListener, { once: true });
        }

        this.setActiveVideoBtn(document.getElementById('btn-intro'));
        this.playVideo(stage.intro);
    },

    playFirstMusic() {
        if (!this.currentStage) return;
        const ids = this.currentStage.musicIds || [];
        if (ids.length > 0) this.playMusic(ids[0]);
    },

    playFirstAmbient() {
        if (!this.currentStage) return;
        const ids = this.currentStage.ambientIds || [];
        if (ids.length > 0) this.playAmbient(ids[0]);
    },

    playIntro() {
        if (!this.currentStage) return;
        this.stopAllAudio();
        this.setActiveVideoBtn(document.getElementById('btn-intro'));
        this.playVideo(this.currentStage.intro);
    },

    playOutro() {
        if (!this.currentStage) return;
        this.stopAllAudio();
        this.setActiveVideoBtn(document.getElementById('btn-outro'));
        this._outroPlaying = this.newGameMode;
        this.playVideo(this.currentStage.outro);

        // Sblocca NEXT STAGE alla fine dell'outro (solo in newGameMode)
        if (this.newGameMode) {
            const player = document.getElementById('video-player');
            if (player) {
                player.addEventListener('ended', () => {
                    this._outroPlaying = false;
                    this.unlockNextStage();
                }, { once: true });
            }
        }
    },

    unlockNextStage() {
        const btnNext = document.getElementById('btn-next-stage');
        if (btnNext && btnNext.style.display !== 'none') {
            btnNext.disabled = false;
            btnNext.style.opacity = '1';
        }
    },

    goBackFromStage() {
        this.stopAllAudio();
        if (this.newGameMode) {
            this.playMenuReturn();
            this.showScreen('main-menu');
        } else {
            this.showScreen('stage-select');
        }
    },

    goNextStage() {
        if (!this.currentStage) return;
        const nextStage = CONFIG.stages.find(s => s.id === this.currentStage.id + 1);
        if (!nextStage) return;
        this.selectStage(nextStage.id);
    },

    openMeiLing() {
        this._initAudioCtx(); // precarica buffer suoni menu per risposta immediata
        this.cardScreenMode = 'save';
        this.cardReturnScreen = 'stage-active';
        this._savedThisVisit = false;
        this.pendingNextStageId = null;
        this.selectedCard = 1;
        this.selectedBlock = null;
        this._renderCardScreen();
        this.showScreen('card-screen');
        setTimeout(() => this._autoPlaySaveIntro(), 300);
    },

    stopVideo() {
        if (this.musicIntroTimer) {
            clearTimeout(this.musicIntroTimer);
            this.musicIntroTimer = null;
        }
        this.setActiveVideoBtn(null);

        const wrapper = document.getElementById('video-wrapper');
        const player = document.getElementById('video-player');
        const stopBtn = document.getElementById('btn-stop-video');

        if (player) {
            player.onended = null;
            if (this._introEndedListener) {
                player.removeEventListener('ended', this._introEndedListener);
                this._introEndedListener = null;
                // Intro interrotta manualmente: avvia ambient/musica se non già in corso
                setTimeout(() => this._afterIntroEnd(), 0);
            }
            if (this._outroPlaying) {
                this._outroPlaying = false;
                this.unlockNextStage();
            }
            player.pause();
            player.removeAttribute('src');
            player.load();
            player.style.display = 'none';
        }
        if (stopBtn) stopBtn.style.display = 'none';
        if (wrapper) wrapper.style.display = 'none';
        document.getElementById('stage-active')?.classList.remove('stage-video-active');
        document.getElementById('stage-active')?.scrollTo({ top: 0, behavior: 'smooth' });
        this._unduckAudio();
    },

    // ============================================
    // MUSIC - seamless loop
    // ============================================
    buildMusicButtons(stage) {
        const category = document.getElementById('music-category');
        const container = document.getElementById('music-buttons');
        if (!container) return;

        const ids = stage.musicIds || [];
        if (ids.length === 0) {
            if (category) category.style.display = 'none';
            return;
        }

        if (category) category.style.display = '';
        container.innerHTML = ids.map(id => {
            const track = CONFIG.music[id];
            if (!track) return '';
            return `<button class="btn-sound" id="music-btn-${id}" onclick="App.playMusic('${id}')">♪ ${track.name}</button>`;
        }).join('');
    },

    playMusicAtVolume(id, volume) {
        const track = CONFIG.music[id];
        if (!track) return;
        this.stopMusic();
        this.lastMusicId = id;
        this.musicLoop = this.createSeamlessLoop(track.file, volume, track.loopOverlap, this._cfgLoopPoints(track));
        this.musicLoop.play();
        const controls = document.getElementById('music-controls');
        if (controls) controls.style.display = '';
        this.currentMusicBtn = document.getElementById(`music-btn-${id}`);
        if (this.currentMusicBtn) this.currentMusicBtn.classList.add('playing');
    },

    playMusic(id) {
        const normalVolume = (document.getElementById('music-volume')?.value || 50) / 100;
        this.playMusicAtVolume(id, normalVolume);
    },

    fadeMusicToNormalVolume() {
        if (!this.musicLoop) return;
        const targetVolume = (document.getElementById('music-volume')?.value || 50) / 100;
        const startVolume = this.musicLoop.getVolume();
        const steps = 30;
        const interval = this.FADE_DURATION / steps;
        let step = 0;
        const timer = setInterval(() => {
            step++;
            const progress = step / steps;
            this.musicLoop.setVolume(Math.min(targetVolume, startVolume + (targetVolume - startVolume) * progress));
            if (step >= steps) {
                clearInterval(timer);
                this.musicLoop.setVolume(targetVolume);
            }
        }, interval);
    },

    setMusicVolume(val) {
        if (this.musicLoop) this.musicLoop.setVolume(val / 100);
    },

    stopMusic() {
        if (this.musicLoop) { this.musicLoop.stop(); this.musicLoop = null; }
        if (this.currentMusicBtn) { this.currentMusicBtn.classList.remove('playing'); this.currentMusicBtn = null; }
        // Differisce il layout shift al frame successivo per evitare ghost click
        requestAnimationFrame(() => {
            const controls = document.getElementById('music-controls');
            if (controls) controls.style.display = 'none';
        });
    },

    // ============================================
    // ALERT SYSTEM - seamless loops
    // ============================================
    buildAlertSection(stage) {
        const container = document.getElementById('alert-section');
        if (!container) return;

        const meiLingVisible = stage.id >= 2;
        const meiLingBtn = `<div id="mei-ling-btn-wrapper" style="display:${meiLingVisible ? '' : 'none'}; margin-left:auto">
                <button class="btn-codec btn-small btn-mei-ling" id="btn-mei-ling" onclick="App.openMeiLing()">
                    <span class="btn-inner">MEI LING</span>
                </button>
            </div>`;

        if (stage.isBoss) {
            container.innerHTML = '<div class="no-audio-msg">Alert disabilitato nelle boss fight</div>';
            container.insertAdjacentHTML('beforeend', meiLingBtn);
            return;
        }

        container.innerHTML = `
            <button class="btn-sound btn-alert" id="btn-alert" onclick="App.triggerAlert()">
                <span class="sfx-icon">!</span> Alert
            </button>
            <button class="btn-sound btn-evasion" id="btn-evasion" onclick="App.triggerEvasion()" disabled style="opacity:0.3">
                <span class="sfx-icon">~</span> Evasion
            </button>
            <button class="btn-sound btn-return" id="btn-return" onclick="App.triggerReturn()" disabled style="opacity:0.3">
                <span class="sfx-icon">✓</span> Tornate ai vostri posti
            </button>
        `;
        container.insertAdjacentHTML('beforeend', meiLingBtn);
    },

    buildGuardSection(stage) {
        const category = document.getElementById('guard-category');
        if (!category) return;

        if (stage.isBoss) {
            category.style.display = 'none';
            return;
        }

        category.style.display = '';
        this.updateGuardButtons();
    },

    playGuardSound(id) {
        const s = CONFIG.guardSounds.find(g => g.id === id);
        if (!s) return;
        const file = (this.alertState !== 'normal' && s.fileAlert) ? s.fileAlert : s.fileNormal;
        this.playSfx(file, s.track);
    },

    updateGuardButtons() {
        const isAlert = this.alertState !== 'normal';
        CONFIG.guardSounds.forEach(s => {
            const btn = document.getElementById(`guard-btn-${s.id}`);
            if (!btn) return;
            btn.textContent = (isAlert && s.nameAlert) ? s.nameAlert : s.nameNormal;
        });
    },

    triggerAlert() {
        if (!this.currentStage || this.currentStage.isBoss) return;
        const sounds = CONFIG.alertSounds;

        if (this.alertState === 'normal') {
            this.trackStat('alerts');
            this.stopMusic();
            this.discoveryAudio = new Audio(sounds['discovery'].file);
            this.discoveryAudio.volume = 0.8;
            this.discoveryAudio.play().catch(e => console.warn(e.message));

            const alertCfg = CONFIG.music['encounter'];
            this.alertLoop = this.createSeamlessLoop(alertCfg.file, 0.8, alertCfg.loopOverlap, this._cfgLoopPoints(alertCfg));
            this.alertLoop.play();

            this.alertState = 'alert';
            this.updateAlertButtons();

        } else if (this.alertState === 'alert') {
            const thisWay = new Audio(sounds['this-way'].file);
            thisWay.volume = 0.8;
            thisWay.play().catch(e => console.warn(e.message));

        } else if (this.alertState === 'evasion') {
            this.trackStat('alerts');
            this.crossfadeLoops(this.evasionLoop, this.alertLoop);
            const thisWay = new Audio(sounds['this-way'].file);
            thisWay.volume = 0.8;
            thisWay.play().catch(e => console.warn(e.message));
            this.alertState = 'alert';
            this.updateAlertButtons();
        }
    },

    triggerEvasion() {
        if (this.alertState !== 'alert') return;

        // Create evasionLoop fresh at target volume — avoids race condition
        // where a silent pre-created loop may not be playing yet
        if (this.evasionLoop) { this.evasionLoop.stop(); this.evasionLoop = null; }
        const evasionCfg = CONFIG.music['evasion'];
        this.evasionLoop = this.createSeamlessLoop(evasionCfg.file, 0.8, evasionCfg.loopOverlap, this._cfgLoopPoints(evasionCfg));
        this.evasionLoop.play();

        // Fade out alertLoop (keep it alive for potential alert→evasion→alert crossfade)
        if (this.alertLoop) {
            const steps = 30;
            const interval = this.FADE_DURATION / steps;
            const startVol = this.alertLoop.getVolume();
            const alertLoopRef = this.alertLoop;
            let step = 0;
            const timer = setInterval(() => {
                step++;
                alertLoopRef.setVolume(Math.max(0, startVol * (1 - step / steps)));
                if (step >= steps) { clearInterval(timer); alertLoopRef.setVolume(0); }
            }, interval);
        }

        this.alertState = 'evasion';
        this.updateAlertButtons();
    },

    triggerReturn() {
        if (this.alertState !== 'evasion') return;
        if (this.alertLoop) { this.alertLoop.stop(); this.alertLoop = null; }
        if (this.evasionLoop) { this.evasionLoop.stop(); this.evasionLoop = null; }

        const returnAudio = new Audio(CONFIG.alertSounds['return-to-posts'].file);
        returnAudio.volume = 0.8;
        returnAudio.play().catch(e => console.warn(e.message));
        returnAudio.addEventListener('ended', () => {
            if (this.lastMusicId) this.playMusic(this.lastMusicId);
        });

        this.alertState = 'normal';
        this.updateAlertButtons();
    },

    updateAlertButtons() {
        const btnAlert = document.getElementById('btn-alert');
        const btnEvasion = document.getElementById('btn-evasion');
        const btnReturn = document.getElementById('btn-return');
        if (!btnAlert || !btnEvasion || !btnReturn) return;

        switch (this.alertState) {
            case 'normal':
                btnAlert.disabled = false; btnAlert.style.opacity = '1'; btnAlert.classList.remove('playing');
                btnEvasion.disabled = true; btnEvasion.style.opacity = '0.3'; btnEvasion.classList.remove('playing');
                btnReturn.disabled = true; btnReturn.style.opacity = '0.3';
                break;
            case 'alert':
                btnAlert.disabled = false; btnAlert.style.opacity = '1'; btnAlert.classList.add('playing');
                btnEvasion.disabled = false; btnEvasion.style.opacity = '1'; btnEvasion.classList.remove('playing');
                btnReturn.disabled = true; btnReturn.style.opacity = '0.3';
                break;
            case 'evasion':
                btnAlert.disabled = false; btnAlert.style.opacity = '1'; btnAlert.classList.remove('playing');
                btnEvasion.disabled = false; btnEvasion.style.opacity = '1'; btnEvasion.classList.add('playing');
                btnReturn.disabled = false; btnReturn.style.opacity = '1';
                break;
        }
        this.updateGuardButtons();
    },

    crossfadeLoops(fadeOutLoop, fadeInLoop) {
        if (!fadeOutLoop || !fadeInLoop) return;
        const steps = 30;
        const interval = this.FADE_DURATION / steps;
        const fadeOutStart = fadeOutLoop.getVolume();
        const fadeInTarget = 0.8;
        let step = 0;
        const timer = setInterval(() => {
            step++;
            const progress = step / steps;
            fadeOutLoop.setVolume(Math.max(0, fadeOutStart * (1 - progress)));
            fadeInLoop.setVolume(Math.min(fadeInTarget, fadeInTarget * progress));
            if (step >= steps) {
                clearInterval(timer);
                fadeOutLoop.setVolume(0);
                fadeInLoop.setVolume(fadeInTarget);
            }
        }, interval);
    },

    stopAlertSystem() {
        if (this.discoveryAudio) { this.discoveryAudio.pause(); this.discoveryAudio = null; }
        if (this.alertLoop) { this.alertLoop.stop(); this.alertLoop = null; }
        if (this.evasionLoop) { this.evasionLoop.stop(); this.evasionLoop = null; }
        this.alertState = 'normal';
    },

    // ============================================
    // AMBIENT - seamless loop
    // ============================================
    buildAmbientButtons(stage) {
        const category = document.getElementById('ambient-category');
        const container = document.getElementById('ambient-buttons');
        if (!container) return;
        const ids = stage.ambientIds || [];
        if (ids.length === 0) {
            if (category) category.style.display = 'none';
            return;
        }
        if (category) category.style.display = '';
        container.innerHTML = ids.map(id => {
            const amb = CONFIG.ambient[id];
            if (!amb) return '';
            return `<button class="btn-sound" id="ambient-btn-${id}" onclick="App.playAmbient('${id}')">◊ ${amb.name}</button>`;
        }).join('');
    },

    buildGameOverButton(stage) {
        // Aggiunge il bottone Game Over al primo contenitore visibile: musica > ambient
        const musicCategory = document.getElementById('music-category');
        const ambientCategory = document.getElementById('ambient-category');
        const target = (musicCategory && musicCategory.style.display !== 'none')
            ? document.getElementById('music-buttons')
            : (ambientCategory && ambientCategory.style.display !== 'none')
                ? document.getElementById('ambient-buttons')
                : null;
        if (target) {
            target.insertAdjacentHTML('beforeend',
                `<button class="btn-game-over btn-video" id="btn-game-over" onclick="App.triggerGameOver()">GAME OVER</button>`);
        }
    },

    playAmbient(id) {
        const amb = CONFIG.ambient[id];
        if (!amb) return;
        this.stopAmbient();
        const vol = (document.getElementById('ambient-volume')?.value || 30) / 100;
        this.ambientLoop = this.createSeamlessLoop(amb.file, vol, amb.loopOverlap, this._cfgLoopPoints(amb));
        this.ambientLoop.play();
        const controls = document.getElementById('ambient-controls');
        if (controls) controls.style.display = '';
        this.currentAmbientBtn = document.getElementById(`ambient-btn-${id}`);
        if (this.currentAmbientBtn) this.currentAmbientBtn.classList.add('playing');
    },

    setAmbientVolume(val) {
        if (this.ambientLoop) this.ambientLoop.setVolume(val / 100);
    },

    stopAmbient() {
        if (this.ambientLoop) { this.ambientLoop.stop(); this.ambientLoop = null; }
        if (this.currentAmbientBtn) { this.currentAmbientBtn.classList.remove('playing'); this.currentAmbientBtn = null; }
        const controls = document.getElementById('ambient-controls');
        if (controls) controls.style.display = 'none';
    },

    // ============================================
    // SFX
    // ============================================
    buildSfxButtons() {
        const container = document.getElementById('sfx-buttons');
        if (!container) return;
        const nonAlertSfx = CONFIG.sfx.filter(s => !s.isAlert);
        if (nonAlertSfx.length === 0) {
            container.innerHTML = '<div class="no-audio-msg">Nessun effetto sonoro configurato.</div>';
            return;
        }
        container.innerHTML = nonAlertSfx.map((sfx, i) => `
            <button class="btn-sound" onclick="App.playSfx('${sfx.file}'${sfx.track ? `, '${sfx.track}'` : ''})" title="${sfx.name}">
                <span class="sfx-icon">${sfx.icon || '♪'}</span> ${sfx.name}
            </button>
        `).join('');
    },

    triggerGameOver() {
        if (!this.currentStage) return;
        this.stopMusic();
        this.stopAmbient();
        this.stopAlertSystem();
        this.trackStat('continues');
        // Suono random dal pool dello stage (o globale), parte al secondo 4 del video
        const pool = this.currentStage.gameOverSounds || CONFIG.gameOverSounds;
        if (pool && pool.length > 0) {
            const id = pool[Math.floor(Math.random() * pool.length)];
            const file = id.includes('/') ? id : `${CONFIG.gameOverSoundsPath}${id}.mp3`;
            const video = document.getElementById('video-player');
            let soundPlayed = false;
            const onTimeUpdate = () => {
                if (!soundPlayed && video.currentTime >= 4) {
                    soundPlayed = true;
                    video.removeEventListener('timeupdate', onTimeUpdate);
                    this.playSfx(file);
                }
            };
            video.addEventListener('timeupdate', onTimeUpdate);
        }
        // Video Game Over
        this.setActiveVideoBtn(document.getElementById('btn-game-over'));
        this.playVideo('video/Game_Over.mp4');
    },

    _sfxPool: {},

    playSfx(file, track) {
        // Web Audio API: zero latency se il buffer è già decodificato in cache
        if (this._audioCtx && this._bufferCache[file]) {
            try {
                if (this._audioCtx.state === 'suspended') this._audioCtx.resume();
                const src = this._audioCtx.createBufferSource();
                src.buffer = this._bufferCache[file];
                src.connect(this._audioCtx.destination);
                src.start(0);
            } catch(e) { console.warn('playSfx WAA:', e); }
        } else {
            // Fallback HTML5 Audio pool
            let audio = this._sfxPool[file];
            if (audio) {
                audio.currentTime = 0;
            } else {
                audio = new Audio(file);
                audio.volume = 1.0;
            }
            audio.play().catch(e => console.warn(e.message));
        }
        if (track) this.trackStat(track);
    },

    // ============================================
    // STOP ALL
    // ============================================
    stopAllAudio() {
        this.stopVideo();
        this.stopMusic();
        this.stopAmbient();
        this.stopAlertSystem();
        this.stopMenuMusic();
    },

    // ============================================
    // KEYBOARD HANDLER
    // ============================================
    handleKeydown(e) {
        // Main menu navigation
        if (this.currentScreen === 'main-menu') {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.menuNav(-1);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.menuNav(1);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                this.menuConfirm();
            }
            return;
        }

        // Press start
        if (this.currentScreen === 'press-start-screen') {
            this.startIntroVideo();
            return;
        }

        // Intro skip
        if (this.currentScreen === 'intro-screen') {
            this.skipIntro();
            return;
        }

        // Card screen: navigazione a due fasi (card → block)
        if (this.currentScreen === 'card-screen') {
            if (this.cardPhase === 'card') {
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    this.focusCard(this.selectedCard === 1 ? 2 : 1);
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (this.selectedCard) this.selectCard(this.selectedCard);
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    this.cardBack();
                }
            } else { // fase 'block'
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    const ids = this._visibleBlockIds;
                    if (!ids.length) return;
                    let idx = ids.indexOf(this.focusedBlock);
                    idx = e.key === 'ArrowDown'
                        ? (idx + 1) % ids.length
                        : (idx - 1 + ids.length) % ids.length;
                    this.focusBlock(ids[idx]);
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (this.focusedBlock) this.selectBlock(this.focusedBlock);
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    this.cardBack();
                }
            }
            return;
        }

        // ESC to go back
        if (e.key === 'Escape') {
            if (this.currentScreen === 'stage-active') {
                // noop
            } else if (this.currentScreen === 'stage-select' || this.currentScreen === 'briefing-screen' || this.currentScreen === 'vr-screen') {
                if (this.currentScreen === 'briefing-screen') this.stopBriefing();
                this.stopAllAudio();
                this.playMenuReturn();
                this.showScreen('main-menu');
            }
        }
    },

    // ============================================
    // TOUCH/CLICK MENU SUPPORT
    // ============================================
    initMenuTouch() {
        const wheel = document.getElementById('menu-wheel');
        if (!wheel) return;

        let startY = 0;
        wheel.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
        }, { passive: true });

        wheel.addEventListener('touchend', (e) => {
            const endY = e.changedTouches[0].clientY;
            const diff = startY - endY;
            if (Math.abs(diff) > 30) {
                this.menuNav(diff > 0 ? 1 : -1);
            }
        }, { passive: true });

        // Click on prev/next
        document.getElementById('menu-prev')?.addEventListener('click', () => this.menuNav(-1));
        document.getElementById('menu-next')?.addEventListener('click', () => this.menuNav(1));

        // Click on current = confirm
        document.getElementById('menu-current')?.addEventListener('click', () => this.menuConfirm());
    },

    // ============================================
    // SAVE SYSTEM
    // ============================================
    SESSION_KEY: 'mgs_session',

    initSession() {
        const raw = localStorage.getItem(this.SESSION_KEY);
        this.session = raw ? JSON.parse(raw) : this._newSession();
    },

    _newSession() {
        return {
            stage: 1,
            vr_mission_unlocked: 0,
            alerts: 0,
            kills: 0,
            kills_silent: 0,
            rations_used: 0,
            continues: 0,
            saves: 0,
            timestamp: new Date().toISOString(),
        };
    },

    _persistSession() {
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(this.session));
    },

    trackStat(stat) {
        if (!this.session || !(stat in this.session)) return;
        this.session[stat]++;
        this._persistSession();
    },

    _getCard(n) {
        const raw = localStorage.getItem(`mgs_card_${n}`);
        return raw ? JSON.parse(raw) : {};
    },

    _setCard(n, data) {
        localStorage.setItem(`mgs_card_${n}`, JSON.stringify(data));
    },

    saveToBlock(cardNum, blockId) {
        const card = this._getCard(cardNum);
        this.session.saves++;
        this.session.timestamp = new Date().toISOString();
        card[blockId] = { ...this.session };
        this._setCard(cardNum, card);
        this._persistSession();
    },

    loadFromBlock(cardNum, blockId) {
        const block = this._getCard(cardNum)[blockId];
        if (!block) return false;
        this.session = { ...block };
        this._persistSession();
        return true;
    },

    // ---- Save screen (tra uno stage e l'altro) ----

    showSaveScreen(nextStageId) {
        this.cardScreenMode = 'save';
        this.pendingNextStageId = nextStageId;
        this.selectedCard = 1;
        this.selectedBlock = null;
        this._renderCardScreen();
        this.showScreen('card-screen');
        // Avvia video intro se configurato
        setTimeout(() => this._autoPlaySaveIntro(), 300);
    },

    _randomSaveVideo(list) {
        if (!list || !list.length) return null;
        return list[Math.floor(Math.random() * list.length)];
    },

    _autoPlaySaveIntro() {
        const sc = CONFIG.saveScreen || {};
        const unlockTabs = () => {
            document.querySelectorAll('.card-tab').forEach(t => { t.disabled = false; });
        };
        // Se il conteggio annullamenti >= 3, l'intro diventa No_Save_Intro
        let src;
        if (this._noSaveCount >= 3 && sc.noSaveIntro) {
            src = sc.noSaveIntro;
        } else {
            src = this._randomSaveVideo(sc.intro);
        }
        if (src) {
            this.setActiveVideoBtn(document.getElementById('save-btn-intro'));
            this._playSaveVideo(src, () => { unlockTabs(); this.focusCard(1); });
        } else {
            unlockTabs();
            this.focusCard(1);
        }
    },

    playSaveIntro() {
        const src = this._randomSaveVideo(CONFIG.saveScreen && CONFIG.saveScreen.intro);
        if (!src) return;
        this.setActiveVideoBtn(document.getElementById('save-btn-intro'));
        this._playSaveVideo(src);
    },

    playSaveOutro() {
        const src = this._randomSaveVideo(CONFIG.saveScreen && CONFIG.saveScreen.outro);
        if (!src) return;
        this.setActiveVideoBtn(document.getElementById('save-btn-outro'));
        const returnTo = this.cardReturnScreen;
        this._playSaveVideo(src, returnTo === 'stage-active' ? () => {
            this.cardReturnScreen = 'main-menu';
            this.showScreen('stage-active');
        } : null);
    },

    _playNotSaveOutro() {
        this._noSaveCount++;
        const count = this._noSaveCount;
        const sc = CONFIG.saveScreen || {};

        const navigateBack = () => {
            this.cardReturnScreen = 'main-menu';
            this.showScreen('stage-active');
        };

        const playVideo = (src, onEnd) => {
            this._notSaveOutroActive = true;
            this.setActiveVideoBtn(document.getElementById('save-btn-outro'));
            this._playSaveVideo(src, () => {
                this._notSaveOutroActive = false;
                onEnd();
            });
        };

        if (count <= 3) {
            // Primo, secondo, terzo annullamento: No_Save_Outro_01..03
            const list = sc.noSaveOutro || [];
            const src = list[count - 1] || null;
            if (!src) { navigateBack(); return; }
            playVideo(src, navigateBack);
        } else {
            // Quarto annullamento in poi (stato "frustrato"):
            // No_Save_Intro è già stato mostrato come intro d'ingresso → outro casuale No_Save_Silence
            const silenceSrc = this._randomSaveVideo(sc.noSaveSilenceOutro);
            if (silenceSrc) {
                playVideo(silenceSrc, navigateBack);
            } else {
                navigateBack();
            }
        }
    },

    _lockCardControls(locked) {
        document.querySelectorAll('.card-tab').forEach(t => { t.disabled = locked; });
        const actionBtns = document.getElementById('card-action-btns');
        if (actionBtns) actionBtns.querySelectorAll('button').forEach(b => { b.disabled = locked; b.style.opacity = locked ? '0.3' : ''; });
    },

    _playSaveVideo(src, onEnd) {
        const wrapper = document.getElementById('save-video-wrapper');
        const player = document.getElementById('save-video-player');
        const placeholder = document.getElementById('save-video-placeholder');
        const stopBtn = document.getElementById('save-btn-stop');
        this._lockCardControls(true);
        if (wrapper) wrapper.style.display = '';
        if (placeholder) placeholder.style.display = 'none';
        if (player) {
            player.onended = null; // rimuove handler precedente prima di assegnarne uno nuovo
            player.src = src;
            player.style.display = 'block';
            player.play().catch(e => console.warn('Save video:', e.message));
            player.onended = () => {
                this._saveVideoEnding = true;
                this.stopSaveVideo();
                this._saveVideoEnding = false;
                if (onEnd) onEnd();
            };
        }
        if (stopBtn) stopBtn.style.display = '';
    },

    stopSaveVideo() {
        const wasNotSaveOutro = this._notSaveOutroActive;
        this._notSaveOutroActive = false;
        this.setActiveVideoBtn(null);
        const player = document.getElementById('save-video-player');
        const placeholder = document.getElementById('save-video-placeholder');
        const stopBtn = document.getElementById('save-btn-stop');
        if (player) {
            player.onended = null; // azzera handler per evitare listener stantii
            player.pause();
            player.removeAttribute('src');
            player.load();
            player.style.display = 'none';
        }
        if (placeholder) placeholder.style.display = '';
        if (stopBtn) stopBtn.style.display = 'none';
        this._lockCardControls(false);
        // Se l'outro "non salvato" viene stoppato MANUALMENTE (non a fine naturale), torna a stage-active
        if (wasNotSaveOutro && !this._saveVideoEnding) {
            this.cardReturnScreen = 'main-menu';
            this.showScreen('stage-active');
        }
    },

    // NEXT: procede allo stage successivo (con o senza aver salvato)
    cardNext() {
        this.stopSaveVideo();
        const id = this.pendingNextStageId;
        this.pendingNextStageId = null;
        this.cardReturnScreen = 'main-menu';
        if (id) this.selectStage(id);
    },

    // MENU / BACK: torna allo schermo precedente
    cardBack() {
        this.pendingNextStageId = null;
        const returnTo = this.cardReturnScreen || 'main-menu';

        // Modalità Mei Ling (save da stage-active)
        if (this.cardScreenMode === 'save' && returnTo === 'stage-active') {
            if (this.cardPhase === 'block') {
                // Fase blocchi → torna alla selezione memory card
                this.stopSaveVideo();
                this.playSfx(CONFIG.menuSounds['return'].file);
                this.cardPhase = 'card';
                this.focusedBlock = null;
                this._visibleBlockIds = [];
                const cardBlocks = document.getElementById('card-blocks');
                if (cardBlocks) cardBlocks.style.display = 'none';
                const confirmArea = document.getElementById('block-confirm-area');
                if (confirmArea) { confirmArea.innerHTML = ''; confirmArea.style.display = 'none'; }
            } else {
                // Fase card → esci
                this.stopSaveVideo();
                this.playSfx(CONFIG.menuSounds['return'].file);
                if (this._savedThisVisit) {
                    // Ha già salvato in questa visita: torna senza rimproverare
                    this._savedThisVisit = false;
                    this.cardReturnScreen = 'main-menu';
                    this.showScreen('stage-active');
                } else {
                    this._playNotSaveOutro();
                }
            }
            return;
        }

        this.stopSaveVideo();
        this.cardReturnScreen = 'main-menu';
        if (returnTo === 'stage-active') {
            this.playSfx(CONFIG.menuSounds['return'].file);
            this.showScreen('stage-active');
        } else {
            this.playMenuReturn();
            this.showScreen('main-menu');
        }
    },

    // ---- Load screen (da main menu) ----

    showLoadScreen() {
        this._initAudioCtx(); // precarica buffer suoni menu per risposta immediata
        this.cardScreenMode = 'load';
        this.cardReturnScreen = 'main-menu';
        this.pendingNextStageId = null;
        this.selectedCard = 1;
        this.selectedBlock = null;
        this._renderCardScreen();
        this.showScreen('card-screen');
    },

    // ---- UI comune ----

    _renderCardScreen() {
        const isSave = this.cardScreenMode === 'save';
        const title = document.getElementById('card-screen-title');
        const nextBtn = document.getElementById('btn-card-next');
        const videoSection = document.getElementById('save-video-section');
        const confirmArea = document.getElementById('block-confirm-area');
        const actionBtns = document.getElementById('card-action-btns');
        if (title) title.textContent = isSave ? 'SALVATAGGIO' : 'CARICA PARTITA';
        if (nextBtn) nextBtn.style.display = (isSave && this.cardReturnScreen !== 'stage-active') ? '' : 'none';
        if (videoSection) videoSection.style.display = isSave ? '' : 'none';
        if (confirmArea) { confirmArea.innerHTML = ''; confirmArea.style.display = 'none'; }
        if (actionBtns) actionBtns.style.display = isSave ? '' : 'none';
        // Reset fase di selezione
        this.cardPhase = 'card';
        this.focusedBlock = null;
        this._visibleBlockIds = [];
        // Nessun tab selezionato all'apertura: blocchi nascosti finché l'utente non clicca una Memory Card
        document.querySelectorAll('.card-tab').forEach(t => t.classList.remove('active'));
        const cardBlocks = document.getElementById('card-blocks');
        if (cardBlocks) {
            cardBlocks.style.display = 'none';
            cardBlocks.classList.add('card-blocks--save'); // max 5 blocchi + scroll in entrambe le modalità
        }
        // In modalità Mei Ling i btn intro/outro sono nascosti (tutto è automatico)
        const isMeiLing = isSave && this.cardReturnScreen === 'stage-active';
        const btnIntro = document.getElementById('save-btn-intro');
        const btnOutro = document.getElementById('save-btn-outro');
        if (isMeiLing) {
            if (btnIntro) btnIntro.style.display = 'none';
            if (btnOutro) btnOutro.style.display = 'none';
            // Disabilita i tab finché il video intro non è finito
            document.querySelectorAll('.card-tab').forEach(t => { t.disabled = true; });
        } else {
            // Modalità load game: mostra i btn in base alla config video
            const introList = CONFIG.saveScreen && CONFIG.saveScreen.intro;
            const outroList = CONFIG.saveScreen && CONFIG.saveScreen.outro;
            const hasIntro = Array.isArray(introList) ? introList.length > 0 : !!introList;
            const hasOutro = Array.isArray(outroList) ? outroList.length > 0 : !!outroList;
            if (btnIntro) { btnIntro.style.display = ''; btnIntro.disabled = !hasIntro; btnIntro.style.opacity = hasIntro ? '1' : '0.3'; }
            if (btnOutro) { btnOutro.style.display = ''; btnOutro.disabled = !hasOutro; btnOutro.style.opacity = hasOutro ? '1' : '0.3'; }
        }
    },

    // Evidenzia il tab senza mostrare i blocchi (navigazione con frecce o fine intro)
    focusCard(n) {
        // Ignorato se già in fase blocchi (save mode) o se tab ancora disabilitati (intro in corso)
        if (this.cardPhase === 'block') return;
        const tabs = document.querySelectorAll('.card-tab');
        if (tabs[0] && tabs[0].disabled) return;
        const changed = this.selectedCard !== n;
        this.selectedCard = n;
        document.querySelectorAll('.card-tab').forEach((t, i) => t.classList.toggle('active', i + 1 === n));
        if (changed) this.playSfx(CONFIG.menuSounds['choice'].file);
    },

    // Evidenzia un blocco (hover mouse o frecce su/giù). silent=true: nessun suono
    focusBlock(blockId, silent = false) {
        const changed = this.focusedBlock !== blockId;
        this.focusedBlock = blockId;
        document.querySelectorAll('.card-block').forEach(el => el.classList.remove('focused'));
        document.getElementById(`card-block-${blockId}`)?.classList.add('focused');
        if (!silent && changed) this.playSfx(CONFIG.menuSounds['choice'].file);
    },

    // Conferma la selezione corrente in base alla fase (card → selectCard, block → selectBlock)
    cardConfirm() {
        if (this.cardPhase === 'card') {
            if (this.selectedCard) this.selectCard(this.selectedCard);
        } else if (this.cardPhase === 'block') {
            if (this.focusedBlock) this.selectBlock(this.focusedBlock);
        }
    },

    // Conferma la memory card: mostra i blocchi (Enter o click sul tab)
    selectCard(n) {
        // Bloccato se tab ancora disabilitati (intro in corso)
        const tabs = document.querySelectorAll('.card-tab');
        if (tabs[0] && tabs[0].disabled) return;
        // Suono PRIMA di qualsiasi lavoro DOM per evitare ritardo percepito
        this.playSfx(CONFIG.menuSounds['confirm-save'].file);
        this.selectedCard = n;
        this.selectedBlock = null;
        this.focusedBlock = null;
        const confirmArea = document.getElementById('block-confirm-area');
        if (confirmArea) { confirmArea.innerHTML = ''; confirmArea.style.display = 'none'; }
        document.querySelectorAll('.card-tab').forEach((t, i) => t.classList.toggle('active', i + 1 === n));
        this._buildCardBlocks();
        const cardBlocks = document.getElementById('card-blocks');
        if (cardBlocks) cardBlocks.style.display = '';
        // In save mode: passa alla fase blocchi e auto-focus il primo blocco (silenzioso)
        if (this.cardScreenMode === 'save') {
            this.cardPhase = 'block';
            if (this._visibleBlockIds.length > 0) {
                this.focusBlock(this._visibleBlockIds[0], true);
            }
        }
    },

    _buildCardBlocks() {
        const container = document.getElementById('card-blocks');
        if (!container) return;
        const card = this._getCard(this.selectedCard);

        if (this.cardScreenMode === 'save') {
            // Modalità salvataggio: mostra i blocchi occupati + il primo blocco libero come [NEW BLOCK]
            let firstEmptyFound = false;
            const rows = [];
            this._visibleBlockIds = [];
            for (let i = 0; i < 15; i++) {
                const id = `block_${String(i + 1).padStart(2, '0')}`;
                const block = card[id];
                const num = String(i + 1).padStart(2, '0');
                if (block) {
                    const stage = CONFIG.stages.find(s => s.id === block.stage);
                    const stageName = stage ? stage.name : `Stage ${block.stage}`;
                    const focCls = this.focusedBlock === id ? ' focused' : '';
                    this._visibleBlockIds.push(id);
                    rows.push(`<div class="card-block used${focCls}" id="card-block-${id}" onclick="App.selectBlock('${id}')" onmouseover="App.focusBlock('${id}')">
                        <span class="block-num">BLOCK ${num}</span>
                        <span class="block-stage-name">${stageName}</span>
                    </div>`);
                } else if (!firstEmptyFound) {
                    firstEmptyFound = true;
                    const focCls = this.focusedBlock === id ? ' focused' : '';
                    this._visibleBlockIds.push(id);
                    rows.push(`<div class="card-block empty new-block${focCls}" id="card-block-${id}" onclick="App.selectBlock('${id}')" onmouseover="App.focusBlock('${id}')">
                        <span class="block-num">BLOCK ${num}</span>
                        <span class="block-new">[NEW BLOCK]</span>
                    </div>`);
                }
                // altri blocchi vuoti: non mostrati
            }
            container.innerHTML = rows.join('');
        } else {
            // Modalità caricamento: mostra tutti i 15 blocchi
            this._visibleBlockIds = [];
            container.innerHTML = Array.from({ length: 15 }, (_, i) => {
                const id = `block_${String(i + 1).padStart(2, '0')}`;
                const block = card[id];
                const disabledClass = !block ? 'card-block--disabled' : '';
                if (block) this._visibleBlockIds.push(id);
                let info = '';
                if (block) {
                    const stage = CONFIG.stages.find(s => s.id === block.stage);
                    const stageName = stage ? stage.name : `STAGE ${String(block.stage).padStart(2, '0')}`;
                    const date = new Date(block.timestamp).toLocaleDateString('it-IT');
                    info = `<span class="block-stage">${stageName}</span>
                            <span class="block-date">${date}</span>`;
                } else {
                    info = `<span class="block-empty">— VUOTO —</span>`;
                }
                const hoverAttr = block ? ` onmouseover="App.focusBlock('${id}')"` : '';
                return `<div class="card-block ${block ? 'used' : 'empty'} ${disabledClass}"
                            id="card-block-${id}" onclick="App.selectBlock('${id}')"${hoverAttr}>
                            <span class="block-num">BLOCK ${String(i + 1).padStart(2, '0')}</span>
                            ${info}
                        </div>`;
            }).join('');
        }
    },

    selectBlock(blockId) {
        if (this.cardScreenMode === 'save') {
            // Save mode: conferma diretta senza dialogo intermedio
            this._doSave(blockId);
            return;
        }
        // Load mode: chiedi conferma
        const block = this._getCard(this.selectedCard)[blockId];
        if (!block) return;
        this.playSfx(CONFIG.menuSounds['confirm-save'].file);
        this.selectedBlock = blockId;
        document.querySelectorAll('.card-block').forEach(el => el.classList.remove('selected'));
        document.getElementById(`card-block-${blockId}`)?.classList.add('selected');
        const confirmArea = document.getElementById('block-confirm-area');
        if (!confirmArea) return;
        confirmArea.innerHTML = `
            <span class="confirm-msg">Caricare questa partita?</span>
            <button class="btn-codec btn-small" onclick="App.confirmBlock()"><span class="btn-inner">✓ CONFERMA</span></button>
            <button class="btn-codec btn-small btn-stop" onclick="App.cancelBlock()"><span class="btn-inner">✗ ANNULLA</span></button>
        `;
        confirmArea.style.display = '';
    },

    confirmBlock() {
        if (!this.selectedBlock) return;
        const blockId = this.selectedBlock;
        this.selectedBlock = null;
        this.playSfx(CONFIG.menuSounds['confirm-save'].file);
        if (this.cardScreenMode === 'save') {
            this._doSave(blockId);
        } else {
            this._doLoad(blockId);
        }
    },

    cancelBlock() {
        this.playSfx(CONFIG.menuSounds['return'].file);
        this.selectedBlock = null;
        document.querySelectorAll('.card-block').forEach(el => el.classList.remove('selected'));
        const confirmArea = document.getElementById('block-confirm-area');
        if (confirmArea) { confirmArea.style.display = 'none'; confirmArea.innerHTML = ''; }
    },

    _doSave(blockId) {
        this.playSfx(CONFIG.menuSounds['confirm-save'].file);
        this._noSaveCount = 0;
        this._savedThisVisit = true;
        this.saveToBlock(this.selectedCard, blockId);
        const confirmArea = document.getElementById('block-confirm-area');
        if (confirmArea) { confirmArea.style.display = 'none'; confirmArea.innerHTML = ''; }
        this._buildCardBlocks();

        // Mostra popup "salvataggio in corso", poi avvia outro dopo 3 secondi
        const popup = document.getElementById('save-popup');
        const popupText = document.getElementById('save-popup-text');
        if (popup) {
            if (popupText) popupText.textContent = 'SALVATAGGIO IN CORSO...';
            popup.style.display = 'flex';
            setTimeout(() => {
                popup.style.display = 'none';
                this.playSaveOutro();
            }, 3000);
        } else {
            this.playSaveOutro();
        }
    },

    _doLoad(blockId) {
        if (this.loadFromBlock(this.selectedCard, blockId)) {
            this.newGameMode = true;
            this.stopSaveVideo();
            this.stopAllAudio();
            // Schermo nero per 2 secondi (sensazione di caricamento)
            const current = document.querySelector('.screen.active');
            if (current) current.classList.remove('active');
            this.currentScreen = '';
            setTimeout(() => this.selectStage(this.session.stage), 2000);
        }
    },

    // ============================================
    // INIT
    // ============================================
    init() {
        this.initSession();
        this.initStageGrid();
        this.buildSfxButtons();
        this.initMenuTouch();

        document.addEventListener('keydown', (e) => this.handleKeydown(e));

        // Preload suoni menu nel pool per riproduzione immediata
        Object.values(CONFIG.menuSounds).forEach(s => {
            const a = new Audio(s.file);
            a.preload = 'auto';
            a.load();
            this._sfxPool[s.file] = a;
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});