/**
 * MGS BOARD GAME COMPANION - APP
 * Intro video → PS1 Main Menu → Stage system + Soundboard
 */

const App = {
    currentScreen: 'press-start-screen',
    currentStage: null,
    currentMusicBtn: null,
    currentAmbientBtn: null,
    lastMusicId: null,
    musicIntroTimer: null,

    // Seamless loop players
    musicLoop: null,
    ambientLoop: null,
    alertLoop: null,
    evasionLoop: null,
    menuMusicLoop: null,
    menuIntroAudio: null,

    // Alert system
    alertState: 'normal',
    discoveryAudio: null,

    FADE_DURATION: 1500,
    LOOP_OVERLAP: 0.05,

    // Menu system
    menuItems: [
        { label: 'NEW GAME',    action: 'newGame' },
        { label: 'LOAD GAME',   action: 'loadGame' },
        { label: 'OPTION',      action: 'option' },
        { label: 'BRIEFING',    action: 'briefing' },
        { label: 'SPECIAL',     action: 'special' },
        { label: 'VR TRAINING', action: 'vrTraining' },
    ],
    menuIndex: 0,
    menuLocked: false,

    // ============================================
    // SEAMLESS LOOP PLAYER
    // ============================================
    createSeamlessLoop(file, volume, overlapOverride) {
        const self = this;
        const overlap = (overlapOverride !== undefined) ? overlapOverride : self.LOOP_OVERLAP;
        const loop = {
            file: file,
            volume: volume,
            audioA: new Audio(file),
            audioB: new Audio(file),
            current: 'A',
            active: true,
            checkTimer: null,
        };

        loop.audioA.volume = volume;
        loop.audioB.volume = volume;

        const scheduleNext = () => {
            if (!loop.active) return;

            const current = loop.current === 'A' ? loop.audioA : loop.audioB;
            const next = loop.current === 'A' ? loop.audioB : loop.audioA;

            loop.checkTimer = setInterval(() => {
                if (!loop.active) {
                    clearInterval(loop.checkTimer);
                    return;
                }
                const remaining = current.duration - current.currentTime;
                if (remaining <= overlap && remaining > 0 && !isNaN(current.duration)) {
                    clearInterval(loop.checkTimer);
                    next.currentTime = 0;
                    next.volume = loop.volume;
                    next.play().catch(e => console.warn(e.message));
                    loop.current = loop.current === 'A' ? 'B' : 'A';
                    scheduleNext();
                }
            }, 20);
        };

        return {
            play() {
                loop.active = true;
                loop.audioA.currentTime = 0;
                loop.audioA.volume = loop.volume;
                loop.audioA.play().then(() => {
                    loop.current = 'A';
                    scheduleNext();
                }).catch(e => console.warn(e.message));
            },
            stop() {
                loop.active = false;
                if (loop.checkTimer) clearInterval(loop.checkTimer);
                loop.audioA.pause();
                loop.audioA.currentTime = 0;
                loop.audioB.pause();
                loop.audioB.currentTime = 0;
            },
            setVolume(v) {
                loop.volume = v;
                loop.audioA.volume = v;
                loop.audioB.volume = v;
            },
            getVolume() {
                return loop.volume;
            },
            isPlaying() {
                return loop.active && (!loop.audioA.paused || !loop.audioB.paused);
            },
        };
    },

    // ============================================
    // PRESS START → INTRO VIDEO → MENU
    // ============================================
    startIntroVideo() {
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
        const sounds = CONFIG.menuSounds;

        // Play menu-intro first (lower volume)
        this.menuIntroAudio = new Audio(sounds['menu-intro'].file);
        this.menuIntroAudio.volume = 0.35;
        this.menuIntroAudio.play().catch(e => console.warn(e.message));

        // When intro ends, start menu-loop in seamless loop
        this.menuIntroAudio.addEventListener('ended', () => {
            this.menuIntroAudio = null;
            const loopCfg = sounds['menu-loop'];
            this.menuMusicLoop = this.createSeamlessLoop(loopCfg.file, 0.35, loopCfg.loopOverlap);
            this.menuMusicLoop.play();
        }, { once: true });
    },

    stopMenuMusic() {
        if (this.menuIntroAudio) {
            this.menuIntroAudio.pause();
            this.menuIntroAudio = null;
        }
        if (this.menuMusicLoop) {
            this.menuMusicLoop.stop();
            this.menuMusicLoop = null;
        }
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
                    this.showBlackTransition(() => {
                        this.selectStage(1);
                    });
                    break;
                case 'loadGame':
                    this.stopMenuMusic();
                    this.showScreen('stage-select');
                    break;
                case 'briefing':
                    this.stopMenuMusic();
                    this.showBriefing();
                    break;
                case 'vrTraining':
                    this.stopMenuMusic();
                    this.showScreen('vr-screen');
                    break;
                case 'option':
                case 'special':
                    // Placeholder
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
            if (splash) splash.classList.add('appear');
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

        this.currentStage = stage;
        this.stopAllAudio();
        this.lastMusicId = null;
        this.alertState = 'normal';

        const title = document.getElementById('active-stage-title');
        if (title) title.textContent = `STAGE ${String(stage.id).padStart(2, '0')} — ${stage.name.toUpperCase()}`;

        const status = document.getElementById('stage-status');
        if (status) {
            status.textContent = stage.isBoss ? 'BOSS BATTLE' : 'SNEAKING MISSION';
            status.style.color = stage.isBoss ? 'var(--codec-red)' : 'var(--codec-orange)';
            status.style.borderColor = stage.isBoss ? 'rgba(255, 58, 58, 0.3)' : 'rgba(255, 140, 58, 0.3)';
        }

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

        this.stopVideo();
        this.buildMusicButtons(stage);
        this.buildAmbientButtons(stage);
        this.buildAlertSection(stage);

        this.showScreen('stage-active');

        if (stage.intro && stage.intro.length > 0) {
            setTimeout(() => {
                this.playIntroThenMusic();
            }, 300);
        } else {
            setTimeout(() => {
                this.playFirstMusic();
            }, 300);
        }
    },

    // ============================================
    // VIDEO PLAYER
    // ============================================
    playVideo(src) {
        if (!src || src.length === 0) return;

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
        }
        if (stopBtn) stopBtn.style.display = '';
    },

    playIntroThenMusic() {
        if (!this.currentStage) return;
        const stage = this.currentStage;
        const player = document.getElementById('video-player');
        const ids = stage.musicIds || [];

        this.playVideo(stage.intro);

        if (stage.musicDuringIntro && ids.length > 0) {
            const delay = stage.musicIntroDelay || 0;
            const introVolume = (stage.musicIntroVolume || 20) / 100;

            this.musicIntroTimer = setTimeout(() => {
                this.playMusicAtVolume(ids[0], introVolume);
            }, delay);

            if (player) {
                player.onended = () => {
                    player.onended = null;
                    if (this.musicIntroTimer) {
                        clearTimeout(this.musicIntroTimer);
                        this.musicIntroTimer = null;
                    }
                    this.stopVideo();
                    if (this.musicLoop) {
                        this.fadeMusicToNormalVolume();
                    } else {
                        this.playFirstMusic();
                    }
                };
            }
        } else {
            if (player) {
                player.onended = () => {
                    player.onended = null;
                    this.stopVideo();
                    this.playFirstMusic();
                };
            }
        }
    },

    playFirstMusic() {
        if (!this.currentStage) return;
        const ids = this.currentStage.musicIds || [];
        if (ids.length > 0) this.playMusic(ids[0]);
    },

    playIntro() {
        if (!this.currentStage) return;
        this.stopAllAudio();
        this.playVideo(this.currentStage.intro);
    },

    playOutro() {
        if (!this.currentStage) return;
        this.stopAllAudio();
        this.playVideo(this.currentStage.outro);
    },

    stopVideo() {
        if (this.musicIntroTimer) {
            clearTimeout(this.musicIntroTimer);
            this.musicIntroTimer = null;
        }

        const wrapper = document.getElementById('video-wrapper');
        const player = document.getElementById('video-player');
        const stopBtn = document.getElementById('btn-stop-video');

        if (player) {
            player.onended = null;
            player.pause();
            player.removeAttribute('src');
            player.load();
            player.style.display = 'none';
        }
        if (stopBtn) stopBtn.style.display = 'none';
        if (wrapper) wrapper.style.display = 'none';
    },

    // ============================================
    // MUSIC - seamless loop
    // ============================================
    buildMusicButtons(stage) {
        const container = document.getElementById('music-buttons');
        if (!container) return;

        const ids = stage.musicIds || [];
        if (ids.length === 0) {
            container.innerHTML = '<div class="no-audio-msg">Nessuna musica per questo stage</div>';
            return;
        }

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
        this.musicLoop = this.createSeamlessLoop(track.file, volume, track.loopOverlap);
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
        const controls = document.getElementById('music-controls');
        if (controls) controls.style.display = 'none';
    },

    // ============================================
    // ALERT SYSTEM - seamless loops
    // ============================================
    buildAlertSection(stage) {
        const container = document.getElementById('alert-section');
        if (!container) return;

        if (stage.isBoss) {
            container.innerHTML = '<div class="no-audio-msg">Alert disabilitato nelle boss fight</div>';
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
    },

    triggerAlert() {
        if (!this.currentStage || this.currentStage.isBoss) return;
        const sounds = CONFIG.alertSounds;

        if (this.alertState === 'normal') {
            this.stopMusic();
            this.discoveryAudio = new Audio(sounds['discovery'].file);
            this.discoveryAudio.volume = 0.8;
            this.discoveryAudio.play().catch(e => console.warn(e.message));

            const alertCfg = sounds['alert-loop'];
            this.alertLoop = this.createSeamlessLoop(alertCfg.file, 0.8, alertCfg.loopOverlap);
            const evasionCfg = sounds['evasion-loop'];
            this.evasionLoop = this.createSeamlessLoop(evasionCfg.file, 0, evasionCfg.loopOverlap);

            setTimeout(() => {
                this.alertLoop.play();
                this.evasionLoop.play();
            }, 1000);

            this.alertState = 'alert';
            this.updateAlertButtons();

        } else if (this.alertState === 'alert') {
            const thisWay = new Audio(sounds['this-way'].file);
            thisWay.volume = 0.8;
            thisWay.play().catch(e => console.warn(e.message));

        } else if (this.alertState === 'evasion') {
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
        this.crossfadeLoops(this.alertLoop, this.evasionLoop);
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
        const container = document.getElementById('ambient-buttons');
        if (!container) return;
        const ids = stage.ambientIds || [];
        if (ids.length === 0) {
            container.innerHTML = '<div class="no-audio-msg">Nessun suono ambientale per questo stage</div>';
            return;
        }
        container.innerHTML = ids.map(id => {
            const amb = CONFIG.ambient[id];
            if (!amb) return '';
            return `<button class="btn-sound" id="ambient-btn-${id}" onclick="App.playAmbient('${id}')">◊ ${amb.name}</button>`;
        }).join('');
    },

    playAmbient(id) {
        const amb = CONFIG.ambient[id];
        if (!amb) return;
        this.stopAmbient();
        const vol = (document.getElementById('ambient-volume')?.value || 30) / 100;
        this.ambientLoop = this.createSeamlessLoop(amb.file, vol, amb.loopOverlap);
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
            <button class="btn-sound" onclick="App.playSfx('${sfx.file}')" title="${sfx.name}">
                <span class="sfx-icon">${sfx.icon || '♪'}</span> ${sfx.name}
            </button>
        `).join('');
    },

    playSfx(file) {
        const audio = new Audio(file);
        audio.volume = 1.0;
        audio.play().catch(e => console.warn(e.message));
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

        // ESC to go back
        if (e.key === 'Escape') {
            if (this.currentScreen === 'stage-active') {
                this.stopAllAudio();
                this.showScreen('stage-select');
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
    // INIT
    // ============================================
    init() {
        this.initStageGrid();
        this.buildSfxButtons();
        this.initMenuTouch();

        document.addEventListener('keydown', (e) => this.handleKeydown(e));
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});