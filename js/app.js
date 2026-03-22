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
    selectedDifficultyIndex: 1,
    difficulties: [
        { id: 'EASY',    label: 'EASY',    caption: 'Mazzo blu: rimosse carte con allerta 6\nSalute Boss: -2' },
        { id: 'NORMAL',  label: 'NORMAL',  caption: 'Regole del gioco' },
        { id: 'HARD',    label: 'HARD',    caption: 'Mazzo blu: rimosse carte con allerta 4\nSalute Boss: +2' },
        { id: 'EXTREME', label: 'EXTREME', caption: 'Mazzo blu: rimosse carte con allerta 4\nSalute Boss: +3\nDanni persistenti: scarta 1 danno ad inizio missione\nEquipaggiamento: massimo 2 slot', locked: true },
    ],

    // Seamless loop players
    musicLoop: null,
    alertLoop: null,
    evasionLoop: null,
    menuMusicLoop: null,

    // Volume musica prima di un evento con stopMusic: false (null = nessun evento attivo)
    _eventMusicRestore: null,

    // Web Audio API
    _audioCtx: null,
    _bufferCache: {},

    // Alert system
    alertState: 'normal',
    discoveryAudio: null,

    // Repeating SFX interval (es. baker per Ocelot)
    _sfxOnMusicStartTimers: [],

    // Listener intro-ended (tracciato per poterlo rimuovere se l'intro viene stoppata)
    _introEndedListener: null,
    // Flag: outro in corso (per sbloccare NEXT anche se stoppato manualmente)
    _outroPlaying: false,
    // Flag: not-save outro in corso (per tornare a stage-active anche se stoppato manualmente)
    _notSaveOutroActive: false,
    // Flag: save outro in corso (per tornare a stage-active anche se stoppato manualmente)
    _saveOutroActive: false,
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
    showSessionStats: false,   // mostra dati sessione nella sidebar (settabile dalle opzioni)

    // Fase soldati — azioni guardie (fase 1)
    GUARD_CARDS: [
        { id: 'risveglio',      label: 'RISVEGLIO GUARDIE', sound: 'audio/azioni/guardie/soldato-eh.wav' },
        { id: 'radio',          label: 'RADIO',             sound: 'audio/azioni/guardie/soldato-radio.wav' },
        { id: 'contatto-perso', label: 'CONTATTO PERSO',    sound: 'audio/azioni/guardie/soldato-radio.wav' },
        { id: 'occhi-aperti',   label: 'OCCHI APERTI',      sound: 'audio/azioni/guardie/soldato-chi-va-la.wav' },
    ],
    // Fase soldati — telecamere (fase 2)
    CAMERA_CARDS: [
        { id: 'cambiano',   label: 'CAMBIANO ORIENTAMENTO', sound: 'audio/sfx/telecamera.mp3' },
        { id: 'non-cambia', label: 'NON CAMBIA',            sound: null },
    ],
    // Fase soldati — azioni per guardia (fase 3)
    GUARD_ACTIONS: [
        { id: 'alert',        label: '→ !',          sound: 'audio/azioni/guardie/soldato-scatto-guardia.wav',  reactionSound: 'audio/azioni/guardie/soldato-dove-si-sara-cacciato.wav' },
        { id: 'morto',        label: '→ MORTO',      sound: 'audio/azioni/guardie/soldato-che-cose.wav',        reactionSound: 'audio/azioni/guardie/soldato-da-questa-parte.wav' },
        { id: 'ko',           label: '→ KO',         sound: 'audio/azioni/guardie/soldato-che-cose.wav',        reactionSound: 'audio/azioni/guardie/soldato-beccati-questa.wav' },
        { id: 'interrogativo',label: '→ ?',          sound: 'audio/azioni/guardie/soldato-cosa-e-stato.wav' },
        { id: 'pattuglia',    label: 'PATTUGLIA',    sound: 'audio/azioni/guardie/soldato-passo-guardia.wav' },
        { id: 'attacca',      label: '⚔ ATTACCA',   sound: 'audio/sfx/attacco-guardia.wav', alertOnly: true },
    ],

    // Zona corrente per ogni giocatore (indice posizionale nell'array enemies)
    playerZoneState: {},

    // Azione attacco in attesa di risultato popup
    _pendingAttackPlayer: null,
    _pendingAttackActionId: null,

    // Traccia se questo round il giocatore ha usato un attacco (fisico o arma) / solo arma
    _anyAttackUsedByPlayer: {},
    _pendingAttackActionObj: null,   // action object per attacchi da equipaggiamento
    _weaponAttackUsedByPlayer: {},

    // Suoni risultato attacco per tipo di bersaglio
    ATTACK_SOUNDS: {
        guard: {
            hit:      'audio/azioni/guardie/soldato-colpito.wav',
            defeated: 'audio/azioni/guardie/soldato-ucciso.wav',
        },
    },

    // Alert cause popup
    _inCameraSight: false,
    _guardsAttackedThisTurn: false,
    ALERT_CAUSES: [
        { id: 'guardia',    label: 'VISTA DA UNA GUARDIA',         sound: 'audio/sfx/!!!.mp3' },
        { id: 'telecamera', label: 'VISTA DA UNA TELECAMERA',      sound: 'audio/sfx/!!! telecamera.wav', cameraOnly: true },
        { id: 'rumore',     label: 'RUMORE (ARMA/ESPLOSIONE)',      sound: 'audio/sfx/!!!.mp3' },
    ],

    // Turn system
    turnPhase: 'players',       // 'players' | 'soldiers'
    currentPlayerIndex: 0,
    stagePlayers: [],
    turnRound: 1,
    playerTokenState: [true, true, true, true],   // 4 token per round
    playerSubPhase: 'select',       // 'select' | 'active' (solo multi-player)
    playersDoneTurn: [],            // nomi giocatori che hanno finito il turno questo round
    selectedPlayerForTurn: null,    // giocatore selezionato nel radio prima del conferma

    // Equipaggiamento corrente per stage: playerName → [id|null, id|null, id|null]
    playerEquipment: {},
    // Stato consumo per stage: playerName → { equipId: bool }
    equipmentConsumedState: {},

    // Contatore azioni rumorose (noise:true) per giocatore nel turno corrente
    // Azzerato a inizio round. A fine turno del giocatore mostra popup promemoria dadi.
    _noiseCountThisTurn: {},
    _noisePendingPlayer: null,
    _pendingStageId: null,

    PLAYER_COLORS: {
        'Snake':    '#3aff7e',
        'Meryl':    '#ff8c3a',
        'Otacon':   '#4af0ff',
        'Gray Fox': '#cc44ff',
    },

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
                legacy = App._loopLegacy(file, currentVolume, overlapOverride, loopPoints);
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

        return this._loopLegacy(file, volume, overlapOverride, loopPoints);
    },

    _loopLegacy(file, volume, overlapOverride, loopPoints) {
        const self = this;
        const overlap = (overlapOverride !== undefined) ? overlapOverride : self.LOOP_OVERLAP;
        const loopStart   = loopPoints ? (loopPoints.start       ?? 0)    : 0;
        const loopEnd     = loopPoints ? (loopPoints.end         ?? null)  : null;
        const introStart  = loopPoints ? (loopPoints.introStart  ?? loopStart) : 0;
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
            next.currentTime = loopStart;
            next.volume = loop.volume;
            next.play().catch(e => console.warn(e.message));
            if (loopEnd != null) current.pause();
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
                const endPoint  = (loopEnd != null) ? loopEnd : current.duration;
                const remaining = endPoint - current.currentTime;
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
                loop.audioA.currentTime = introStart;
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
                    this.showDifficultyScreen();
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

        grid.innerHTML = STAGES.map(stage => {
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

    selectStage(stageId, selectedPlayers) {
        const stage = STAGES.find(s => s.id === stageId);
        if (!stage) return;

        this._initAudioCtx();
        this.currentStage = stage;
        this.stopAllAudio();
        this.lastMusicId = null;
        this.alertState = 'normal';
        if (this.session) { this.session.stage = stage.id; this._persistSession(); }
        this.trackStat('rounds'); // round 1 inizia subito

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
            const hasNextStage = !!STAGES.find(s => s.id === stage.id + 1);
            if (this.newGameMode && hasNextStage) {
                btnNext.style.display = '';
                btnNext.disabled = true;
                btnNext.style.opacity = '0.3';
            } else {
                btnNext.style.display = 'none';
            }
        }

        this.stopVideo();
        this.initEnemyState(stage);
        this.buildEventButtons(stage);
        this.buildMusicButtons(stage);
        this.buildGameOverButton(stage);
        this.buildAlertSection(stage);
        this.buildTurnSection(stage, selectedPlayers);
        this.buildPlayerSidebar(stage);
        if (stage.startInAlert) {
            this.stagePlayers.forEach(p => {
                if (this.markerState[p]) this.markerState[p].alert = true;
                const btn = document.getElementById(`marker-alert-${p}`);
                if (btn) btn.classList.add('active');
            });
        }

        this.showScreen('stage-active');

        if (stage.intro && stage.intro.length > 0) {
            setTimeout(() => {
                this.playIntroThenMusic();
            }, 300);
        } else {
            setTimeout(() => {
                this.playFirstAmbient();
                if (stage.startInAlert) {
                    this.triggerAlert();
                } else {
                    this.playFirstMusic();
                }
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
        const sidebar = document.getElementById('player-sidebar');
        if (sidebar) sidebar.classList.toggle('video-playing', !!btn);
    },

    _duckAudio() {
        const DUCK = 0.15;
        this._duckVolumes = {};
        const loops = { musicLoop: this.musicLoop, alertLoop: this.alertLoop, evasionLoop: this.evasionLoop };
        for (const [key, loop] of Object.entries(loops)) {
            if (key === 'musicLoop' && this._eventMusicRestore !== null) continue;
            if (loop && loop.isPlaying()) {
                this._duckVolumes[key] = loop.getVolume();
                loop.setVolume(this._duckVolumes[key] * DUCK);
            }
        }
    },

    _unduckAudio() {
        if (!this._duckVolumes) return;
        const loops = { musicLoop: this.musicLoop, alertLoop: this.alertLoop, evasionLoop: this.evasionLoop };
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
            // Rimuove eventuali listener anonimi accumulati da chiamate precedenti
            if (this._autoStopListener) {
                player.removeEventListener('ended', this._autoStopListener);
            }
            player.src = src;
            player.style.display = 'block';
            player.play().catch(e => console.warn('Video:', e.message));
            // Rimuove l'highlight quando il video finisce naturalmente
            this._autoStopListener = () => { this._autoStopListener = null; this.stopVideo(); };
            player.addEventListener('ended', this._autoStopListener, { once: true });
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
        // Applica variazioni nemici associate all'evento
        const changes = this.currentStage.enemyEvents?.[id];
        if (changes) changes.forEach(c => this.updateEnemyCount(c.zone, c.delta));
        if (ev.stopMusic) {
            this._eventMusicRestore = null;
            this.stopMusic();
            this.stopAlertSystem();
        } else if (this.musicLoop && this.musicLoop.isPlaying()) {
            this._eventMusicRestore = this.musicLoop.getVolume();
            if (ev.musicEvent !== undefined) {
                this.musicLoop.setVolume(ev.musicEvent / 100);
            }
        }
        this.setActiveVideoBtn(document.getElementById(`btn-event-${id}`));
        this.playVideo(ev.file);
    },

    _afterIntroEnd() {
        if (this.musicIntroTimer) {
            const p = document.getElementById('video-player');
            if (p) p.removeEventListener('timeupdate', this.musicIntroTimer);
            this.musicIntroTimer = null;
        }
        // Se un video è già in riproduzione (es. outro avviato mentre l'intro era ancora in corso),
        // non avviare la musica — lo farà stopVideo quando quel video termina o viene fermato.
        const vp = document.getElementById('video-player');
        if (vp && !vp.paused) return;

        if (this.currentStage && this.currentStage.startInAlert) {
            this.triggerAlert();
        } else if (this.musicLoop && this.musicLoop.isPlaying()) {
            this.fadeMusicToNormalVolume();
            this._startSfxOnMusicStart();
        } else if (!this.musicLoop || !this.musicLoop.isPlaying()) {
            this.playFirstMusic();
        }
    },

    _getMantisVariantVideo() {
        const s = this.session;
        if (!s) return 'video/Mantis/a-c-s0.mp4';
        const a = s.alerts < 5 ? '-' : '+';
        const c = s.continues < 5 ? '-' : '+';
        const sv = s.saves === 0 ? '0' : (s.saves < 5 ? '-' : '+');
        const t = (c === '+' && s.trappola) ? 't' : '';
        return `video/Mantis/a${a}c${c}s${sv}${t}.mp4`;
    },

    _startMantisChain() {
        const player = document.getElementById('video-player');
        const playerB = document.getElementById('video-player-b');
        if (!player || !this.currentStage) return;
        const stage = this.currentStage;
        const variantSrc = this._getMantisVariantVideo();
        const OVERLAP = 0.12; // secondi prima della fine di playerA in cui si avvia playerB (muto)

        // Rimuove eventuali listener stantii da playVideo() precedenti
        if (this._autoStopListener) {
            player.removeEventListener('ended', this._autoStopListener);
            this._autoStopListener = null;
        }

        // Precarica la variante nel secondo player: position:absolute invisibile
        // così il browser decodifica i frame senza occupare spazio nel layout
        if (playerB) {
            playerB.muted = true;
            playerB.src = variantSrc;
            playerB.style.display = '';          // toglie display:none inline, CSS prende il controllo (block)
            playerB.classList.add('mantis-preload'); // position:absolute, visibility:hidden
            playerB.load();
        }

        // Fase 2: variante (playerB) finita → chiudi e avvia musica
        const phase2 = () => {
            this._introEndedListener = null;
            this.stopVideo();
            this._afterIntroEnd();
        };

        // OVERLAP secondi prima della fine di playerA: avvia playerB muto e invisibile
        // così al momento dello swap il frame è già renderizzato
        const onTimeUpdate = () => {
            if (!player.duration || player.duration === Infinity) return;
            if (player.currentTime >= player.duration - OVERLAP) {
                player.removeEventListener('timeupdate', onTimeUpdate);
                this._mantisTimeUpdateListener = null;
                if (playerB && playerB.paused) {
                    playerB.play().catch(() => {});
                }
            }
        };
        this._mantisTimeUpdateListener = onTimeUpdate;
        player.addEventListener('timeupdate', onTimeUpdate);

        // Fase 1: playerA terminato → swap istantaneo con playerB già in riproduzione
        const phase1 = () => {
            if (this._mantisTimeUpdateListener) {
                player.removeEventListener('timeupdate', this._mantisTimeUpdateListener);
                this._mantisTimeUpdateListener = null;
            }
            this._introEndedListener = phase2;
            if (playerB) {
                // playerB diventa visibile (mantis-active = absolute+visibile) PRIMA che playerA sparisca
                // → nessun flash: playerB copre playerA senza alcun frame vuoto
                playerB.classList.remove('mantis-preload');
                playerB.classList.add('mantis-active'); // rimane absolute, ora visibile
                playerB.muted = false;
                if (playerB.paused) playerB.play().catch(e => console.warn('Video Mantis variant:', e.message));
                playerB.addEventListener('ended', phase2, { once: true });
            }
            // playerA rimane nel layout (visibility:hidden) per mantenere le dimensioni del wrapper
            player.style.visibility = 'hidden';
        };

        // _introEndedListener gestisce anche lo stop manuale (stopVideo lo rimuove e chiama _afterIntroEnd)
        this._introEndedListener = phase1;
        player.addEventListener('ended', phase1, { once: true });

        // Setup player diretto (senza playVideo, per evitare il suo auto-stopVideo)
        this._duckAudio();
        const wrapper = document.getElementById('video-wrapper');
        const placeholder = document.getElementById('video-placeholder');
        const stopBtn = document.getElementById('btn-stop-video');
        if (wrapper) wrapper.style.display = '';
        if (placeholder) placeholder.style.display = 'none';
        if (stopBtn) stopBtn.style.display = '';
        player.src = stage.intro;
        player.style.display = 'block';
        player.play().catch(e => console.warn('Video Mantis intro:', e.message));
        document.getElementById('stage-active')?.classList.add('stage-video-active');
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

        // Caso speciale: intro a due video (intro fissa → variante basata su statistiche)
        if (stage.mantisIntro) {
            this.setActiveVideoBtn(document.getElementById('btn-intro'));
            this._startMantisChain();
            return;
        }

        if (stage.musicDuringIntro && ids.length > 0) {
            const triggerTime = (stage.musicIntroDelay || 0) / 1000;
            const introVolume = (stage.musicIntroVolume || 20) / 100;
            const onTimeUpdate = () => {
                if (player && player.currentTime >= triggerTime) {
                    player.removeEventListener('timeupdate', onTimeUpdate);
                    this.playMusicAtVolume(ids[0], introVolume);
                }
            };
            this.musicIntroTimer = onTimeUpdate; // tenuto per poterlo rimuovere in stopVideo
            if (player) player.addEventListener('timeupdate', onTimeUpdate);
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
        this._startSfxOnMusicStart();
    },

    playIntro() {
        if (!this.currentStage) return;
        this.stopAllAudio();
        this.setActiveVideoBtn(document.getElementById('btn-intro'));
        if (this.currentStage.mantisIntro) {
            const player = document.getElementById('video-player');
            if (player && this._introEndedListener) {
                player.removeEventListener('ended', this._introEndedListener);
                this._introEndedListener = null;
            }
            this._startMantisChain();
            return;
        }
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
        this.hidePlayerSidebar();
        if (this.newGameMode) {
            this.playMenuReturn();
            this.showScreen('main-menu');
        } else {
            this.showScreen('stage-select');
        }
    },

    goNextStage() {
        if (!this.currentStage) return;
        const nextStage = STAGES.find(s => s.id === this.currentStage.id + 1);
        if (!nextStage) return;
        if (this.currentStage.rewards) {
            this._showRewardsPopup(this.currentStage, nextStage);
        } else {
            this.showPlayersPopup(nextStage);
        }
    },

    _showRewardsPopup(stage, nextStage) {
        this._rewardsPendingNextStage = nextStage;
        this._rewardsConditionalState = {};

        const popup = document.getElementById('rewards-popup');
        document.getElementById('rewards-popup-stage').textContent =
            `STAGE ${String(stage.id).padStart(2, '0')} — ${stage.name}`;

        // Equipaggiamento sempre sbloccato
        const alwaysList = document.getElementById('rewards-always-list');
        alwaysList.innerHTML = (stage.rewards.always || []).map(id => {
            const eq = EQUIPMENT[id];
            return `<div class="rewards-equipment-item">
                <span class="rewards-eq-id">${id}</span>
                <span class="rewards-eq-name">${eq ? eq.name : id}</span>
            </div>`;
        }).join('');

        // Sezione condizionale
        const condSection = document.getElementById('rewards-conditional-section');
        const conditionals = stage.rewards.conditional || [];
        condSection.innerHTML = conditionals.map((cond, i) => {
            if (cond.exclusive && cond.options) {
                const optionsHtml = cond.options.map((opt, oi) => {
                    const eqHtml = opt.equipmentIds.map(id => {
                        const eq = EQUIPMENT[id];
                        return `<span class="rewards-eq-tag">${eq ? eq.name : id}</span>`;
                    }).join('');
                    return `<label class="rewards-radio-option" id="rewards-opt-${i}-${oi}">
                        <input type="radio" name="rewards-excl-${i}" value="${oi}"
                            onchange="App._rewardsToggle(${i}, ${oi})">
                        <span class="rewards-radio-label">${opt.label}</span>
                        <span class="rewards-radio-eq">${eqHtml}</span>
                    </label>`;
                }).join('');
                return `<div class="rewards-popup-divider"></div>
                    <div class="rewards-cond-block" id="rewards-cond-${i}">
                        <div class="rewards-popup-section-label">OBIETTIVO</div>
                        <div class="rewards-popup-question">${cond.question}</div>
                        <div class="rewards-radio-list">${optionsHtml}</div>
                    </div>`;
            }
            // Fallback: YES/NO classico
            return `<div class="rewards-popup-divider"></div>
                <div class="rewards-cond-block" id="rewards-cond-${i}">
                    <div class="rewards-popup-section-label">OBIETTIVO OPZIONALE</div>
                    <div class="rewards-popup-question">${cond.question}</div>
                    <div class="rewards-popup-yesno">
                        <button class="btn-codec rewards-no-btn active" id="rewards-no-${i}"
                            onclick="App._rewardsToggle(${i}, false)">
                            <span class="btn-inner">✕ NO</span>
                        </button>
                        <button class="btn-codec rewards-yes-btn" id="rewards-yes-${i}"
                            onclick="App._rewardsToggle(${i}, true)">
                            <span class="btn-inner">✓ SÌ</span>
                        </button>
                    </div>
                    <div class="rewards-cond-items" id="rewards-cond-items-${i}" style="display:none">
                        ${(cond.equipmentIds || []).map(id => {
                            const eq = EQUIPMENT[id];
                            return `<div class="rewards-equipment-item rewards-equipment-bonus">
                                <span class="rewards-eq-id">${id}</span>
                                <span class="rewards-eq-name">${eq ? eq.name : id}</span>
                            </div>`;
                        }).join('')}
                    </div>
                </div>`;
        }).join('');

        popup.style.display = 'flex';
    },

    _rewardsToggle(condIndex, value) {
        const stage = this.currentStage;
        if (!stage || !stage.rewards) return;
        this._rewardsConditionalState[condIndex] = value;

        // YES/NO classico
        document.getElementById(`rewards-no-${condIndex}`)?.classList.toggle('active', !value);
        document.getElementById(`rewards-yes-${condIndex}`)?.classList.toggle('active', value);
        const itemsEl = document.getElementById(`rewards-cond-items-${condIndex}`);
        if (itemsEl) itemsEl.style.display = value ? '' : 'none';
    },

    _rewardsConfirm() {
        // Persiste equipaggiamento sbloccato nella sessione
        const stage = this.currentStage;
        if (stage?.rewards && this.session) {
            const pool = this.session.unlockedEquipment || (this.session.unlockedEquipment = []);
            (stage.rewards.always || []).forEach(id => {
                if (!pool.includes(id)) pool.push(id);
            });
            (stage.rewards.conditional || []).forEach((cond, i) => {
                const val = this._rewardsConditionalState[i];
                if (cond.exclusive && cond.options && val !== undefined && val !== false) {
                    const opt = cond.options[val];
                    (opt?.equipmentIds || []).forEach(id => {
                        if (!pool.includes(id)) pool.push(id);
                    });
                } else if (!cond.exclusive && val === true) {
                    (cond.equipmentIds || []).forEach(id => {
                        if (!pool.includes(id)) pool.push(id);
                    });
                }
            });
            this._persistSession();
        }

        document.getElementById('rewards-popup').style.display = 'none';
        const nextStage = this._rewardsPendingNextStage;
        this._rewardsPendingNextStage = null;
        this._rewardsConditionalState = {};
        if (nextStage) this.showPlayersPopup(nextStage);
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
            const p = document.getElementById('video-player');
            if (p) p.removeEventListener('timeupdate', this.musicIntroTimer);
            this.musicIntroTimer = null;
        }
        this.setActiveVideoBtn(null);

        const wrapper = document.getElementById('video-wrapper');
        const player = document.getElementById('video-player');
        const stopBtn = document.getElementById('btn-stop-video');

        if (player) {
            player.onended = null;
            if (this._autoStopListener) {
                player.removeEventListener('ended', this._autoStopListener);
                this._autoStopListener = null;
            }
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
            player.style.visibility = '';
        }
        // Pulisce anche il player di precaricamento Mantis
        if (this._mantisTimeUpdateListener) {
            if (player) player.removeEventListener('timeupdate', this._mantisTimeUpdateListener);
            this._mantisTimeUpdateListener = null;
        }
        const playerB = document.getElementById('video-player-b');
        if (playerB) {
            playerB.pause();
            playerB.removeAttribute('src');
            playerB.load();
            playerB.classList.remove('mantis-preload');
            playerB.classList.remove('mantis-active');
            playerB.muted = false;
            playerB.style.display = 'none';
        }
        if (stopBtn) stopBtn.style.display = 'none';
        if (wrapper) wrapper.style.display = 'none';
        document.getElementById('stage-active')?.classList.remove('stage-video-active');
        this._unlockStage();
        document.getElementById('stage-active')?.scrollTo({ top: 0, behavior: 'smooth' });
        this._unduckAudio();
        if (this._eventMusicRestore !== null) {
            if (this.musicLoop) this.musicLoop.setVolume(this._eventMusicRestore);
            this._eventMusicRestore = null;
        }
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
        const disabledClass = stage.startInAlert ? ' btn-disabled' : '';
        const hasEnemies = Array.isArray(stage.enemies) && stage.enemies.length > 0;
        container.innerHTML = ids.map((id, i) => {
            const track = CONFIG.music[id];
            if (!track) return '';
            const label = (stage.musicLabels && stage.musicLabels[i]) || track.name;
            const btn = `<button class="btn-sound${disabledClass}" id="music-btn-${id}" onclick="App.playMusic('${id}')">♪ ${label}</button>`;
            if (!hasEnemies || stage.enemies[i] === undefined) return btn;
            const count = this.enemyState[i] ?? stage.enemies[i];
            const counter = `<div class="enemy-counter" id="enemy-counter-${i}">
                <button class="enemy-btn enemy-btn-minus" onclick="App.updateEnemyCount(${i},-1)">−</button>
                <span class="enemy-count" id="enemy-count-${i}">${count}</span>
                <span class="enemy-count-label">guardie</span>
                <button class="enemy-btn enemy-btn-plus" onclick="App.updateEnemyCount(${i},+1)">+</button>
            </div>`;
            return `<div class="music-zone-wrap">${btn}${counter}</div>`;
        }).join('');
    },

    // Restituisce true se lo stage ha telecamere (considera hasCamerasMinPlayers)
    _stageHasCameras(stage) {
        if (!stage) return false;
        if (stage.hasCameras) return true;
        if (stage.hasCamerasMinPlayers) {
            const count = (stage.players && stage.players.length) ? stage.players.length : 1;
            return count >= stage.hasCamerasMinPlayers;
        }
        return false;
    },

    // ============================================
    // ENEMY TRACKER
    // ============================================
    initEnemyState(stage) {
        this.enemyState = Array.isArray(stage.enemies)
            ? [...stage.enemies]
            : [];
        this.radioEnemyState = Array.isArray(stage.radioEnemies)
            ? [...stage.radioEnemies]
            : [];
    },

    updateEnemyCount(zone, delta) {
        if (this.enemyState[zone] === undefined) return;
        this.enemyState[zone] = Math.max(0, this.enemyState[zone] + delta);
        const el = document.getElementById(`enemy-count-${zone}`);
        if (el) {
            el.textContent = this.enemyState[zone];
            el.classList.add('enemy-count-flash');
            el.addEventListener('animationend', () => el.classList.remove('enemy-count-flash'), { once: true });
        }
    },

    updateRadioEnemyCount(zone, delta) {
        if (this.radioEnemyState[zone] === undefined) return;
        this.radioEnemyState[zone] = Math.max(0, this.radioEnemyState[zone] + delta);
        const el = document.getElementById(`radio-enemy-count-${zone}`);
        if (el) {
            el.textContent = this.radioEnemyState[zone];
            el.classList.add('enemy-count-flash');
            el.addEventListener('animationend', () => el.classList.remove('enemy-count-flash'), { once: true });
        }
    },

    playMusicAtVolume(id, volume) {
        const track = CONFIG.music[id];
        if (!track) return;
        this.stopMusic();
        this.lastMusicId = id;
        this.musicLoop = this.createSeamlessLoop(track.file, volume, track.loopOverlap, this._cfgLoopPoints(track));
        this.musicLoop.play();
        this._startSfxOnMusicStart();
        const controls = document.getElementById('music-controls');
        if (controls) controls.style.display = '';
        this.currentMusicBtn = document.getElementById(`music-btn-${id}`);
        if (this.currentMusicBtn) this.currentMusicBtn.classList.add('playing');
    },

    playMusic(id) {
        const normalVolume = (document.getElementById('music-volume')?.value || 25) / 100;
        const stage = this.currentStage;
        const isSwitching = this.musicLoop && this.musicLoop.isPlaying();
        if (isSwitching && stage && stage.elevator) {
            this.stopMusic();
            const stageEl = document.getElementById('stage-active');
            if (stageEl) stageEl.classList.add('stage-elevator-active');
            const sfx = new Audio(stage.elevator);
            sfx.play().catch(e => console.warn(e.message));
            sfx.addEventListener('ended', () => {
                if (stageEl) stageEl.classList.remove('stage-elevator-active');
                this.playMusicAtVolume(id, normalVolume);
            });
        } else {
            this.playMusicAtVolume(id, normalVolume);
        }
    },

    fadeMusicToNormalVolume() {
        if (!this.musicLoop) return;
        const targetVolume = (document.getElementById('music-volume')?.value || 25) / 100;
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

    _getMusicVolumeNum() {
        return (document.getElementById('music-volume')?.value || 15) / 100;
    },

    _getAlertVolumeNum() {
        return (document.getElementById('alert-volume')?.value || 80) / 100;
    },

    _showAlertVolumeSlider() {
        const wrap = document.getElementById('alert-volume-wrap');
        if (!wrap) return;
        const slider = document.getElementById('alert-volume');
        if (slider) slider.value = document.getElementById('music-volume')?.value || 15;
        wrap.style.display = '';
    },

    _hideAlertVolumeSlider() {
        const wrap = document.getElementById('alert-volume-wrap');
        if (wrap) wrap.style.display = 'none';
    },

    stopMusic() {
        this._stopSfxOnMusicStart();
        if (this.musicLoop) { this.musicLoop.stop(); this.musicLoop = null; }
        if (this.currentMusicBtn) { this.currentMusicBtn.classList.remove('playing'); this.currentMusicBtn = null; }
        // Differisce il layout shift al frame successivo per evitare ghost click
        requestAnimationFrame(() => {
            if (this.musicLoop) return;
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
        container.innerHTML = `
            <div id="mei-ling-btn-wrapper" style="display:${meiLingVisible ? '' : 'none'}; margin-left:auto">
                <button class="btn-codec btn-small btn-mei-ling" id="btn-mei-ling" onclick="App.openMeiLing()">
                    <span class="btn-inner">MEI LING</span>
                </button>
            </div>
            <div id="alert-volume-wrap" class="music-controls" style="display:none">
                <input type="range" id="alert-volume" class="volume-slider" min="0" max="100" value="20"
                    oninput="App.setAlertVolume(this.value)">
            </div>`;
    },

    // ============================================
    // TURN SYSTEM
    // ============================================
    buildTurnSection(stage, selectedPlayers) {
        const allPlayers = (stage.players && stage.players.length > 0) ? stage.players : ['Snake'];
        this.stagePlayers = (selectedPlayers && selectedPlayers.length > 0) ? selectedPlayers : allPlayers;
        this.currentPlayerIndex = 0;
        this.turnPhase = 'players';
        this.turnRound = 1;
        this.playerTokenState = [true, true, true, true];
        this.playerSubPhase = 'select';
        this.playersDoneTurn = [];
        this.selectedPlayerForTurn = null;
        this._noiseCountThisTurn = {};
        this._concMode = false;
        this._concModePlayer = null;
        // Token concentrazione: per ogni giocatore, array di booleani, persistono per tutto lo stage
        this.concentrationState = {};
        this.stagePlayers.forEach(p => {
            const ch = CHARACTERS[p];
            const tokens = ch && Array.isArray(ch.concentrationTokens) ? ch.concentrationTokens : [];
            this.concentrationState[p] = tokens.map(() => true);
        });
        // Stato capacità (once/reactive): reset ogni round
        this.abilityUsedState = {};
        this.stagePlayers.forEach(p => {
            const ch = CHARACTERS[p];
            if (!ch || !ch.abilities) return;
            this.abilityUsedState[p] = {};
            ch.abilities.forEach(a => { if (a.type !== 'passive') this.abilityUsedState[p][a.id] = false; });
        });
        this._anyAttackUsedByPlayer = {};
        this._weaponAttackUsedByPlayer = {};
        // Stato consumo equipaggiamenti (per stage)
        // - consumable: true/false (disabilitato dopo 1 uso)
        // - charges: N rimanenti (disabilitato quando raggiunge 0)
        // - altrimenti: null (nessun consumo)
        this.equipmentConsumedState = {};
        this.stagePlayers.forEach(p => {
            this.equipmentConsumedState[p] = {};
            (this.playerEquipment[p] || []).forEach(id => {
                if (!id) return;
                const eq = EQUIPMENT[id];
                if (eq?.charges != null)  this.equipmentConsumedState[p][id] = eq.charges;
                else if (eq?.consumable)  this.equipmentConsumedState[p][id] = false;
                else                      this.equipmentConsumedState[p][id] = null;
            });
        });
        this._renderTurnSection();
    },

    _buildTokenHtml() {
        return this.playerTokenState.map((avail, i) =>
            `<button class="token-dot ${avail ? 'available' : 'spent'}" onclick="App.toggleToken(${i})"></button>`
        ).join('');
    },

    toggleToken(i) {
        this.playerTokenState[i] = !this.playerTokenState[i];
        const el = document.getElementById('token-dots');
        if (el) el.innerHTML = this._buildTokenHtml();
        this._updatePlanciaButtonStates(this._activePlanciaPlayer());
    },

    resetTokens() {
        this.playerTokenState = [true, true, true, true];
        const el = document.getElementById('token-dots');
        if (el) el.innerHTML = this._buildTokenHtml();
        this._updatePlanciaButtonStates(this._activePlanciaPlayer());
    },

    // Giocatore attualmente sulla plancia
    _activePlanciaPlayer() {
        return this.stagePlayers.length > 1 ? this.selectedPlayerForTurn : this.stagePlayers[0];
    },

    // Consuma n token azione e aggiorna i bottoni della plancia
    spendTokens(n, playerName) {
        let rem = n;
        for (let i = 0; i < this.playerTokenState.length && rem > 0; i++) {
            if (this.playerTokenState[i]) { this.playerTokenState[i] = false; rem--; }
        }
        const el = document.getElementById('token-dots');
        if (el) el.innerHTML = this._buildTokenHtml();
        this._updatePlanciaButtonStates(playerName);
    },

    // Ricalcola disabled su tutti i bottoni della plancia
    _updatePlanciaButtonStates(playerName) {
        if (!playerName) return;
        const ch = CHARACTERS[playerName];
        if (!ch || !ch.hotspots) return;

        const available  = this.playerTokenState.filter(t => t).length;
        const inConcMode = this._concMode && this._concModePlayer === playerName;
        const stageDisabled = new Set(this.currentStage?.disabledActions || []);
        const actionMap  = {};
        (ch.fixedActions           || []).forEach(a => { actionMap[a.id] = a; });
        (ch.defaultVariableActions || []).forEach(a => { actionMap[a.id] = a; });

        ch.hotspots.forEach(h => {
            const btn = document.getElementById(`hotspot-${playerName}-${h.ref}`);
            if (!btn) return;
            const a = actionMap[h.ref];
            if (!a) return;

            let disabled = stageDisabled.has(a.id);
            if (!disabled && inConcMode) {
                // In conc mode solo il bottone concentrazione rimane attivo (funge da annulla)
                disabled = a.id !== 'concentrazione';
                btn.classList.toggle('conc-mode-active', a.id === 'concentrazione');
            } else {
                btn.classList.remove('conc-mode-active');
                if (!disabled && typeof a.cost === 'number') {
                    disabled = a.cost > available;
                } else if (!disabled && a.cost === 'X') {
                    const concState = this.concentrationState[playerName] || [];
                    const tokens = ch.concentrationTokens || [];
                    disabled = !tokens.some((t, i) => concState[i] === false && t.cost <= available);
                }
            }

            btn.disabled = disabled;
            btn.closest('.plancia-action-row')?.classList.toggle('action-disabled', disabled);
        });

        this._updateConcTokensForMode(playerName);

        // Aggiorna stato abilità (condizioni speciali di sblocco)
        const usedMap = this.abilityUsedState[playerName] || {};
        (ch.abilities || []).forEach(a => {
            if (a.type === 'passive') return;
            const btn = document.getElementById(`hotspot-${playerName}-${a.id}`);
            if (!btn) return;
            const isUsed = !!usedMap[a.id];
            let disabled = isUsed;
            if (a.id === 'attacco-furtivo') {
                disabled = disabled || !this._anyAttackUsedByPlayer[playerName];
            } else if (a.id === 'lavoro-da-solo') {
                disabled = disabled || !this._weaponAttackUsedByPlayer[playerName];
            }
            btn.disabled = disabled;
            btn.closest('.plancia-action-row')?.classList.toggle('action-disabled', disabled);
        });
    },

    enterConcMode(playerName) {
        if (this._concMode) { this._exitConcMode(playerName); return; }
        this._concMode = true;
        this._concModePlayer = playerName;
        this._updatePlanciaButtonStates(playerName);
    },

    _exitConcMode(playerName) {
        this._concMode = false;
        this._concModePlayer = null;
        this._updatePlanciaButtonStates(playerName);
    },

    // Aggiorna i token concentrazione in base alla modalità attiva
    _updateConcTokensForMode(playerName) {
        const ch = CHARACTERS[playerName];
        if (!ch?.concentrationTokens) return;
        const state      = this.concentrationState[playerName] || [];
        const available  = this.playerTokenState.filter(t => t).length;
        const inConcMode = this._concMode && this._concModePlayer === playerName;
        const noConc     = !!this.currentStage?.noConcentrationTokens;

        ch.concentrationTokens.forEach((t, i) => {
            const btn = document.getElementById(`conc-btn-${playerName}-${i}`);
            if (!btn) return;
            if (noConc) {
                btn.disabled = true;
                btn.classList.remove('available', 'conc-selectable', 'conc-mode-dim');
                btn.classList.add('spent');
                return;
            }
            const isSpent   = state[i] === false;
            const canAfford = t.cost <= available;
            if (inConcMode) {
                const selectable = isSpent && canAfford;
                btn.disabled = !selectable;
                btn.classList.toggle('conc-selectable', selectable);
                btn.classList.toggle('conc-mode-dim', !selectable);
            } else {
                btn.disabled = false;
                btn.classList.remove('conc-selectable', 'conc-mode-dim');
            }
        });
    },

    _buildDiceHtml(dice) {
        if (!dice || !dice.length) return '';
        const chips = dice.flatMap(d => {
            const cls = d.color === 'white' ? 'die-white' : 'die-black';
            return Array.from({ length: d.count }, () => `<span class="die-chip ${cls}">🎲</span>`);
        }).join('');
        return `<div class="action-dice">${chips}</div>`;
    },

    // ============================================
    // EQUIPMENT PANEL
    // ============================================

    _buildEquipmentPanel(playerName) {
        const slots = (this.playerEquipment[playerName] || []).filter(Boolean);
        if (!slots.length) return '';

        const consumed  = this.equipmentConsumedState[playerName] || {};
        const available = this.playerTokenState.filter(t => t).length;

        const items = slots.map(id => {
            const eq = EQUIPMENT[id];
            if (!eq) return '';

            // Stato consumi
            let isExhausted = false;
            let chargesHtml = '';
            if (eq.charges != null) {
                const remaining = typeof consumed[id] === 'number' ? consumed[id] : eq.charges;
                isExhausted = remaining <= 0;
                chargesHtml = `<div class="eq-panel-charges">${
                    Array.from({ length: eq.charges }, (_, i) =>
                        `<span class="eq-charge-dot ${i < remaining ? 'full' : 'empty'}"></span>`
                    ).join('')
                }</div>`;
            } else if (eq.consumable) {
                isExhausted = consumed[id] === true;
            }

            // Supporto multi-azione (es. C-4) e singola azione
            const actionList = eq.actions || (eq.action ? [eq.action] : []);
            const btnsHtml = actionList.map((a, ai) => {
                const chargeNeeded = a.usesCharge && eq.charges != null;
                const remaining    = typeof consumed[id] === 'number' ? consumed[id] : (eq.charges ?? 0);
                const noCharge     = chargeNeeded && remaining <= 0;
                const noTokens     = a.cost != null && a.cost > available;
                const disabled     = isExhausted || noCharge || noTokens;
                const noiseTag     = a.alertImmediate ? '⚠ ' : (a.noise ? '🔊 ' : '');
                const diceHtml     = this._buildDiceHtml(a.dice);
                return `<button class="panel-btn eq-action-btn"
                    ${disabled ? 'disabled' : ''}
                    onmouseenter="App.showTooltip(event,'${this._enc(a)}')"
                    onmouseleave="App.hideActionTooltip()"
                    onclick="App.useEquipment('${playerName}','${id}',${ai})">
                    <span class="panel-btn-name">${noiseTag}${a.name || '—'}</span>
                    <span class="panel-btn-cost">${a.cost != null ? a.cost : ''}${a.cost != null ? '<span class="cost-token">●</span>' : ''}</span>
                </button>${diceHtml}`;
            }).join('');

            return `<div class="eq-panel-item${isExhausted ? ' eq-item-disabled' : ''}" id="eq-item-${playerName}-${id}">
                <div class="eq-panel-item-name">${eq.name}</div>
                ${chargesHtml}
                ${btnsHtml}
            </div>`;
        }).join('');

        if (!items) return '';

        return `<div class="eq-panel-row" id="eq-panel-${playerName}">
            <div class="turn-panel-col-header">EQUIPAGGIAMENTO</div>
            <div class="eq-panel-items">${items}</div>
        </div>`;
    },

    useEquipment(playerName, equipId, actionIndex = 0) {
        const eq = EQUIPMENT[equipId];
        if (!eq) return;
        const actionList = eq.actions || (eq.action ? [eq.action] : []);
        const a = actionList[actionIndex] || {};

        // Spendi token
        if (a.cost > 0) this.spendTokens(a.cost, playerName);

        // Suono azione
        if (a.sound) this._playActionSound(a.sound);

        // Aggiorna stato consumi
        const consumed = this.equipmentConsumedState[playerName] || {};
        if (a.usesCharge && eq.charges != null) {
            const current = typeof consumed[equipId] === 'number' ? consumed[equipId] : eq.charges;
            consumed[equipId] = Math.max(0, current - 1);
        } else if (eq.consumable) {
            consumed[equipId] = true;
        }
        this.equipmentConsumedState[playerName] = consumed;

        // Cura
        if (a.heal) this.adjustHp(playerName, a.heal);

        // Se è un attacco, mostra popup risultato
        if (a.attack) {
            this.showAttackResultPopup(playerName, `eq-${equipId}`, a);
        }

        this._refreshEquipmentPanel(playerName);
    },

    _refreshEquipmentPanel(playerName) {
        const el = document.getElementById(`eq-panel-${playerName}`);
        if (!el) return;
        const newHtml = this._buildEquipmentPanel(playerName);
        if (newHtml) {
            const tmp = document.createElement('div');
            tmp.innerHTML = newHtml.trim();
            el.replaceWith(tmp.firstElementChild);
        }
    },

    _renderEquipmentSidebar(playerName) {
        const sidebar = document.getElementById('equipment-sidebar');
        if (!sidebar) return;
        const slots = (this.playerEquipment[playerName] || []).filter(Boolean);
        if (!slots.length) {
            sidebar.style.display = 'none';
            return;
        }
        sidebar.innerHTML = this._buildEquipmentPanel(playerName);
        sidebar.style.display = 'flex';
    },

    _clearEquipmentSidebar() {
        const sidebar = document.getElementById('equipment-sidebar');
        if (sidebar) sidebar.style.display = 'none';
    },

    // ============================================
    // TURN PANEL HELPERS
    // ============================================
    _enc(obj) { return encodeURIComponent(JSON.stringify(obj)).replace(/'/g, '%27'); },

    _buildPanelActionBtn(a) {
        const noiseTag = a.noise ? '🔊 ' : '';
        return `<button class="panel-btn"
            onmouseenter="App.showTooltip(event,'${this._enc(a)}')"
            onmouseleave="App.hideActionTooltip()"
            onclick="App.toggleTooltip(event,'${this._enc(a)}')">
            <span class="panel-btn-name">${noiseTag}${a.name}</span>
            <span class="panel-btn-cost">${a.cost}<span class="cost-token">●</span></span>
        </button>`;
    },

    _buildPanelFixed(playerName) {
        const ch = CHARACTERS[playerName];
        if (!ch || !ch.fixedActions) return '<div class="no-char-data">—</div>';
        return ch.fixedActions.map(a => this._buildPanelActionBtn(a)).join('');
    },

    _buildPanelVariable(playerName, stage) {
        const ch = CHARACTERS[playerName];
        if (!ch) return '<div class="no-char-data">—</div>';
        const varActions = (stage.variableActions && stage.variableActions[playerName])
            ? stage.variableActions[playerName].map(id => ch.defaultVariableActions.find(a => a.id === id)).filter(Boolean)
            : (ch.defaultVariableActions || []);
        if (!varActions.length) return '<div class="no-char-data">—</div>';
        return varActions.map(a => this._buildPanelActionBtn(a)).join('');
    },

    _buildPanelConc(playerName) {
        const ch = CHARACTERS[playerName];
        if (!ch || !Array.isArray(ch.concentrationTokens) || !ch.concentrationTokens.length)
            return '<div class="no-char-data">—</div>';
        const state = this.concentrationState[playerName] || [];
        const noConc = !!this.currentStage?.noConcentrationTokens;
        return ch.concentrationTokens.map((t, i) => {
            const avail   = state[i] !== false;
            const imgHtml = t.img
                ? `<img src="${t.img}" class="conc-token-img" alt="${t.label}">`
                : '';
            const hasImg  = !!t.img;
            return `<button class="panel-conc-token ${(noConc || !avail) ? 'spent' : 'available'}${hasImg ? ' has-img' : ''}"
                id="conc-btn-${playerName}-${i}"
                title="${t.label} — ${t.desc}"
                ${noConc ? 'disabled' : ''}
                onclick="App.toggleConcentration('${playerName}',${i});event.stopPropagation()">
                ${imgHtml}
                <span class="conc-token-label">${t.dice ? t.label.replace('[dice]', t.dice.flatMap(d => Array.from({length: d.count}, () => `<span class="die-chip ${d.color === 'white' ? 'die-white' : 'die-black'}">🎲</span>`)).join('')) : t.label}</span>
                <span class="conc-token-cost">${t.cost}<span class="cost-token">●</span></span>
            </button>`;
        }).join('');
    },

    _buildPanelAbilities(playerName) {
        const ch = CHARACTERS[playerName];
        if (!ch || !ch.abilities || !ch.abilities.length) return '<div class="no-char-data">—</div>';
        const usedMap = this.abilityUsedState[playerName] || {};
        return ch.abilities.map(a => {
            const isPassive = a.type === 'passive';
            const isUsed    = !!usedMap[a.id];
            const cls       = isPassive ? 'passive' : (isUsed ? 'used' : 'available');
            const label     = isPassive ? 'passiva' : (isUsed ? 'usata' : '1×/round');
            const payload   = { ...a, isAbility: true };
            const clickAttr = isPassive
                ? ''
                : `onclick="App.toggleAbility('${playerName}','${a.id}');App.toggleTooltip(event,'${this._enc(payload)}')"`;
            return `<button class="panel-btn panel-ability ${cls}"
                id="ability-btn-${playerName}-${a.id}"
                ${isPassive ? 'style="cursor:default"' : ''}
                onmouseenter="App.showTooltip(event,'${this._enc(payload)}')"
                onmouseleave="App.hideActionTooltip()"
                ${clickAttr}>
                <span class="panel-btn-name">${a.name}</span>
                <span class="panel-btn-cost panel-ability-tag">${label}</span>
            </button>`;
        }).join('');
    },

    _merylConcOpen: false,

    // Mostra l'abilità condivisa di Meryl nel pannello di un altro giocatore
    _buildMerylSharedAbilityHtml(activePlayer) {
        if (activePlayer === 'Meryl') return '';
        if (!this.stagePlayers.includes('Meryl')) return '';
        const ch = CHARACTERS['Meryl'];
        const ability = ch?.abilities?.find(a => a.id === 'posso-essere-d-aiuto');
        if (!ability) return '';
        const tokens = this.concentrationState['Meryl'] || [];
        const hasToken = tokens.some(v => v);
        const cls = hasToken ? 'available' : 'used';
        const payload = { ...ability, isAbility: true };

        let tokensHtml = '';
        if (this._merylConcOpen && hasToken) {
            const merylCh = CHARACTERS['Meryl'];
            const concTokens = merylCh?.concentrationTokens || [];
            tokensHtml = `<div class="meryl-conc-selection">` +
                concTokens.map((t, i) => {
                    const avail = tokens[i] !== false;
                    if (!avail) return '';
                    const diceHtml = t.dice
                        ? t.label.replace('[dice]', t.dice.flatMap(d =>
                            Array.from({length: d.count}, () =>
                                `<span class="die-chip ${d.color === 'white' ? 'die-white' : 'die-black'}">🎲</span>`
                            )).join(''))
                        : t.label;
                    const tPayload = { ...t, isConcToken: true };
                    return `<button class="panel-conc-token available"
                        onmouseenter="App.showTooltip(event,'${this._enc(tPayload)}')"
                        onmouseleave="App.hideActionTooltip()"
                        onclick="App.useMerylConcToken(${i})">
                        <span class="conc-token-label">${diceHtml}</span>
                    </button>`;
                }).join('') +
            `</div>`;
        }

        return `<div class="meryl-shared-ability-row" id="meryl-shared-ability-row">
            <span class="meryl-shared-label">MERYL</span>
            <div class="meryl-shared-ability-col">
                <button class="panel-btn panel-ability ${cls}${this._merylConcOpen ? ' active' : ''}"
                    onmouseenter="App.showTooltip(event,'${this._enc(payload)}')"
                    onmouseleave="App.hideActionTooltip()"
                    onclick="App.toggleMerylConcSelection()">
                    <span class="panel-btn-name">${ability.name}</span>
                    <span class="panel-btn-cost panel-ability-tag">passiva</span>
                </button>
                ${tokensHtml}
            </div>
        </div>`;
    },

    toggleMerylConcSelection() {
        this._merylConcOpen = !this._merylConcOpen;
        const row = document.getElementById('meryl-shared-ability-row');
        if (row) row.outerHTML = this._buildMerylSharedAbilityHtml(
            this.stagePlayers[this.currentPlayerIndex]
        );
    },

    useMerylConcToken(index) {
        if (!this.concentrationState['Meryl']) return;
        const ch = CHARACTERS['Meryl'];
        const token = ch?.concentrationTokens?.[index];
        this.concentrationState['Meryl'][index] = false;
        this._merylConcOpen = false;

        // Se è il token "+ Azione", ripristina un segnalino azione al giocatore attivo
        if (token?.id === 'meryl-conc-4') {
            const spentIdx = this.playerTokenState.indexOf(false);
            if (spentIdx !== -1) {
                this.playerTokenState[spentIdx] = true;
            } else {
                // Tutti i token sono già disponibili: aggiunge un quinto temporaneo
                this.playerTokenState.push(true);
            }
            const dots = document.getElementById('token-dots');
            if (dots) dots.innerHTML = this._buildTokenHtml();
        }

        const row = document.getElementById('meryl-shared-ability-row');
        if (row) row.outerHTML = this._buildMerylSharedAbilityHtml(
            this.stagePlayers[this.currentPlayerIndex]
        );
    },

    // ============================================
    // TOOLTIP
    // ============================================
    _tooltipPinnedData: null,

    showTooltip(event, encodedPayload) {
        const a = JSON.parse(decodeURIComponent(encodedPayload));
        this._renderTooltip(event.currentTarget || event.target, a);
    },

    toggleTooltip(event, encodedPayload) {
        const tooltip = document.getElementById('action-tooltip');
        if (tooltip && tooltip.style.display !== 'none' && this._tooltipPinnedData === encodedPayload) {
            this._tooltipPinnedData = null;
            tooltip.style.display = 'none';
        } else {
            this._tooltipPinnedData = encodedPayload;
            const a = JSON.parse(decodeURIComponent(encodedPayload));
            this._renderTooltip(event.currentTarget || event.target, a);
        }
        event.stopPropagation();
    },

    _renderTooltip(btn, a) {
        const tooltip = document.getElementById('action-tooltip');
        if (!tooltip) return;

        const diceHtml = this._buildDiceHtml(a.dice);
        let metaHtml;
        if (a.isAbility) {
            const typeLabel = a.type === 'passive' ? 'Passiva' : '1×/round — Gratuita';
            metaHtml = `<span class="tooltip-tag">${typeLabel}</span>`;
        } else {
            metaHtml = `<span class="tooltip-tag">${a.cost}● azione</span>`
                + (a.noise ? `<span class="tooltip-tag tooltip-noise">🔊 Rumore</span>` : '');
        }

        tooltip.innerHTML = `
            <div class="tooltip-name">${a.name}</div>
            <div class="tooltip-meta">${metaHtml}</div>
            <div class="tooltip-desc">${a.desc}</div>
            ${diceHtml}`;

        tooltip.style.display = 'block';
        const r = btn.getBoundingClientRect();
        tooltip.style.top  = (r.bottom + 6) + 'px';
        tooltip.style.left = r.left + 'px';
        requestAnimationFrame(() => {
            const t = tooltip.getBoundingClientRect();
            if (t.right  > window.innerWidth  - 8) tooltip.style.left = (window.innerWidth  - t.width  - 8) + 'px';
            if (t.bottom > window.innerHeight - 8) tooltip.style.top  = (r.top - t.height - 6) + 'px';
        });
    },

    hideActionTooltip() {
        if (this._tooltipPinnedData) return;
        const tooltip = document.getElementById('action-tooltip');
        if (tooltip) tooltip.style.display = 'none';
    },

    // ============================================
    // TOGGLE CONCENTRATION / ABILITY
    // ============================================
    toggleConcentration(playerName, i) {
        if (!this.concentrationState[playerName]) return;

        if (this._concMode && this._concModePlayer === playerName) {
            // Modalità concentrazione: ripristina il token e consuma segnalini azione
            if (this.concentrationState[playerName][i] !== false) return; // solo token spesi
            const ch    = CHARACTERS[playerName];
            const token = ch?.concentrationTokens?.[i];
            if (!token) return;

            this.concentrationState[playerName][i] = true;
            const btn = document.getElementById(`conc-btn-${playerName}-${i}`);
            if (btn) {
                btn.classList.replace('spent', 'available');
                btn.classList.remove('conc-selectable', 'conc-mode-dim');
                btn.disabled = false;
            }
            this._exitConcMode(playerName);          // aggiorna bottoni azione
            this.spendTokens(token.cost, playerName); // consuma token azione
            return;
        }

        // Modalità normale: toggle semplice
        this.concentrationState[playerName][i] = !this.concentrationState[playerName][i];
        const btn = document.getElementById(`conc-btn-${playerName}-${i}`);
        if (btn) {
            const avail = this.concentrationState[playerName][i];
            btn.classList.toggle('available',  avail);
            btn.classList.toggle('spent',     !avail);
        }
        this._updatePlanciaButtonStates(playerName);
    },

    toggleAbility(playerName, abilityId) {
        if (!this.abilityUsedState[playerName]) return;
        const wasUsed = this.abilityUsedState[playerName][abilityId];
        this.abilityUsedState[playerName][abilityId] = !wasUsed;
        const btn = document.getElementById(`ability-btn-${playerName}-${abilityId}`);
        if (btn) {
            btn.classList.toggle('used',      !wasUsed);
            btn.classList.toggle('available',  wasUsed);
            const tag = btn.querySelector('.panel-ability-tag');
            if (tag) tag.textContent = wasUsed ? '1×/round' : 'usata';
        }
        // aggiorna anche l'hotspot sulla plancia (se presente)
        const hotspot = document.getElementById(`hotspot-${playerName}-${abilityId}`);
        if (hotspot) {
            hotspot.classList.toggle('hotspot-used', !wasUsed);
            // Graya il nome nella riga della plancia
            const row = hotspot.closest('.plancia-action-row');
            if (row) row.classList.toggle('action-disabled', !wasUsed);
        }
    },

    // ============================================
    // PLANCIA OVERLAY
    // Hotspot circolari posizionati sui cerchi stampati.
    // cx/cy = centro in % sull'immagine (1913×1112).
    // Per avere pixel quadrati: H% = W% * (1913/1112)
    // ============================================
    _planciaDebug: false,

    togglePlanciaDebug() {
        this._planciaDebug = !this._planciaDebug;
        const wrapper = document.querySelector('.plancia-wrapper');
        if (!wrapper) return;
        wrapper.classList.toggle('plancia-debug', this._planciaDebug);
        const btn = document.getElementById('plancia-debug-btn');
        if (btn) btn.textContent = this._planciaDebug ? '✕ CALIBRAZIONE' : '⊕ CALIBRA';

        const img = wrapper.querySelector('.plancia-img');
        if (this._planciaDebug) {
            img._debugHandler = (e) => {
                const r = img.getBoundingClientRect();
                const cx = ((e.clientX - r.left) / r.width  * 100).toFixed(1);
                const cy = ((e.clientY - r.top)  / r.height * 100).toFixed(1);
                // Mostra badge coordinate sul punto cliccato
                const badge = document.createElement('div');
                badge.className = 'plancia-coord-badge';
                badge.textContent = `cx:${cx} cy:${cy}`;
                badge.style.left = cx + '%';
                badge.style.top  = cy + '%';
                wrapper.appendChild(badge);
                setTimeout(() => badge.remove(), 3000);
            };
            img.addEventListener('click', img._debugHandler);
        } else {
            if (img._debugHandler) img.removeEventListener('click', img._debugHandler);
            wrapper.querySelectorAll('.plancia-coord-badge').forEach(b => b.remove());
        }
    },

    _playActionSound(file) {
        if (!file) return;
        const audio = new Audio(file);
        audio.volume = 0.85;
        audio.play().catch(() => {});
    },

    _onBussataAction(playerName) {
        const marker = this.markerState[playerName] || {};
        // Se nessun segnalino attivo, attiva il ?
        if (!marker.alert && !marker.inter) {
            if (this.markerState[playerName]) this.markerState[playerName].inter = true;
            const btn = document.getElementById(`marker-inter-${playerName}`);
            if (btn) btn.classList.add('active');
        }
        const ch = CHARACTERS[playerName];
        const bussataSound = ch?.fixedActions?.find(a => a.id === 'bussata')?.sound
            || ch?.defaultVariableActions?.find(a => a.id === 'bussata')?.sound
            || 'audio/azioni/snake/bussata.wav';
        const sfx = new Audio(bussataSound);
        sfx.volume = 0.85;
        sfx.play().catch(() => {});
        sfx.addEventListener('ended', () => {
            const zone = this.playerZoneState[playerName] ?? 0;
            const guardsInZone = (this.enemyState && this.enemyState[zone]) || 0;
            if (guardsInZone <= 0) return;
            const currentMarker = this.markerState[playerName] || {};
            if (currentMarker.alert) {
                this._playActionSound('audio/azioni/guardie/soldato-ho-sentito-qualcosa.wav');
            } else if (currentMarker.inter) {
                const eh = new Audio('audio/azioni/guardie/soldato-eh.wav');
                eh.volume = 0.85;
                eh.play().catch(() => {});
                eh.addEventListener('ended', () => {
                    setTimeout(() => this._playActionSound('audio/azioni/guardie/soldato-cosa-e-stato.wav'), 500);
                }, { once: true });
            }
        }, { once: true });
    },

    _buildPlanciaOverlay(playerName, stage) {
        const ch = CHARACTERS[playerName];
        if (!ch || !ch.hotspots) return null;

        const actionMap = {};
        const stageVarOverride = stage?.variableActions?.[playerName];
        const varActionsToUse = stageVarOverride !== undefined
            ? stageVarOverride.map(id => (ch.defaultVariableActions || []).find(a => a.id === id)).filter(Boolean)
            : (ch.defaultVariableActions || []);
        (ch.fixedActions || []).forEach(a => { actionMap[a.id] = { ...a, _atype: 'action'  }; });
        varActionsToUse        .forEach(a => { actionMap[a.id] = { ...a, _atype: 'action'  }; });
        (ch.abilities  || []).forEach(a => { actionMap[a.id] = { ...a, _atype: 'ability' }; });

        const usedMap  = this.abilityUsedState[playerName] || {};
        const available = this.playerTokenState.filter(t => t).length;
        const stageDisabled = new Set(stage?.disabledActions || []);

        const buildRow = (h) => {
            const a = actionMap[h.ref];
            if (!a) return '';

            const isAbility  = a._atype === 'ability';
            const isUsed     = isAbility && !!usedMap[a.id];
            const soundCall  = a.id === 'bussata'
                ? `App._onBussataAction('${playerName}');`
                : (a.sound ? `App._playActionSound('${a.sound}');` : '');
            const toggleCall = (isAbility && a.type !== 'passive')
                ? `App.toggleAbility('${playerName}','${a.id}');`
                : '';

            // Calcola stato disabilitato
            let isDisabled = stageDisabled.has(a.id);
            if (isAbility) {
                isDisabled = isUsed;
                if (a.id === 'attacco-furtivo') {
                    isDisabled = isDisabled || !this._anyAttackUsedByPlayer[playerName];
                } else if (a.id === 'lavoro-da-solo') {
                    isDisabled = isDisabled || !this._weaponAttackUsedByPlayer[playerName];
                }
            } else if (typeof a.cost === 'number') {
                isDisabled = a.cost > available;
            } else if (a.cost === 'X') {
                // Concentrazione: abilitata solo se c'è almeno un token speso che si può permettere
                const concState = this.concentrationState[playerName] || [];
                const tokens = ch.concentrationTokens || [];
                isDisabled = !tokens.some((t, i) => concState[i] === false && t.cost <= available);
            }

            const spendCall = (typeof a.cost === 'number' && a.cost > 0)
                ? `App.spendTokens(${a.cost},'${playerName}');`
                : '';
            const noiseCall = a.noise
                ? `App._trackNoise('${playerName}');`
                : '';
            const attackCall = a.attack
                ? `App.showAttackResultPopup('${playerName}','${a.id}');`
                : '';
            const autoKillCall = a.autoKill
                ? `App.processAutoKill('${playerName}');`
                : '';
            const concModeCall = (a.id === 'concentrazione')
                ? `App.enterConcMode('${playerName}');`
                : '';

            const circleCls = ['plancia-circle-btn',
                isAbility ? 'circle-ability' : '',
                isUsed    ? 'hotspot-used'   : '',
            ].filter(Boolean).join(' ');

            const costLabel = a.cost !== undefined ? String(a.cost) : '';
            const noiseHtml = '';
            const diceHtml  = this._buildDiceHtml(a.dice);

            const isPassiveAbility = isAbility && a.type === 'passive';
            return `<div class="plancia-action-row${isAbility ? ' plancia-action-ability' : ''}${isDisabled ? ' action-disabled' : ''}">
                <button class="${circleCls}"
                    id="hotspot-${playerName}-${h.ref}"
                    ${isDisabled ? 'disabled' : ''}
                    ${isPassiveAbility ? 'style="cursor:default;pointer-events:none"' : ''}
                    onclick="${spendCall}${soundCall}${noiseCall}${attackCall}${autoKillCall}${toggleCall}${concModeCall}App._pulseHotspot(this);event.stopPropagation()">
                    <span class="circle-cost">${costLabel}</span>
                </button>
                <div class="plancia-action-text">
                    <div class="plancia-action-name">${a.name}${noiseHtml}</div>
                    <div class="plancia-action-desc">${a.desc}</div>
                    ${diceHtml}
                </div>
            </div>`;
        };

        const fixedHs   = ch.hotspots.filter(h => h.type === 'fixed');
        const varHs     = ch.hotspots.filter(h => h.type === 'variable');
        const abilityHs = ch.hotspots.filter(h => h.type === 'ability');

        const fixedHtml   = fixedHs.map(buildRow).join('');
        const varHtml     = varHs.map(buildRow).join('');
        const abilityHtml = abilityHs.map(buildRow).join('');

        return `<div class="plancia-board">
            <div class="plancia-board-cols">
                <div class="plancia-col">
                    <div class="plancia-col-header">AZIONI FISSE</div>
                    ${fixedHtml}
                </div>
                ${varHtml ? `<div class="plancia-col">
                    <div class="plancia-col-header">AZIONI VARIABILI</div>
                    ${varHtml}
                </div>` : ''}
            </div>
            ${abilityHtml ? `<div class="plancia-abilities-section">
                <div class="plancia-col-header">CAPACITÀ</div>
                ${abilityHtml}
            </div>` : ''}
        </div>`;
    },

    _pulseHotspot(btn) {
        btn.classList.remove('hotspot-pulse');
        void btn.offsetWidth; // reflow per riavviare l'animazione
        btn.classList.add('hotspot-pulse');
        btn.addEventListener('animationend', () => btn.classList.remove('hotspot-pulse'), { once: true });
    },

    // ============================================
    // TURN RENDERING
    // ============================================
    _renderTurnSection() {
        const content = document.getElementById('turn-content');
        if (!content) return;
        const stage  = this.currentStage;
        const isBoss = this._isEffectiveBoss(stage);

        if (this.turnPhase === 'players') {
            const isMulti = this.stagePlayers.length > 1;

            // ── FASE SELEZIONE (solo multi-player) ──────────────────────────
            if (isMulti && this.playerSubPhase === 'select') {
                const radioItems = this.stagePlayers.map(p => {
                    const done  = this.playersDoneTurn.includes(p);
                    const color = this.PLAYER_COLORS[p] || 'var(--codec-green)';
                    const sel   = this.selectedPlayerForTurn === p;
                    return `<label class="player-radio-item${done ? ' done' : ''}${sel ? ' selected' : ''}"
                                onclick="${done ? '' : `App.selectTurnPlayerRadio('${p}')`}">
                        <span class="player-radio-dot${sel ? ' sel' : ''}" style="${(!done && sel) ? `color:${color}` : ''}">◆</span>
                        <span class="player-radio-name" style="${done ? '' : `color:${color}`}">${p}</span>
                        ${done ? '<span class="player-done-badge">✓ FATTO</span>' : ''}
                    </label>`;
                }).join('');

                const canConfirm = this.selectedPlayerForTurn !== null
                    && !this.playersDoneTurn.includes(this.selectedPlayerForTurn);

                content.innerHTML = `
                    <div class="turn-header">
                        <div class="turn-phase-badge turn-phase-players">
                            FASE DEI GIOCATORI <span class="turn-round-label">Round ${this.turnRound}</span>
                        </div>
                    </div>
                    <div class="player-select-phase">
                        <div class="player-select-label">SCEGLI PERSONAGGIO</div>
                        <div class="player-radio-list">${radioItems}</div>
                        <button class="btn-codec player-confirm-btn" onclick="App.confirmTurnPlayer()"
                            ${canConfirm ? '' : 'disabled'}>
                            <span class="btn-inner">▶ CONFERMA</span>
                        </button>
                    </div>`;
                return;
            }

            // ── FASE ATTIVA (plancia del personaggio corrente) ───────────────
            const activePlayer = isMulti ? this.selectedPlayerForTurn : this.stagePlayers[0];
            this.currentPlayerIndex = this.stagePlayers.indexOf(activePlayer);
            const playerColor = this.PLAYER_COLORS[activePlayer] || 'var(--codec-green)';

            const headerHtml = `
                <div class="turn-header">
                    <div class="turn-phase-badge turn-phase-players">
                        FASE DEI GIOCATORI <span class="turn-round-label">Round ${this.turnRound}</span>
                    </div>
                    <div class="turn-header-controls">
                        <div class="token-tracker">
                            <span class="token-tracker-label">SEGNALINI AZIONE</span>
                            <div class="token-dots" id="token-dots">${this._buildTokenHtml()}</div>
                            <button class="token-reset" onclick="App.resetTokens()" title="Ripristina token">↺</button>
                        </div>
                        <button class="btn-sound turn-end-btn" onclick="App.finishPlayerTurn()"
                            style="border-color:${playerColor};color:${playerColor}">
                            FINE TURNO ${activePlayer.toUpperCase()}
                        </button>
                    </div>
                </div>`;

            const planciaHtml = this._buildPlanciaOverlay(activePlayer, stage);

            const eqHtml = this._buildEquipmentPanel(activePlayer);

            if (planciaHtml) {
                // Layout con bottoni cerchio + segnalini concentrazione separati
                const concHtml = this._buildPanelConc(activePlayer);
                content.innerHTML = headerHtml
                    + `<div class="plancia-with-eq">
                        ${planciaHtml}
                        ${eqHtml ? `<div class="plancia-eq-col">${eqHtml}</div>` : ''}
                    </div>`
                    + `<div class="plancia-conc-row">
                        <div class="turn-panel-col-header">SEGNALINI CONCENTRAZIONE</div>
                        <div class="plancia-conc-body">${concHtml}</div>
                       </div>`;
                this._updatePlanciaButtonStates(activePlayer);
                const merylSharedHtml = this._buildMerylSharedAbilityHtml(activePlayer);
                if (merylSharedHtml) content.innerHTML += merylSharedHtml;
            } else {
                // Layout a colonne (personaggi senza plancia)
                const merylSharedHtml = this._buildMerylSharedAbilityHtml(activePlayer);
                const eqColHtml = eqHtml
                    ? `<div class="turn-panel-col turn-panel-eq-col">${eqHtml}</div>`
                    : '';
                content.innerHTML = headerHtml + `
                <div class="turn-panel">
                    <div class="turn-panel-col">
                        <div class="turn-panel-col-header">AZIONI FISSE</div>
                        <div class="turn-panel-col-body">${this._buildPanelFixed(activePlayer)}</div>
                    </div>
                    <div class="turn-panel-col">
                        <div class="turn-panel-col-header">AZIONI VAR.</div>
                        <div class="turn-panel-col-body">${this._buildPanelVariable(activePlayer, stage)}</div>
                    </div>
                    <div class="turn-panel-col">
                        <div class="turn-panel-col-header">CONC.</div>
                        <div class="turn-panel-col-body">${this._buildPanelConc(activePlayer)}</div>
                    </div>
                    <div class="turn-panel-col">
                        <div class="turn-panel-col-header">CAPACITÀ</div>
                        <div class="turn-panel-col-body">${this._buildPanelAbilities(activePlayer)}</div>
                    </div>
                    ${eqColHtml}
                </div>
                ${merylSharedHtml}`;
            }
            this._clearEquipmentSidebar();
        } else {
            this._clearEquipmentSidebar();
            // Auto game over se si arriva alla fase nemici al round orderCards+7
            const _oc = this._resolveOrderCards(stage);
            if (!isBoss && _oc != null) {
                const autoGoRound = _oc + 7;
                if (this.turnRound >= autoGoRound) {
                    setTimeout(() => this.triggerGameOver(), 0);
                    return;
                }
            }

            const label    = isBoss ? 'TURNO BOSS'      : 'FASE DELLE GUARDIE';
            const endLabel = isBoss ? 'FINE TURNO BOSS' : 'FINE FASE GUARDIE';
            const phasesHtml = (!isBoss && stage)
                ? `<div id="soldier-phases">${this._buildSoldierPhaseHtml(stage)}</div>`
                : (isBoss ? this._buildBossTurnHtml(stage) : '');
            content.innerHTML = `
                <div class="turn-header">
                    <div class="turn-phase-badge turn-phase-soldiers">
                        ${label} <span class="turn-round-label">Round ${this.turnRound}</span>
                    </div>
                    <div class="turn-header-controls">
                        <button class="btn-sound btn-alert turn-end-btn" onclick="App.endSoldiersTurn()">
                            ${endLabel}
                        </button>
                    </div>
                </div>
                ${phasesHtml}`;
        }
    },

    selectTurnPlayer(index) {
        this.currentPlayerIndex = index;
        this.playerTokenState = [true, true, true, true];
        this._concMode = false;
        this._concModePlayer = null;
        this._renderTurnSection();
    },

    // Seleziona un personaggio nel radio button
    selectTurnPlayerRadio(name) {
        if (this.playersDoneTurn.includes(name)) return;
        this.selectedPlayerForTurn = name;
        this._merylConcOpen = false;
        // Cambia musica senza elevator se il nuovo giocatore è in una zona diversa
        const zone = this.playerZoneState[name] ?? 0;
        this._playMusicForZone(zone, false);
        this._renderTurnSection();
    },

    // Conferma la selezione radio → mostra plancia
    confirmTurnPlayer() {
        if (!this.selectedPlayerForTurn || this.playersDoneTurn.includes(this.selectedPlayerForTurn)) return;
        this.playerSubPhase = 'active';
        this.playerTokenState = [true, true, true, true];
        this._renderTurnSection();
    },

    // Fine turno del personaggio attivo
    finishPlayerTurn() {
        const player = this.stagePlayers.length > 1
            ? this.selectedPlayerForTurn
            : this.stagePlayers[0];

        // Se il giocatore ha fatto azioni rumorose, mostra prima il promemoria dadi
        const noiseCount = this._noiseCountThisTurn[player] || 0;
        if (noiseCount > 0) {
            this._showNoiseReminderPopup(player, noiseCount);
            return;
        }
        this._doFinishPlayerTurn(player);
    },

    _showNoiseReminderPopup(player, count) {
        const popup = document.getElementById('noise-reminder-popup');
        if (!popup) { this._doFinishPlayerTurn(player); return; }
        const dado = count === 1 ? 'dado bianco' : 'dadi bianchi';
        document.getElementById('noise-reminder-count').textContent = count;
        document.getElementById('noise-reminder-dado').textContent = dado;
        document.getElementById('noise-reminder-player').textContent = player.toUpperCase();
        this._noisePendingPlayer = player;
        popup.style.display = 'flex';
    },

    noiseReminderConfirm() {
        document.getElementById('noise-reminder-popup').style.display = 'none';
        const player = this._noisePendingPlayer;
        this._noisePendingPlayer = null;
        this._doFinishPlayerTurn(player);
    },

    _doFinishPlayerTurn(player) {
        if (player && !this.playersDoneTurn.includes(player)) {
            this.playersDoneTurn.push(player);
        }
        if (this.playersDoneTurn.length >= this.stagePlayers.length) {
            // Tutti i giocatori hanno finito → popup FASE DEI NEMICI
            const popup = document.getElementById('enemy-phase-popup');
            if (popup) popup.style.display = 'flex';
        } else {
            // Torna alla selezione con questo personaggio disabilitato
            this.playerSubPhase = 'select';
            this.selectedPlayerForTurn = null;
            this.playerTokenState = [true, true, true, true];
            this._renderTurnSection();
        }
    },

    _trackNoise(playerName) {
        this._noiseCountThisTurn[playerName] = (this._noiseCountThisTurn[playerName] || 0) + 1;
    },

    // Conferma popup FASE DEI NEMICI → passa a soldati/boss
    confirmEnemyPhase() {
        const popup = document.getElementById('enemy-phase-popup');
        if (popup) popup.style.display = 'none';
        this.turnPhase = 'soldiers';
        this.currentPlayerIndex = 0;
        this.playerTokenState = [true, true, true, true];
        const totalGuards = (this.enemyState || []).reduce((a, b) => a + b, 0);
        this.soldierGuardCard  = null;
        this.soldierCameraCard = null;
        this.soldierGuardAction = null;
        this._guardsAttackedThisTurn = false;
        this._renderTurnSection();
    },

    // Mantenuti per compatibilità ma non più chiamati dalla nuova UI
    passPlayerTurn() {
        this.finishPlayerTurn();
    },

    endPlayersTurn() {
        this.confirmEnemyPhase();
    },

    _isEffectiveBoss(stage) {
        if (!stage?.isBoss) return false;
        if (stage.hybridSneaking && this.stagePlayers.length >= stage.hybridSneaking.minPlayers) return false;
        return true;
    },

    _resolveOrderCards(stage) {
        const oc = stage?.orderCards;
        if (oc == null) return null;
        if (typeof oc === 'object') {
            const n = this.stagePlayers.length;
            return oc[n] ?? oc[Object.keys(oc).sort((a, b) => b - a).find(k => k <= n)] ?? null;
        }
        return oc;
    },

    endSoldiersTurn() {
        // Auto-evasione: se ancora in alert, nessuna guardia ha attaccato, e non in vista telecamera
        if (this.alertState === 'alert' && !this._guardsAttackedThisTurn && !this._inCameraSight) {
            this.triggerEvasion();
        }

        this.turnPhase = 'players';
        this.currentPlayerIndex = 0;
        this.turnRound++;
        this.trackStat('rounds');
        this.playerTokenState = [true, true, true, true];
        this.playerSubPhase = 'select';
        this.playersDoneTurn = [];
        this.selectedPlayerForTurn = null;
        // Reset capacità usate e tracciamento attacchi
        Object.keys(this.abilityUsedState).forEach(p => {
            Object.keys(this.abilityUsedState[p]).forEach(id => {
                this.abilityUsedState[p][id] = false;
            });
        });
        this._anyAttackUsedByPlayer = {};
        this._weaponAttackUsedByPlayer = {};
        this._noiseCountThisTurn = {};
        this._renderTurnSection();
    },

    // ============================================
    // FASE SOLDATI
    // ============================================
    _buildSoldierPhaseHtml(stage) {
        const inAlert    = this.alertState !== 'normal';
        const totalGuards = (this.enemyState || []).reduce((a, b) => a + b, 0);

        // Fase 1 — azioni guardie
        const guardCardsHtml = this.GUARD_CARDS.map(c => {
            const sel  = this.soldierGuardCard === c.id;
            const snd  = c.sound ? `App._playActionSound('${c.sound}');` : '';
            return `<button class="soldier-card${sel ? ' selected' : ''}"
                onclick="${snd}App.selectGuardCard('${c.id}')">${c.label}</button>`;
        }).join('');

        // Fase 2 — telecamere
        const cameraCardsHtml = this.CAMERA_CARDS.map(c => {
            const sel = this.soldierCameraCard === c.id;
            const snd = c.sound ? `App._playActionSound('${c.sound}');` : '';
            return `<button class="soldier-card${sel ? ' selected' : ''}"
                onclick="${snd}App.selectCameraCard('${c.id}')">${c.label}</button>`;
        }).join('');

        // Fase 3 — attivare guardie (singola riga per tutte)
        let guardsHtml = '';
        if (totalGuards > 0) {
            const actionsHtml = this.GUARD_ACTIONS.map(a => {
                if (a.alertOnly && !inAlert) return '';
                const isSel = this.soldierGuardAction === a.id;
                const snd   = a.sound ? `App._playActionSound('${a.sound}');` : '';
                const extra = a.id === 'attacca' ? ' guard-attacca' : '';
                return `<button class="guard-action-btn${isSel ? ' sel' : ''}${extra}"
                    onclick="${snd}App.setGuardAction('${a.id}')">${a.label}</button>`;
            }).join('');

            let reactionHtml = '';
            if (this.soldierGuardAction === 'interrogativo') {
                reactionHtml = `<select class="guard-reaction-select" onchange="App._playActionSound(this.value);this.value=''">
                    <option value="">— REAZIONE —</option>
                    <option value="audio/azioni/guardie/soldato-sembrava-qualcuno.wav">Devo essermelo immaginato</option>
                    <option value="audio/azioni/guardie/soldato-di-chi-sono-queste-impronte.wav">Di chi sono queste impronte?</option>
                    <option value="audio/azioni/guardie/soldato-sembrava-qualcuno.wav">Mh, non era nulla...</option>
                </select>`;
            } else if (this.soldierGuardAction && this.soldierGuardAction !== 'pattuglia' && this.soldierGuardAction !== 'attacca') {
                const curAction = this.GUARD_ACTIONS.find(a => a.id === this.soldierGuardAction);
                const rSnd = curAction?.reactionSound ? `App._playActionSound('${curAction.reactionSound}')` : '';
                reactionHtml = `<button class="guard-action-btn guard-reaction-btn"
                    onclick="${rSnd}">REAZIONE</button>`;
            }

            guardsHtml = `<div class="guard-actions-row">
                <div class="guard-actions">${actionsHtml}</div>
                ${reactionHtml}
            </div>`;
        } else {
            guardsHtml = '<div class="soldier-no-guards">Nessuna guardia attiva</div>';
        }

        const hasGameOver = !!(stage?.gameOverSounds || CONFIG.gameOverSounds);
        const orderCards  = this._resolveOrderCards(stage);
        const goLocked    = orderCards != null && this.turnRound <= orderCards;
        const gameOverBtn = hasGameOver
            ? `<div class="soldier-game-over-col">
                <button class="btn-game-over btn-video${goLocked ? ' go-locked' : ''}" id="btn-game-over"
                    ${goLocked ? 'disabled' : 'onclick="App.triggerGameOver()"'}>GAME<br>OVER</button>
               </div>`
            : '';

        return `
            <div class="soldier-phases-grid${hasGameOver ? ' has-game-over' : ''}">
                <div class="soldier-phase">
                    <div class="soldier-phase-title"><span class="phase-num">1</span>AZIONI GUARDIE</div>
                    <div class="soldier-phase-body">${guardCardsHtml}</div>
                </div>
                <div class="soldier-phase">
                    <div class="soldier-phase-title"><span class="phase-num">2</span>TELECAMERE</div>
                    <div class="soldier-phase-body">${cameraCardsHtml}</div>
                </div>
                <div class="soldier-phase">
                    <div class="soldier-phase-title"><span class="phase-num">3</span>ATTIVARE GUARDIE</div>
                    <div class="soldier-guards-list">${guardsHtml}</div>
                </div>
                ${gameOverBtn}
            </div>`;
    },

    _renderSoldierPhases() {
        const el = document.getElementById('soldier-phases');
        if (!el || !this.currentStage) return;
        el.innerHTML = this._buildSoldierPhaseHtml(this.currentStage);
    },

    selectGuardCard(id) {
        const wasSelected = this.soldierGuardCard === id;
        this.soldierGuardCard = wasSelected ? null : id;
        if (!wasSelected && id === 'radio') this._radioRestoreGuards();
        this._renderSoldierPhases();
    },

    selectCameraCard(id) {
        this.soldierCameraCard = this.soldierCameraCard === id ? null : id;
        if (this.soldierCameraCard === 'cambiano') this._inCameraSight = false;
        this._renderSoldierPhases();
    },

    setGuardAction(action) {
        this.soldierGuardAction = this.soldierGuardAction === action ? null : action;
        if (action === 'attacca') this._guardsAttackedThisTurn = true;
        this._renderSoldierPhases();
    },

    // ============================================
    // PLAYER SIDEBAR
    // ============================================
    buildPlayerSidebar(stage) {
        const sidebar = document.getElementById('player-sidebar');
        if (!sidebar) return;
        const players = this.stagePlayers?.length ? this.stagePlayers : (stage.players?.length ? stage.players : ['Snake']);

        // Inizializza stato HP, marker e zona
        this.hpState       = this.hpState       || {};
        this.markerState   = this.markerState   || {};
        this.playerZoneState = {};
        const isExtreme = this.session?.difficulty === 'EXTREME';
        players.forEach(p => {
            const ch    = CHARACTERS[p];
            const maxHp = (ch && ch.hp) ? ch.hp : 4;
            if (this.hpState[p] === undefined) {
                // Prima volta che il personaggio appare: sempre al massimo
                this.hpState[p] = maxHp;
            } else if (isExtreme) {
                // Extreme: HP precedenti + 1, mai sopra il massimo
                this.hpState[p] = Math.min(maxHp, this.hpState[p] + 1);
            } else {
                // Normal/Easy/Hard: reset al massimo
                this.hpState[p] = maxHp;
            }
            if (!this.markerState[p]) this.markerState[p] = { alert: false, inter: false };
            this.playerZoneState[p] = 0;
        });

        // Inizializza HP nemici boss
        this.bossHpState = this.bossHpState || {};
        const bossEnemies = stage.bossEnemies || [];
        const playerCount = players.length;
        bossEnemies.forEach(e => {
            if (this.bossHpState[e.id] === undefined) {
                const hp = e.hpByPlayerCount
                    ? (e.hpByPlayerCount[playerCount] ?? e.hpByPlayerCount[1] ?? e.hp ?? 10)
                    : (e.hp ?? 10);
                this.bossHpState[e.id] = hp;
            }
        });

        const statsHtml = this._buildSessionStatsHtml();
        const bossHtml  = bossEnemies.map(e => this._buildBossEnemyCard(e)).join('');
        sidebar.innerHTML = statsHtml + bossHtml + players.map(p => this._buildPlayerCard(p)).join('');
        sidebar.style.display = 'flex';
    },

    _buildSessionStatsHtml() {
        const s = this.session;
        const shown = this.showSessionStats;
        const chevron = shown ? '▲' : '▼';
        const statsBody = shown && s ? `
            <div class="session-stats-body">
                <div class="session-stat"><span class="stat-label">Play Time</span><span class="stat-val">${s.rounds}</span></div>
                <div class="session-stat"><span class="stat-label">Save</span><span class="stat-val">${s.saves}</span></div>
                <div class="session-stat"><span class="stat-label">Continue</span><span class="stat-val">${s.continues}</span></div>
                <div class="session-stat"><span class="stat-label">Being Found</span><span class="stat-val">${s.alerts}</span></div>
                <div class="session-stat"><span class="stat-label">Enemies</span><span class="stat-val">${s.kills + s.kills_silent}</span></div>
                <div class="session-stat"><span class="stat-label">Rations</span><span class="stat-val">${s.rations_used}</span></div>
            </div>` : '';
        return `<div class="session-stats-block">
            <button class="session-stats-toggle" onclick="App.toggleSessionStats()"
                title="${shown ? 'Nascondi statistiche sessione' : 'Mostra statistiche sessione'}">
                SESS ${chevron}
            </button>
            ${statsBody}
        </div>`;
    },

    toggleSessionStats() {
        this.showSessionStats = !this.showSessionStats;
        // Aggiorna solo il blocco stats senza ricostruire tutto
        const block = document.querySelector('.session-stats-block');
        if (block) block.outerHTML = this._buildSessionStatsHtml();
    },

    _buildPlayerCard(playerName) {
        const color  = this.PLAYER_COLORS[playerName] || 'var(--codec-green)';
        const hp     = this.hpState[playerName] ?? 5;
        const marker = this.markerState[playerName] || {};
        const stage  = this.currentStage;
        const currentZone = (this.playerZoneState && this.playerZoneState[playerName]) || 0;
        const isBoss    = stage?.isBoss || false;
        const multiZone = !isBoss && stage && stage.enemies && stage.enemies.length > 1;
        const zoneHtml = multiZone ? `
            <select class="zone-select" onchange="App.setPlayerZone('${playerName}', this.value)">
                ${stage.enemies.map((_, i) => {
                    const label = (stage.musicLabels && stage.musicLabels[i])
                        ? stage.musicLabels[i].toUpperCase() : `ZONA ${i + 1}`;
                    return `<option value="${i}"${i === currentZone ? ' selected' : ''}>${label}</option>`;
                }).join('')}
            </select>` : '';
        return `<div class="player-card">
            <div class="player-card-name" style="color:${color}">${playerName.toUpperCase()}</div>
            <div class="hp-tracker">
                <button class="hp-btn" onclick="App.adjustHp('${playerName}',-1)">−</button>
                <span class="hp-value" id="hp-${playerName}">${hp}</span>
                <button class="hp-btn" onclick="App.adjustHp('${playerName}',+1)">+</button>
            </div>
            ${!isBoss ? `<div class="player-markers">
                <button class="marker-btn marker-alert${marker.alert ? ' active' : ''}"
                    id="marker-alert-${playerName}"
                    onclick="App.toggleMarker('${playerName}','alert')">
                    <span class="marker-circle">!</span>
                </button>
                <button class="marker-btn marker-inter${marker.inter ? ' active' : ''}"
                    id="marker-inter-${playerName}"
                    onclick="App.toggleMarker('${playerName}','inter')">
                    <span class="marker-circle">?</span>
                </button>
            </div>` : ''}
            ${zoneHtml}
        </div>`;
    },

    _buildBossEnemyCard(enemy) {
        const hp = this.bossHpState[enemy.id] ?? 0;
        return `<div class="player-card boss-enemy-card">
            <div class="player-card-name" style="color:var(--codec-red)">${enemy.name}</div>
            <div class="hp-tracker">
                <button class="hp-btn" onclick="App.adjustBossHp('${enemy.id}',-1)">−</button>
                <span class="hp-value" id="boss-hp-${enemy.id}">${hp}</span>
                <button class="hp-btn" onclick="App.adjustBossHp('${enemy.id}',+1)">+</button>
            </div>
        </div>`;
    },

    _buildBossTurnHtml(stage) {
        const enemies = stage?.bossEnemies || [];
        return enemies.filter(e => e.attackSound || (e.cards && e.cards.length)).map(e => {
            const attackBtn = e.attackSound
                ? `<button class="btn-codec boss-attack-btn" onclick="App.playBossAttack('${e.id}')">
                       ▶ ATTACCA
                   </button>`
                : '';
            const cardsHtml = (e.cards && e.cards.length)
                ? `<div class="boss-cards-row">
                       <select class="boss-cards-select" id="boss-cards-select-${e.id}">
                           <option value="">— Carta frase —</option>
                           ${e.cards.map((c, i) => `<option value="${i}">${c.label}</option>`).join('')}
                       </select>
                       <button class="btn-codec boss-play-btn" onclick="App.playBossCard('${e.id}')">▶</button>
                   </div>`
                : '';
            return `<div class="boss-turn-block">
                <div class="boss-turn-name" style="color:var(--codec-red)">${e.name}</div>
                ${attackBtn}
                ${cardsHtml}
            </div>`;
        }).join('');
    },

    playBossAttack(enemyId) {
        const enemy = this.currentStage?.bossEnemies?.find(e => e.id === enemyId);
        if (enemy?.attackSound) this.playSfx(enemy.attackSound);
    },

    playBossCard(enemyId) {
        const enemy = this.currentStage?.bossEnemies?.find(e => e.id === enemyId);
        if (!enemy?.cards) return;
        const sel = document.getElementById(`boss-cards-select-${enemyId}`);
        const idx = sel ? parseInt(sel.value) : NaN;
        if (isNaN(idx) || !enemy.cards[idx]) return;
        this.playSfx(enemy.cards[idx].file);
    },

    adjustBossHp(enemyId, delta) {
        if (!this.bossHpState || this.bossHpState[enemyId] === undefined) return;
        const prev = this.bossHpState[enemyId];
        this.bossHpState[enemyId] = Math.max(0, this.bossHpState[enemyId] + delta);
        const current = this.bossHpState[enemyId];
        const el = document.getElementById(`boss-hp-${enemyId}`);
        if (el) {
            el.textContent = current;
            el.classList.add('hp-flash');
            el.addEventListener('animationend', () => el.classList.remove('hp-flash'), { once: true });
        }
        if (delta < 0 && prev > 0) {
            const enemy = this.currentStage?.bossEnemies?.find(e => e.id === enemyId);
            if (enemy) {
                const sound = current === 0 ? enemy.koSound : enemy.hitSound;
                if (sound) this.playSfx(sound);
                if (current === 0 && enemy.koTriggersGameOver) {
                    setTimeout(() => this.triggerGameOver(), 1500);
                } else if (current === 0 && enemy.koTriggersOutro) {
                    setTimeout(() => this.playOutro(), 1500);
                }
            }
        }
    },

    hidePlayerSidebar() {
        const sidebar = document.getElementById('player-sidebar');
        if (sidebar) sidebar.style.display = 'none';
        this.hpState       = {};
        this.markerState   = {};
        this.playerZoneState = {};
        this.bossHpState   = {};
    },

    adjustHp(playerName, delta) {
        if (this.hpState[playerName] === undefined) return;
        const prev = this.hpState[playerName];
        const ch = CHARACTERS[playerName];
        const maxHp = (ch && ch.hp) ? ch.hp : 4;
        this.hpState[playerName] = Math.max(0, Math.min(maxHp, prev + delta));
        const current = this.hpState[playerName];

        if (delta < 0 && current > 0 && ch?.hurtSound) {
            this._playActionSound(ch.hurtSound);
        }

        const el = document.getElementById(`hp-${playerName}`);
        if (el) {
            el.textContent = current;
            el.classList.add('hp-flash');
            el.addEventListener('animationend', () => el.classList.remove('hp-flash'), { once: true });
        }

        if (current === 0 && prev > 0) this._onPlayerDeath(playerName);
    },

    _onPlayerDeath(playerName) {
        const ch = CHARACTERS[playerName];
        this._lockStage();
        const specificSound = ch?.gameOverSound || null;
        if (ch?.deathSound) {
            const audio = new Audio(ch.deathSound);
            audio.volume = 0.9;
            audio.play().catch(() => {});
            setTimeout(() => this.triggerGameOver(specificSound), 4000);
        } else {
            this.triggerGameOver(specificSound);
        }
    },

    _lockStage() {
        document.getElementById('stage-active')?.classList.add('stage-locked');
    },

    _unlockStage() {
        document.getElementById('stage-active')?.classList.remove('stage-locked');
    },

    toggleMarker(playerName, marker) {
        if (!this.markerState[playerName]) return;
        if (marker === 'alert') {
            const wasActive = this.markerState[playerName].alert;
            this.showAlertCausePopup(playerName, wasActive);
            return;
        }
        // Per '?' — comportamento diretto
        const wasActive = this.markerState[playerName][marker];
        this.markerState[playerName].alert = false;
        this.markerState[playerName].inter = false;
        if (!wasActive) {
            this.markerState[playerName][marker] = true;
            this._playActionSound('audio/azioni/guardie/soldato-eh.wav');
        }
        ['alert', 'inter'].forEach(m => {
            const btn = document.getElementById(`marker-${m}-${playerName}`);
            if (btn) btn.classList.toggle('active', !!this.markerState[playerName][m]);
        });
    },

    // ============================================
    // ATTACK RESULT POPUP
    // ============================================
    showAttackResultPopup(playerName, actionId, actionObj = null) {
        const popup = document.getElementById('attack-result-popup');
        if (!popup) return;
        this._pendingAttackActionObj = actionObj;
        this._pendingAttackPlayer   = playerName;
        this._pendingAttackActionId = actionId;


        document.getElementById('attack-result-title').textContent = 'RISULTATO ATTACCO';
        document.getElementById('attack-result-options').innerHTML = `
            <button class="attack-result-btn" onclick="App.closeAttackResultPopup()">NESSUN COLPO</button>
            <button class="attack-result-btn attack-result-hit" onclick="App.resolveAttackHit()">COLPITO</button>
            <button class="attack-result-btn attack-result-defeated" onclick="App.resolveAttackDefeated()">COLPITO E SCONFITTO</button>`;

        popup.style.display = 'flex';
    },

    closeAttackResultPopup() {
        const popup = document.getElementById('attack-result-popup');
        if (popup) popup.style.display = 'none';
    },

    _getPendingAction() {
        if (this._pendingAttackActionObj) return this._pendingAttackActionObj;
        const ch = CHARACTERS[this._pendingAttackPlayer];
        if (!ch) return null;
        return [...(ch.fixedActions || []), ...(ch.defaultVariableActions || [])]
            .find(a => a.id === this._pendingAttackActionId) || null;
    },

    _trackAttackHit() {
        const playerName = this._pendingAttackPlayer;
        const action = this._getPendingAction();
        if (!playerName || !action?.attack) return;
        this._anyAttackUsedByPlayer[playerName] = true;
        if (action.attackType === 'weapon' || action.attackType === 'ranged') {
            this._weaponAttackUsedByPlayer[playerName] = true;
        }
        this._updatePlanciaButtonStates(playerName);
    },

    resolveAttackHit() {
        this.closeAttackResultPopup();
        this._trackAttackHit();
        const action   = this._getPendingAction();
        const stage    = this.currentStage;
        const isSneaking = !this._isEffectiveBoss(stage);
        const sounds   = isSneaking ? this.ATTACK_SOUNDS.guard : {};
        const vol      = 0.85;

        if (action?.attackType === 'physical') {
            // colpo fisico → +100ms → soldato-colpito
            const sfx1 = new Audio('audio/sfx/colpo-fisico.wav');
            sfx1.volume = vol;
            sfx1.play().catch(() => {});
            if (sounds.hit) {
                setTimeout(() => {
                    const sfx2 = new Audio(sounds.hit);
                    sfx2.volume = vol;
                    sfx2.play().catch(() => {});
                }, 100);
            }
        } else if (sounds.hit) {
            this._playActionSound(sounds.hit);
        }
    },

    resolveAttackDefeated() {
        this.closeAttackResultPopup();
        this._trackAttackHit();
        const playerName = this._pendingAttackPlayer;
        const action     = this._getPendingAction();
        const stage      = this.currentStage;
        const isSneaking = !this._isEffectiveBoss(stage);
        const sounds     = isSneaking ? this.ATTACK_SOUNDS.guard : {};
        const vol        = 0.85;

        const hitSoundFile = action?.attackType === 'physical' ? 'audio/sfx/colpo-fisico.wav' : null;

        if (hitSoundFile && isSneaking) {
            // colpo → +100ms → soldato-colpito → +300ms → colpo → +100ms → soldato-ucciso → caduta → tonfo
            const sfx1 = new Audio(hitSoundFile);
            sfx1.volume = vol;
            sfx1.play().catch(() => {});
            if (sounds.hit) {
                setTimeout(() => {
                    const sfxHit = new Audio(sounds.hit);
                    sfxHit.volume = vol;
                    sfxHit.play().catch(() => {});
                }, 100);
            }
            setTimeout(() => {
                const sfx2 = new Audio(hitSoundFile);
                sfx2.volume = vol;
                sfx2.play().catch(() => {});
                setTimeout(() => {
                    if (!sounds.defeated) return;
                    const sfx3 = new Audio(sounds.defeated);
                    sfx3.volume = vol;
                    sfx3.play().catch(() => {});
                    sfx3.addEventListener('ended', () => {
                        const sfx4 = new Audio('audio/azioni/guardie/soldato-caduta.wav');
                        sfx4.volume = vol;
                        sfx4.play().catch(() => {});
                        sfx4.addEventListener('ended', () => {
                            const sfx5 = new Audio('audio/azioni/guardie/soldato-tonfo.wav');
                            sfx5.volume = vol;
                            sfx5.play().catch(() => {});
                        }, { once: true });
                    }, { once: true });
                }, 100);
            }, 300);
        } else if (sounds.defeated) {
            this._playActionSound(sounds.defeated);
        }

        this._decreaseGuardInZone(playerName);
    },

    // Atterramento silenzioso: kill automatica → diminuisce guardie + stat kill
    processAutoKill(playerName) {
        this._decreaseGuardInZone(playerName);
        this.trackStat('kills_silent');
    },

    _decreaseGuardInZone(playerName) {
        const zone = (this.playerZoneState && this.playerZoneState[playerName] !== undefined)
            ? this.playerZoneState[playerName] : 0;
        this.updateEnemyCount(zone, -1);
    },

    _getDefaultEnemies(stage) {
        if (!stage || !stage.enemies) return [];
        if (stage.defaultEnemies) return stage.defaultEnemies;
        return stage.enemies.map(() => 3);
    },

    _radioRestoreGuards() {
        const stage = this.currentStage;
        if (!stage || !this.enemyState) return;

        if (Array.isArray(stage.radioEnemies)) {
            // Ripristina le guardie nelle zone dove si trovano i giocatori
            // fino alla soglia radioEnemies di quella zona
            const playerZones = new Set(
                this.stagePlayers.map(p => this.playerZoneState[p] ?? 0)
            );
            playerZones.forEach(zone => {
                const threshold = stage.radioEnemies[zone];
                if (threshold === undefined) return;
                const cur = this.enemyState[zone] || 0;
                if (cur < threshold) this.updateEnemyCount(zone, threshold - cur);
            });
        } else {
            // Comportamento di default: ripristina tutte le zone ai valori iniziali
            const defaults = this._getDefaultEnemies(stage);
            defaults.forEach((def, zone) => {
                const cur = this.enemyState[zone] || 0;
                if (cur < def) this.updateEnemyCount(zone, def - cur);
            });
        }
    },

    // Restituisce l'indice della zona della musica attualmente in riproduzione (-1 se nessuna)
    _currentMusicZoneIndex() {
        const stage = this.currentStage;
        if (!stage || !this.lastMusicId) return -1;
        return (stage.musicIds || []).indexOf(this.lastMusicId);
    },

    // Suona la musica della zona indicata.
    // useElevator=true: effetto ascensore (cambio manuale del giocatore)
    // useElevator=false: cambio diretto (passaggio al turno di un altro giocatore)
    _playMusicForZone(zoneIndex, useElevator) {
        const stage = this.currentStage;
        if (!stage) return;
        // Non cambiare musica se alert/evasion è attivo
        if (this.alertState !== 'normal') return;
        const ids = stage.musicIds || [];
        const id  = ids[zoneIndex];
        if (!id) return;
        if (id === this.lastMusicId) return; // già nella zona giusta
        if (useElevator) {
            this.playMusic(id); // playMusic gestisce già l'elevator
        } else {
            this.playMusicAtVolume(id, (document.getElementById('music-volume')?.value || 25) / 100);
        }
    },

    setPlayerZone(playerName, zoneIndex) {
        this.playerZoneState[playerName] = parseInt(zoneIndex);
        // Cambia musica solo se è il giocatore attivo in questo momento
        const isActive = this.stagePlayers?.length === 1
            ? true
            : (this.turnPhase === 'players' && this.playerSubPhase === 'active' && this.selectedPlayerForTurn === playerName);
        if (isActive) this._playMusicForZone(parseInt(zoneIndex), true);
    },

    // ============================================
    // ALERT CAUSE POPUP
    // ============================================
    showAlertCausePopup(playerName, alertWasActive) {
        const popup = document.getElementById('alert-cause-popup');
        if (!popup) return;
        const stage = this.currentStage;
        const optionsEl = document.getElementById('alert-cause-options');
        if (!optionsEl) return;

        let html = '';
        if (alertWasActive) {
            html += `<button class="alert-cause-btn alert-cause-fine"
                onclick="App.selectFineAlert('${playerName}')">FINE ALERT</button>`;
        }
        this.ALERT_CAUSES.forEach(c => {
            if (c.cameraOnly && !this._stageHasCameras(stage)) return;
            html += `<button class="alert-cause-btn"
                onclick="App.selectAlertCause('${playerName}','${c.id}')">${c.label}</button>`;
        });

        optionsEl.innerHTML = html;
        popup.style.display = 'flex';
    },

    closeAlertCausePopup() {
        const popup = document.getElementById('alert-cause-popup');
        if (popup) popup.style.display = 'none';
    },

    selectAlertCause(playerName, causeId) {
        if (this._alertCauseHandling) return;
        this._alertCauseHandling = true;
        setTimeout(() => { this._alertCauseHandling = false; }, 1000);
        this.closeAlertCausePopup();
        const cause = this.ALERT_CAUSES.find(c => c.id === causeId);
        // Suono dipende dallo stato corrente:
        // normal → suono causa (!!!), alert → nessun suono, evasion → !.mp3
        const isCamera = causeId === 'telecamera';
        if (this.alertState === 'normal' && cause && cause.sound) {
            const vol = this._getMusicVolumeNum();
            const sfx = new Audio(cause.sound);
            sfx.volume = 0.8;
            sfx.play().catch(e => console.warn(e.message));
            // 50% di probabilità di far partire eccolo dopo il suono causa (solo non-telecamera)
            if (!isCamera && Math.random() < 0.5) {
                sfx.addEventListener('ended', () => {
                    const eccolo = new Audio('audio/azioni/guardie/soldato-eccolo.wav');
                    eccolo.volume = vol;
                    eccolo.play().catch(e => console.warn(e.message));
                }, { once: true });
            }
            // Per la telecamera: triggerAlert parte 1s dopo l'inizio del suono !!!
            if (isCamera) {
                setTimeout(() => this.triggerAlert(), 1000);
            }
        } else if (this.alertState === 'evasion') {
            const sfx = new Audio('audio/sfx/!.mp3');
            sfx.volume = 0.8;
            sfx.play().catch(e => console.warn(e.message));
        }
        this._inCameraSight = isCamera;
        // Attiva marker ! per il giocatore
        if (this.markerState[playerName]) {
            this.markerState[playerName].alert = true;
            this.markerState[playerName].inter = false;
            ['alert', 'inter'].forEach(m => {
                const btn = document.getElementById(`marker-${m}-${playerName}`);
                if (btn) btn.classList.toggle('active', !!this.markerState[playerName][m]);
            });
        }
        // Per la telecamera triggerAlert è già schedulato dopo la fine dell'audio !!!
        if (!isCamera) this.triggerAlert();
        if (this.turnPhase === 'soldiers') this._renderSoldierPhases();
    },

    selectFineAlert(playerName) {
        this.closeAlertCausePopup();
        // Disattiva marker ! per il giocatore
        if (this.markerState[playerName]) {
            this.markerState[playerName].alert = false;
            const btn = document.getElementById(`marker-alert-${playerName}`);
            if (btn) btn.classList.remove('active');
        }
        // Se nessun giocatore ha più !, torna a normale
        const anyAlert = Object.values(this.markerState).some(s => s.alert);
        if (!anyAlert) this._returnToNormal();
        if (this.turnPhase === 'soldiers') this._renderSoldierPhases();
    },

    _returnToNormal() {
        if (this.alertState === 'normal') return;
        if (this.alertLoop) { this.alertLoop.stop(); this.alertLoop = null; }
        if (this.evasionLoop) { this.evasionLoop.stop(); this.evasionLoop = null; }
        this._hideAlertVolumeSlider();

        const returnAudio = new Audio(CONFIG.alertSounds['return-to-posts'].file);
        returnAudio.volume = 0.8;
        returnAudio.play().catch(e => console.warn(e.message));
        returnAudio.addEventListener('ended', () => {
            const vp = document.getElementById('video-player');
            if (vp && !vp.paused) return; // video in riproduzione, non avviare musica
            const normalVolume = (document.getElementById('music-volume')?.value || 25) / 100;
            const stageIds = this.currentStage?.musicIds || [];
            const idToPlay = (this.lastMusicId && stageIds.includes(this.lastMusicId))
                ? this.lastMusicId
                : (stageIds[0] || null);
            if (idToPlay) this.playMusicAtVolume(idToPlay, normalVolume);
        });

        this.alertState = 'normal';
        this._inCameraSight = false;
    },

    showPlayersPopup(stage) {
        const popup = document.getElementById('players-popup');
        if (!popup) { this.selectStage(stage.id); return; }

        document.getElementById('players-popup-stage-id').textContent =
            `STAGE ${String(stage.id).padStart(2, '0')}`;
        document.getElementById('players-popup-stage-name').textContent =
            stage.name.toUpperCase();
        const typeEl = document.getElementById('players-popup-type');
        typeEl.textContent = stage.type;
        typeEl.style.color = stage.isBoss ? 'var(--codec-red)' : 'var(--codec-orange)';

        const players = (stage.players && stage.players.length > 0) ? stage.players : ['Snake'];
        this._pendingStageId = stage.id;
        this._popupAllPlayers = players;
        this._pendingSelectedPlayers = players.includes('Snake') ? ['Snake'] : [];

        // Con un solo personaggio disponibile salta il popup e vai diretto all'equipaggiamento
        if (players.length === 1) {
            this.startStageFromPopup();
            return;
        }

        this._renderPlayersPopupList();
        popup.style.display = 'flex';
    },

    _renderPlayersPopupList() {
        const players = this._popupAllPlayers || [];
        const selected = this._pendingSelectedPlayers || [];
        document.getElementById('players-popup-list').innerHTML =
            players.map(p => {
                const color    = this.PLAYER_COLORS[p] || 'var(--codec-green)';
                const isSel    = selected.includes(p);
                const required = p === 'Snake';
                return `<div class="player-chip${isSel ? ' selected' : ''}${required ? ' required' : ''}"
                    style="border-color:${color};color:${color}"
                    onclick="App._togglePopupPlayer('${p}')">◆ ${p}${required ? ' ✦' : ''}</div>`;
            }).join('');
        const startBtn = document.querySelector('.players-popup-start-btn');
        if (startBtn) startBtn.disabled = selected.length === 0;
    },

    _togglePopupPlayer(name) {
        if (name === 'Snake') return; // Snake è sempre obbligatorio
        const sel = this._pendingSelectedPlayers;
        const idx = sel.indexOf(name);
        if (idx === -1) sel.push(name);
        else if (sel.length > 1) sel.splice(idx, 1);
        this._renderPlayersPopupList();
    },

    startStageFromPopup() {
        const popup = document.getElementById('players-popup');
        if (popup) popup.style.display = 'none';
        if (!this._pendingStageId || !this._pendingSelectedPlayers?.length) return;

        const unlocked = this.session?.unlockedEquipment || [];
        const players  = this._pendingSelectedPlayers || [];
        // Owner items contano solo per i giocatori NON al debutto (già sbloccati)
        const hasOwnerItems = players.some(p =>
            !this._isCharacterDebut(p) && Object.values(EQUIPMENT).some(eq => eq.owner === p)
        );
        if (unlocked.length > 0 || hasOwnerItems) {
            this._showEquipmentPopup();
        } else {
            this._doStartStage();
        }
    },

    _doStartStage() {
        const players = this._pendingSelectedPlayers;
        const isExtreme = this.session?.difficulty === 'EXTREME';
        const maxSlots  = isExtreme ? 2 : 3;
        // Segna tutti i giocatori selezionati come "al debutto avvenuto"
        // e auto-assegna baseEquipment ai debutanti (popup non mostrato)
        if (this.session) {
            const debuted = this.session.debutedCharacters || (this.session.debutedCharacters = []);
            players.forEach(p => {
                if (!debuted.includes(p)) debuted.push(p);
                if (this._isCharacterDebut(p)) {
                    const ch = CHARACTERS[p];
                    if (ch?.baseEquipment?.length > 0) {
                        if (!this.playerEquipment) this.playerEquipment = {};
                        this.playerEquipment[p] = [...ch.baseEquipment.slice(0, maxSlots)];
                        while (this.playerEquipment[p].length < maxSlots) this.playerEquipment[p].push(null);
                    }
                }
            });
            this._persistSession();
        }
        const stageId = this._pendingStageId;
        this._pendingStageId = null;
        this._pendingSelectedPlayers = null;
        this._popupAllPlayers = null;
        this.selectStage(stageId, players);
    },

    // ============================================
    // EQUIPMENT SELECTION POPUP
    // ============================================

    _isCharacterDebut(playerName) {
        const ch = CHARACTERS[playerName];
        const stageId = this._pendingStageId || this.currentStage?.id || 0;
        // È debutto solo se è esattamente lo stage di prima apparizione del personaggio
        return ch?.debutStage != null && stageId === ch.debutStage;
    },

    _showEquipmentPopup() {
        const players = this._pendingSelectedPlayers;

        const isExtreme = this.session?.difficulty === 'EXTREME';
        const maxSlots  = isExtreme ? 2 : 3;

        this.playerEquipment = {};
        players.forEach(p => {
            const isDebut = this._isCharacterDebut(p);
            const ch = CHARACTERS[p];
            if (isDebut && ch?.baseEquipment?.length > 0) {
                // Slot pre-compilati con l'equipaggiamento base, bloccati
                this.playerEquipment[p] = [...ch.baseEquipment.slice(0, maxSlots)];
                while (this.playerEquipment[p].length < maxSlots) this.playerEquipment[p].push(null);
            } else {
                this.playerEquipment[p] = Array(maxSlots).fill(null);
            }
        });

        this._renderEquipmentPopup();
        document.getElementById('equipment-popup').style.display = 'flex';
    },

    _renderEquipmentPopup() {
        const players   = this._pendingSelectedPlayers;
        const unlocked  = this.session?.unlockedEquipment || [];
        const isExtreme = this.session?.difficulty === 'EXTREME';
        const maxSlots  = isExtreme ? 2 : 3;
        const content   = document.getElementById('equipment-popup-content');

        content.innerHTML = players.map(p => {
            const isDebut = this._isCharacterDebut(p);
            const color   = this.PLAYER_COLORS[p] || 'var(--codec-green)';
            const slots   = (this.playerEquipment[p] || [null, null, null]).slice(0, maxSlots);

            const slotsHtml = slots.map((slotId, i) => {
                if (isDebut) {
                    const eq = slotId ? EQUIPMENT[slotId] : null;
                    return `<div class="eq-slot eq-slot-locked">
                        <span class="eq-slot-num">${i + 1}</span>
                        <div class="eq-slot-display">
                            ${eq
                                ? `<span class="eq-id">${slotId}</span><span class="eq-name">${eq.name}</span>`
                                : `<span class="eq-empty">—</span>`}
                        </div>
                        ${slotId ? `<span class="eq-lock-icon">🔒</span>` : ''}
                    </div>`;
                }

                const isInactive = i > 0 && !slots[i - 1];
                const usedIds    = this._getAllUsedEquipment(p, i);
                // Include anche gli item con owner === p non ancora nell'unlocked pool
                const ownerItems = Object.keys(EQUIPMENT).filter(id => EQUIPMENT[id].owner === p && !unlocked.includes(id));
                const pool       = [...unlocked, ...ownerItems];
                const available  = pool.filter(id => !usedIds.has(id) && (!EQUIPMENT[id].owner || EQUIPMENT[id].owner === p));

                const ddId = `eq-dd-${p}-${i}`;
                const allOpts = [
                    { value: '', label: '— nessuno —' },
                    ...available.map(id => ({ value: id, label: `${id} — ${EQUIPMENT[id]?.name || id}` })),
                    ...(slotId && !available.includes(slotId)
                        ? [{ value: slotId, label: `${slotId} — ${EQUIPMENT[slotId]?.name || slotId}` }]
                        : []),
                ];
                const selectedLabel = slotId
                    ? (allOpts.find(o => o.value === slotId)?.label || slotId)
                    : '— nessuno —';
                const optionsHtml = allOpts.map((o, j) => `
                    <li class="eq-dd-option${o.value === slotId ? ' selected' : ''}"
                        data-value="${o.value}"
                        onmouseenter="App._eqDdHover('${ddId}', ${j})"
                        onmousedown="event.preventDefault();App._eqDdSelect('${p}', ${i}, '${o.value}')">
                        ${o.label}
                    </li>`).join('');
                return `<div class="eq-slot${isInactive ? ' eq-slot-inactive' : ''}">
                    <span class="eq-slot-num">${i + 1}</span>
                    <div class="eq-dd" id="${ddId}" tabindex="${isInactive ? -1 : 0}"
                        onkeydown="App._eqDdKeydown('${p}', ${i}, '${ddId}', event)"
                        onblur="App._eqDdBlur('${ddId}', event)">
                        <button class="eq-dd-trigger" type="button" ${isInactive ? 'disabled' : ''}
                            onmousedown="event.preventDefault();App._eqDdToggle('${ddId}')">
                            <span class="eq-dd-value">${selectedLabel}</span>
                            <span class="eq-dd-arrow">▾</span>
                        </button>
                        <ul class="eq-dd-list" style="display:none">
                            ${optionsHtml}
                        </ul>
                    </div>
                    ${slotId ? `<button class="eq-remove-btn" type="button" onclick="App._removeEquipSlot('${p}', ${i})">✕</button>` : ''}
                </div>`;
            }).join('');

            return `<div class="eq-player-block" style="--player-color:${color}">
                <div class="eq-player-name" style="color:${color}">◆ ${p.toUpperCase()}</div>
                ${isDebut ? `<div class="eq-debut-label">DEBUTTO — equipaggiamento di base</div>` : ''}
                <div class="eq-slots">${slotsHtml}</div>
            </div>`;
        }).join('');
    },

    _getAllUsedEquipment(forPlayer, excludeSlot) {
        const used = new Set();
        Object.entries(this.playerEquipment).forEach(([p, slots]) => {
            slots.forEach((id, i) => {
                if (id && !(p === forPlayer && i === excludeSlot)) used.add(id);
            });
        });
        return used;
    },

    // Suoni equipaggiamento (popup selezione)
    _equipSounds: {
        menu:     'audio/sfx/oggetto-menu.wav',
        navigate: 'audio/sfx/oggetto-scelta.wav',
        select:   'audio/sfx/oggetto-togliere.wav',
    },
    _selectJustChanged: false,
    _openEqDdId: null,      // id del dropdown equipaggiamento attualmente aperto
    _eqDdCursor: 0,         // indice dell'opzione evidenziata (0 = nessuno)

    _playEquipSound(type) {
        const file = this._equipSounds[type];
        if (file) this._playActionSound(file);
    },

    _onEquipSlotChange(playerName, slotIndex, value) {
        this._eqDdSelect(playerName, slotIndex, value);
    },

    _eqDdToggle(ddId) {
        if (this._openEqDdId && this._openEqDdId !== ddId) {
            this._eqDdClose(this._openEqDdId, false);
        }
        const isOpen = this._openEqDdId === ddId;
        if (isOpen) {
            this._eqDdClose(ddId, true);
        } else {
            this._eqDdOpen(ddId);
        }
    },

    _eqDdOpen(ddId) {
        const dd = document.getElementById(ddId);
        if (!dd) return;
        const list = dd.querySelector('.eq-dd-list');
        if (!list) return;
        list.style.display = '';
        dd.classList.add('open');
        this._openEqDdId = ddId;
        this._eqDdCursor = 0;
        this._playEquipSound('menu');
        dd.focus();
    },

    _eqDdClose(ddId, playSound) {
        const dd = document.getElementById(ddId);
        if (!dd) return;
        const list = dd.querySelector('.eq-dd-list');
        if (list) list.style.display = 'none';
        dd.classList.remove('open');
        dd.querySelectorAll('.eq-dd-option.cursor').forEach(el => el.classList.remove('cursor'));
        if (this._openEqDdId === ddId) this._openEqDdId = null;
        if (playSound) this._playEquipSound('select');
    },

    _eqDdHover(ddId, index) {
        const dd = document.getElementById(ddId);
        if (!dd) return;
        dd.querySelectorAll('.eq-dd-option').forEach((el, i) => {
            el.classList.toggle('cursor', i === index);
        });
        this._eqDdCursor = index;
        this._playEquipSound('navigate');
    },

    _eqDdSelect(playerName, slotIndex, value) {
        const ddId = `eq-dd-${playerName}-${slotIndex}`;
        this._eqDdClose(ddId, false);
        this._selectJustChanged = true;
        this._playEquipSound('select');
        this.playerEquipment[playerName][slotIndex] = value || null;
        if (!value) {
            const len = this.playerEquipment[playerName].length;
            for (let i = slotIndex + 1; i < len; i++) this.playerEquipment[playerName][i] = null;
        }
        this._renderEquipmentPopup();
    },

    _eqDdKeydown(playerName, slotIndex, ddId, event) {
        const dd = document.getElementById(ddId);
        if (!dd) return;
        const isOpen = dd.classList.contains('open');
        const list = dd.querySelector('.eq-dd-list');
        const options = list ? [...list.querySelectorAll('.eq-dd-option')] : [];

        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (!isOpen) {
                this._eqDdOpen(ddId);
            } else {
                const cur = options[this._eqDdCursor];
                if (cur) this._eqDdSelect(playerName, slotIndex, cur.dataset.value);
                else this._eqDdClose(ddId, true);
            }
        } else if (event.key === 'Escape') {
            event.preventDefault();
            if (isOpen) this._eqDdClose(ddId, true);
        } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (!isOpen) { this._eqDdOpen(ddId); return; }
            const next = Math.min(this._eqDdCursor + 1, options.length - 1);
            this._eqDdHover(ddId, next);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            if (!isOpen) { this._eqDdOpen(ddId); return; }
            const prev = Math.max(this._eqDdCursor - 1, 0);
            this._eqDdHover(ddId, prev);
        }
    },

    _eqDdBlur(ddId, event) {
        // Chiudi solo se il focus va fuori dal dropdown
        setTimeout(() => {
            const dd = document.getElementById(ddId);
            if (!dd || dd.contains(document.activeElement)) return;
            if (this._openEqDdId === ddId) this._eqDdClose(ddId, true);
        }, 100);
    },

    _removeEquipSlot(playerName, slotIndex) {
        this._playEquipSound('select');
        const slots = this.playerEquipment[playerName];
        slots.splice(slotIndex, 1);
        slots.push(null);
        this._renderEquipmentPopup();
    },

    confirmEquipmentPopup() {
        document.getElementById('equipment-popup').style.display = 'none';
        this._doStartStage();
    },

    triggerAlert() {
        if (!this.currentStage || this._isEffectiveBoss(this.currentStage)) return;
        const sounds = CONFIG.alertSounds;

        if (this.alertState === 'normal') {
            this.trackStat('alerts');
            const vol = this._getMusicVolumeNum();
            this.stopMusic();

            const alertCfg = CONFIG.music['encounter'];
            this.alertLoop = this.createSeamlessLoop(alertCfg.file, vol, alertCfg.loopOverlap, this._cfgLoopPoints(alertCfg));
            this.alertLoop.play();

            this.alertState = 'alert';
            this._showAlertVolumeSlider();
            this.updateAlertButtons();

        } else if (this.alertState === 'evasion') {
            this.trackStat('alerts');
            const vol = this._getAlertVolumeNum();
            this.crossfadeLoops(this.evasionLoop, this.alertLoop, vol);
            // 33% eccolo, 33% da-questa-parte, 34% niente
            const roll = Math.random();
            let voiceFile = null;
            if (roll < 0.33)      voiceFile = 'audio/azioni/guardie/soldato-eccolo.wav';
            else if (roll < 0.66) voiceFile = 'audio/azioni/guardie/soldato-da-questa-parte.wav';
            if (voiceFile) {
                const sfx = new Audio(voiceFile);
                sfx.volume = vol;
                sfx.play().catch(e => console.warn(e.message));
            }
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
        const evasionVol = this._getAlertVolumeNum();
        this.evasionLoop = this.createSeamlessLoop(evasionCfg.file, evasionVol, evasionCfg.loopOverlap, this._cfgLoopPoints(evasionCfg));
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
            const vp = document.getElementById('video-player');
            if (vp && !vp.paused) return;
            const stageIds = this.currentStage?.musicIds || [];
            if (this.lastMusicId && stageIds.includes(this.lastMusicId)) {
                this.playMusic(this.lastMusicId);
            } else {
                this.playFirstMusic();
            }
        });

        this.alertState = 'normal';
        this.updateAlertButtons();
    },

    updateAlertButtons() {
        const btnAlert = document.getElementById('btn-alert');
        const btnEvasion = document.getElementById('btn-evasion');
        const btnReturn = document.getElementById('btn-return');
        if (!btnAlert || !btnEvasion || !btnReturn) return;

        const isAlert = this.alertState !== 'normal';
        document.querySelectorAll('#music-buttons .btn-sound').forEach(btn => {
            btn.classList.toggle('btn-disabled', isAlert);
        });

        const alertControls = document.getElementById('alert-controls');

        switch (this.alertState) {
            case 'normal':
                btnAlert.disabled = false; btnAlert.style.opacity = '1'; btnAlert.classList.remove('playing');
                btnEvasion.disabled = true; btnEvasion.style.opacity = '0.3'; btnEvasion.classList.remove('playing');
                btnReturn.disabled = true; btnReturn.style.opacity = '0.3';
                if (alertControls) alertControls.style.display = 'none';
                break;
            case 'alert':
                btnAlert.disabled = false; btnAlert.style.opacity = '1'; btnAlert.classList.add('playing');
                btnEvasion.disabled = false; btnEvasion.style.opacity = '1'; btnEvasion.classList.remove('playing');
                btnReturn.disabled = true; btnReturn.style.opacity = '0.3';
                if (alertControls) alertControls.style.display = '';
                break;
            case 'evasion':
                btnAlert.disabled = false; btnAlert.style.opacity = '1'; btnAlert.classList.remove('playing');
                btnEvasion.disabled = false; btnEvasion.style.opacity = '1'; btnEvasion.classList.add('playing');
                btnReturn.disabled = false; btnReturn.style.opacity = '1';
                if (alertControls) alertControls.style.display = '';
                break;
        }
    },

    setAlertVolume(val) {
        const vol = val / 100;
        if (this.alertState === 'evasion' && this.evasionLoop) {
            this.evasionLoop.setVolume(vol);
        } else if (this.alertLoop) {
            this.alertLoop.setVolume(vol);
        }
    },

    crossfadeLoops(fadeOutLoop, fadeInLoop, fadeInTarget = 0.8) {
        if (!fadeOutLoop || !fadeInLoop) return;
        const steps = 30;
        const interval = this.FADE_DURATION / steps;
        const fadeOutStart = fadeOutLoop.getVolume();
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
        this.updateAlertButtons();
    },

    buildGameOverButton(stage) {
        // Il bottone GAME OVER è ora parte di _buildSoldierPhaseHtml
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

    triggerGameOver(specificSoundId = null) {
        if (!this.currentStage) return;
        this.stopMusic();
        this.stopAlertSystem();
        this.trackStat('continues');
        // Suono specifico (es. morte Meryl) oppure random dal pool dello stage
        const pool = this.currentStage.gameOverSounds || CONFIG.gameOverSounds;
        if (pool && pool.length > 0 || specificSoundId) {
            const id = specificSoundId || pool[Math.floor(Math.random() * pool.length)];
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
        // Video Game Over — al termine resetta lo stage (preserva i giocatori scelti)
        const savedPlayers = this.stagePlayers ? [...this.stagePlayers] : null;
        this.setActiveVideoBtn(document.getElementById('btn-game-over'));
        const videoEl = document.getElementById('video-player');
        if (videoEl) {
            videoEl.addEventListener('ended', () => {
                this._unlockStage();
                this.hidePlayerSidebar();
                this.selectStage(this.currentStage.id, savedPlayers);
            }, { once: true });
        }
        this.playVideo('video/Game_Over.mp4');
    },

    _sfxPool: {},

    playSfx(file, track, volume) {
        // Web Audio API: zero latency se il buffer è già decodificato in cache
        if (this._audioCtx && this._bufferCache[file]) {
            try {
                if (this._audioCtx.state === 'suspended') this._audioCtx.resume();
                const src = this._audioCtx.createBufferSource();
                src.buffer = this._bufferCache[file];
                if (volume !== undefined && volume !== 1) {
                    const gain = this._audioCtx.createGain();
                    gain.gain.value = volume;
                    src.connect(gain);
                    gain.connect(this._audioCtx.destination);
                } else {
                    src.connect(this._audioCtx.destination);
                }
                src.start(0);
            } catch(e) { console.warn('playSfx WAA:', e); }
        } else {
            // Fallback HTML5 Audio pool
            let audio = this._sfxPool[file];
            if (audio) {
                audio.currentTime = 0;
                if (volume !== undefined) audio.volume = volume;
            } else {
                audio = new Audio(file);
                audio.volume = volume !== undefined ? volume : 1.0;
            }
            audio.play().catch(e => console.warn(e.message));
        }
        if (track) this.trackStat(track);
    },

    // ============================================
    // SFX ON MUSIC START (one-shot e ripetuti)
    // ============================================
    _startSfxOnMusicStart() {
        this._stopSfxOnMusicStart();
        const list = this.currentStage?.sfxOnMusicStart;
        if (!list || !list.length) return;
        const stage = this.currentStage;
        list.forEach(sfx => {
            const t = setTimeout(() => {
                if (this.currentStage !== stage) return;
                this.playSfx(sfx.file, null, sfx.volume);
                if (sfx.interval) {
                    const id = setInterval(() => {
                        if (this.currentStage !== stage) { clearInterval(id); return; }
                        this.playSfx(sfx.file, null, sfx.volume);
                    }, sfx.interval);
                    this._sfxOnMusicStartTimers.push({ type: 'interval', id });
                }
            }, sfx.delay ?? 0);
            this._sfxOnMusicStartTimers.push({ type: 'timeout', id: t });
        });
    },

    _stopSfxOnMusicStart() {
        this._sfxOnMusicStartTimers.forEach(({ type, id }) =>
            type === 'interval' ? clearInterval(id) : clearTimeout(id)
        );
        this._sfxOnMusicStartTimers = [];
    },

    // ============================================
    // STOP ALL
    // ============================================
    stopAllAudio() {
        this.stopVideo();
        this.stopMusic();
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

        // Difficulty select screen
        if (this.currentScreen === 'difficulty-screen') {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                this._difficultyMoveTo((this.selectedDifficultyIndex - 1 + this.difficulties.length) % this.difficulties.length);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this._difficultyMoveTo((this.selectedDifficultyIndex + 1) % this.difficulties.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                this._difficultyConfirm();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.playMenuReturn();
            }
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
            rounds: 0,
            trappola: false,
            timestamp: new Date().toISOString(),
            // Campagna: persistono tra gli stage
            unlockedEquipment: [],   // ID equipaggiamenti sbloccati attraverso le ricompense
            debutedCharacters: [],   // personaggi che hanno già giocato almeno uno stage
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
        const src = this._randomSaveVideo(sc.intro);
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
        const returnTo = this.cardReturnScreen;
        this._saveOutroActive = (returnTo === 'stage-active');
        this.setActiveVideoBtn(document.getElementById('save-btn-outro'));
        this._playSaveVideo(src, returnTo === 'stage-active' ? () => {
            this._saveOutroActive = false;
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
            // Quarto annullamento in poi (stato "frustrato"): No_Save_Intro → No_Save_Silence
            const introSrc = sc.noSaveIntro || null;
            const silenceSrc = this._randomSaveVideo(sc.noSaveSilenceOutro);
            const playSilence = () => {
                if (silenceSrc) playVideo(silenceSrc, navigateBack);
                else navigateBack();
            };
            if (introSrc) playVideo(introSrc, playSilence);
            else playSilence();
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
        const wasSaveOutro    = this._saveOutroActive;
        this._notSaveOutroActive = false;
        this._saveOutroActive    = false;
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
        // Se outro (salvato o non) viene stoppato MANUALMENTE (non a fine naturale), torna a stage-active
        if (!this._saveVideoEnding && (wasNotSaveOutro || wasSaveOutro)) {
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

    // ============================================
    // DIFFICULTY SELECT
    // ============================================
    showDifficultyScreen() {
        // Aggiorna stato lock EXTREME da localStorage
        const unlocked = !!localStorage.getItem('mgs_extreme_unlocked');
        const extreme = this.difficulties.find(d => d.id === 'EXTREME');
        if (extreme) extreme.locked = !unlocked;
        this.showScreen('difficulty-screen');
        this._renderDifficultyList();
    },

    unlockExtreme() {
        localStorage.setItem('mgs_extreme_unlocked', '1');
        const extreme = this.difficulties.find(d => d.id === 'EXTREME');
        if (extreme) extreme.locked = false;
        this._renderDifficultyList();
    },

    _renderDifficultyList() {
        const list    = document.getElementById('difficulty-list');
        const caption = document.getElementById('difficulty-caption');
        if (!list) return;
        list.innerHTML = this.difficulties.map((d, i) => {
            const isSel = i === this.selectedDifficultyIndex;
            const cls   = ['difficulty-item', isSel ? 'selected' : '', d.locked ? 'locked' : ''].filter(Boolean).join(' ');
            const label = d.label;
            return `<div class="${cls}" onclick="App._difficultyClick(${i})">${label}</div>`;
        }).join('');
        const cur = this.difficulties[this.selectedDifficultyIndex];
        if (caption) {
            if (cur?.locked) {
                caption.innerHTML = 'Completa il gioco per sbloccare questa difficoltà';
                caption.classList.add('locked-caption');
            } else {
                caption.innerHTML = (cur?.caption || '').replace(/\n/g, '<br>');
                caption.classList.remove('locked-caption');
            }
        }
    },

    _difficultyClick(i) {
        if (i === this.selectedDifficultyIndex) {
            this._difficultyConfirm();
        } else {
            this._difficultyMoveTo(i);
        }
    },

    _difficultyMoveTo(i) {
        if (i < 0 || i >= this.difficulties.length) return;
        this.selectedDifficultyIndex = i;
        this.playSfx(CONFIG.menuSounds['choice'].file);
        this._renderDifficultyList();
    },

    _difficultyConfirm() {
        const diff = this.difficulties[this.selectedDifficultyIndex];
        if (diff?.locked) return;
        this.playSfx(CONFIG.menuSounds['confirm-save'].file);
        this.newGameMode = true;
        this._noSaveCount = 0;
        this.session = this._newSession();
        this.session.difficulty = diff.id;
        this._persistSession();
        this.showBlackTransition(() => {
            this.selectStage(1);
        });
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
                    const stage = STAGES.find(s => s.id === block.stage);
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
                    const stage = STAGES.find(s => s.id === block.stage);
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
    // Chiude il tooltip pinnato cliccando fuori
    document.addEventListener('click', (e) => {
        const tooltip = document.getElementById('action-tooltip');
        if (tooltip && !tooltip.contains(e.target) && !e.target.closest('.action-btn')) {
            App._tooltipPinnedData = null;
            tooltip.style.display = 'none';
        }
    });
});