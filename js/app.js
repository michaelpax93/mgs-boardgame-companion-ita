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
    _postSaveScreen: null,   // se impostato, dopo il save outro torna a questo screen
    _enemyDownPendingZone: null,
    cardPhase: 'card',       // 'card' | 'block' (solo save mode)
    focusedBlock: null,      // blockId attualmente in focus (fase blocchi)
    _visibleBlockIds: [],    // lista ordinata dei blockId mostrati (per navigazione tastiera)

    FADE_DURATION: 1500,
    LOOP_OVERLAP: 0.15,
    showSessionStats: false,   // mostra dati sessione nella sidebar (settabile dalle opzioni)
    sfxVolume: 85,             // 0-100, volume effetti sonori
    defaultMusicVolume: 15,    // 0-100, volume musica stage
    menuMusicVolume: 35,       // 0-100, volume musica menu
    vrUnlockAll: false,        // sblocca tutti i livelli VR senza doverli fare in ordine

    // Stato VR runtime
    vrMode: false,
    vrNav: { level: 'top', bossId: null },
    vrCurrentBossId: null,
    vrCurrentStageId: null,
    vrLoadedCard: null,
    vrLoadedBlock: null,
    _vrTypewriterTimer: null,

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
        { id: 'attacca',      label: '⚔ ATTACCA',        sound: 'audio/sfx/attacco-guardia.wav',                        alertOnly: true },
        { id: 'scatolone',    label: '📦 SCATOLONE',      sound: 'audio/azioni/guardie/soldato-e-solo-uno-scatolone.wav', boxOnly: true },
        { id: 'scatolone-ng', label: '📦 SCATOLONE — !',  sound: 'audio/azioni/guardie/soldato-fuori-dai-piedi.wav',      boxOnly: true },
    ],

    // Zona corrente per ogni giocatore (indice posizionale nell'array enemies)
    playerZoneState: {},

    // Azione attacco in attesa di risultato popup
    _pendingAttackPlayer: null,
    _pendingAttackActionId: null,
    _pendingBossDamageAmount: 0,
    _pendingBossDamageEnemy: null,

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

    // Stato scatolone per giocatore (true = giocatore nascosto nello scatolone)
    boxState: {},

    // Alert cause popup
    _inCameraSight: false,
    _guardsAttackedThisTurn: false,
    ALERT_CAUSES: [
        { id: 'guardia',    label: 'VISTA DA UNA GUARDIA',         sound: 'audio/sfx/!!!.mp3' },
        { id: 'telecamera', label: 'VISTA DA UNA TELECAMERA',      sound: 'audio/sfx/!!! telecamera.wav', cameraOnly: true },
        { id: 'esplosione', label: 'ESPLOSIONE',                   sound: 'audio/sfx/esplosione.wav' },
        { id: 'rumore',     label: 'ARMA RUMOROSA / TRAPPOLA',     sound: 'audio/sfx/!!!.mp3' },
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
    playerAttachments: {},  // player → [equipId, ...] (non occupano slot)
    // Stato consumo per stage: playerName → { equipId: bool }
    equipmentConsumedState: {},
    equipmentFlagState: {},   // playerName → { equipId → { flagName: bool } }
    equipmentUsedThisTurn: {}, // playerName → Set<equipId> per azioni oncePerTurn
    _inlineChargeActiveFor: {}, // playerName → equipId attivo per inline charge
    _inlineChargeClicksLeft: {}, // playerName → click rimanenti (null = illimitati)
    _volpePendingPlayer: null,
    bossSectionChargeState: {}, // sectionId → remaining charges
    eventClickedState: {},    // eventId → true (cliccato una volta)
    _ketchupPendingEvent: null,
    ketchupUsed: false,

    // Stage 11 Sniper Wolf — modalità ibrida Boss/Sneaking con Otacon
    otaconEnemySubPhase: 'select',   // 'select' | 'sniper-wolf' | 'guards'
    otaconEnemyDone: null,           // Set dei nemici che hanno già agito questo round

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
        { label: 'OPTION',      action: 'option' },
        { label: 'BRIEFING',    action: 'briefing' },
        { label: 'SPECIAL',     action: 'special' },
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
        this.menuMusicLoop = this.createSeamlessLoop(cfg.file, this.menuMusicVolume / 100, cfg.loopOverlap, this._cfgLoopPoints(cfg));
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

        const prevEl    = document.getElementById('menu-prev');
        const currentEl = document.getElementById('menu-current');
        const labelEl   = document.getElementById('menu-label');
        const nextEl    = document.getElementById('menu-next');

        if (prevEl) {
            prevEl.textContent = items[prevIdx].label;
            prevEl.classList.toggle('locked', !!items[prevIdx].locked);
        }
        if (labelEl) labelEl.textContent = items[this.menuIndex].label;
        if (currentEl) currentEl.classList.toggle('locked', !!items[this.menuIndex].locked);
        if (nextEl) {
            nextEl.textContent = items[nextIdx].label;
            nextEl.classList.toggle('locked', !!items[nextIdx].locked);
        }
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
        if (item.locked) return;

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
                    this.showVrCardScreen();
                    break;
                case 'option':
                    this.stopMenuMusic();
                    this._initOptionScreen();
                    this.showScreen('option-screen');
                    break;
                case 'credits':
                    this.stopMenuMusic();
                    this.showScreen('credits-screen');
                    break;
                case 'special':
                    this.stopMenuMusic();
                    this.showSpecialScreen();
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
        // Annulla eventuali ripristini alert pendenti da stage precedente
        this._eventStoppedMusic = false;
        this._eventStoppedAlertState = null;
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
        if (btnIntro) {
            const hasIntro = stage.intro && stage.intro.length > 0;
            btnIntro.disabled = !hasIntro;
            btnIntro.style.opacity = hasIntro ? '1' : '0.3';
        }

        this.stopVideo();
        // NEXT STAGE button: visibile solo in newGameMode, disabilitato finché outro non visto
        // NB: deve stare DOPO stopVideo() altrimenti _outroPlaying dello stage precedente lo riabilita
        const btnNext = document.getElementById('btn-next-stage');
        if (btnNext) {
            const hasNextStage = !!STAGES.find(s => s.id === stage.id + 1);
            const isLastStage = !hasNextStage;
            if (this.newGameMode && (hasNextStage || isLastStage)) {
                btnNext.style.display = '';
                btnNext.disabled = true;
                btnNext.style.opacity = '0.3';
                btnNext.querySelector('.btn-inner').textContent = isLastStage ? 'SCORE ▶' : 'NEXT ▶';
            } else {
                btnNext.style.display = 'none';
            }
        }
        this.eventClickedState = {};
        this.introPlayed = false;
        this.outroPlayed = false;
        this.missileState = {}; // playerName → true se il missile è attivo sulla mappa
        this.boxState = {};
        this._missilePendingPlayer = null;
        this._eventStoppedMusic = false;
        this.markerState = {};
        this.ketchupState = {};
        this.ketchupUsed = false;
        this.liberateSnakePlayer = null;
        this._inlineChargeActiveFor = {};
        this._inlineChargeClicksLeft = {};
        this._ketchupPendingPlayer = null;
        this._ketchupPendingEvent = null;
        this.initEnemyState(stage);
        this.buildEventButtons(stage);
        this.buildMusicButtons(stage);
        this.buildGameOverButton(stage);
        this.buildAlertSection(stage);
        this.buildTurnSection(stage, selectedPlayers);
        this.buildPlayerSidebar(stage);
        this._updateOutroBtn();
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
        if (this.currentScreen === 'stage-active' || this.currentScreen === 'vr-screen') window.scrollTo({ top: 0, behavior: 'smooth' });
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
            // Se il file non esiste o dà errore, sblocca comunque l'UI
            this._videoErrorListener = () => { this._videoErrorListener = null; this.stopVideo(); };
            player.addEventListener('error', this._videoErrorListener, { once: true });
        }
        if (stopBtn) stopBtn.style.display = '';
        document.getElementById('stage-active')?.classList.add('stage-video-active');
    },

    buildEventButtons(stage) {
        const container = document.getElementById('event-buttons');
        if (!container) return;
        const events = (stage.events || []).filter(ev =>
            !ev.playerOwner || (this.stagePlayers || []).includes(ev.playerOwner)
        );
        container.innerHTML = events.map(ev => {
            if (ev.toggle) {
                const active = !!this.eventClickedState[ev.id];
                const label  = ev.label || `EVENTO ${ev.id}`;
                const owner  = ev.playerOwner ? ` (${ev.playerOwner})` : '';
                return `<button class="btn-codec btn-video btn-toggle${active ? ' btn-toggle-on' : ''}" id="btn-event-${ev.id}"
                    onclick="App.playEvent('${ev.id}')">
                    <span class="btn-inner">${label}${owner}<br><span class="btn-event-count">${active ? '● ON' : '○ OFF'}</span></span>
                </button>`;
            }
            if (ev.multiClick && ev.canDecrement) {
                const clicked = typeof this.eventClickedState[ev.id] === 'number' ? this.eventClickedState[ev.id] : 0;
                const label   = ev.label || `EVENTO ${ev.id}`;
                return `<div class="enemy-counter" id="node-counter-${ev.id}">
                    <button class="enemy-btn enemy-btn-minus" id="btn-event-dec-${ev.id}"
                        onclick="App.decrementEvent('${ev.id}')" ${clicked <= 0 ? 'disabled' : ''}>−</button>
                    <span class="enemy-count" id="node-count-${ev.id}">${clicked}</span>
                    <span class="enemy-count-label">${label}</span>
                    <button class="enemy-btn enemy-btn-plus" id="btn-event-${ev.id}"
                        onclick="App.playEvent('${ev.id}')" ${clicked >= ev.maxCount ? 'disabled' : ''}>+</button>
                </div>`;
            }
            if (ev.multiClick) {
                const clicked    = typeof this.eventClickedState[ev.id] === 'number' ? this.eventClickedState[ev.id] : 0;
                const remaining  = ev.maxCount - clicked;
                const done       = remaining <= 0;
                const label      = ev.label || `EVENTO ${ev.id}`;
                return `<button class="btn-codec btn-video" id="btn-event-${ev.id}"
                    onclick="App.playEvent('${ev.id}')" ${done ? 'disabled style="opacity:0.35"' : ''}>
                    <span class="btn-inner">${label}<br><span class="btn-event-count">? x ${remaining}</span></span>
                </button>`;
            }
            const clicked = !!this.eventClickedState[ev.id];
            const prefix  = ev.file ? '▶ ' : '';
            const style   = clicked ? ' style="opacity:0.35"' : '';
            const label   = ev.label || `EVENTO ${ev.id}`;
            return `<button class="btn-codec btn-video" id="btn-event-${ev.id}"
                onclick="App.playEvent('${ev.id}')" ${clicked ? 'disabled' : ''}${style}>
                <span class="btn-inner">${prefix}${label}</span>
            </button>`;
        }).join('');
        this._updateEventButtonsForTurn();
    },

    playEvent(id) {
        if (!this.currentStage) return;
        const ev = (this.currentStage.events || []).find(e => e.id === id);
        if (!ev) return;
        // Libera Snake: se il giocatore attivo ha il ketchup, mostra popup prima di risolvere
        if (ev.liberate === 'snake') {
            const player = this._activePlanciaPlayer() ?? this.stagePlayers?.[0];
            if (player && this.ketchupState?.[player]) {
                this._ketchupPendingPlayer = player;
                this._ketchupPendingEvent = id;
                document.getElementById('ketchup-popup').style.display = 'flex';
                return;
            }
        }
        // Traccia chi ha liberato Snake (per la scelta del video outro)
        if (ev.liberate === 'snake') {
            this.liberateSnakePlayer = this._activePlanciaPlayer() ?? this.stagePlayers?.[0];
        }
        // Segna evento come cliccato e disabilita il bottone
        const btn = document.getElementById(`btn-event-${id}`);
        if (ev.toggle) {
            this.eventClickedState[id] = !this.eventClickedState[id];
            const active = !!this.eventClickedState[id];
            const btn = document.getElementById(`btn-event-${id}`);
            if (btn) {
                btn.classList.toggle('btn-toggle-on', active);
                const countEl = btn.querySelector('.btn-event-count');
                if (countEl) countEl.textContent = active ? '● ON' : '○ OFF';
            }
            if (active && ev.sound) {
                const sfx = new Audio(ev.sound); sfx.volume = this._sfxVol(); sfx.play().catch(() => {});
            }
            this._updateOutroBtn();
            return;
        }
        if (ev.multiClick && ev.canDecrement) {
            const prev = typeof this.eventClickedState[id] === 'number' ? this.eventClickedState[id] : 0;
            this.eventClickedState[id] = Math.min(ev.maxCount, prev + 1);
            this._refreshNodeCounter(ev);
            // Rilevazione sblocco USCITA: sopprime il suono in _updateVrUscitaBtn per gestirlo dopo oggetto-preso
            const outroBtn = document.getElementById('btn-outro');
            const wasOutroEnabled = outroBtn && !outroBtn.disabled;
            this._suppressNextGenerazioneUscita = true;
            this._updateOutroBtn();
            this._suppressNextGenerazioneUscita = false;
            const justEnabledUscita = outroBtn && !outroBtn.disabled && !wasOutroEnabled;
            if (this.vrMode) {
                const presoCfg = CONFIG.vrSounds?.['oggetto-preso'];
                const playGenerazione = () => {
                    const cfg = CONFIG.vrSounds?.['generazione-uscita'];
                    if (cfg) { const a = new Audio(cfg.file); a.volume = this._sfxVol(); a.play().catch(() => {}); }
                };
                if (presoCfg) {
                    const a = new Audio(presoCfg.file);
                    a.volume = this._sfxVol();
                    if (justEnabledUscita) a.onended = playGenerazione;
                    a.play().catch(() => { if (justEnabledUscita) playGenerazione(); });
                } else if (justEnabledUscita) {
                    playGenerazione();
                }
            }
            return;
        }
        if (ev.multiClick) {
            const prev      = typeof this.eventClickedState[id] === 'number' ? this.eventClickedState[id] : 0;
            this.eventClickedState[id] = prev + 1;
            const remaining = ev.maxCount - this.eventClickedState[id];
            if (btn) {
                btn.disabled = remaining <= 0;
                btn.style.opacity = remaining <= 0 ? '0.35' : '1';
                const countEl = btn.querySelector('.btn-event-count');
                if (countEl) countEl.textContent = `? x ${remaining}`;
            }
            // Traccia per giocatore (es. ostaggi salvati)
            if (ev.perPlayerCount) {
                const player = this._activePlanciaPlayer();
                if (player) {
                    if (!this.perPlayerEventCount[id]) this.perPlayerEventCount[id] = {};
                    this.perPlayerEventCount[id][player] = (this.perPlayerEventCount[id][player] || 0) + 1;
                    this._refreshPerPlayerEventBadge(player);
                }
            }
        } else {
            this.eventClickedState[id] = true;
            if (btn) { btn.disabled = true; btn.style.opacity = '0.35'; }
        }
        this._updateOutroBtn();
        this._updateEventButtonsForTurn();
        // Se questo evento sblocca il cambio zona, aggiorna la sidebar
        if (this.currentStage?.blockZoneChangeUntilEvent === id) {
            this.buildPlayerSidebar(this.currentStage);
        }
        // Applica variazioni nemici associate all'evento
        const changes = this.currentStage.enemyEvents?.[id];
        if (changes) changes.forEach(c => this.updateEnemyCount(c.zone, c.delta));
        // Ketchup (solo stage 9)
        if (ev.ketchup) {
            const player = this._activePlanciaPlayer() ?? this.stagePlayers?.[0];
            if (player) {
                this.ketchupState[player] = true;
                this.buildPlayerSidebar(this.currentStage);
            }
        }

        // Evento solo-suono (nessun video)
        if (!ev.file) {
            if (ev.sound) {
                const sfx = new Audio(ev.sound);
                sfx.volume = App._sfxVol();
                const justUnlocked = this.vrMode && this._vrUscitaJustUnlocked;
                if (justUnlocked) this._vrUscitaJustUnlocked = false;
                const remaining = ev.multiClick ? (ev.maxCount - (this.eventClickedState[id] || 0)) : 0;
                sfx.onended = () => {
                    if (justUnlocked && !this._vrGenerazioneUscitaPlayed) {
                        this._vrGenerazioneUscitaPlayed = true;
                        const cfg = CONFIG.vrSounds?.['generazione-uscita'];
                        if (cfg) {
                            const a = new Audio(cfg.file);
                            a.volume = this._sfxVol();
                            if (ev.multiClick && remaining > 0) a.onended = () => this._updateEventButtonsForTurn();
                            a.play().catch(() => { if (ev.multiClick && remaining > 0) this._updateEventButtonsForTurn(); });
                        } else if (ev.multiClick && remaining > 0) {
                            this._updateEventButtonsForTurn();
                        }
                    } else if (ev.multiClick && remaining > 0) {
                        this._updateEventButtonsForTurn();
                    }
                };
                sfx.play().catch(() => {});
            }
            // Equipaggiamento bonus al giocatore corrente
            if (ev.grantEquipment) {
                const player = this._activePlanciaPlayer() ?? this.stagePlayers?.[0];
                if (player) {
                    const slots = this.playerEquipment[player] || [];
                    slots.push(ev.grantEquipment); // slot extra, non rimpiazza un null
                    this.playerEquipment[player] = slots;
                    const eq = EQUIPMENT[ev.grantEquipment];
                    if (!this.equipmentConsumedState[player]) this.equipmentConsumedState[player] = {};
                    if (eq?.charges != null) this.equipmentConsumedState[player][ev.grantEquipment] = eq.charges;
                    else if (eq?.consumable) this.equipmentConsumedState[player][ev.grantEquipment] = false;
                    this._refreshEquipmentPanel(player);
                }
            }
            return;
        }
        if (ev.stopMusic) {
            this._eventMusicRestore = null;
            this._eventStoppedMusic = true;
            this._eventStoppedAlertState = this.alertState; // 'normal'|'alert'|'evasion'
            this.stopMusic();
            this.stopAlertSystem();
        } else if (this.musicLoop && this.musicLoop.isPlaying()) {
            this._eventMusicRestore = this.musicLoop.getVolume();
            if (ev.musicEvent !== undefined) {
                this.musicLoop.setVolume(ev.musicEvent / 100);
            }
        }
        this.setActiveVideoBtn(btn);
        this.playVideo(ev.file);
    },

    _afterIntroEnd(skipDelay = false) {
        if (this.musicIntroTimer) {
            const p = document.getElementById('video-player');
            if (p) p.removeEventListener('timeupdate', this.musicIntroTimer);
            this.musicIntroTimer = null;
        }
        const btnIntro = document.getElementById('btn-intro');
        if (btnIntro) { btnIntro.disabled = true; btnIntro.style.opacity = '0.3'; }
        // Se un video è già in riproduzione (es. outro avviato mentre l'intro era ancora in corso),
        // non avviare la musica — lo farà stopVideo quando quel video termina o viene fermato.
        const vp = document.getElementById('video-player');
        if (vp && !vp.paused) return;

        // Stage 2 e 14: se non ancora salvato per questo stage, mostra Mei Ling prima di avviare la musica
        const _sid = this.currentStage?.id;
        if ((_sid === 2 || _sid === 14) && (this.session?.savedForStage ?? 0) < _sid) {
            this._triggerInlineSave(null); // nextStage = null → resta sullo stage corrente
            return;
        }

        if (this.currentStage && this.currentStage.startInAlert) {
            this.triggerAlert();
        } else if (this.musicLoop && this.musicLoop.isPlaying()) {
            this.fadeMusicToNormalVolume();
            this._startSfxOnMusicStart();
        } else if (!this.musicLoop || !this.musicLoop.isPlaying()) {
            this.playFirstMusic(skipDelay);
        }
    },

    _getMantisVariantVideo() {
        const s = this.session;
        if (!s) return 'video/Mantis/a-c-s0.mp4';
        const a = s.alerts < 4 ? '-' : '+';
        const c = s.continues < 4 ? '-' : '+';
        const sv = s.saves === 0 ? '0' : (s.saves < 4 ? '-' : '+');
        const t = (c === '+' && s.trappola) ? 't' : '';
        return `video/Mantis/a${a}c${c}s${sv}${t}.mp4`;
    },

    _startMantisChain() {
        const player = document.getElementById('video-player');
        if (!player || !this.currentStage) return;
        const stage = this.currentStage;
        const variantSrc = this._getMantisVariantVideo();
        const dimosSrc   = stage.mantisDimostrazione || 'video/mantis/mantis_dimostrazione.mp4';
        const FADE_MS    = 175; // ms di fade-in / fade-out

        // Rimuove listener stantii
        if (this._autoStopListener) {
            player.removeEventListener('ended', this._autoStopListener);
            this._autoStopListener = null;
        }
        if (this._mantisTimeUpdateListener) {
            player.removeEventListener('timeupdate', this._mantisTimeUpdateListener);
            this._mantisTimeUpdateListener = null;
        }
        if (this._mantisNearEndListener) {
            player.removeEventListener('timeupdate', this._mantisNearEndListener);
            this._mantisNearEndListener = null;
        }

        const overlay = document.getElementById('mantis-black');

        // Anima overlay opacity e volume player in FADE_MS ms, poi chiama onDone
        const animateFade = (startOp, endOp, startVol, endVol, onDone) => {
            if (this._mantisFadeAnimId) {
                cancelAnimationFrame(this._mantisFadeAnimId);
                this._mantisFadeAnimId = null;
            }
            const t0 = performance.now();
            const step = (now) => {
                const t = Math.min(1, (now - t0) / FADE_MS);
                if (overlay) overlay.style.opacity = startOp + (endOp - startOp) * t;
                player.volume = Math.max(0, Math.min(1, startVol + (endVol - startVol) * t));
                if (t < 1) {
                    this._mantisFadeAnimId = requestAnimationFrame(step);
                } else {
                    this._mantisFadeAnimId = null;
                    if (onDone) onDone();
                }
            };
            this._mantisFadeAnimId = requestAnimationFrame(step);
        };

        // Avvia un video con fade-in (overlay nero → trasparente) non appena il primo frame è pronto
        const playWithFadeIn = (src, startVol, onEndedCb) => {
            // Blocca l'altezza del wrapper per evitare reflow durante il cambio src
            if (wrapper && wrapper.offsetHeight > 0) wrapper.style.minHeight = wrapper.offsetHeight + 'px';
            player.src = src;
            player.volume = startVol;
            player.addEventListener('canplay', () => {
                if (wrapper) wrapper.style.minHeight = '';
                animateFade(1, 0, startVol, 1);
            }, { once: true });
            player.play().catch(e => console.warn('Video Mantis:', e.message));
            this._introEndedListener = onEndedCb;
            player.addEventListener('ended', onEndedCb, { once: true });
        };

        // Fase 3: dimostrazione finita
        const phase3End = () => {
            this._introEndedListener = null;
            this._cleanupMantisEffects();
            this.stopVideo();
            this._afterIntroEnd();
        };

        // Fase 3: avvia dimostrazione con fade-in + shake
        const startPhase3 = () => {
            playWithFadeIn(dimosSrc, 0, phase3End);
            this._startMantisDimostrazioneEffects(player, stage.mantisShakes || []);
        };

        // Fase 2: variante finita → fade-out → fase 3
        const phase2End = () => {
            this._introEndedListener = null;
            animateFade(0, 1, 1, 0, startPhase3);
        };

        // Fase 2: avvia variante con fade-in
        const startPhase2 = () => playWithFadeIn(variantSrc, 0, phase2End);

        // Fase 1: intro finita → fade-out → fase 2
        const phase1End = () => {
            this._introEndedListener = null;
            animateFade(0, 1, 1, 0, startPhase2);
        };

        // Setup display
        this._duckAudio();
        const wrapper = document.getElementById('video-wrapper');
        const placeholder = document.getElementById('video-placeholder');
        const stopBtn = document.getElementById('btn-stop-video');
        if (wrapper) wrapper.style.display = '';
        if (placeholder) placeholder.style.display = 'none';
        if (stopBtn) stopBtn.style.display = '';
        player.style.display = 'block';
        document.getElementById('stage-active')?.classList.add('stage-video-active');

        // Avvia intro — nessun fade-in (parte direttamente visibile)
        player.src = stage.intro;
        player.volume = 1;
        this._introEndedListener = phase1End;
        player.addEventListener('ended', phase1End, { once: true });
        player.play().catch(e => console.warn('Video Mantis intro:', e.message));
    },

    // Avvia il tracking degli shake durante mantis_dimostrazione
    _startMantisDimostrazioneEffects(player, shakes) {
        if (!shakes.length) return;
        const triggered = new Set();
        const onTimeUpdate = () => {
            const t = player.currentTime;
            shakes.forEach((s, i) => {
                if (!triggered.has(i) && t >= s.time) {
                    triggered.add(i);
                    this._triggerMantisShake();
                }
            });
        };
        this._mantisTimeUpdateListener = onTimeUpdate;
        player.addEventListener('timeupdate', onTimeUpdate);
    },

    _triggerMantisShake() {
        // Shake schermo
        const wrapper = document.getElementById('video-wrapper');
        if (wrapper) {
            wrapper.classList.remove('mantis-shaking');
            void wrapper.offsetWidth;
            wrapper.classList.add('mantis-shaking');
            wrapper.addEventListener('animationend', () => wrapper.classList.remove('mantis-shaking'), { once: true });
        }
        // Volo cursore
        const cursor = document.getElementById('mantis-cursor');
        if (cursor) {
            cursor.classList.remove('flying');
            void cursor.offsetWidth;
            cursor.classList.add('flying');
            cursor.addEventListener('animationend', () => cursor.classList.remove('flying'), { once: true });
        }
    },

    _cleanupMantisEffects() {
        if (this._mantisFadeAnimId) {
            cancelAnimationFrame(this._mantisFadeAnimId);
            this._mantisFadeAnimId = null;
        }
        const player = document.getElementById('video-player');
        if (player) player.volume = 1;
        const cursor = document.getElementById('mantis-cursor');
        if (cursor) cursor.classList.remove('flying');
        const overlay = document.getElementById('mantis-black');
        if (overlay) overlay.style.opacity = '0';
        const wrapper = document.getElementById('video-wrapper');
        if (wrapper) wrapper.classList.remove('mantis-shaking');
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
                    this.playMusicAtVolume(ids[0], introVolume, stage.musicIntroStartOffset ?? null);
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

    playFirstMusic(skipDelay = false) {
        if (!this.currentStage) return;
        const ids = this.currentStage.musicIds || [];
        if (!ids.length) return;
        const delay = skipDelay ? 0 : (this.currentStage.musicDelay ?? 0);
        const doPlay = () => {
            if (!this.currentStage) return;
            const offset = this.currentStage.musicStartOffset ?? null;
            if (offset != null) {
                const volume = this._getMusicVolumeNum();
                this.playMusicAtVolume(ids[0], volume, offset);
            } else {
                this.playMusic(ids[0]);
            }
            this._startSfxOnMusicStart();
        };
        if (delay > 0) {
            setTimeout(doPlay, delay);
        } else {
            doPlay();
        }
    },

    playIntro() {
        if (!this.currentStage) return;
        this.stopAllAudio();
        this.introPlayed = true;
        const btnIntro = document.getElementById('btn-intro');
        if (btnIntro) { btnIntro.disabled = true; btnIntro.style.opacity = '0.3'; }
        this.setActiveVideoBtn(btnIntro);
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

    _updateEventButtonsForTurn() {
        const isPlayerTurn = this.vrMode
            ? this.turnPhase === 'players'
            : (this.turnPhase === 'players' && (this.stagePlayers.length === 1 || this.playerSubPhase === 'active'));
        const activePlayer = this._activePlanciaPlayer();
        const activeZone   = activePlayer != null ? (this.playerZoneState[activePlayer] ?? 0) : null;
        (this.currentStage?.events || []).forEach(ev => {
            if (!ev.toggle) {
                if (ev.multiClick) {
                    const clicked = typeof this.eventClickedState[ev.id] === 'number' ? this.eventClickedState[ev.id] : 0;
                    if (clicked >= ev.maxCount) return;
                } else {
                    if (this.eventClickedState[ev.id]) return;
                }
            }
            const prereqMet = !ev.requiresEvent     || !!this.eventClickedState[ev.requiresEvent];
            const zoneMet   = ev.requiresZone == null || activeZone === ev.requiresZone;
            const playerMet = !ev.requiresPlayer    || activePlayer === ev.requiresPlayer;
            const ownerMet  = !ev.playerOwner       || activePlayer === ev.playerOwner;
            const equipMet  = !ev.requiresEquipment || (activePlayer != null && (this.playerEquipment[activePlayer] || []).includes(ev.requiresEquipment));
            const btn = document.getElementById(`btn-event-${ev.id}`);
            if (!btn) return;
            const enabled = isPlayerTurn && prereqMet && zoneMet && playerMet && ownerMet && equipMet;
            btn.disabled = !enabled;
            btn.style.opacity = ev.toggle ? '1' : (enabled ? '1' : '0.35');
        });
        if (this.vrMode) this._updateVrUscitaBtn();
    },

    _updateOutroBtn() {
        if (this.vrMode) { this._updateVrUscitaBtn(); return; }
        const stage = this.currentStage;
        if (!stage) return;
        const btn = document.getElementById('btn-outro');
        if (!btn) return;

        // Modalità ibrida Sniper Wolf con Otacon: outro sbloccato da tessera OPPURE da Wolf sconfitta
        if (stage.otaconHybrid && this.stagePlayers.includes('Otacon')) {
            const tesseraEv = (stage.events || []).find(e => e.otaconOutro);
            const tesseraClicked = tesseraEv ? !!this.eventClickedState[tesseraEv.id] : false;
            const wolfDead = (this.bossHpState?.['wolf'] ?? 1) <= 0;
            const enabled = (tesseraClicked || wolfDead) && !this.outroPlayed;
            btn.disabled = !enabled;
            btn.style.opacity = enabled ? '1' : '0.3';
            return;
        }

        const required = (stage.events || []).filter(e => e.requiredForOutro);
        const allDone = required.every(e => !!this.eventClickedState[e.id]);
        const hasOutro = (stage.outro && stage.outro.length > 0) || stage.outroPart2 || required.length > 0;
        const enabled = hasOutro && allDone && !this.outroPlayed && !stage.isBoss;
        btn.disabled = !enabled;
        btn.style.opacity = enabled ? '1' : '0.3';
    },

    playOutro() {
        if (this.vrMode) { this.vrCompleteStage(); return; }
        if (!this.currentStage) return;
        this.stopAllAudio();
        this.outroPlayed = true;
        this._updateOutroBtn();
        this.setActiveVideoBtn(document.getElementById('btn-outro'));
        this._outroPlaying = this.newGameMode;

        const stage = this.currentStage;
        // Stage con outro in due parti (es. stage 9: dipende da chi libera Snake)
        if (stage.outroPart2) {
            const part1ByPlayer = stage.outroPart1ByPlayer || {};
            const key = this.ketchupUsed ? 'ketchup' : (this.liberateSnakePlayer || '');
            const part1 = part1ByPlayer[key] || stage.outro || '';
            const playPart2 = () => {
                // playVideo setta _autoStopListener → stopVideo() → controlla _outroPlaying → unlockNextStage
                this.playVideo(stage.outroPart2);
            };
            if (part1 && part1.length > 0) {
                this.playVideo(part1);
                // Rimpiazza _autoStopListener di playVideo con la catena verso part2
                const player = document.getElementById('video-player');
                if (player && this._autoStopListener) {
                    player.removeEventListener('ended', this._autoStopListener);
                    this._autoStopListener = () => { this._autoStopListener = null; playPart2(); };
                    player.addEventListener('ended', this._autoStopListener, { once: true });
                } else {
                    playPart2();
                }
            } else {
                playPart2();
            }
            return;
        }

        if (stage.outro && stage.outro.length > 0) {
            this.playVideo(stage.outro);
            // Sblocca NEXT STAGE alla fine dell'outro (solo in newGameMode)
            if (this.newGameMode) {
                const player = document.getElementById('video-player');
                if (player) {
                    this._outroEndedListener = () => {
                        this._outroEndedListener = null;
                        this._outroPlaying = false;
                        this.unlockNextStage();
                    };
                    player.addEventListener('ended', this._outroEndedListener, { once: true });
                }
            }
        } else if (this.newGameMode) {
            this._outroPlaying = false;
            this.unlockNextStage();
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
        if (this.vrMode) {
            this._exitVrStage();
            const level = this.vrCurrentBossId ? 'stagelist' : 'training';
            this.playSfx(CONFIG.vrSounds['return'].file);
            this._vrNavTo(level, this.vrCurrentBossId, true);
            this.showScreen('vr-screen');
            return;
        }
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
        if (this.vrMode) {
            const stages = VR_CONFIG.stages;
            const idx = stages.findIndex(s => s.id === this.vrCurrentStageId);
            if (idx < stages.length - 1) {
                this.playSfx(CONFIG.menuSounds['confirm'].file);
                this.launchVrStage(this.vrCurrentBossId, stages[idx + 1].id);
            }
            return;
        }
        if (!this.currentStage) return;
        const nextStage = STAGES.find(s => s.id === this.currentStage.id + 1);
        const destination = nextStage || 'score';
        const effectiveRewards = (this.ketchupUsed && this.currentStage.rewardsKetchup)
            ? this.currentStage.rewardsKetchup
            : this.currentStage.rewards;
        if (destination === 'score') {
            // Applica rewards silenziosamente, nessun popup
            if (effectiveRewards && this.session) {
                const pool = this.session.unlockedEquipment || (this.session.unlockedEquipment = []);
                (effectiveRewards.always || []).forEach(id => { if (!pool.includes(id)) pool.push(id); });
                this._persistSession();
                this._addToMemoryBox(...(this.session?.unlockedEquipment || []));
            }
            this.showScoreScreen();
        } else if (effectiveRewards) {
            this._showRewardsPopup({ ...this.currentStage, rewards: effectiveRewards }, destination);
        } else {
            this.showPlayersPopup(destination);
        }
    },

    _showRewardsPopup(stage, nextStage) {
        this._rewardsPendingNextStage = nextStage;
        this._rewardsConditionalState = {};
        // Pre-popola automaticamente i condizionali
        (stage.rewards.conditional || []).forEach((cond, i) => {
            if (cond.type === 'event') {
                this._rewardsConditionalState[i] = !!this.eventClickedState[cond.eventId];
            }
        });

        const popup = document.getElementById('rewards-popup');
        document.getElementById('rewards-popup-stage').textContent =
            `STAGE ${String(stage.id).padStart(2, '0')} — ${stage.name}`;

        // Equipaggiamento sempre sbloccato + condizionali event auto-risolti
        const alwaysList = document.getElementById('rewards-always-list');
        const eventIds = (stage.rewards.conditional || [])
            .filter(cond => cond.type === 'event')
            .flatMap(cond => {
                const obtained = !!this.eventClickedState[cond.eventId];
                return obtained ? (cond.equipmentIds || []) : (cond.elseEquipmentIds || []);
            });
        const allIds = [...(stage.rewards.always || []), ...eventIds];
        alwaysList.innerHTML = allIds.map(id => {
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
            if (cond.type === 'event') return '';
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
            // Barcode secret
            if (cond.type === 'barcode') {
                const eqHtml = (cond.equipmentIds || []).map(id => {
                    const eq = EQUIPMENT[id];
                    return `<div class="rewards-equipment-item rewards-equipment-bonus">
                        <span class="rewards-eq-id">${id}</span>
                        <span class="rewards-eq-name">${eq ? eq.name : id}</span>
                    </div>`;
                }).join('');
                return `<div class="rewards-popup-divider"></div>
                    <div class="rewards-cond-block" id="rewards-cond-${i}">
                        <div class="rewards-popup-section-label">SEGRETO</div>
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
                        <div id="rewards-barcode-no-hint-${i}" class="rewards-barcode-hint" style="display:none">
                            Devi leggere il capitolo prima di continuare. Quando sei pronto, seleziona SÌ.
                        </div>
                        <div id="rewards-barcode-wrap-${i}" style="display:none">
                            <div class="rewards-popup-question rewards-barcode-prompt">${cond.prompt}</div>
                            <input type="text" id="rewards-barcode-val-${i}" maxlength="3"
                                class="rewards-barcode-input" placeholder="_ _ _"
                                oninput="App._rewardsBarcodeCheck(${i})">
                            <div id="rewards-barcode-wrong-hint-${i}" class="rewards-barcode-hint rewards-barcode-hint-wrong" style="display:none">
                                Guarda meglio sulla confezione della scatola sotto il codice a barre. Si tratta di un equipaggiamento.
                            </div>
                            <div id="rewards-barcode-result-${i}" class="rewards-cond-items" style="display:none">
                                ${eqHtml}
                            </div>
                        </div>
                    </div>`;
            }
            // Evento auto-risolto: mostra risultato senza interazione
            if (cond.type === 'event') {
                const obtained = !!this.eventClickedState[cond.eventId];
                const activeIds = obtained ? (cond.equipmentIds || []) : (cond.elseEquipmentIds || []);
                const eqHtml = activeIds.length
                    ? activeIds.map(id => {
                        const eq = EQUIPMENT[id];
                        return `<div class="rewards-equipment-item rewards-equipment-bonus">
                            <span class="rewards-eq-id">${id}</span>
                            <span class="rewards-eq-name">${eq ? eq.name : id}</span>
                        </div>`;
                    }).join('')
                    : `<div class="rewards-popup-question" style="opacity:0.5">Non completato — nessun equipaggiamento bonus.</div>`;
                return `<div class="rewards-popup-divider"></div>
                    <div class="rewards-cond-block" id="rewards-cond-${i}">
                        <div class="rewards-popup-section-label">OBIETTIVO OPZIONALE</div>
                        <div class="rewards-popup-question">${cond.question}</div>
                        ${eqHtml}
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
        // Animate items in one by one (only those visible at open time — barcode/yes-no items excluded)
        const itemsToAnimate = [...popup.querySelectorAll('.rewards-equipment-item')].filter(el => {
            let p = el.parentElement;
            while (p && p !== popup) { if (p.style.display === 'none') return false; p = p.parentElement; }
            return true;
        });
        if (itemsToAnimate.length > 0) {
            const confirmBtn = document.getElementById('rewards-confirm-btn');
            if (confirmBtn) { confirmBtn.disabled = true; confirmBtn.style.opacity = '0.35'; }
            const spawnCfg = CONFIG.vrSounds?.['oggetto-spawn'];
            let animIdx = 0;
            const animIn = () => {
                if (animIdx >= itemsToAnimate.length) { this._updateRewardsConfirmBtn(); return; }
                const el = itemsToAnimate[animIdx++];
                el.classList.add('rewards-item-in');
                if (spawnCfg) { const a = new Audio(spawnCfg.file); a.volume = this._sfxVol(); a.play().catch(() => {}); }
                setTimeout(animIn, 200);
            };
            setTimeout(animIn, 50);
        } else {
            this._updateRewardsConfirmBtn();
        }
    },

    _updateRewardsConfirmBtn() {
        const btn = document.getElementById('rewards-confirm-btn');
        if (!btn) return;
        const conditionals = this.currentStage?.rewards?.conditional || [];
        const blocked = conditionals.some((cond, i) => {
            const state = this._rewardsConditionalState[i];
            if (cond.exclusive && cond.options && state === undefined) return true;
            if (cond.type === 'barcode' && state !== true) return true;
            return false;
        });
        btn.disabled = blocked;
        btn.style.opacity = blocked ? '0.35' : '';
    },

    _rewardsToggle(condIndex, value) {
        const stage = this.currentStage;
        if (!stage || !stage.rewards) return;
        const cond = (stage.rewards.conditional || [])[condIndex];

        document.getElementById(`rewards-no-${condIndex}`)?.classList.toggle('active', !value);
        document.getElementById(`rewards-yes-${condIndex}`)?.classList.toggle('active', value);

        // Barcode secret
        if (cond?.type === 'barcode') {
            const noHint = document.getElementById(`rewards-barcode-no-hint-${condIndex}`);
            const wrap   = document.getElementById(`rewards-barcode-wrap-${condIndex}`);
            if (value) {
                if (noHint) noHint.style.display = 'none';
                if (wrap)   wrap.style.display = '';
                // Una volta scelto SÌ, non si può tornare indietro
                const noBtn = document.getElementById(`rewards-no-${condIndex}`);
                if (noBtn) { noBtn.disabled = true; noBtn.style.opacity = '0.35'; }
            } else {
                if (noHint) noHint.style.display = '';
                if (wrap)   wrap.style.display = 'none';
                this._rewardsConditionalState[condIndex] = false;
                const inp = document.getElementById(`rewards-barcode-val-${condIndex}`);
                if (inp) inp.value = '';
                const res = document.getElementById(`rewards-barcode-result-${condIndex}`);
                if (res) res.style.display = 'none';
                const wrongHint = document.getElementById(`rewards-barcode-wrong-hint-${condIndex}`);
                if (wrongHint) wrongHint.style.display = 'none';
            }
            this._updateRewardsConfirmBtn();
            return;
        }

        // YES/NO classico o opzione esclusiva (value = indice opzione o bool)
        this._rewardsConditionalState[condIndex] = value;
        const itemsEl = document.getElementById(`rewards-cond-items-${condIndex}`);
        if (itemsEl) {
            if (value) {
                const wasHidden = itemsEl.style.display === 'none';
                itemsEl.style.display = '';
                if (wasHidden) {
                    const yesItems = [...itemsEl.querySelectorAll('.rewards-equipment-item')];
                    const spawnCfg = CONFIG.vrSounds?.['oggetto-spawn'];
                    let yIdx = 0;
                    const animYes = () => {
                        if (yIdx >= yesItems.length) return;
                        const el = yesItems[yIdx++];
                        el.classList.add('rewards-item-in');
                        if (spawnCfg) { const a = new Audio(spawnCfg.file); a.volume = this._sfxVol(); a.play().catch(() => {}); }
                        if (yIdx < yesItems.length) setTimeout(animYes, 200);
                    };
                    animYes();
                }
            } else {
                itemsEl.style.display = 'none';
                [...itemsEl.querySelectorAll('.rewards-equipment-item')].forEach(el => el.classList.remove('rewards-item-in'));
            }
        }
        this._updateRewardsConfirmBtn();
    },

    _rewardsBarcodeCheck(condIndex) {
        const stage = this.currentStage;
        if (!stage?.rewards) return;
        const cond = (stage.rewards.conditional || [])[condIndex];
        if (!cond || cond.type !== 'barcode') return;
        const inp = document.getElementById(`rewards-barcode-val-${condIndex}`);
        const val = inp ? inp.value.trim() : '';
        const match = val.toUpperCase() === cond.secret.toUpperCase();
        const wrongHint = document.getElementById(`rewards-barcode-wrong-hint-${condIndex}`);
        const res       = document.getElementById(`rewards-barcode-result-${condIndex}`);
        if (match) {
            if (wrongHint) wrongHint.style.display = 'none';
            if (res) {
                const wasHidden = res.style.display === 'none';
                res.style.display = '';
                if (wasHidden) {
                    const bItems = [...res.querySelectorAll('.rewards-equipment-item')];
                    const spawnCfg = CONFIG.vrSounds?.['oggetto-spawn'];
                    let bIdx = 0;
                    const animBarcode = () => {
                        if (bIdx >= bItems.length) return;
                        const el = bItems[bIdx++];
                        el.classList.add('rewards-item-in');
                        if (spawnCfg) { const a = new Audio(spawnCfg.file); a.volume = this._sfxVol(); a.play().catch(() => {}); }
                        if (bIdx < bItems.length) setTimeout(animBarcode, 200);
                    };
                    animBarcode();
                }
            }
        } else {
            if (res) res.style.display = 'none';
            // Mostra il hint solo se l'utente ha inserito 3 caratteri (tentativo completo)
            if (wrongHint) wrongHint.style.display = val.length === 3 ? '' : 'none';
        }
        this._rewardsConditionalState[condIndex] = match;
        this._updateRewardsConfirmBtn();
    },

    _rewardsConfirm() {
        const confirmBtn = document.getElementById('rewards-confirm-btn');
        if (confirmBtn) { confirmBtn.disabled = true; confirmBtn.style.opacity = '0.35'; }

        const popup = document.getElementById('rewards-popup');
        // Collect only items already animated in
        const visibleItems = popup ? [...popup.querySelectorAll('.rewards-equipment-item.rewards-item-in')] : [];

        // Snapshot pool BEFORE saving to know which items were already owned
        const poolBefore = new Set(this._getMemoryBox());

        // Persist equipment to session
        const stage = this.currentStage;
        if (stage?.rewards && this.session) {
            const pool = this.session.unlockedEquipment || (this.session.unlockedEquipment = []);
            (stage.rewards.always || []).forEach(id => { if (!pool.includes(id)) pool.push(id); });
            (stage.rewards.conditional || []).forEach((cond, i) => {
                const val = this._rewardsConditionalState[i];
                if (cond.exclusive && cond.options && val !== undefined && val !== false) {
                    const opt = cond.options[val];
                    (opt?.equipmentIds || []).forEach(id => { if (!pool.includes(id)) pool.push(id); });
                } else if (cond.type === 'event') {
                    const ids = val ? (cond.equipmentIds || []) : (cond.elseEquipmentIds || []);
                    ids.forEach(id => { if (!pool.includes(id)) pool.push(id); });
                } else if (!cond.exclusive && val === true) {
                    (cond.equipmentIds || []).forEach(id => { if (!pool.includes(id)) pool.push(id); });
                }
            });
            this._persistSession();
            this._addToMemoryBox(...(this.session?.unlockedEquipment || []));
        }

        const nextStage = this._rewardsPendingNextStage;
        this._rewardsPendingNextStage = null;
        this._rewardsConditionalState = {};

        const doNavigate = () => {
            if (popup) popup.style.display = 'none';
            if (nextStage === 'score') { this.showScoreScreen(); return; }
            if (!nextStage) return;
            // Stage 1→2 e 13→14: salvataggio speciale dopo intro, non qui
            if (nextStage.id === 2 || nextStage.id === 14) {
                this.showPlayersPopup(nextStage);
            } else if (this.currentStage?.id === 11 && nextStage.id === 12) {
                this._pendingVideoEndCallback = () => this._triggerInlineSave(nextStage);
                this.playVideo('video/disco2.mp4');
            } else {
                this._triggerInlineSave(nextStage);
            }
        };

        if (visibleItems.length === 0) { setTimeout(doNavigate, 2000); return; }

        const fullFile   = this._equipSounds?.full;
        const presoCfg   = CONFIG.vrSounds?.['oggetto-preso'];
        let idx = 0;

        const animOut = () => {
            if (idx >= visibleItems.length) { setTimeout(doNavigate, 2000); return; }
            const el = visibleItems[idx++];
            const idSpan = el.querySelector('.rewards-eq-id');
            const itemId = idSpan ? idSpan.textContent.trim() : null;
            const alreadyOwned = itemId ? poolBefore.has(itemId) : false;

            if (alreadyOwned) {
                // FULL: mostra label + glitch + suono oggetto-full
                const label = document.createElement('span');
                label.className = 'rewards-item-full-label';
                label.textContent = 'FULL';
                el.appendChild(label);
                if (fullFile) { const a = new Audio(fullFile); a.volume = this._sfxVol(); a.play().catch(() => {}); }
                el.classList.add('rewards-item-glitch');
                setTimeout(animOut, 900);
            } else {
                // PRESO: fade out + suono oggetto-preso
                if (presoCfg) { const a = new Audio(presoCfg.file); a.volume = this._sfxVol(); a.play().catch(() => {}); }
                el.style.transition = 'opacity 0.3s ease';
                el.style.opacity = '0';
                setTimeout(animOut, 400);
            }
        };

        animOut();
    },

    // ============================================
    // SCORE SCREEN (fine campagna)
    // ============================================
    _calcCodeName(s) {
        const rounds      = s.rounds        || 0;
        const saves       = s.saves         || 0;
        const continues   = s.continues     || 0;
        const alerts      = s.alerts        || 0;
        const kills       = s.kills         || 0;
        const rations     = s.rations_used  || 0;
        const bandanaUsed = s.bandana_used  || false;
        const diff        = s.difficulty    || 'NORMAL';

        const NAMES = {
            EASY:    ['Hound','Pigeon','Piranha','Pig','Cat','Koala','Chicken','Puma','Komodo Dragon','Mongoose','Spider','Flying Squirrel'],
            NORMAL:  ['Doberman','Falcon','Shark','Elephant','Deer','Capybara','Mouse','Leopard','Iguana','Hyena','Tarantula','Bat'],
            HARD:    ['Fox','Hawk','Jaws','Mammoth','Zebra','Sloth','Rabbit','Panther','Alligator','Jackal','Centipede','Flying Fox'],
            EXTREME: ['Big Boss','Eagle','Orca','Whale','Hippopotamus','Giant Panda','Ostrich','Jaguar','Crocodile','Tasmanian Devil','Scorpion','Night Owl'],
        };
        const names = NAMES[diff] || NAMES.NORMAL;

        // Rank 1: tutte le condizioni devono essere soddisfatte
        if (rounds <= 180 && continues === 0 && alerts <= 2 && kills <= 12 && rations <= 1 && !bandanaUsed) {
            return names[0];
        }
        // Rank 2
        if (rounds <= 150) return names[1];
        // Rank 3
        if (kills >= 25) return names[2];

        // Rank 7 speciale: 2+ tra le condizioni di rank 4, 5, 6 (controllato prima dei singoli)
        const r4 = rations > 6;
        const r5 = saves > 8;
        const r6 = rounds > 210;
        if ([r4, r5, r6].filter(Boolean).length >= 2) return names[6];

        // Rank 4, 5, 6 singoli
        if (r4) return names[3];
        if (r5) return names[4];
        if (r6) return names[5];

        // Rank 8–12: tabella being found × enemies
        let rank;
        if      (alerts <= 2) { rank = kills <= 12 ? 8  : kills <= 18 ? 9  : 10; }
        else if (alerts <= 4) { rank = kills <= 12 ? 9  : kills <= 18 ? 10 : 11; }
        else                  { rank = kills <= 12 ? 10 : kills <= 18 ? 11 : 12; }
        return names[rank - 1];
    },

    _fmtTime(ms) {
        const s = Math.floor(ms / 1000);
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
    },

    showScoreScreen() {
        this.stopVideo();
        this.stopMusic();
        if (this.ambientLoop) this.ambientLoop.stop();
        if (this.alertLoop) this.alertLoop.stop();
        if (this.evasionLoop) this.evasionLoop.stop();

        const s = this.session || {};
        const rounds   = s.rounds || 0;
        const playTime = `${String(Math.floor(rounds / 60)).padStart(2,'0')}:${String(rounds % 60).padStart(2,'0')}`;
        const codeName = this._calcCodeName(s);
        const diffLabel = s.difficulty || 'NORMAL';

        const stats = [
            { label: 'GAME LEVEL',  value: diffLabel,           unit: '' },
            { label: 'PLAY TIME',   value: playTime,             unit: '' },
            { label: 'SAVE',        value: s.saves    || 0,     unit: 'TIMES' },
            { label: 'CONTINUE',    value: s.continues|| 0,     unit: 'TIMES' },
            { label: 'BEING FOUND', value: s.alerts   || 0,     unit: 'TIMES' },
            { label: 'ENEMIES',     value: s.kills    || 0,     unit: 'KILLED' },
            { label: 'RATIONS',     value: s.rations_used || 0, unit: 'USED' },
        ];

        const usedItems = [];
        if (s.bandana_used)   usedItems.push('BANDANA');
        if (s.mimetica_used)  usedItems.push('MIMETICA OTTICA');

        document.getElementById('score-stats').innerHTML = stats.map((st, i) =>
            `<div class="score-stat" id="score-stat-${i}">
                <span class="score-stat-label">${st.label}</span>
                <span class="score-stat-sep">/</span>
                <span class="score-stat-value">${st.value}</span>
                ${st.unit ? `<span class="score-stat-unit">${st.unit}</span>` : ''}
            </div>`
        ).join('') + (usedItems.length ? `
            <div class="score-stat score-used-items-block">
                <span class="score-stat-label">USED ITEMS</span>
                <span class="score-stat-sep">/</span>
                <span class="score-used-items-list">${usedItems.map(n => `<div>${n}</div>`).join('')}</span>
            </div>` : '');

        document.getElementById('score-special-section').innerHTML =
            `<div class="score-special-label">SPECIAL ITEMS</div>
             <div class="score-special-item">"BANDANA"</div>`;

        document.getElementById('score-codename-row').innerHTML =
            `<span class="score-codename-label">CODE NAME</span>
             <span class="score-codename-value">${codeName}</span>`;

        // Nascondi sidebar
        const sidebar = document.getElementById('player-sidebar');
        if (sidebar) sidebar.style.display = 'none';
        const eqSidebar = document.getElementById('equipment-sidebar');
        if (eqSidebar) eqSidebar.style.display = 'none';

        this.showScreen('score-screen');

        // Avvia video — quando finisce, fade-out rivela l'immagine statica con le stats
        const vp = document.getElementById('score-video-player');
        if (vp) {
            vp.style.opacity = '1';
            vp.src = 'video/score-video.mp4';
            vp.play().catch(() => { vp.style.opacity = '0'; });
            vp.addEventListener('ended', () => {
                vp.style.opacity = '0';
            }, { once: true });
        }
    },

    promptScoreSave() {
        const popup = document.getElementById('score-save-popup');
        if (popup) popup.style.display = 'flex';
    },

    // HTML della mini-classifica per uno stage
    _vrLeaderboardHtml(lbKey, stageId) {
        const lb = this._vrGetLeaderboard(lbKey, stageId);
        const medals = ['1ST', '2ND', '3RD'];
        const rows = lb.map((e, i) => {
            const cls = e.isDefault ? 'vr-lb-default' : 'vr-lb-player';
            return `<div class="vr-lb-row ${cls}">
                <span class="vr-lb-pos">${medals[i]}</span>
                <span class="vr-lb-val">${e.rounds}</span>
            </div>`;
        }).join('');
        return `<div class="vr-lb">${rows}</div>`;
    },

    // Restituisce il leaderboard per una chiave composta (es. "training_101" o "boss_B01_101")
    _vrGetLeaderboard(lbKey, stageId) {
        if (!this._vrState.vrLeaderboard) this._vrState.vrLeaderboard = {};
        if (!this._vrState.vrLeaderboard[lbKey]) {
            const stage = VR_CONFIG.stages.find(s => s.id === stageId);
            const s = stage?.roundSoglia ?? 20;
            this._vrState.vrLeaderboard[lbKey] = [
                { rounds: s - 5, isDefault: true },
                { rounds: s - 2, isDefault: true },
                { rounds: s + 1, isDefault: true },
            ];
        }
        return this._vrState.vrLeaderboard[lbKey];
    },

    // Inserisce un nuovo tempo nel leaderboard; restituisce il rank ottenuto (1-4)
    _vrUpdateLeaderboard(lbKey, stageId, rounds) {
        const lb = this._vrGetLeaderboard(lbKey, stageId);
        // Trova dove si inserisce
        let insertPos = lb.findIndex(e => rounds < e.rounds);
        if (insertPos === -1) insertPos = lb.length; // peggiore di tutti
        if (insertPos >= 3) return 4; // fuori dai primi 3
        // Inserisci e taglia a 3
        lb.splice(insertPos, 0, { rounds, isDefault: false });
        lb.splice(3);
        return insertPos + 1; // rank 1-3
    },

    saveFromScoreScreen() {
        document.getElementById('score-save-popup').style.display = 'none';

        // Prepara sessione "new game+": stage 1, statistiche azzerate, bandana + difficoltà mantenuti
        // Gli equipaggiamenti VR sono globali (_vrState) e vengono rimergiati automaticamente
        const hasBandana     = this._getAllUnlockedEquip().includes('023');
        const prevDifficulty = this.session?.difficulty || 'NORMAL';
        this.session = this._newSession();
        this.session.stage = 1;
        this.session.savedForStage = 1;
        this.session.difficulty = prevDifficulty;
        if (hasBandana) this.session.unlockedEquipment = ['023'];
        this._mergeVrEquipIntoSession();

        this._postSaveScreen = 'intro';
        this.cardReturnScreen = 'main-menu';
        this.newGameMode = true;
        this.showSaveScreen(null);
    },

    skipScoreSave() {
        document.getElementById('score-save-popup').style.display = 'none';
        this.startIntroVideo();
    },

    // ============================================
    // INLINE SAVE (Mei Ling automatico tra stage)
    // ============================================
    _inlineSaveVideoPath(prefix) {
        const id = this._inlineSaveNextStage?.id ?? this.currentStage?.id;
        if (!id || id < 2) return null;
        return `video/mei ling/${prefix}-${String(id).padStart(2, '0')}.mp4`;
    },

    _triggerInlineSave(nextStage) {
        this._inlineSaveNextStage = nextStage;
        this._inInlineSaveMode = true;
        // Aggiorna subito il titolo e lo status dello stage nella UI
        if (nextStage) {
            const title = document.getElementById('active-stage-title');
            if (title) title.textContent = `STAGE ${String(nextStage.id).padStart(2, '0')} — ${nextStage.name.toUpperCase()}`;
            const status = document.getElementById('stage-status');
            if (status) {
                status.textContent = nextStage.isBoss ? 'BOSS BATTLE' : 'SNEAKING MISSION';
                status.style.color = nextStage.isBoss ? 'var(--codec-red)' : 'var(--codec-orange)';
                status.style.borderColor = nextStage.isBoss ? 'rgba(255, 58, 58, 0.3)' : 'rgba(255, 140, 58, 0.3)';
            }
        }
        const src = this._inlineSaveVideoPath('pre-save') || this._randomSaveVideo((CONFIG.saveScreen || {}).intro);
        if (src) {
            this._pendingVideoEndCallback = () => this._showInlineSaveQuestion();
            this.playVideo(src);
        } else {
            this._showInlineSaveQuestion();
        }
    },

    _inlineSaveFocused: 'yes',

    _inlineSaveFocus(which) {
        const changed = this._inlineSaveFocused !== which;
        this._inlineSaveFocused = which;
        document.getElementById('inline-save-item-yes')?.classList.toggle('focused', which === 'yes');
        document.getElementById('inline-save-item-no')?.classList.toggle('focused', which === 'no');
        if (changed) this.playSfx(CONFIG.menuSounds['choice'].file);
    },

    _showInlineSaveQuestion() {
        const popup = document.getElementById('inline-save-question');
        if (popup) popup.style.display = 'flex';
        this._inlineSaveFocus('yes');
    },

    _inlineSaveYes() {
        document.getElementById('inline-save-question').style.display = 'none';
        this._initAudioCtx();
        this.cardScreenMode = 'save';
        this.cardReturnScreen = 'stage-active';
        this._savedThisVisit = false;
        this.selectedCard = 1;
        this.selectedBlock = null;
        this._skipSaveIntroVideo = true;
        this._renderCardScreen();
        this.showScreen('card-screen');
        setTimeout(() => this._autoPlaySaveIntro(), 300);
    },

    _inlineSaveNo() {
        document.getElementById('inline-save-question').style.display = 'none';
        if (this.currentScreen === 'card-screen') this.showScreen('stage-active');
        const src = this._inlineSaveVideoPath('no-save') || this._randomSaveVideo((CONFIG.saveScreen || {}).outro);
        this._inInlineSaveMode = false;
        if (src) {
            this._pendingVideoEndCallback = () => this._afterInlineSaveComplete();
            this.playVideo(src);
        } else {
            this._afterInlineSaveComplete();
        }
    },

    _afterInlineSaveComplete() {
        const nextStage = this._inlineSaveNextStage;
        this._inlineSaveNextStage = null;
        this._inInlineSaveMode = false;
        const fromCardScreen = this.currentScreen === 'card-screen';
        if (fromCardScreen) this.showScreen('stage-active');
        if (nextStage) {
            if (fromCardScreen) {
                setTimeout(() => this.showPlayersPopup(nextStage), 150);
            } else {
                this.showPlayersPopup(nextStage);
            }
        } else {
            // Stage 2: avvia musica/gioco
            if (this.currentStage?.startInAlert) {
                this.triggerAlert();
            } else {
                this.playFirstMusic();
            }
        }
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
        if (this._gameOverSoundListener) {
            const p = document.getElementById('video-player');
            if (p) p.removeEventListener('timeupdate', this._gameOverSoundListener);
            this._gameOverSoundListener = null;
        }
        this.setActiveVideoBtn(null);

        const wrapper = document.getElementById('video-wrapper');
        const player = document.getElementById('video-player');
        const stopBtn = document.getElementById('btn-stop-video');

        this._cleanupMantisEffects();

        if (player) {
            player.onended = null;
            if (this._autoStopListener) {
                player.removeEventListener('ended', this._autoStopListener);
                this._autoStopListener = null;
            }
            if (this._videoErrorListener) {
                player.removeEventListener('error', this._videoErrorListener);
                this._videoErrorListener = null;
            }
            if (this._introEndedListener) {
                player.removeEventListener('ended', this._introEndedListener);
                this._introEndedListener = null;
                // Intro interrotta manualmente: avvia ambient/musica se non già in corso (senza delay)
                // Non chiamare durante il flusso inline save: sarebbe _afterIntroEnd per lo stage precedente
                if (!this._inInlineSaveMode) {
                    setTimeout(() => this._afterIntroEnd(true), 0);
                }
            }
            if (this._outroEndedListener) {
                player.removeEventListener('ended', this._outroEndedListener);
                this._outroEndedListener = null;
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
        if (this._pendingVideoEndCallback) {
            const cb = this._pendingVideoEndCallback;
            this._pendingVideoEndCallback = null;
            setTimeout(cb, 0);
        }
        if (this._eventMusicRestore !== null) {
            if (this.musicLoop) this.musicLoop.setVolume(this._eventMusicRestore);
            this._eventMusicRestore = null;
        }
        if (this._eventStoppedMusic) {
            this._eventStoppedMusic = false;
            const savedAlert = this._eventStoppedAlertState || 'normal';
            this._eventStoppedAlertState = null;
            if (savedAlert === 'alert' || savedAlert === 'evasion') {
                setTimeout(() => {
                    this.triggerAlert();
                    if (savedAlert === 'evasion') this.triggerEvasion();
                }, 100);
            } else {
                setTimeout(() => {
                    const ids = this.currentStage?.musicIds || [];
                    if (!ids.length) return;
                    // Usa l'ultima musica suonata se ancora valida, altrimenti la prima della zona corrente
                    const activePlayer = this._activePlanciaPlayer()
                        ?? (this.stagePlayers?.length === 1 ? this.stagePlayers[0] : null);
                    const currentZone = activePlayer != null ? (this.playerZoneState[activePlayer] ?? 0) : 0;
                    const zoneId = ids[currentZone] ?? ids[0];
                    const volume = this._getMusicVolumeNum();
                    this.playMusicAtVolume(zoneId, volume);
                }, 100);
            }
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
        // VR stage: nessuna musicId ma ha zone con guardie — mostra solo contatori zona
        if (ids.length === 0) {
            if (category) category.style.display = 'none';
            return;
        }

        if (category) category.style.display = '';
        const musicSlider = document.getElementById('music-volume');
        if (musicSlider) musicSlider.value = this.defaultMusicVolume;
        const disabledClass = stage.startInAlert ? ' btn-disabled' : '';
        const hasEnemies = Array.isArray(stage.enemies) && stage.enemies.length > 0;
        container.innerHTML = ids.map((id, i) => {
            const track = CONFIG.music[id];
            if (!track) return '';
            const label = (stage.musicLabels && stage.musicLabels[i]) || track.name;
            const btn = `<button class="btn-sound${disabledClass}" id="music-btn-zone-${i}" onclick="App.playMusic('${id}',${i})">♪ ${label}</button>`;
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

    // Restituisce true se lo stage ha telecamere (considera hasCamerasMinPlayers e hasCamerasInZones)
    _stageHasCameras(stage, zone) {
        if (!stage) return false;
        if (stage.hasCameras) return true;
        if (stage.hasCamerasInZones) {
            return zone != null
                ? stage.hasCamerasInZones.includes(zone)
                : stage.hasCamerasInZones.length > 0;
        }
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
        const re = stage.radioEnemies;
        if (Array.isArray(re)) {
            this.radioEnemyState = [...re];
        } else if (re && typeof re === 'object') {
            const n = this.stagePlayers.length;
            const key = Object.keys(re).map(Number).sort((a, b) => b - a).find(k => k <= n) ?? Object.keys(re).map(Number).sort((a, b) => a - b)[0];
            this.radioEnemyState = [...(re[key] ?? [])];
        } else {
            this.radioEnemyState = [];
        }
    },

    updateEnemyCount(zone, delta) {
        if (this.enemyState[zone] === undefined) return;
        if (delta < 0 && this.enemyState[zone] > 0) {
            this._enemyDownPendingZone = zone;
            document.getElementById('enemy-down-popup').style.display = 'flex';
            return;
        }
        this._applyEnemyCount(zone, delta);
    },

    decrementEvent(id) {
        const ev = (this.currentStage?.events || []).find(e => e.id === id);
        if (!ev?.canDecrement) return;
        const prev = typeof this.eventClickedState[id] === 'number' ? this.eventClickedState[id] : 0;
        if (prev <= 0) return;
        this.eventClickedState[id] = prev - 1;
        this._refreshNodeCounter(ev);
        this._updateOutroBtn();
        if (this.vrMode) {
            const cfg = CONFIG.vrSounds?.['oggetto-spawn'];
            if (cfg) { const a = new Audio(cfg.file); a.volume = this._sfxVol(); a.play().catch(() => {}); }
        }
    },

    _refreshNodeCounter(ev) {
        const clicked = typeof this.eventClickedState[ev.id] === 'number' ? this.eventClickedState[ev.id] : 0;
        const countEl = document.getElementById(`node-count-${ev.id}`);
        if (countEl) countEl.textContent = clicked;
        const plusBtn = document.getElementById(`btn-event-${ev.id}`);
        if (plusBtn) plusBtn.disabled = clicked >= ev.maxCount;
        const minusBtn = document.getElementById(`btn-event-dec-${ev.id}`);
        if (minusBtn) minusBtn.disabled = clicked <= 0;
    },

    updateNodeCount(zone, delta) {
        if (this.nodeState[zone] === undefined) return;
        const max = this.currentStage?.nodeCounters?.[zone] ?? Infinity;
        this.nodeState[zone] = Math.min(max, Math.max(0, this.nodeState[zone] + delta));
        const el = document.getElementById(`node-count-${zone}`);
        if (el) el.textContent = this.nodeState[zone];
        if (this.vrMode) this._updateVrUscitaBtn();
    },

    confirmEnemyDown(isKill) {
        document.getElementById('enemy-down-popup').style.display = 'none';
        const zone = this._enemyDownPendingZone;
        this._enemyDownPendingZone = null;
        if (zone === null || zone === undefined) return;
        this._applyEnemyCount(zone, -1);
        if (isKill) {
            if (this.currentStage?.gameOverOnKill) {
                const sfx = new Audio('audio/sfx/Soldato ucciso.mp3');
                sfx.volume = this._sfxVol();
                sfx.play().catch(() => {});
                sfx.onended = () => this.triggerGameOver();
                return;
            }
            this.trackStat('kills');
            this.playSfx('audio/sfx/Soldato ucciso.mp3');
        } else {
            this.playSfx('audio/sfx/guardia ko.mp3');
        }
    },

    _applyEnemyCount(zone, delta) {
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

    playMusicAtVolume(id, volume, startOffset = null) {
        const track = CONFIG.music[id];
        if (!track) return;
        this.stopMusic();
        this.lastMusicId = id;
        let loopPoints = this._cfgLoopPoints(track);
        if (startOffset != null) {
            loopPoints = loopPoints
                ? { ...loopPoints, introStart: startOffset }
                : { introStart: startOffset, start: 0, end: 0 };
        }
        this.musicLoop = this.createSeamlessLoop(track.file, volume, track.loopOverlap, loopPoints);
        this.musicLoop.play();
        this._startSfxOnMusicStart();
        const controls = document.getElementById('music-controls');
        if (controls) controls.style.display = '';
        this.currentMusicBtn = document.getElementById(`music-btn-${id}`);
        if (this.currentMusicBtn) this.currentMusicBtn.classList.add('playing');
    },

    playMusic(id, explicitZoneIndex) {
        const normalVolume = this._getMusicVolumeNum();
        const stage = this.currentStage;

        // Sincronizza la zona del giocatore attivo con la zona musicale scelta
        const zoneIndex = explicitZoneIndex !== undefined ? explicitZoneIndex : (stage?.musicIds || []).indexOf(id);
        if (zoneIndex >= 0) {
            const activePlayer = this._activePlanciaPlayer()
                ?? (this.stagePlayers?.length === 1 ? this.stagePlayers[0] : null);
            if (activePlayer) {
                this.playerZoneState[activePlayer] = zoneIndex;
                // Aggiorna il select nella card senza ricostruire tutto
                const sel = document.querySelector(`.zone-select[onchange*="${activePlayer}"]`);
                if (sel) sel.value = zoneIndex;
                if (stage?.zoneRestrictions) this._refreshEquipmentPanel(activePlayer);
                this._updateEventButtonsForTurn();
            }
            this._startZoneSfx(zoneIndex);
        }

        // Non cambiare musica se alert/evasion è attivo (la zona è già aggiornata sopra)
        if (this.alertState !== 'normal') return;

        // In VR: suona la porta al cambio zona, poi esci (musica invariata)
        if (this.vrMode) {
            if (this.currentStage?.elevator) {
                const sfx = new Audio(this.currentStage.elevator);
                sfx.volume = this._sfxVol();
                sfx.play().catch(() => {});
            }
            return;
        }

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
        const targetVolume = this._getMusicVolumeNum();
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
        this.defaultMusicVolume = parseInt(val);
        if (this.musicLoop) this.musicLoop.setVolume(val / 100);
    },

    _sfxVol() { return this.sfxVolume / 100; },

    _getMusicVolumeNum() {
        return this.defaultMusicVolume / 100;
    },

    _getAlertVolumeNum() {
        return (document.getElementById('alert-volume')?.value || 80) / 100;
    },

    _showAlertVolumeSlider() {
        const wrap = document.getElementById('alert-volume-wrap');
        if (!wrap) return;
        const slider = document.getElementById('alert-volume');
        if (slider) slider.value = this.defaultMusicVolume;
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

        container.innerHTML = `
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
        this.eventClickedState = {};
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
            if (this.session) {
                // Bandana equipaggiata a Snake → segna come usata per il rank
                if (p === 'Snake' && (this.playerEquipment[p] || []).includes('023')) {
                    this.session.bandana_used = true;
                }
                // Mimetica ottica equipaggiata → segna come usata per lo score
                if ((this.playerEquipment[p] || []).some(id => EQUIPMENT[id]?.itemSubtype === 'mimetica')) {
                    this.session.mimetica_used = true;
                }
            }
        });
        // Inizializza charges sezioni boss — per giocatore
        this.bossSectionChargeState = {};
        this.stagePlayers.forEach(p => {
            this.bossSectionChargeState[p] = {};
            (this.currentStage?.bossTurnSections || []).forEach(sec => {
                if (sec.id && sec.charges != null) this.bossSectionChargeState[p][sec.id] = sec.charges;
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
        const player = this._activePlanciaPlayer();
        this._updatePlanciaButtonStates(player);
        this._refreshEquipmentPanel(player);
        this._refreshPlayerBossSections();
    },

    // Giocatore attualmente sulla plancia
    _activePlanciaPlayer() {
        return this.stagePlayers.length > 1 ? this.selectedPlayerForTurn : this.stagePlayers[0];
    },

    // Consuma n token azione e aggiorna i bottoni della plancia
    spendTokens(n, playerName, actionId = null) {
        let rem = n;
        for (let i = 0; i < this.playerTokenState.length && rem > 0; i++) {
            if (this.playerTokenState[i]) { this.playerTokenState[i] = false; rem--; }
        }
        const el = document.getElementById('token-dots');
        if (el) el.innerHTML = this._buildTokenHtml();
        this._updatePlanciaButtonStates(playerName);
        // Azione plancia: deattiva inline charge mode
        if (actionId && playerName && this._inlineChargeActiveFor[playerName]) {
            this._inlineChargeActiveFor[playerName] = null;
            this._inlineChargeClicksLeft[playerName] = null;
        }
        // Aggiorna stato scatolone: le azioni della plancia escono dallo scatolone
        // tranne Movimento Furtivo, Scatto e Concentrazione
        const BOX_SAFE = ['movimento-furtivo', 'scatto', 'concentrazione'];
        if (actionId && playerName && this.boxState[playerName] && !BOX_SAFE.includes(actionId)) {
            this.boxState[playerName] = false;
            this._renderSoldierPhases();
        }
        this._refreshEquipmentPanel(playerName);
        this._refreshPlayerBossSections();
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
        (ch.fixedActions || []).forEach(a => { actionMap[a.id] = a; });
        const varActions = this._resolvePlanciaVarActions(playerName, this.currentStage);
        varActions.forEach(a => { actionMap[a._hotspotRef || a.id] = a; });

        ch.hotspots.forEach(h => {
            const btn = document.getElementById(`hotspot-${playerName}-${h.ref}`);
            if (!btn) return;
            const a = actionMap[h.ref];
            if (!a) return;

            let disabled = stageDisabled.has(a.id);
            if (!disabled && a._bossSectionId !== undefined) {
                const remaining = this.bossSectionChargeState[playerName]?.[a._bossSectionId] ?? a._bossSectionCharges;
                disabled = (a.usesCharge && remaining <= 0) || (typeof a.cost === 'number' && a.cost > available);
            } else if (!disabled && inConcMode) {
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
            return Array.from({ length: d.count }, () => `<span class="die-chip ${cls}"></span>`);
        }).join('');
        return `<div class="action-dice">${chips}</div>`;
    },

    // ============================================
    // EQUIPMENT PANEL
    // ============================================

    _buildEquipmentPanel(playerName) {
        const fullSlots = this.playerEquipment[playerName] || [];
        const slots = fullSlots.filter(Boolean);
        if (!slots.length) return '';

        const consumed  = this.equipmentConsumedState[playerName] || {};
        const available = this.playerTokenState.filter(t => t).length;

        const items = fullSlots.map((id, slotIndex) => {
            if (!id) return '';
            const eq = EQUIPMENT[id];
            if (!eq) return '';
            const attachId = this.playerAttachments[playerName]?.[slotIndex] || null;
            const attachSuffix = attachId ? (EQUIPMENT[attachId]?.nameSuffix || null) : null;

            // Stato consumi
            let isExhausted = false;
            let chargesHtml = '';
            if (eq.charges != null) {
                const remaining = typeof consumed[id] === 'number' ? consumed[id] : eq.charges;
                isExhausted = remaining <= 0;
                const totalDots = Math.max(eq.charges, remaining);
                chargesHtml = `<div class="eq-panel-charges">${
                    Array.from({ length: totalDots }, (_, i) =>
                        `<span class="eq-charge-dot ${i < remaining ? 'full' : 'empty'}"></span>`
                    ).join('')
                }</div>`;
            } else if (eq.consumable) {
                isExhausted = consumed[id] === true;
            }

            // Supporto multi-azione (es. C-4) e singola azione
            const actionList = eq.actions || (eq.action ? [eq.action] : []);
            // Restrizioni di zona (es. no armi a distanza/esplosivi in zona L1)
            const playerZone = this.playerZoneState[playerName] ?? 0;
            const zoneRestr  = this.currentStage?.zoneRestrictions?.[playerZone];
            const zoneBlocked = zoneRestr?.disabledItemTypes
                ? zoneRestr.disabledItemTypes.includes(eq.itemType)
                : false;

            const BOX_IDS = ['010', '027'];
            const usedThisTurn = this.equipmentUsedThisTurn[playerName] || new Set();
            const disabledList = actionList.map(a => {
                const chargeNeeded   = a.usesCharge && eq.charges != null;
                const remaining      = typeof consumed[id] === 'number' ? consumed[id] : (eq.charges ?? 0);
                const noCharge       = chargeNeeded && remaining <= 0;
                const noTokens       = a.cost != null && a.cost > available;
                const flagBlocked    = a.requiresFlag
                    ? !(this.equipmentFlagState[playerName]?.[id]?.[a.requiresFlag])
                    : false;
                const alreadyInBox   = BOX_IDS.includes(id) && !!this.boxState[playerName];
                const notExhausted   = a.requiresExhausted && remaining > 0;
                const onceDone       = a.oncePerTurn && usedThisTurn.has(id);
                const maxHp          = CHARACTERS[playerName]?.hp || 4;
                const atMaxHp        = a.heal && ((this.hpState?.[playerName] ?? maxHp) >= maxHp);
                return (eq.consumable && isExhausted) || (a.usesCharge && isExhausted) || noCharge || noTokens || flagBlocked || zoneBlocked || alreadyInBox || notExhausted || onceDone || atMaxHp;
            });
            const allDisabled = disabledList.every(Boolean);
            const btnsHtml = actionList.map((a, ai) => {
                const disabled = disabledList[ai];
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

            const inlineChargeRemaining = typeof consumed[id] === 'number' ? consumed[id] : (eq.charges ?? 0);
            const inlineChargeActive = this._inlineChargeActiveFor[playerName] === id;
            const inlineChargeHtml = eq.inlineCharge
                ? `<button class="panel-btn eq-inline-charge-btn${inlineChargeActive ? ' inline-charge-active' : ''}"
                       ${!inlineChargeActive || inlineChargeRemaining <= 0 ? 'disabled' : ''}
                       onclick="App.spendEquipCharge('${playerName}','${id}')">
                       −1 ⚙
                   </button>`
                : '';
            const passiveHtml = eq.passive
                ? `<div class="eq-passive-row"><span class="eq-passive-label">PASSIVA</span><span class="eq-passive-desc">${eq.passive.desc}</span></div>`
                : '';

            return `<div class="eq-panel-item${allDisabled ? ' eq-item-disabled' : ''}" id="eq-item-${playerName}-${id}">
                <div class="eq-panel-item-name">${eq.name}${attachSuffix ? ` ${attachSuffix}` : ''}</div>
                ${chargesHtml}
                ${btnsHtml}${inlineChargeHtml}
                ${passiveHtml}
            </div>`;
        }).join('');

        // Accessori attaccati (passivi, non usano slot)
        const attachedItems = (this.playerAttachments[playerName] || [])
            .filter(Boolean)
            .filter((id, i, arr) => arr.indexOf(id) === i) // dedup
            .map(id => EQUIPMENT[id] ? `<div class="eq-panel-item eq-panel-attachment">
                <div class="eq-panel-item-name">◈ ${EQUIPMENT[id].name}</div>
                ${EQUIPMENT[id].passive ? `<div class="eq-passive-row"><span class="eq-passive-label">PASSIVA</span><span class="eq-passive-desc">${EQUIPMENT[id].passive.desc}</span></div>` : ''}
            </div>` : '')
            .join('');

        if (!items && !attachedItems) return '';

        return `<div class="eq-panel-row" id="eq-panel-${playerName}">
            <div class="turn-panel-col-header">EQUIPAGGIAMENTO</div>
            <div class="eq-panel-items">${items}${attachedItems}</div>
        </div>`;
    },

    _buildManualChargeHtml(playerName) {
        const slots = this.playerEquipment[playerName] || [];
        const consumed = this.equipmentConsumedState[playerName] || {};
        const btns = slots
            .filter(id => id && EQUIPMENT[id]?.manualCharge)
            .map(id => {
                const eq = EQUIPMENT[id];
                const remaining = typeof consumed[id] === 'number' ? consumed[id] : (eq.charges ?? 0);
                const tooltip = eq.passive?.desc ? eq.passive.desc.replace(/<br\s*\/?>/gi, ' ') : '';
                return `<button class="eq-charge-sidebar-btn" ${remaining <= 0 ? 'disabled' : ''}
                    ${tooltip ? `title="${tooltip}"` : ''}
                    onclick="App.spendEquipCharge('${playerName}','${id}')">
                    ⚙ ${remaining}
                </button>`;
            }).join('');
        return btns ? `<div class="eq-charge-sidebar" id="eq-charge-sidebar-${playerName}">${btns}</div>` : '';
    },

    spendEquipCharge(playerName, equipId) {
        const eq = EQUIPMENT[equipId];
        if (!eq?.manualCharge && !eq?.inlineCharge) return;
        // Per inline charge: consentito solo se è il modo attivo
        if (eq.inlineCharge && !eq.manualCharge && this._inlineChargeActiveFor[playerName] !== equipId) return;
        const consumed = this.equipmentConsumedState[playerName] || {};
        const remaining = typeof consumed[equipId] === 'number' ? consumed[equipId] : (eq.charges ?? 0);
        if (remaining <= 0) return;
        consumed[equipId] = remaining - 1;
        this.equipmentConsumedState[playerName] = consumed;
        // Decrementa click rimanenti (per inlineChargeOnce)
        if (eq.inlineCharge && this._inlineChargeActiveFor[playerName] === equipId) {
            const left = this._inlineChargeClicksLeft[playerName];
            if (left !== null) {
                const newLeft = left - 1;
                this._inlineChargeClicksLeft[playerName] = newLeft;
                if (newLeft <= 0) {
                    this._inlineChargeActiveFor[playerName] = null;
                    this._inlineChargeClicksLeft[playerName] = null;
                }
            }
        }
        this._refreshEquipmentPanel(playerName);
        // Aggiorna il bottone nella sidebar
        const sidebarSection = document.getElementById(`eq-charge-sidebar-${playerName}`);
        if (sidebarSection) sidebarSection.outerHTML = this._buildManualChargeHtml(playerName);
    },

    _vrMarkRankRestricted(equipId) {
        if (this.vrMode && (equipId === '023' || equipId === '030')) {
            this._vrRankRestricted = true;
        }
    },

    useEquipment(playerName, equipId, actionIndex = 0) {
        const eq = EQUIPMENT[equipId];
        if (!eq) return;
        const actionList = eq.actions || (eq.action ? [eq.action] : []);
        // Applica override da accessori attaccati (es. silenziatore → no alert, suono diverso)
        const slotIndex = (this.playerEquipment[playerName] || []).indexOf(equipId);
        const attachId  = slotIndex >= 0 ? (this.playerAttachments[playerName]?.[slotIndex] || null) : null;
        const attachMod = attachId ? EQUIPMENT[attachId] : null;
        const override = attachMod?.actionOverride ? { ...attachMod.actionOverride } : null;
        if (override?.soundByEquip?.[equipId]) override.sound = override.soundByEquip[equipId];
        const a = override
            ? { ...(actionList[actionIndex] || {}), ...override }
            : (actionList[actionIndex] || {});

        // Spendi token
        if (a.cost > 0) this.spendTokens(a.cost, playerName);

        // Traccia uso di item che impediscono rank 1 in VR
        this._vrMarkRankRestricted(equipId);

        // Suono azione missile: sequenza sparato→movimento o solo movimento
        if (a.category === 'missile') {
            const missileAttivo = !!this.missileState[playerName];
            const playMovimento = () => {
                const mov = new Audio('audio/sfx/missile-movimento.wav');
                mov.volume = App._sfxVol();
                mov.addEventListener('ended', () => this._showMissilePopup(playerName), { once: true });
                mov.play().catch(() => this._showMissilePopup(playerName));
            };
            if (!missileAttivo) {
                const sparato = new Audio('audio/sfx/missile-sparato.wav');
                sparato.volume = App._sfxVol();
                sparato.addEventListener('ended', playMovimento, { once: true });
                sparato.play().catch(playMovimento);
            } else {
                playMovimento();
            }
        // Suono azione normale (con eventuale followUp per stage specifico o reazione boss)
        } else if (a.sound) {
            const followUp = a.followUpByStage?.[this.currentStage?.id];
            const bossReaction = (() => {
                if (!this.currentStage?.isBoss) return null;
                for (const e of (this.currentStage.bossEnemies || [])) {
                    const r = e.equipReactions?.[equipId];
                    if (!r || (this.bossHpState?.[e.id] ?? 0) <= 0) continue;
                    if (e.defensePopup && !this.mantisDefenseSolved) continue;
                    return r;
                }
                return null;
            })();
            if (followUp) {
                const followUpFile  = typeof followUp === 'string' ? followUp : followUp.file;
                const followUpDelay = typeof followUp === 'object' ? (followUp.delay ?? null) : null;
                const audio = new Audio(a.sound);
                audio.volume = App._sfxVol();
                if (followUpDelay !== null) {
                    setTimeout(() => this.playSfx(followUpFile), followUpDelay);
                } else {
                    audio.addEventListener('ended', () => this.playSfx(followUpFile), { once: true });
                }
                audio.play().catch(() => {});
            } else if (bossReaction) {
                const reactionSound = typeof bossReaction === 'string' ? bossReaction : bossReaction.sound;
                const reactionDelay = typeof bossReaction === 'object' ? (bossReaction.delay ?? 0) : 0;
                this._playActionSound(a.sound);
                setTimeout(() => this.playSfx(reactionSound), reactionDelay);
            } else {
                this._playActionSound(a.sound);
            }
        }

        // Aggiorna stato consumi
        const consumed = this.equipmentConsumedState[playerName] || {};
        // Per i missili: consuma carica solo al lancio (quando non c'è già un missile attivo)
        const missileAlreadyActive = a.category === 'missile' && !!this.missileState[playerName];
        if (a.grantsCharge != null && eq.charges != null) {
            const current = typeof consumed[equipId] === 'number' ? consumed[equipId] : 0;
            consumed[equipId] = Math.min(eq.charges, current + a.grantsCharge);
        } else if (a.usesCharge && eq.charges != null && !missileAlreadyActive) {
            const bandanaActive = playerName === 'Snake'
                && (this.equipmentConsumedState['Snake']?.['023'] !== true)
                && Object.keys(this.equipmentConsumedState['Snake'] || {}).includes('023')
                && (eq.itemType === 'arma a distanza' || eq.itemType === 'arma da mischia');
            if (!bandanaActive) {
                const current = typeof consumed[equipId] === 'number' ? consumed[equipId] : eq.charges;
                consumed[equipId] = Math.max(0, current - 1);
            }
        } else if (eq.consumable) {
            consumed[equipId] = true;
        }
        this.equipmentConsumedState[playerName] = consumed;

        // Aggiorna flag equipaggiamento
        if (a.setsFlag || a.clearsFlag) {
            const flags = this.equipmentFlagState[playerName] || {};
            const eqFlags = flags[equipId] || {};
            if (a.setsFlag)   eqFlags[a.setsFlag]   = true;
            if (a.clearsFlag) eqFlags[a.clearsFlag]  = false;
            flags[equipId] = eqFlags;
            this.equipmentFlagState[playerName] = flags;
        }

        // Cura
        if (a.heal) {
            this.adjustHp(playerName, a.heal, false, true);
            this.trackStat('rations_used');
        }

        // Ripristino segnalini concentrazione
        if (a.restoreConcentration && this.concentrationState[playerName]) {
            this.concentrationState[playerName] = this.concentrationState[playerName].map(() => true);
            this.concentrationState[playerName].forEach((_, i) => {
                const btn = document.getElementById(`conc-btn-${playerName}-${i}`);
                if (btn) { btn.classList.add('available'); btn.classList.remove('spent'); btn.disabled = false; }
            });
        }

        // Se l'azione è rumorosa (alertImmediate) e ci sono guardie nella zona, triggera alert
        // Eccezione: i missili fanno rumore all'impatto, non al lancio (gestito in _missileObstacle)
        if (a.alertImmediate && a.category !== 'missile' && !this.currentStage?.isBoss) {
            const zone = this.playerZoneState[playerName] ?? 0;
            if ((this.enemyState[zone] ?? 0) > 0) {
                this.triggerAlert();
                if (this.markerState[playerName]) {
                    this.markerState[playerName].alert = true;
                    this.markerState[playerName].inter = false;
                    ['alert', 'inter'].forEach(m => {
                        const btn = document.getElementById(`marker-${m}-${playerName}`);
                        if (btn) btn.classList.toggle('active', !!this.markerState[playerName][m]);
                    });
                }
            }
        }

        // Se è un attacco, mostra popup risultato (i missili gestiscono il popup in _missileHitEnemy)
        if (a.attack && a.category !== 'missile') {
            this.showAttackResultPopup(playerName, `eq-${equipId}`, a);
        }

        // Scatolone: NASCONDITI attiva il flag; tutte le altre azioni lo disattivano
        // (il reset per azioni della plancia è gestito in spendTokens tramite actionId)
        const BOX_IDS = ['010', '027'];
        const wasInBox = !!this.boxState[playerName];
        this.boxState[playerName] = BOX_IDS.includes(equipId);
        if (wasInBox !== !!this.boxState[playerName]) this._renderSoldierPhases();

        // Attiva/deattiva inline charge mode
        if (eq.inlineCharge) {
            this._inlineChargeActiveFor[playerName] = equipId;
            this._inlineChargeClicksLeft[playerName] = a.inlineChargeOnce ? 1 : null;
        } else if (this._inlineChargeActiveFor[playerName]) {
            this._inlineChargeActiveFor[playerName] = null;
            this._inlineChargeClicksLeft[playerName] = null;
        }

        // Segna azione oncePerTurn come usata per questo turno
        if (a.oncePerTurn) {
            if (!this.equipmentUsedThisTurn[playerName]) this.equipmentUsedThisTurn[playerName] = new Set();
            this.equipmentUsedThisTurn[playerName].add(equipId);
        }

        this._refreshEquipmentPanel(playerName);
    },

    _showMissilePopup(playerName) {
        if (this._missilePendingPlayer) return; // popup già aperto, ignora doppio trigger
        this._missilePendingPlayer = playerName;
        const text = document.getElementById('missile-popup-text');
        const btns = document.getElementById('missile-popup-buttons');
        if (text) text.innerHTML = 'Il missile incontra<br>un ostacolo?';
        if (btns) btns.innerHTML = `
            <button class="btn-codec enemy-phase-confirm-btn" onclick="App._missileObstacle(true)">
                <span class="btn-inner">✓ SÌ</span>
            </button>
            <button class="btn-codec enemy-phase-confirm-btn" onclick="App._missileObstacle(false)">
                <span class="btn-inner">✕ NO</span>
            </button>`;
        const popup = document.getElementById('missile-popup');
        if (popup) popup.style.display = 'flex';
    },

    _missileObstacle(hit) {
        const player = this._missilePendingPlayer;
        if (!player) return;
        if (!hit) {
            document.getElementById('missile-popup').style.display = 'none';
            this._missilePendingPlayer = null;
            this.missileState[player] = true;
            return;
        }
        // Ostacolo: esplode → alert → chiedi se colpisce qualcuno
        this.missileState[player] = false;
        const sfx = new Audio('audio/sfx/esplosione.wav');
        sfx.volume = App._sfxVol();
        sfx.play().catch(() => {});
        if (!this.currentStage?.isBoss) {
            const zone = this.playerZoneState[player] ?? 0;
            if ((this.enemyState[zone] ?? 0) > 0) {
                this.triggerAlert();
                // Imposta il marker ! sul giocatore (come fa selectAlertCause)
                if (this.markerState[player]) {
                    this.markerState[player].alert = true;
                    this.markerState[player].inter = false;
                    ['alert', 'inter'].forEach(m => {
                        const btn = document.getElementById(`marker-${m}-${player}`);
                        if (btn) btn.classList.toggle('active', !!this.markerState[player][m]);
                    });
                }
            }
        }
        const text = document.getElementById('missile-popup-text');
        const btns = document.getElementById('missile-popup-buttons');
        if (text) text.innerHTML = 'Il missile colpisce<br>qualcuno?';
        if (btns) btns.innerHTML = `
            <button class="btn-codec enemy-phase-confirm-btn" onclick="App._missileHitEnemy(true)">
                <span class="btn-inner">✓ SÌ</span>
            </button>
            <button class="btn-codec enemy-phase-confirm-btn" onclick="App._missileHitEnemy(false)">
                <span class="btn-inner">✕ NO</span>
            </button>`;
    },

    _missileHitEnemy(hit) {
        document.getElementById('missile-popup').style.display = 'none';
        const player = this._missilePendingPlayer;
        this._missilePendingPlayer = null;
        if (!player) return;
        if (hit) {
            const nikitaAction = EQUIPMENT['E06B']?.action;
            if (nikitaAction) this.showAttackResultPopup(player, 'eq-E06B', nikitaAction);
        }
    },

    _refreshEquipmentPanel(playerName) {
        const newHtml = this._buildEquipmentPanel(playerName);
        const el = document.getElementById(`eq-panel-${playerName}`);
        if (el) {
            if (newHtml) {
                const tmp = document.createElement('div');
                tmp.innerHTML = newHtml.trim();
                el.replaceWith(tmp.firstElementChild);
            }
        } else if (newHtml) {
            // Panel non ancora nel DOM (giocatore partito senza equip): inietta nel container
            const col = document.getElementById(`eq-col-${playerName}`);
            if (col) {
                col.innerHTML = newHtml;
                col.style.display = '';
            }
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
            ? stage.variableActions[playerName].map(item =>
                typeof item === 'string' ? (ch.defaultVariableActions || []).find(a => a.id === item) : item
              ).filter(Boolean)
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
                <span class="conc-token-label">${t.label
                    .replace(/\[dice\]/g, '<span class="die-chip die-white"></span>')
                    .replace(/\[dado bianco\]/g, '<span class="die-chip die-white"></span>')
                    .replace(/\[dado nero\]/g, '<span class="die-chip die-black"></span>')
                }</span>
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
                                `<span class="die-chip ${d.color === 'white' ? 'die-white' : 'die-black'}"></span>`
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

    // Mostra nel pannello del giocatore attivo le abilità "otherTurn" degli altri personaggi (esclusa Meryl)
    _sharedConcOpen: {},

    _buildOtherSharedAbilitiesHtml(activePlayer) {
        let html = '';
        for (const pName of this.stagePlayers) {
            if (pName === activePlayer || pName === 'Meryl') continue;
            const ch = CHARACTERS[pName];
            if (!ch?.abilities) continue;
            const shared = ch.abilities.filter(a => a.otherTurn);
            if (!shared.length) continue;
            const usedMap = this.abilityUsedState[pName] || {};
            const btns = shared.map(a => {
                const isUsed = !!usedMap[a.id];
                const cls   = isUsed ? 'used' : 'available';
                const label = isUsed ? 'usata' : '1×/round';
                const payload = { ...a, isAbility: true };
                const isOpen = a.showsConcTokens && !!this._sharedConcOpen[pName];
                const onclick = a.showsConcTokens
                    ? `App.toggleSharedConcSelection('${pName}')`
                    : `App.toggleAbility('${pName}','${a.id}')`;
                return `<button class="panel-btn panel-ability ${cls}${isOpen ? ' active' : ''}"
                    id="ability-btn-shared-${pName}-${a.id}"
                    onmouseenter="App.showTooltip(event,'${this._enc(payload)}')"
                    onmouseleave="App.hideActionTooltip()"
                    onclick="${onclick}">
                    <span class="panel-btn-name">${a.name}</span>
                    <span class="panel-btn-cost panel-ability-tag">${label}</span>
                </button>`;
            }).join('');

            // Token concentrazione espandibili per abilità con showsConcTokens
            let tokensHtml = '';
            const concAbility = shared.find(a => a.showsConcTokens);
            if (concAbility && this._sharedConcOpen[pName]) {
                const tokens = this.concentrationState[pName] || [];
                const concTokens = ch.concentrationTokens || [];
                tokensHtml = `<div class="meryl-conc-selection">` +
                    concTokens.map((t, i) => {
                        const avail = tokens[i] !== false;
                        if (!avail) return '';
                        const diceHtml = t.dice
                            ? t.label.replace(/\[.*?\]/, t.dice.flatMap(d =>
                                Array.from({length: d.count}, () =>
                                    `<span class="die-chip ${d.color === 'white' ? 'die-white' : 'die-black'}"></span>`
                                )).join(''))
                            : t.label;
                        const tPayload = { ...t, isConcToken: true };
                        return `<button class="panel-conc-token available"
                            onmouseenter="App.showTooltip(event,'${this._enc(tPayload)}')"
                            onmouseleave="App.hideActionTooltip()"
                            onclick="App.useSharedConcToken('${pName}',${i})">
                            <span class="conc-token-label">${diceHtml}</span>
                            <span class="conc-token-cost">${t.cost}●</span>
                        </button>`;
                    }).join('') +
                    `</div>`;
            }

            html += `<div class="meryl-shared-ability-row" id="shared-ability-row-${pName}">
                <span class="meryl-shared-label">${pName.toUpperCase()}</span>
                <div class="meryl-shared-ability-col">${btns}${tokensHtml}</div>
            </div>`;
        }
        return html;
    },

    confirmKetchup() {
        document.getElementById('ketchup-popup').style.display = 'none';
        const player = this._ketchupPendingPlayer;
        const pendingEvent = this._ketchupPendingEvent;
        this._ketchupPendingPlayer = null;
        this._ketchupPendingEvent = null;
        if (player) {
            this.ketchupState[player] = false;
            this.ketchupUsed = true;
            const sfx = new Audio('audio/sfx/ketchup.wav');
            sfx.volume = App._sfxVol();
            sfx.addEventListener('ended', () => {
                if (pendingEvent) this.playEvent(pendingEvent);
            }, { once: true });
            sfx.play().catch(() => {
                if (pendingEvent) this.playEvent(pendingEvent);
            });
            this.buildPlayerSidebar(this.currentStage);
        } else {
            if (pendingEvent) this.playEvent(pendingEvent);
        }
    },

    cancelKetchup() {
        document.getElementById('ketchup-popup').style.display = 'none';
        const pendingEvent = this._ketchupPendingEvent;
        this._ketchupPendingPlayer = null;
        this._ketchupPendingEvent = null;
        if (pendingEvent) this.playEvent(pendingEvent);
    },

    toggleSharedConcSelection(playerName) {
        this._sharedConcOpen[playerName] = !this._sharedConcOpen[playerName];
        this._refreshSharedAbilityRow(playerName);
    },

    _refreshSharedAbilityRow(playerName) {
        const row = document.getElementById(`shared-ability-row-${playerName}`);
        if (!row) return;
        const activePlayer = this.stagePlayers[this.currentPlayerIndex];
        const tmp = document.createElement('div');
        tmp.innerHTML = this._buildOtherSharedAbilitiesHtml(activePlayer);
        const target = tmp.querySelector(`#shared-ability-row-${playerName}`);
        if (target) row.outerHTML = target.outerHTML;
    },

    useSharedConcToken(playerName, index) {
        if (!this.concentrationState[playerName]) return;
        const ch = CHARACTERS[playerName];
        const token = ch?.concentrationTokens?.[index];
        this.concentrationState[playerName][index] = false;
        this._sharedConcOpen[playerName] = false;
        if (token?.grantsAction) {
            const spentIdx = this.playerTokenState.indexOf(false);
            if (spentIdx !== -1) this.playerTokenState[spentIdx] = true;
            else this.playerTokenState.push(true);
            const dots = document.getElementById('token-dots');
            if (dots) dots.innerHTML = this._buildTokenHtml();
        }
        const activePlayer = this.stagePlayers[this.currentPlayerIndex];
        this._refreshSharedAbilityRow(playerName);
        this._updatePlanciaButtonStates(activePlayer);
        this._refreshEquipmentPanel(activePlayer);
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

        const activePlayer = this.stagePlayers[this.currentPlayerIndex];
        const row = document.getElementById('meryl-shared-ability-row');
        if (row) row.outerHTML = this._buildMerylSharedAbilityHtml(activePlayer);
        this._updatePlanciaButtonStates(activePlayer);
        this._refreshEquipmentPanel(activePlayer);
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
                + (a.noise ? `<span class="tooltip-tag tooltip-noise">🔊 Rumore</span>` : '')
                + (a.weaponName ? `<span class="tooltip-tag">${a.weaponName}</span>` : '');
        }

        tooltip.innerHTML = `
            <div class="tooltip-name">${a.name}</div>
            <div class="tooltip-meta">${metaHtml}</div>
            <div class="tooltip-desc">${a.desc}</div>
            ${diceHtml}
            ${a.passiveDesc ? `<div class="tooltip-passive" style="margin-top:8px;padding-top:6px;border-top:1px solid #333"><b>PASSIVA:</b> ${a.passiveDesc}</div>` : ''}`;

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
        const wasAvail = this.concentrationState[playerName][i];
        this.concentrationState[playerName][i] = !wasAvail;
        const btn = document.getElementById(`conc-btn-${playerName}-${i}`);
        if (btn) {
            const avail = this.concentrationState[playerName][i];
            btn.classList.toggle('available',  avail);
            btn.classList.toggle('spent',     !avail);
        }
        // Effetti speciali al momento della spesa (available → spent)
        const ch2   = CHARACTERS[playerName];
        const token = ch2?.concentrationTokens?.[i];
        if (token?.grantsAction) {
            const delta = wasAvail ? token.grantsAction : -token.grantsAction; // undo se ri-cliccato
            for (let d = 0; d < Math.abs(delta); d++) {
                if (delta > 0) {
                    const idx = this.playerTokenState.findIndex(t => !t);
                    if (idx !== -1) this.playerTokenState[idx] = true;
                } else {
                    const idx = this.playerTokenState.findLastIndex(t => t);
                    if (idx !== -1) this.playerTokenState[idx] = false;
                }
            }
            const el = document.getElementById('token-dots');
            if (el) el.innerHTML = this._buildTokenHtml();
            this._refreshEquipmentPanel(playerName);
        }
        this._updatePlanciaButtonStates(playerName);
    },

    toggleAbility(playerName, abilityId) {
        if (!this.abilityUsedState[playerName]) return;
        const wasUsed = this.abilityUsedState[playerName][abilityId];
        this.abilityUsedState[playerName][abilityId] = !wasUsed;
        for (const id of [
            `ability-btn-${playerName}-${abilityId}`,
            `ability-btn-shared-${playerName}-${abilityId}`,
        ]) {
            const btn = document.getElementById(id);
            if (!btn) continue;
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
        audio.volume = App._sfxVol();
        audio.play().catch(() => {});
    },

    _playSoundSequence(files) {
        if (!files || files.length === 0) return;
        const [first, ...rest] = files;
        if (rest.length === 0) {
            this._playActionSound(first);
        } else {
            this._playSfxOnce(first, () => this._playSoundSequence(rest));
        }
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
        sfx.volume = App._sfxVol();
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
                eh.volume = App._sfxVol();
                eh.play().catch(() => {});
                eh.addEventListener('ended', () => {
                    setTimeout(() => this._playActionSound('audio/azioni/guardie/soldato-cosa-e-stato.wav'), 500);
                }, { once: true });
            }
        }, { once: true });
    },

    // Restituisce le azioni variabili per la plancia.
    // Se variableActions è [] e ci sono bossTurnSections, inietta quelle nelle posizioni variable.
    _resolvePlanciaVarActions(playerName, stage) {
        const ch = CHARACTERS[playerName];
        const stageVarOverride = stage?.variableActions?.[playerName];
        if (stageVarOverride === null) return [];
        if (stageVarOverride !== undefined && stageVarOverride.length === 0 && stage?.bossTurnSections?.length) {
            const varHotspots = (ch.hotspots || []).filter(h => h.type === 'variable');
            const result = [];
            let idx = 0;
            for (const sec of stage.bossTurnSections) {
                for (let ai = 0; ai < sec.actions.length; ai++) {
                    const slotIdx = sec.slots ? sec.slots[ai] : idx++;
                    if (slotIdx == null || slotIdx >= varHotspots.length) continue;
                    result.push({
                        ...sec.actions[ai],
                        _hotspotRef: varHotspots[slotIdx].ref,
                        _bossSectionId: sec.id,
                        _bossSectionActionIndex: ai,
                        _bossSectionCharges: sec.charges,
                        _atype: 'action',
                    });
                }
            }
            return result;
        }
        if (stageVarOverride !== undefined) {
            return stageVarOverride.map(item =>
                typeof item === 'string' ? (ch.defaultVariableActions || []).find(a => a.id === item) : item
            ).filter(Boolean);
        }
        return ch.defaultVariableActions || [];
    },

    _buildPlanciaOverlay(playerName, stage) {
        const ch = CHARACTERS[playerName];
        if (!ch || !ch.hotspots) return null;

        const actionMap = {};
        const varActionsToUse = this._resolvePlanciaVarActions(playerName, stage);
        (ch.fixedActions || []).forEach(a => { actionMap[a.id] = { ...a, _atype: 'action'  }; });
        varActionsToUse.forEach(a => {
            const key = a._hotspotRef || a.id;
            actionMap[key] = { ...a, _atype: 'action' };
        });
        (ch.abilities  || []).forEach(a => { actionMap[a.id] = { ...a, _atype: 'ability' }; });

        const usedMap  = this.abilityUsedState[playerName] || {};
        const available = this.playerTokenState.filter(t => t).length;
        const stageDisabled = new Set(stage?.disabledActions || []);

        const buildRow = (h) => {
            const a = actionMap[h.ref];
            if (!a) return '';

            const isAbility  = a._atype === 'ability';
            const isUsed     = isAbility && !!usedMap[a.id];
            const _stageOverrides = this.currentStage?.actionSoundOverrides;
            const _overrideExclude = this.currentStage?.actionSoundOverridesExclude || [];
            const _effectiveSound = (_stageOverrides && !_overrideExclude.includes(playerName) && _stageOverrides[a.id]) ? _stageOverrides[a.id] : a.sound;
            const soundCall  = a.id === 'bussata'
                ? `App._onBussataAction('${playerName}');`
                : (a.sounds ? `App._playSoundSequence(${JSON.stringify(a.sounds)});` : (_effectiveSound ? `App._playActionSound('${_effectiveSound}');` : ''));
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
            } else if (a._bossSectionId !== undefined) {
                const remaining = this.bossSectionChargeState[playerName]?.[a._bossSectionId] ?? a._bossSectionCharges;
                isDisabled = (a.usesCharge && remaining <= 0) || (typeof a.cost === 'number' && a.cost > available);
            } else if (typeof a.cost === 'number') {
                isDisabled = a.cost > available;
            } else if (a.cost === 'X') {
                // Concentrazione: abilitata solo se c'è almeno un token speso che si può permettere
                const concState = this.concentrationState[playerName] || [];
                const tokens = ch.concentrationTokens || [];
                isDisabled = !tokens.some((t, i) => concState[i] === false && t.cost <= available);
            }

            // Boss section action: onclick specifico, ignora i call standard
            if (a._bossSectionId !== undefined) {
                const spendBoss = (typeof a.cost === 'number' && a.cost > 0)
                    ? `App.spendTokens(${a.cost},'${playerName}');` : '';
                const circleCls2 = ['plancia-circle-btn'].filter(Boolean).join(' ');
                const costLabel2 = a.costLabel ?? (a.cost !== undefined ? String(a.cost) : '');
                const diceHtml2  = this._buildDiceHtml(a.dice);
                const enc2 = this._enc(a);
                let chargesDotsHtml = '';
                if (a.usesCharge && a._bossSectionCharges != null) {
                    const remaining = this.bossSectionChargeState[playerName]?.[a._bossSectionId] ?? a._bossSectionCharges;
                    chargesDotsHtml = `<span class="hotspot-charges">${
                        Array.from({ length: a._bossSectionCharges }, (_, i) =>
                            `<span class="eq-charge-dot ${i < remaining ? 'full' : 'empty'}"></span>`
                        ).join('')
                    }</span>`;
                }
                const descHtml = a.desc ? `<span class="hotspot-action-desc">${a.desc}</span>` : '';
                return `<div class="plancia-action-row plancia-action-row--with-desc${isDisabled ? ' action-disabled' : ''}">
                    <button class="${circleCls2}"
                        id="hotspot-${playerName}-${h.ref}"
                        ${isDisabled ? 'disabled' : ''}
                        onclick="${spendBoss}App.useBossSectionAction('${a._bossSectionId}',${a._bossSectionActionIndex});App._pulseHotspot(this);event.stopPropagation()">
                        <span class="hotspot-cost">${costLabel2}</span>
                    </button>
                    <div class="hotspot-label-group">
                        <div class="hotspot-label-line">
                            <span class="hotspot-label">${a.name}</span>
                            ${chargesDotsHtml}
                            ${diceHtml2}
                        </div>
                        ${descHtml}
                    </div>
                </div>`;
            }

            const spendCall = (typeof a.cost === 'number' && a.cost > 0)
                ? `App.spendTokens(${a.cost},'${playerName}','${a.id}');`
                : '';
            const noiseCall = a.noise
                ? `App._trackNoise('${playerName}');`
                : '';
            const attackCall = a.attack
                ? `App.showAttackResultPopup('${playerName}',null,JSON.parse(decodeURIComponent('${this._enc(a)}')));`
                : '';
            const miraAttackCall = a.miraAttackPopup
                ? `App.showMiraAttackPopup();`
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
                    onclick="${spendCall}${soundCall}${miraAttackCall}${noiseCall}${attackCall}${autoKillCall}${toggleCall}${concModeCall}App._pulseHotspot(this);event.stopPropagation()">
                    <span class="circle-cost">${costLabel}</span>
                </button>
                <div class="plancia-action-text">
                    <div class="plancia-action-name">${a.name}${noiseHtml}</div>
                    ${a.weaponName ? `<div class="plancia-action-weapon">${a.weaponName}</div>` : ''}
                    <div class="plancia-action-desc">${a.desc}</div>
                    ${a.passiveDesc ? `<div class="plancia-action-passive"><b>PASSIVA:</b> ${a.passiveDesc}</div>` : ''}
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

            const hasBossSectionsInPlancia = !!(stage?.bossTurnSections?.length && stage?.variableActions);
            const bossSectionsHtml = hasBossSectionsInPlancia ? '' : this._buildPlayerBossSectionsHtml(stage, activePlayer);

            if (planciaHtml) {
                // Layout con bottoni cerchio + segnalini concentrazione separati
                const concHtml = this._buildPanelConc(activePlayer);
                content.innerHTML = headerHtml
                    + `<div class="plancia-with-eq">
                        ${planciaHtml}
                        <div class="plancia-eq-col" id="eq-col-${activePlayer}" style="${eqHtml ? '' : 'display:none'}">${eqHtml}</div>
                    </div>`
                    + `<div class="plancia-conc-row">
                        <div class="turn-panel-col-header">SEGNALINI CONCENTRAZIONE</div>
                        <div class="plancia-conc-body">${concHtml}</div>
                       </div>`
                    + bossSectionsHtml;
                this._updatePlanciaButtonStates(activePlayer);
                const merylSharedHtml = this._buildMerylSharedAbilityHtml(activePlayer);
                if (merylSharedHtml) content.innerHTML += merylSharedHtml;
                const otherSharedHtml = this._buildOtherSharedAbilitiesHtml(activePlayer);
                if (otherSharedHtml) content.innerHTML += otherSharedHtml;
            } else {
                // Layout a colonne (personaggi senza plancia)
                const merylSharedHtml = this._buildMerylSharedAbilityHtml(activePlayer);
                const eqColHtml = `<div class="turn-panel-col turn-panel-eq-col" id="eq-col-${activePlayer}" style="${eqHtml ? '' : 'display:none'}">${eqHtml}</div>`;
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
                ${bossSectionsHtml}
                ${merylSharedHtml}
                ${this._buildOtherSharedAbilitiesHtml(activePlayer)}`;
            }
            this._clearEquipmentSidebar();
        } else {
            this._clearEquipmentSidebar();
            // Modalità ibrida Sniper Wolf con Otacon
            if (stage?.otaconHybrid && this.stagePlayers.includes('Otacon')) {
                const subPhase = this.otaconEnemySubPhase || 'select';
                let enemyLabel, headerCtrlHtml, phasesHtml;
                if (subPhase === 'sniper-wolf') {
                    enemyLabel    = 'TURNO SNIPER WOLF';
                    headerCtrlHtml = `<button class="btn-sound btn-alert turn-end-btn" onclick="App.endOtaconEnemyTurn()">FINE TURNO SNIPER WOLF</button>`;
                    phasesHtml    = this._buildBossTurnHtml(stage);
                } else if (subPhase === 'guards') {
                    enemyLabel    = 'FASE DELLE GUARDIE';
                    headerCtrlHtml = `<button class="btn-sound btn-alert turn-end-btn" onclick="App.endOtaconEnemyTurn()">FINE TURNO GUARDIE</button>`;
                    phasesHtml    = `<div id="soldier-phases">${this._buildSoldierPhaseHtml(stage)}</div>`;
                } else {
                    enemyLabel    = 'FASE DEI NEMICI';
                    headerCtrlHtml = '';
                    phasesHtml    = this._buildOtaconHybridEnemyHtml(stage);
                }
                content.innerHTML = `
                    <div class="turn-header">
                        <div class="turn-phase-badge turn-phase-soldiers">
                            ${enemyLabel} <span class="turn-round-label">Round ${this.turnRound}</span>
                        </div>
                        ${headerCtrlHtml ? `<div class="turn-header-controls">${headerCtrlHtml}</div>` : ''}
                    </div>
                    ${phasesHtml}`;
                this._updateEventButtonsForTurn();
                return;
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
        this._updateEventButtonsForTurn();
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
        // Cambia musica senza elevator se il nuovo giocatore è in una zona diversa (solo campagna)
        if (!this.vrMode) {
            const zone = this.playerZoneState[name] ?? 0;
            this._playMusicForZone(zone, false);
        }
        this._renderTurnSection();
    },

    // Conferma la selezione radio → mostra plancia
    confirmTurnPlayer() {
        if (!this.selectedPlayerForTurn || this.playersDoneTurn.includes(this.selectedPlayerForTurn)) return;
        this.playerSubPhase = 'active';
        this.playerTokenState = [true, true, true, true];
        delete this.equipmentUsedThisTurn[this.selectedPlayerForTurn];
        delete this._inlineChargeActiveFor[this.selectedPlayerForTurn];
        delete this._inlineChargeClicksLeft[this.selectedPlayerForTurn];
        this._renderTurnSection();
    },

    // Fine turno del personaggio attivo
    finishPlayerTurn() {
        const player = this.stagePlayers.length > 1
            ? this.selectedPlayerForTurn
            : this.stagePlayers[0];

        // Se il giocatore ha fatto azioni rumorose, mostra prima il promemoria dadi
        let noiseCount = this._noiseCountThisTurn[player] || 0;
        if (noiseCount > 0) {
            // Aggiungi bonus dadi da eventi per giocatore (es. ostaggi salvati)
            if (this.perPlayerEventCount) {
                (this.currentStage?.events || []).filter(e => e.perPlayerCount && e.noiseDiceBonus).forEach(ev => {
                    noiseCount += this.perPlayerEventCount[ev.id]?.[player] || 0;
                });
            }
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
        if (this.currentStage?.isBoss) return;
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
        this._inCameraSight = false;
        // Init stato selezione nemici per modalità ibrida Sniper Wolf / Otacon
        if (this.currentStage?.otaconHybrid && this.stagePlayers.includes('Otacon')) {
            this.otaconEnemySubPhase = 'select';
            this.otaconEnemyDone = new Set();
        }
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
        if (stage.otaconHybrid && this.stagePlayers.includes('Otacon')) {
            // Fase giocatori: è boss solo per i non-Otacon; fase nemici: trattato come sneaking
            if (this.turnPhase === 'players') {
                const active = (this.stagePlayers.length > 1 ? this.selectedPlayerForTurn : this.stagePlayers[0]) ?? this.stagePlayers[0];
                return active !== 'Otacon';
            }
            return false; // fase nemici → gestita separatamente, non è boss puro
        }
        return true;
    },

    _resolveOrderCards(stage) {
        if (stage?.otaconHybrid && this.stagePlayers.includes('Otacon')) {
            return stage.orderCardsWithOtacon ?? null;
        }
        const oc = stage?.orderCards;
        if (oc == null) return null;
        if (typeof oc === 'object') {
            const n = this.stagePlayers.length;
            return oc[n] ?? oc[Object.keys(oc).sort((a, b) => b - a).find(k => k <= n)] ?? null;
        }
        return oc;
    },

    // ============================================
    // FASE NEMICI — IBRIDA SNIPER WOLF (Otacon)
    // ============================================

    // Schermata di selezione: Sniper Wolf o Guardie
    _buildOtaconHybridEnemyHtml(stage) {
        const done = this.otaconEnemyDone || new Set();
        const options = [
            { id: 'sniper-wolf', label: 'SNIPER WOLF', color: 'var(--codec-red)' },
            { id: 'guards',      label: 'GUARDIE',     color: 'var(--codec-green)' },
        ];
        const itemsHtml = options.map(o => {
            const isDone = done.has(o.id);
            return `<label class="player-radio-item${isDone ? ' done' : ''}"
                        onclick="${isDone ? '' : `App.selectOtaconEnemy('${o.id}')`}"
                        style="cursor:${isDone ? 'default' : 'pointer'}">
                <span class="player-radio-dot${isDone ? '' : ' sel'}" style="${isDone ? '' : `color:${o.color}`}">◆</span>
                <span class="player-radio-name" style="${isDone ? '' : `color:${o.color}`}">${o.label}</span>
                ${isDone ? '<span class="player-done-badge">✓ FATTO</span>' : ''}
            </label>`;
        }).join('');
        return `<div class="player-select-phase">
            <div class="player-select-label">SCEGLI NEMICO</div>
            <div class="player-radio-list">${itemsHtml}</div>
            <button class="btn-codec player-confirm-btn" onclick="App.endSoldiersTurn()">
                <span class="btn-inner">▶ FINE FASE NEMICI</span>
            </button>
        </div>`;
    },

    // Selezione Sniper Wolf o Guardie
    selectOtaconEnemy(type) {
        if ((this.otaconEnemyDone || new Set()).has(type)) return;
        this.otaconEnemySubPhase = type;
        this._renderTurnSection();
    },

    // Fine turno di un nemico → torna alla selezione
    endOtaconEnemyTurn() {
        if (!this.otaconEnemyDone) this.otaconEnemyDone = new Set();
        const wasGuards = this.otaconEnemySubPhase === 'guards';
        this.otaconEnemyDone.add(this.otaconEnemySubPhase);
        if (wasGuards) {
            // Auto-evasione: stesso comportamento di endSoldiersTurn per le guardie
            if (this.alertState === 'alert' && !this._guardsAttackedThisTurn && !this._inCameraSight) {
                this.triggerEvasion();
            }
            this.soldierGuardCard   = null;
            this.soldierCameraCard  = null;
            this.soldierGuardAction = null;
            this._guardsAttackedThisTurn = false;
        }
        this.otaconEnemySubPhase = 'select';
        this._renderTurnSection();
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
        // Reset eventi con resetEachTurn
        (this.currentStage?.events || []).filter(e => e.resetEachTurn).forEach(e => {
            this.eventClickedState[e.id] = false;
            const btn = document.getElementById(`btn-event-${e.id}`);
            if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
        });
        // In VR: se si supera la soglia, avvisa con "tempo-poco" x2
        if (this.vrMode) {
            const soglia = this._vrFakeStage?.roundSoglia ?? null;
            if (soglia != null && this.turnRound > soglia) {
                const cfg = CONFIG.vrSounds['tempo-poco'];
                if (cfg) {
                    const vol = this._sfxVol();
                    const a1 = new Audio(cfg.file);
                    a1.volume = vol;
                    a1.onended = () => {
                        const a2 = new Audio(cfg.file);
                        a2.volume = vol;
                        a2.play().catch(() => {});
                    };
                    a1.play().catch(() => {});
                }
            }
        }
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
        this.equipmentUsedThisTurn = {};
        this._inlineChargeActiveFor = {};
        this._inlineChargeClicksLeft = {};
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
            const sel = this.soldierGuardCard === c.id;
            return `<button class="soldier-card${sel ? ' selected' : ''}"
                onclick="App.selectGuardCard('${c.id}')">${c.label}</button>`;
        }).join('');

        // Fase 2 — telecamere
        const cameraCardsHtml = this.CAMERA_CARDS.map(c => {
            const sel = this.soldierCameraCard === c.id;
            return `<button class="soldier-card${sel ? ' selected' : ''}"
                onclick="App.selectCameraCard('${c.id}')">${c.label}</button>`;
        }).join('');

        // Fase 3 — attivare guardie (singola riga per tutte)
        const anyInBox = Object.values(this.boxState).some(Boolean);
        let guardsHtml = '';
        if (totalGuards > 0) {
            const actionsHtml = this.GUARD_ACTIONS.map(a => {
                if (a.alertOnly && !inAlert) return '';
                if (a.boxOnly && !anyInBox) return '';
                const isSel = this.soldierGuardAction === a.id;
                const extra = a.id === 'attacca' ? ' guard-attacca' : '';
                return `<button class="guard-action-btn${isSel ? ' sel' : ''}${extra}"
                    onclick="App.setGuardAction('${a.id}')">${a.label}</button>`;
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
        const gameOverBtn = hasGameOver
            ? `<div class="soldier-game-over-col">
                <button class="btn-game-over btn-video" id="btn-game-over"
                    onclick="App.showGameOverConfirm()">GAME<br>OVER</button>
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
        const changed = this.soldierGuardCard !== id;
        this.soldierGuardCard = id;
        const c = this.GUARD_CARDS.find(c => c.id === id);
        if (c?.sound) this._playActionSound(c.sound);
        if (id === 'radio') this._radioRestoreGuards();
        if (changed) this._renderSoldierPhases();
    },

    selectCameraCard(id) {
        const changed = this.soldierCameraCard !== id;
        this.soldierCameraCard = id;
        const c = this.CAMERA_CARDS.find(c => c.id === id);
        if (c?.sound) this._playActionSound(c.sound);
        if (id === 'cambiano') {
            this._inCameraSight = false;
            this._flipCameraIndicator();
        }
        if (changed) this._renderSoldierPhases();
    },

    _buildCameraIndicatorHtml(stage) {
        if (!this._stageHasCameras(stage)) return '';
        this._cameraFlipped = false;
        const isOrange = (stage.cameraStartColor ?? 'green') === 'orange';
        const colorA = isOrange ? '#c46000' : '#1a7a3a';
        const colorB = isOrange ? '#1a7a3a' : '#c46000';
        const faceStyle = (bg) => `background:${bg}; outline: 2px solid #000; border-radius: 5px;`;
        const icon = `<img src="img/telecamera.png" width="40" height="40" style="display:block">`;
        return `<div class="camera-indicator-wrap">
            <div class="camera-indicator" id="camera-indicator">
                <div class="camera-indicator-face camera-face-front" style="${faceStyle(colorA)}">${icon}</div>
                <div class="camera-indicator-face camera-face-back"  style="${faceStyle(colorB)}">${icon}</div>
            </div>
        </div>`;
    },

    _flipCameraIndicator() {
        this._cameraFlipped = !this._cameraFlipped;
        const el = document.getElementById('camera-indicator');
        if (el) el.classList.toggle('is-flipped', this._cameraFlipped);
    },

    setGuardAction(action) {
        const changed = this.soldierGuardAction !== action;
        this.soldierGuardAction = action;
        const a = this.GUARD_ACTIONS.find(a => a.id === action);
        if (a?.sound) this._playActionSound(a.sound);
        if (action === 'attacca') this._guardsAttackedThisTurn = true;
        if (changed) this._renderSoldierPhases();
    },

    // ============================================
    // PLAYER SIDEBAR
    // ============================================
    buildPlayerSidebar(stage) {
        if (this.vrMode) return; // VR sidebar is managed separately by _doLaunchVrStage
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
        this.bossHpState           = this.bossHpState    || {};
        this.bossMaxHpState        = this.bossMaxHpState || {};
        this._bossCardFollowUpUsed  = {};
        // Cancella HP precedenti per i nemici di questo stage (evita stale state da run precedenti)
        (stage.bossEnemies || []).forEach(e => { delete this.bossHpState[e.id]; });
        this._bossSpecialBtnUsed    = {};
        this._bossCounterFirstUsed  = {};
        this._bossFirstHitUsed      = {};
        this._ocelotZeroStreak     = 0;
        this.mantisDefenseStep = 0;
        this.mantisDefenseSolved = false;
        const bossEnemies = stage.bossEnemies || [];
        const playerCount = (stage.otaconHybrid && players.includes('Otacon'))
            ? players.filter(p => p !== 'Otacon').length
            : players.length;
        bossEnemies.forEach(e => {
            const hp = e.hpByPlayerCount
                ? (e.hpByPlayerCount[playerCount] ?? e.hpByPlayerCount[1] ?? e.hp ?? 10)
                : (e.hp ?? 10);
            this.bossMaxHpState[e.id] = hp;
            if (this.bossHpState[e.id] === undefined) {
                this.bossHpState[e.id] = hp;
            }
        });

        const statsHtml = this._buildSessionStatsHtml();
        const bossHtml  = bossEnemies.map(e => this._buildBossEnemyCard(e)).join('');
        const flipCardsHtml = bossEnemies
            .filter(e => e.flipCard && e.image)
            .map(e => `<div class="boss-flip-card boss-flip-card-sidebar" id="flip-card-${e.id}"
                    onclick="App.flipBossCard('${e.id}')">
                <div class="boss-flip-inner">
                    <div class="boss-flip-front"><span class="boss-flip-question">?</span></div>
                    <div class="boss-flip-back"><img src="${e.image}" alt="${e.name}"></div>
                </div>
            </div>`).join('');
        const cameraHtml = this._buildCameraIndicatorHtml(stage);
        sidebar.innerHTML = statsHtml + bossHtml + players.map(p => this._buildPlayerCard(p)).join('') + flipCardsHtml + cameraHtml;
        sidebar.style.display = 'flex';
    },

    _buildSessionStatsHtml() {
        if (!this.showSessionStats) return '';
        const s = this.session;
        if (!s) return '';
        return `<div class="session-stats-block">
            <div class="session-stats-body">
                <div class="session-stat"><span class="stat-label">Play Time</span><span class="stat-val">${s.rounds}</span></div>
                <div class="session-stat"><span class="stat-label">Save</span><span class="stat-val">${s.saves}</span></div>
                <div class="session-stat"><span class="stat-label">Continue</span><span class="stat-val">${s.continues}</span></div>
                <div class="session-stat"><span class="stat-label">Being Found</span><span class="stat-val">${s.alerts}</span></div>
                <div class="session-stat"><span class="stat-label">Enemies</span><span class="stat-val">${s.kills + s.kills_silent}</span></div>
                <div class="session-stat"><span class="stat-label">Rations</span><span class="stat-val">${s.rations_used}</span></div>
            </div>
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
        // In modalità otaconHybrid i segnalini ! e ? appaiono solo per Otacon
        const showMarkers = !isBoss || (stage?.otaconHybrid && this.stagePlayers.includes('Otacon') && playerName === 'Otacon');
        const multiZone = !isBoss && stage && stage.enemies && stage.enemies.length > 1;
        const anyAlert = this.stagePlayers?.some(p => this.markerState[p]?.alert);
        const zoneBlocked = (stage?.blockZoneChangeUntilEvent && !this.eventClickedState[stage.blockZoneChangeUntilEvent])
            || (stage?.blockZoneChangeInAlert && anyAlert);
        const zoneAdjacency = stage?.zoneAdjacency;
        const zoneHtml = multiZone ? `
            <select class="zone-select" onchange="App.setPlayerZone('${playerName}', this.value)"
                ${zoneBlocked ? 'disabled style="opacity:0.35"' : ''}>
                ${stage.enemies.map((_, i) => {
                    const label = (stage.musicLabels && stage.musicLabels[i])
                        ? stage.musicLabels[i].toUpperCase() : `ZONA ${i + 1}`;
                    const notAdjacent = zoneAdjacency && i !== currentZone && !zoneAdjacency[currentZone]?.includes(i);
                    return `<option value="${i}"${i === currentZone ? ' selected' : ''}${notAdjacent ? ' disabled' : ''}>${label}</option>`;
                }).join('')}
            </select>` : '';
        return `<div class="player-card">
            <div class="player-card-name" style="color:${color}">${(CHARACTERS[playerName]?.displayName || playerName).toUpperCase()}</div>
            <div class="hp-tracker">
                <button class="hp-btn" onclick="App.adjustHp('${playerName}',-1)">−</button>
                <span class="hp-value" id="hp-${playerName}">${hp}</span>
                <button class="hp-btn" onclick="App.adjustHp('${playerName}',+1)">+</button>
            </div>
            ${showMarkers ? `<div class="player-markers">
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
            ${this._buildManualChargeHtml(playerName)}
            ${this.ketchupState?.[playerName] ? `<button class="ketchup-badge ketchup-badge-disabled" disabled>A</button>` : ''}
            ${this._buildPerPlayerEventBadges(playerName)}
        </div>`;
    },

    _buildPerPlayerEventBadges(playerName) {
        const events = (this.currentStage?.events || []).filter(e => e.perPlayerCount);
        if (!events.length) return '';
        return events.map(ev => {
            const count = this.perPlayerEventCount?.[ev.id]?.[playerName] || 0;
            if (!count) return '';
            const label = ev.perPlayerLabel || ev.label || ev.id;
            return `<div class="per-player-event-badge" id="per-player-${ev.id}-${playerName}">${label}: ${count}</div>`;
        }).join('');
    },

    _refreshPerPlayerEventBadge(playerName) {
        const events = (this.currentStage?.events || []).filter(e => e.perPlayerCount);
        events.forEach(ev => {
            const count = this.perPlayerEventCount?.[ev.id]?.[playerName] || 0;
            const el = document.getElementById(`per-player-${ev.id}-${playerName}`);
            if (el) {
                el.textContent = `${ev.perPlayerLabel || ev.label || ev.id}: ${count}`;
            } else if (count > 0) {
                // Prima volta: ricostruisce la card
                const card = document.getElementById(`player-card-${playerName}`);
                if (!card) this._rebuildPlayerCard(playerName);
            }
        });
    },

    _rebuildPlayerCard(playerName) {
        const sidebar = document.getElementById('player-sidebar');
        if (!sidebar) return;
        const displayName = (CHARACTERS[playerName]?.displayName || playerName).toUpperCase();
        const cardEl = [...sidebar.querySelectorAll('.player-card')].find(c => c.querySelector('.player-card-name')?.textContent === displayName);
        if (cardEl) cardEl.outerHTML = this._buildPlayerCard(playerName);
    },

    _buildBossEnemyCard(enemy) {
        const hp = this.bossHpState[enemy.id] ?? 0;
        const defenseVal = (enemy.id === 'mantis' && this.mantisDefenseSolved) ? 4 : enemy.defense;
        const defenseHtml = defenseVal != null
            ? (enemy.defensePopup
                ? `<button class="boss-defense boss-defense-btn" onclick="App.openMantisDefensePopup()"${this.mantisDefenseSolved ? ' disabled' : ''}>DIFESA: ${defenseVal}</button>`
                : `<div class="boss-defense">DIFESA: ${defenseVal}</div>`)
            : '';
        const minusOnclick = enemy.damageSelectorPopup
            ? `App._showBossDamageSelectorPopup('${enemy.id}')`
            : `App.adjustBossHp('${enemy.id}',-1)`;
        const cardHtml = `<div class="player-card boss-enemy-card">
            <div class="player-card-name" style="color:var(--codec-red)">${enemy.name}</div>
            <div class="hp-tracker">
                <button class="hp-btn" onclick="${minusOnclick}">−</button>
                <span class="hp-value" id="boss-hp-${enemy.id}">${hp}</span>
                <button class="hp-btn" onclick="App.adjustBossHp('${enemy.id}',+1)">+</button>
            </div>
            ${defenseHtml}
        </div>`;
        return cardHtml;
    },

    openMantisDefensePopup() {
        const step = this.mantisDefenseStep ?? 0;
        if (step === 0) this._mantisDefenseShowStep0();
        else if (step === 1) this._mantisDefenseShowStep1();
        else if (step === 2) this._mantisDefenseShowStep2();
    },

    _mantisDefenseShowStep0() {
        const box = document.getElementById('mantis-defense-popup-box');
        if (!box) return;
        box.innerHTML = `
            <div class="enemy-phase-popup-text" style="max-width:20rem">
                Hai consultato il codec per trovare gli indizi su come sconfiggere Psycho Mantis?
            </div>
            <div style="display:flex;gap:0.5rem;margin-top:0.5rem">
                <button class="btn-codec enemy-phase-confirm-btn" onclick="App._mantisDefenseStep0Yes()">
                    <span class="btn-inner">▶ SÌ</span>
                </button>
                <button class="btn-codec enemy-phase-confirm-btn" onclick="App._closeMantisDefensePopup()">
                    <span class="btn-inner">▶ NO</span>
                </button>
            </div>`;
        document.getElementById('mantis-defense-popup').style.display = 'flex';
    },

    _mantisDefenseStep0Yes() {
        this.mantisDefenseStep = 1;
        this._mantisDefenseShowStep1();
    },

    _mantisDefenseShowStep1() {
        const box = document.getElementById('mantis-defense-popup-box');
        if (!box) return;
        box.innerHTML = `
            <div class="enemy-phase-popup-text" style="max-width:20rem">
                Quali sono le parole chiave dell'indizio?
            </div>
            <input type="text" id="mantis-keyword-input" class="mantis-keyword-input"
                placeholder="Scrivi qui..." autocomplete="off"
                onkeydown="if(event.key==='Enter')App._mantisDefenseCheckKeyword()">
            <div id="mantis-keyword-wrong" style="display:none;color:var(--codec-red);font-family:var(--font-mono);font-size:0.75rem">
                Risposta errata.
            </div>
            <div style="display:flex;gap:0.5rem;margin-top:0.2rem">
                <button class="btn-codec enemy-phase-confirm-btn" onclick="App._mantisDefenseCheckKeyword()">
                    <span class="btn-inner">▶ CONFERMA</span>
                </button>
                <button class="btn-codec enemy-phase-confirm-btn" onclick="App._closeMantisDefensePopup()">
                    <span class="btn-inner">▶ ANNULLA</span>
                </button>
            </div>`;
        document.getElementById('mantis-defense-popup').style.display = 'flex';
        setTimeout(() => document.getElementById('mantis-keyword-input')?.focus(), 50);
    },

    _mantisDefenseCheckKeyword() {
        const inp = document.getElementById('mantis-keyword-input');
        if (!inp) return;
        const val = inp.value.trim().toUpperCase().replace(/\s+/g, ' ');
        if (val === 'GUARDARE SOTTO IL FONDO') {
            this.mantisDefenseStep = 2;
            this._mantisDefenseShowStep2();
        } else {
            const err = document.getElementById('mantis-keyword-wrong');
            if (err) err.style.display = 'block';
            inp.value = '';
            inp.focus();
        }
    },

    _mantisDefenseShowStep2() {
        const box = document.getElementById('mantis-defense-popup-box');
        if (!box) return;
        box.innerHTML = `
            <div class="enemy-phase-popup-text" style="max-width:20rem">
                Hai alzato il fondo della scatola dove sono riposte tutte le miniature, i segnalini e le carte?
            </div>
            <div style="display:flex;gap:0.5rem;margin-top:0.5rem">
                <button class="btn-codec enemy-phase-confirm-btn" onclick="App._mantisDefenseSolve()">
                    <span class="btn-inner">▶ SÌ</span>
                </button>
                <button class="btn-codec enemy-phase-confirm-btn" onclick="App._closeMantisDefensePopup()">
                    <span class="btn-inner">▶ NO</span>
                </button>
            </div>`;
        document.getElementById('mantis-defense-popup').style.display = 'flex';
    },

    _mantisDefenseSolve() {
        this.mantisDefenseSolved = true;
        this.mantisDefenseStep = 0;
        this._closeMantisDefensePopup();
        // Aggiorna il bottone difesa nella sidebar
        const btn = document.querySelector('.boss-defense-btn');
        if (btn) { btn.textContent = 'DIFESA: 4'; btn.disabled = true; }
    },

    _closeMantisDefensePopup() {
        document.getElementById('mantis-defense-popup').style.display = 'none';
    },

    _buildPlayerBossSectionsHtml(stage, playerName) {
        const sections = stage?.bossTurnSections || [];
        if (!sections.length) return '';
        const pName = playerName ?? this._activePlanciaPlayer();
        const available = this.playerTokenState.filter(t => t).length;
        const items = sections.map(sec => {
            const remaining = sec.id != null && sec.charges != null
                ? (this.bossSectionChargeState[pName]?.[sec.id] ?? sec.charges)
                : null;
            const chargesHtml = remaining != null
                ? `<div class="eq-panel-charges">${
                    Array.from({ length: sec.charges }, (_, i) =>
                        `<span class="eq-charge-dot ${i < remaining ? 'full' : 'empty'}"></span>`
                    ).join('')}</div>`
                : '';
            const btns = sec.actions.map((a, ai) => {
                const noCharge = a.usesCharge && remaining !== null && remaining <= 0;
                const noTokens = typeof a.cost === 'number' && a.cost > available;
                const disabled = noCharge || noTokens;
                const diceHtml = this._buildDiceHtml(a.dice);
                const displayCost = a.costLabel ?? a.cost;
                return `<button class="panel-btn eq-action-btn"
                    ${disabled ? 'disabled' : ''}
                    onmouseenter="App.showTooltip(event,'${this._enc(a)}')"
                    onmouseleave="App.hideActionTooltip()"
                    onclick="App.useBossSectionAction('${sec.id}',${ai},'${pName}')">
                    <span class="panel-btn-name">${a.name}</span>
                    <span class="panel-btn-cost">${displayCost != null ? displayCost : ''}${displayCost != null ? '<span class="cost-token">●</span>' : ''}</span>
                </button>${diceHtml}`;
            }).join('');
            const allDisabled = sec.actions.every((a) => {
                const noCharge = a.usesCharge && remaining !== null && remaining <= 0;
                const noTokens = typeof a.cost === 'number' && a.cost > available;
                return noCharge || noTokens;
            });
            return `<div class="eq-panel-item${allDisabled ? ' eq-item-disabled' : ''}">
                <div class="eq-panel-item-name">${sec.label}</div>
                ${chargesHtml}
                ${btns}
            </div>`;
        }).join('');
        return `<div class="eq-panel-row" id="player-boss-sections-panel">
            <div class="turn-panel-col-header">RISORSE</div>
            <div class="eq-panel-items">${items}</div>
        </div>`;
    },

    _refreshPlayerBossSections() {
        const el = document.getElementById('player-boss-sections-panel');
        if (!el) return;
        const html = this._buildPlayerBossSectionsHtml(this.currentStage);
        if (!html) return;
        const tmp = document.createElement('div');
        tmp.innerHTML = html.trim();
        el.replaceWith(tmp.firstElementChild);
    },

    _buildBossTurnHtml(stage) {
        const enemies = stage?.bossEnemies || [];
        const enemiesHtml = enemies.filter(e => e.attacks?.length || e.attackSound || e.attackSounds?.length || e.movementSounds?.length || e.movementHighHP || e.movementLowHP || e.playerTargetAttack || (e.cards && e.cards.length)).map(e => {
            let attackBtn = '';
            if (e.attacks && e.attacks.length) {
                attackBtn = e.attacks.map((atk, ai) =>
                    `<button class="btn-codec boss-attack-btn" onclick="App.playBossEnemyAttack('${e.id}',${ai})">▶ ${atk.name}</button>`
                ).join('');
            } else if (e.playerTargetAttack) {
                attackBtn = `<button class="btn-codec boss-attack-btn" onclick="App.openBossPlayerAttackPopup('${e.id}')">▶ ATTACCA</button>`;
            } else if (e.attackSound || e.attackSounds?.length) {
                attackBtn = `<button class="btn-codec boss-attack-btn" onclick="App.playBossAttack('${e.id}')">▶ ATTACCA</button>`;
            }
            const movementBtn = (e.movementHighHP || e.movementLowHP || e.movementSounds?.length)
                ? `<button class="btn-codec boss-attack-btn" onclick="App.playBossMovement('${e.id}')">▶ MOVIMENTO</button>`
                : '';
            const specialBtns = (e.specialButtons || []).map(sb => {
                if (sb.type === 'counter') {
                    const count = this._bossSpecialBtnUsed[`${e.id}-${sb.id}`] ?? 0;
                    const atMax = count >= sb.max;
                    return `<span class="boss-counter-row">
                        <span class="boss-counter-label">${sb.label}</span>
                        <button class="btn-codec boss-counter-btn" onclick="App.bossBtnCounterAdj('${e.id}','${sb.id}',-1)">−</button>
                        <span class="boss-counter-val" id="boss-counter-${e.id}-${sb.id}">${count}</span>
                        <button class="btn-codec boss-counter-btn" onclick="App.bossBtnCounterAdj('${e.id}','${sb.id}',1)" ${atMax ? 'disabled' : ''}>+</button>
                    </span>`;
                }
                return `<button class="btn-codec boss-attack-btn" onclick="App.playBossSpecialBtn('${e.id}','${sb.id}')">▶ ${sb.label}</button>`;
            }).join('');
            const cardsHtml = (e.cards && e.cards.length)
                ? `<div class="boss-cards-row">
                       <select class="boss-cards-select" id="boss-cards-select-${e.id}">
                           <option value="">— ${e.cardsLabel ?? 'Frase della carta'} —</option>
                           ${e.cards.map((c, i) => `<option value="${i}">${c.label}</option>`).join('')}
                       </select>
                       <button class="btn-codec boss-play-btn" onclick="App.playBossCard('${e.id}')">▶</button>
                   </div>`
                : '';
            return `<div class="boss-turn-block">
                <div class="boss-turn-name" style="color:var(--codec-red)">${e.name}</div>
                <div style="display:flex;gap:0.5rem;flex-wrap:wrap">${attackBtn}${movementBtn}${specialBtns}</div>
                ${cardsHtml}
            </div>`;
        }).join('');

        return enemiesHtml;
    },

    useBossSectionAction(sectionId, actionIndex, playerName) {
        const stage = this.currentStage;
        const sec   = stage?.bossTurnSections?.find(s => s.id === sectionId);
        if (!sec) return;
        const a = sec.actions[actionIndex];
        if (!a) return;
        const pName = playerName ?? this._activePlanciaPlayer();
        if (a.sounds) this._playSoundSequence(a.sounds);
        else if (a.sound) this.playSfx(a.sound);
        let needsRender = false;
        if (a.usesCharge && sec.charges != null) {
            if (!this.bossSectionChargeState[pName]) this.bossSectionChargeState[pName] = {};
            const cur = this.bossSectionChargeState[pName][sectionId] ?? sec.charges;
            this.bossSectionChargeState[pName][sectionId] = Math.max(0, cur - 1);
            needsRender = true;
        }
        if (a.restoresCharges && sec.charges != null) {
            if (!this.bossSectionChargeState[pName]) this.bossSectionChargeState[pName] = {};
            this.bossSectionChargeState[pName][sectionId] = sec.charges;
            needsRender = true;
        }
        if (needsRender) this._renderTurnSection();
        if (a.attack) {
            if (a.extraTokenAttack) {
                this._showExtraTokenAttackPopup(pName, a);
            } else {
                this.showAttackResultPopup(null, null, a);
            }
        }
    },

    _showExtraTokenAttackPopup(playerName, baseAction) {
        const popup = document.getElementById('token-attack-popup');
        const btnsEl = document.getElementById('token-attack-btns');
        if (!popup || !btnsEl) { this.showAttackResultPopup(null, null, baseAction); return; }

        const titleEl = popup.querySelector('.enemy-phase-popup-text');
        if (titleEl) titleEl.innerHTML = 'Quanti segnalini azione?';

        // Il costo base (1 token) è già stato speso — available = token rimasti
        const available = this.playerTokenState.filter(t => t).length;
        const baseDice  = baseAction.dice?.[0]?.count ?? 2;

        // Bottoni: da 0 extra token (solo il base) fino a tutti i disponibili
        btnsEl.innerHTML = Array.from({ length: available + 1 }, (_, extra) => {
            const totalTokens = 1 + extra;
            const totalDice   = baseDice + extra;
            return `<button class="btn-codec" style="font-size:1.2rem;padding:0.5rem 1rem;min-width:3rem"
                onclick="App._confirmExtraTokenAttack('${playerName}',${extra},${totalDice})">
                <span class="btn-inner">${totalTokens}</span>
            </button>`;
        }).join('');

        this._extraTokenBaseAction = baseAction;
        popup.style.display = 'flex';
    },

    _confirmExtraTokenAttack(playerName, extraTokens, totalDice) {
        document.getElementById('token-attack-popup').style.display = 'none';
        if (extraTokens > 0) this.spendTokens(extraTokens, playerName);
        const action = { ...this._extraTokenBaseAction, dice: [{ color: 'white', count: totalDice }] };
        this.showAttackResultPopup(null, null, action);
    },

    _showBossDamageSelectorPopup(enemyId) {
        const enemy = this.currentStage?.bossEnemies?.find(e => e.id === enemyId);
        if (!enemy) return;
        const max = enemy.damageSelectorMax ?? 4;
        const btns = document.getElementById('elicottero-damage-btns');
        btns.innerHTML = Array.from({ length: max + 1 }, (_, i) =>
            `<button class="btn-codec" style="font-size:1.4rem;padding:0.6rem 1.2rem;min-width:3.2rem" onclick="App._confirmBossDamageSelectorPopup('${enemyId}',${i})">${i}</button>`
        ).join('');
        document.getElementById('elicottero-damage-popup').style.display = 'flex';
    },

    _confirmBossDamageSelectorPopup(enemyId, amount) {
        document.getElementById('elicottero-damage-popup').style.display = 'none';
        if (amount <= 0) return;
        const enemy = this.currentStage?.bossEnemies?.find(e => e.id === enemyId);
        const currentHp = this.bossHpState?.[enemyId] ?? 0;
        const isLethal = amount >= currentHp;
        this.adjustBossHp(enemyId, -amount, false);
        this._playElicotteroHitSounds(amount, isLethal, isLethal ? enemy : null);
    },

    _playElicotteroHitSounds(amount, isLethal, enemyForKo = null) {
        const base = 'audio/sfx/elicottero/';
        const finalSound = (isLethal || amount === 2 || amount === 3)
            ? `${base}ferito-2-3.wav`
            : amount === 1 ? `${base}ferito-1.wav`
            : `${base}ferito-4.wav`;
        this._playActionSound('audio/sfx/esplosione.wav');
        setTimeout(() => {
            this._playSfxOnce(`${base}elicottero-colpito.wav`, () => {
                if (enemyForKo) {
                    this._playSfxOnce(finalSound, () => this._triggerBossKo(enemyForKo));
                } else {
                    this._playActionSound(finalSound);
                }
            });
        }, 250);
    },

    playBossAttack(enemyId) {
        const enemy = this.currentStage?.bossEnemies?.find(e => e.id === enemyId);
        if (!enemy) return;
        if (enemy.attackSounds?.length) {
            const file = enemy.attackSounds[Math.floor(Math.random() * enemy.attackSounds.length)];
            this.playSfx(file);
            return;
        }
        if (!enemy.attackSound) return;
        if (enemy.aboveHalfAttackSound) {
            const hp    = this.bossHpState?.[enemyId] ?? 0;
            const maxHp = this.bossMaxHpState?.[enemyId] ?? 0;
            if (maxHp > 0 && hp > maxHp / 2) {
                this._playSfxOnce(enemy.aboveHalfAttackSound, () => this.playSfx(enemy.attackSound));
                return;
            }
        }
        this.playSfx(enemy.attackSound);
    },

    playBossMovement(enemyId) {
        const enemy = this.currentStage?.bossEnemies?.find(e => e.id === enemyId);
        if (!enemy) return;

        // Movimento condizionale HP (es. Vulcan Raven)
        if (enemy.movementHighHP || enemy.movementLowHP) {
            const hp    = this.bossHpState?.[enemyId] ?? 0;
            const maxHp = this.bossMaxHpState?.[enemyId] ?? 0;
            const cfg   = (maxHp > 0 && hp > maxHp / 2) ? enemy.movementHighHP : enemy.movementLowHP;
            if (!cfg) return;
            if (cfg.leadSound) this.playSfx(cfg.leadSound);
            const file = cfg.sounds[Math.floor(Math.random() * cfg.sounds.length)];
            setTimeout(() => this.playSfx(file), 400);
            return;
        }

        const sounds = enemy?.movementSounds;
        if (!sounds?.length) return;
        const entry = sounds[Math.floor(Math.random() * sounds.length)];
        const file   = typeof entry === 'string' ? entry : entry.file;
        const repeat = typeof entry === 'object' ? (entry.repeat ?? 1) : 1;
        const playN = (n) => {
            if (n <= 0) return;
            const a = new Audio(file);
            a.volume = App._sfxVol();
            if (n > 1) a.addEventListener('ended', () => playN(n - 1), { once: true });
            a.play().catch(() => {});
        };
        playN(repeat);
        if (enemy.movementSounds2?.length) {
            const file2 = enemy.movementSounds2[Math.floor(Math.random() * enemy.movementSounds2.length)];
            setTimeout(() => this._playActionSound(file2), enemy.movementSounds2Delay ?? 250);
        }
    },

    bossBtnCounterAdj(enemyId, btnId, delta) {
        const enemy = this.currentStage?.bossEnemies?.find(e => e.id === enemyId);
        const btn   = enemy?.specialButtons?.find(b => b.id === btnId);
        if (!btn) return;
        const key     = `${enemyId}-${btnId}`;
        const current = this._bossSpecialBtnUsed[key] ?? 0;
        const next    = Math.max(0, Math.min(btn.max ?? Infinity, current + delta));
        if (next === current) return;
        this._bossSpecialBtnUsed[key] = next;

        // Aggiorna display
        const valEl = document.getElementById(`boss-counter-${enemyId}-${btnId}`);
        if (valEl) valEl.textContent = next;
        // Aggiorna stato disabled del tasto +
        const plusBtn = valEl?.nextElementSibling;
        if (plusBtn) plusBtn.disabled = next >= (btn.max ?? Infinity);

        // Audio solo su incremento
        if (delta > 0) {
            const firstKey = `${enemyId}-${btnId}-first`;
            const isFirst = next === 1 && !this._bossCounterFirstUsed[firstKey];
            if (next === 1) this._bossCounterFirstUsed[firstKey] = true;
            if (isFirst && btn.firstVideo) {
                this._playBossHalfVideo(btn.firstVideo);
            } else {
                let sound = null;
                if (next >= btn.max)  sound = btn.maxSound;
                else if (isFirst)     sound = btn.firstSound;
                else                  sound = btn.repeatSound;
                if (sound) { const sfx = new Audio(sound); sfx.volume = App._sfxVol(); sfx.play().catch(() => {}); }
            }
        }
    },

    playBossSpecialBtn(enemyId, btnId) {
        const enemy = this.currentStage?.bossEnemies?.find(e => e.id === enemyId);
        const btn   = enemy?.specialButtons?.find(b => b.id === btnId);
        if (!btn) return;
        const key     = `${enemyId}-${btnId}`;
        const used    = !!this._bossSpecialBtnUsed[key];
        const file    = used ? btn.repeatSound : btn.firstSound;
        this._bossSpecialBtnUsed[key] = true;
        if (!file) return;
        const sfx = new Audio(file);
        sfx.volume = App._sfxVol();
        sfx.play().catch(() => {});
    },

    playBossEnemyAttack(enemyId, attackIndex) {
        const enemy = this.currentStage?.bossEnemies?.find(e => e.id === enemyId);
        const atk   = enemy?.attacks?.[attackIndex];
        if (!atk) return;
        if (atk.sound) this.playSfx(atk.sound, undefined, atk.volume);
        if (atk.hitPopup) this._showCannonHitPopup(atk);
    },

    // ============================================
    // BOSS → PLAYER ATTACK POPUP (es. Vulcan Raven)
    // ============================================
    _bossPlayerAttackEnemyId: null,
    _bossPlayerAttackTarget: null,  // playerName o null
    _bossPlayerAttackDamage: 1,

    openBossPlayerAttackPopup(enemyId) {
        const enemy = this.currentStage?.bossEnemies?.find(e => e.id === enemyId);
        if (!enemy) return;
        if (enemy.playerTargetAttack?.attackSound) this.playSfx(enemy.playerTargetAttack.attackSound);
        this._bossPlayerAttackEnemyId = enemyId;
        this._bossPlayerAttackTarget  = null;
        this._bossPlayerAttackDamage  = 1;

        const players = this.stagePlayers || [];
        const list = document.getElementById('boss-player-attack-list');
        if (list) {
            list.innerHTML = [
                `<label class="boss-player-atk-option"><input type="radio" name="boss-player-atk" value="" checked onchange="App._bossPlayerAttackTarget=null"> — nessun giocatore —</label>`,
                ...players.map(p =>
                    `<label class="boss-player-atk-option"><input type="radio" name="boss-player-atk" value="${p}" onchange="App._bossPlayerAttackTarget='${p}'"> ${p}</label>`
                ),
            ].join('');
        }
        const dmgEl = document.getElementById('boss-player-attack-dmg');
        if (dmgEl) dmgEl.textContent = this._bossPlayerAttackDamage;
        const popup = document.getElementById('boss-player-attack-popup');
        if (popup) popup.style.display = 'flex';
    },

    bossPlayerAttackAdjDmg(delta) {
        this._bossPlayerAttackDamage = Math.max(1, (this._bossPlayerAttackDamage || 1) + delta);
        const el = document.getElementById('boss-player-attack-dmg');
        if (el) el.textContent = this._bossPlayerAttackDamage;
    },

    confirmBossPlayerAttack() {
        const popup = document.getElementById('boss-player-attack-popup');
        if (popup) popup.style.display = 'none';
        const target = this._bossPlayerAttackTarget;
        const damage = this._bossPlayerAttackDamage || 1;
        if (!target) return;
        const prev = this.hpState[target] ?? 0;
        if (prev <= 0) return;
        const ch = CHARACTERS[target];
        const surviving = prev - damage > 0;
        if (surviving && ch?.hurtPlusSound) {
            const a = new Audio(ch.hurtPlusSound);
            a.volume = App._sfxVol();
            a.play().catch(() => {});
        }
        this.adjustHp(target, -damage, surviving);
    },

    closeBossPlayerAttackPopup() {
        const popup = document.getElementById('boss-player-attack-popup');
        if (popup) popup.style.display = 'none';
    },

    _pendingCannonHitAtk: null,
    _pendingCannonHitPlayer: null,
    _pendingCannonHitDamage: 1,

    _showCannonHitPopup(atk) {
        const popup = document.getElementById('attack-result-popup');
        if (!popup) return;
        this._pendingCannonHitAtk    = atk;
        this._pendingCannonHitDamage = 1;
        // Auto-seleziona se c'è un solo giocatore
        const players = this.stagePlayers || [];
        this._pendingCannonHitPlayer = players.length === 1 ? players[0] : null;
        document.getElementById('attack-result-title').textContent = 'COLPO DI CANNONE';
        document.getElementById('attack-result-options').innerHTML = this._buildCannonHitPopupHtml();
        popup.style.display = 'flex';
    },

    _buildCannonHitPopupHtml() {
        const players = this.stagePlayers || [];
        const confirmDisabled = !this._pendingCannonHitPlayer;
        const playerBtns = players.map(p =>
            `<button class="attack-result-btn boss-dmg-target${p === this._pendingCannonHitPlayer ? ' active' : ''}"
                onclick="App.selectCannonHitPlayer('${p}')">${p.toUpperCase()}</button>`
        ).join('');
        return `
            <div class="boss-dmg-targets">${playerBtns}</div>
            <div class="boss-dmg-counter">
                <button class="attack-result-btn boss-dmg-adj" onclick="App.adjustCannonHitDamage(-1)">−</button>
                <span id="cannon-dmg-amount" class="boss-dmg-amount">${this._pendingCannonHitDamage}</span>
                <button class="attack-result-btn boss-dmg-adj" onclick="App.adjustCannonHitDamage(1)">+</button>
            </div>
            <div class="boss-dmg-actions">
                <button class="attack-result-btn" onclick="App.closeAttackResultPopup()">NESSUNO</button>
                <button class="attack-result-btn attack-result-hit" id="cannon-confirm-btn"
                    ${confirmDisabled ? 'disabled style="opacity:0.35"' : ''}
                    onclick="App.confirmCannonHit()">CONFERMA</button>
            </div>`;
    },

    selectCannonHitPlayer(playerName) {
        this._pendingCannonHitPlayer = playerName;
        document.querySelectorAll('#attack-result-popup .boss-dmg-target').forEach(btn => {
            btn.classList.toggle('active', btn.textContent.trim() === playerName.toUpperCase());
        });
        const confirmBtn = document.getElementById('cannon-confirm-btn');
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.style.opacity = '';
        }
    },

    adjustCannonHitDamage(delta) {
        this._pendingCannonHitDamage = Math.max(1, (this._pendingCannonHitDamage || 1) + delta);
        const el = document.getElementById('cannon-dmg-amount');
        if (el) el.textContent = this._pendingCannonHitDamage;
    },

    confirmCannonHit() {
        const playerName = this._pendingCannonHitPlayer;
        const atk        = this._pendingCannonHitAtk;
        const damage     = this._pendingCannonHitDamage || 0;
        this.closeAttackResultPopup();
        if (!playerName) return;
        const hp = this.hpState[playerName] ?? 0;
        if (hp <= 0) return;
        const ch = CHARACTERS[playerName];
        const surviving = hp - damage > 0;
        if (surviving && ch?.hurtPlusSound) {
            const hurtAudio = new Audio(ch.hurtPlusSound);
            hurtAudio.volume = App._sfxVol();
            if (atk?.hitVideo) {
                hurtAudio.addEventListener('ended', () => {
                    setTimeout(() => {
                        if (this.musicLoop?.isPlaying()) {
                            this._eventMusicRestore = this.musicLoop.getVolume();
                        }
                        this.playVideo(atk.hitVideo);
                    }, 2000);
                }, { once: true });
            }
            hurtAudio.play().catch(() => {});
        } else if (surviving && atk?.hitVideo) {
            this._playBossHalfVideo(atk.hitVideo, 3000);
        }
        if (damage > 0) this.adjustHp(playerName, -damage, surviving);
    },

    _bossCardFollowUpUsed: {},

    playBossCard(enemyId) {
        const enemy = this.currentStage?.bossEnemies?.find(e => e.id === enemyId);
        if (!enemy?.cards) return;
        const sel = document.getElementById(`boss-cards-select-${enemyId}`);
        const idx = sel ? parseInt(sel.value) : NaN;
        if (isNaN(idx) || !enemy.cards[idx]) return;
        const card = enemy.cards[idx];
        // Carta con sequenza blackout → video → sfx (stesso meccanismo di sfxOnMusicStart)
        if (card.thenVideo) {
            this._playSfxOnce(card.file, () => {
                if (this.musicLoop && this.musicLoop.isPlaying()) {
                    this._eventMusicRestore = this.musicLoop.getVolume();
                    this.musicLoop.setVolume(0);
                }
                if (card.thenSfx) {
                    this._pendingVideoEndCallback = () => this._playSfxOnce(card.thenSfx);
                }
                this.playVideo(card.thenVideo);
            });
            return;
        }
        if (card.filesAll) {
            card.filesAll.forEach(f => { const a = new Audio(f); a.volume = 1.0; a.play().catch(() => {}); });
            return;
        }
        const src = card.files
            ? card.files[Math.floor(Math.random() * card.files.length)]
            : card.file;
        const audio = new Audio(src);
        audio.volume = 1.0;
        if (card.followUp) {
            const key = `${enemyId}-${idx}`;
            const alreadyUsed = !!this._bossCardFollowUpUsed[key];
            const followUpFile = (alreadyUsed && card.followUpAlt) ? card.followUpAlt : card.followUp;
            audio.addEventListener('ended', () => {
                this.playSfx(followUpFile);
                this._bossCardFollowUpUsed[key] = true;
            }, { once: true });
        }
        audio.play().catch(e => console.warn(e.message));
        if (card.hitPlayer) {
            audio.addEventListener('ended', () => this._showBossPlayerHitPopup(), { once: true });
        }
    },

    _showBossPlayerHitPopup() {
        const players = this.stagePlayers || [];
        const popup = document.getElementById('token-attack-popup');
        const btnsEl = document.getElementById('token-attack-btns');
        if (!popup || !btnsEl) return;

        const playerBtns = players.map(p =>
            `<button class="btn-codec" style="font-size:1rem;padding:0.4rem 0.9rem"
                onclick="App._bossPlayerHitSelectPlayer('${p}')">
                <span class="btn-inner">${p.toUpperCase()}</span>
            </button>`
        ).join('');

        const titleEl = popup.querySelector('.enemy-phase-popup-text');
        if (titleEl) titleEl.innerHTML = 'Giocatore colpito?<br><span style="font-size:0.8rem;opacity:0.7">Seleziona il personaggio</span>';
        btnsEl.innerHTML = playerBtns + `<button class="btn-codec" style="font-size:1rem;padding:0.4rem 0.9rem"
            onclick="document.getElementById('token-attack-popup').style.display='none'">
            <span class="btn-inner">NESSUNO</span>
        </button>`;
        popup.style.display = 'flex';
    },

    _bossPlayerHitSelectPlayer(playerName) {
        const popup = document.getElementById('token-attack-popup');
        const btnsEl = document.getElementById('token-attack-btns');
        const titleEl = popup?.querySelector('.enemy-phase-popup-text');
        if (!popup || !btnsEl) return;

        if (titleEl) titleEl.innerHTML = `${playerName.toUpperCase()} — Quanti danni?<br><span style="font-size:0.8rem;opacity:0.7">0 = nessun danno</span>`;
        const maxHp = CHARACTERS[playerName]?.hp || 4;
        btnsEl.innerHTML = Array.from({ length: maxHp + 1 }, (_, i) =>
            `<button class="btn-codec" style="font-size:1.2rem;padding:0.4rem 0.9rem;min-width:3rem"
                onclick="App._bossPlayerHitApplyDamage('${playerName}',${i})">
                <span class="btn-inner">${i}</span>
            </button>`
        ).join('');
    },

    _bossPlayerHitApplyDamage(playerName, damage) {
        document.getElementById('token-attack-popup').style.display = 'none';
        if (damage <= 0) return;
        const prevHp = this.hpState?.[playerName] ?? (CHARACTERS[playerName]?.hp || 4);
        this.adjustHp(playerName, -damage, true); // skipHurtSound=true, gestiamo noi
        const newHp = this.hpState?.[playerName] ?? 0;
        if (newHp > 0) {
            const ch = CHARACTERS[playerName];
            if (ch?.hurtPlusSound) this._playActionSound(ch.hurtPlusSound);
        }
    },

    flipBossCard(enemyId) {
        const card = document.getElementById(`flip-card-${enemyId}`);
        if (!card) return;
        const isFlipped = card.classList.toggle('flipped');
        if (isFlipped) {
            const enemy = this.currentStage?.bossEnemies?.find(e => e.id === enemyId);
            if (enemy?.discoverySound) this.playSfx(enemy.discoverySound);
        }
    },

    // Azione MIRA giocatori — mostra popup colpo su Sniper Wolf
    showMiraAttackPopup() {
        const popup = document.getElementById('mira-attack-popup');
        if (popup) popup.style.display = 'flex';
    },

    resolveMiraAttack(hit) {
        const popup = document.getElementById('mira-attack-popup');
        if (popup) popup.style.display = 'none';
        if (!hit) return;

        const wolf = this.currentStage?.bossEnemies?.find(e => e.id === 'wolf');

        // Sparo
        this.playSfx('audio/sfx/cecchino-sparo.wav', undefined, 0.4);

        // Dopo 250ms: verifica HP e suona ferito o morte
        setTimeout(() => {
            const prevHp = this.bossHpState?.['wolf'] ?? 0;
            this.adjustBossHp('wolf', -2, false);
            const newHp = this.bossHpState?.['wolf'] ?? 0;

            if (prevHp > 0 && newHp <= 0) {
                // Colpo letale → morte
                if (wolf?.koSound) this.playSfx(wolf.koSound);
                if (wolf) setTimeout(() => this._triggerBossKo({ ...wolf, koSound: null }), 1200);
            } else if (prevHp > 0) {
                // Non letale → ferito casuale
                const hurtSounds = wolf?.hurtSounds || [];
                if (hurtSounds.length) {
                    this.playSfx(hurtSounds[Math.floor(Math.random() * hurtSounds.length)]);
                }
            }
        }, 250);
    },

    adjustBossHp(enemyId, delta, playSounds = true, category = null) {
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
        if (playSounds && delta < 0 && prev > 0) {
            const enemy = this.currentStage?.bossEnemies?.find(e => e.id === enemyId);
            if (enemy) {
                if (current === 0) {
                    if (enemy.hitLeadSound && enemy.hitWoundSound) {
                        const delay = enemy.hitWoundDelay ?? 300;
                        this.playSfx(enemy.hitLeadSound);
                        setTimeout(() => {
                            this._playSfxOnce(enemy.hitWoundSound, () => this._triggerBossKo(enemy));
                        }, delay);
                    } else {
                        this._triggerBossKo(enemy);
                    }
                } else if (enemy.hitSequence) {
                    // Sidebar: suono ferita sempre + video se primo colpo o metà vita
                    const maxHp = this.bossMaxHpState?.[enemyId] ?? 0;
                    const crossedHalf = maxHp > 0 && prev > maxHp / 2 && current <= maxHp / 2;
                    this.playSfx(enemy.hitSequence.woundSound);
                    if (!this._bossFirstHitUsed[enemyId] && enemy.firstHitVideo) {
                        this._bossFirstHitUsed[enemyId] = true;
                        this._playBossHalfVideo(enemy.firstHitVideo);
                    } else if (crossedHalf && enemy.hitHalfVideo) {
                        this._playBossHalfVideo(enemy.hitHalfVideo);
                    } else if (crossedHalf && enemy.hitHalfSound) {
                        setTimeout(() => this.playSfx(enemy.hitHalfSound), 500);
                    }
                } else {
                    const maxHp = this.bossMaxHpState?.[enemyId] ?? 0;
                    const crossedHalf = maxHp > 0 && prev > maxHp / 2 && current <= maxHp / 2;
                    if (!this._bossFirstHitUsed[enemyId] && enemy.firstHitVideo) {
                        this._bossFirstHitUsed[enemyId] = true;
                        this._playBossHalfVideo(enemy.firstHitVideo);
                    } else if (crossedHalf && (enemy.hitHalfSound || enemy.hitHalfVideo)) {
                        if (enemy.hitHalfSound) this.playSfx(enemy.hitHalfSound);
                        if (enemy.hitHalfVideo) this._playBossHalfVideo(enemy.hitHalfVideo, 3000);
                    } else if (enemy.hitLeadSound) {
                        const dmg = -delta;
                        const threshold = enemy.hitWoundPlusThreshold ?? 3;
                        const woundSound = (dmg >= threshold && enemy.hitWoundPlusSound)
                            ? enemy.hitWoundPlusSound
                            : (enemy.hitWoundSound ?? enemy.hitLeadSound);
                        const delay = enemy.hitWoundDelay ?? 300;
                        if (enemy.hitExplosionSound) {
                            this.playSfx(enemy.hitExplosionSound);
                            setTimeout(() => {
                                this.playSfx(enemy.hitLeadSound);
                                setTimeout(() => this.playSfx(woundSound), delay);
                            }, 300);
                        } else {
                            this.playSfx(enemy.hitLeadSound);
                            setTimeout(() => this.playSfx(woundSound), delay);
                        }
                    } else {
                        const dmg = -delta;
                        const exactEntry = (enemy.damageSounds || []).find(ds => ds.damage === dmg);
                        let soundToPlay;
                        if (exactEntry) {
                            soundToPlay = exactEntry.sounds
                                ? exactEntry.sounds[Math.floor(Math.random() * exactEntry.sounds.length)]
                                : exactEntry.sound;
                        } else if (enemy.hurtSoundsByCategory) {
                            const pool = enemy.hurtSoundsByCategory[category] || enemy.hurtSoundsByCategory.default || [];
                            soundToPlay = pool[Math.floor(Math.random() * pool.length)];
                        } else {
                            soundToPlay = enemy.hurtSounds?.length
                                ? enemy.hurtSounds[Math.floor(Math.random() * enemy.hurtSounds.length)]
                                : enemy.hitSound;
                        }
                        if (soundToPlay) this.playSfx(soundToPlay);
                    }
                }
            }
        }
    },

    hidePlayerSidebar() {
        const sidebar = document.getElementById('player-sidebar');
        if (sidebar) sidebar.style.display = 'none';
        this._stopZoneSfx();
        this.hpState        = {};
        this.markerState    = {};
        this.playerZoneState = {};
        this.bossHpState    = {};
        this.bossMaxHpState = {};
    },

    _triggerBossKo(enemy) {
        if (enemy.stopMusicOnKo) this.stopMusic();
        if (enemy.koSequence) {
            this._playBossKoSequence(enemy);
        } else {
            if (enemy.koSound) this.playSfx(enemy.koSound);
            if (enemy.koTriggersGameOver) {
                setTimeout(() => this.triggerGameOver(), 1500);
            } else {
                setTimeout(() => this.playOutro(), 1500);
            }
        }
    },


    _playBossKoSequence(enemy) {
        const seq = enemy.koSequence;
        if (!seq) return;
        const { sound, repeat, parallelAt, parallelSound,
                volume = 0.85, overlap = 0, parallelOffset = 0, fadeOutLast = 0 } = seq;
        let parallelStarted = false;
        const playNext = (n) => {
            if (n > repeat) return;
            const a = new Audio(sound);
            a.volume = volume;
            // Ultimo play: triggerKo su ended
            if (n === repeat) {
                a.addEventListener('ended', () => {
                    if (enemy.koTriggersGameOver) this.triggerGameOver();
                    else this.playOutro();
                }, { once: true });
            }
            // timeupdate: overlap, morte anticipata, fade out ultimo play
            if (overlap > 0 || (parallelSound && n === parallelAt && parallelOffset > 0) || (n === repeat && fadeOutLast > 0)) {
                let fadeStarted = false;
                const onTick = () => {
                    if (!a.duration) return;
                    const remaining = a.duration - a.currentTime;
                    // Morte prima (soglia più alta), senza return per non bloccare il check overlap
                    if (parallelSound && n === parallelAt && !parallelStarted && remaining <= parallelOffset) {
                        parallelStarted = true;
                        const p = new Audio(parallelSound);
                        p.volume = App._sfxVol();
                        p.play().catch(() => {});
                    }
                    // Fade out dell'ultimo play
                    if (n === repeat && fadeOutLast > 0 && !fadeStarted && remaining <= fadeOutLast) {
                        fadeStarted = true;
                        const startVol = a.volume;
                        const steps = 30;
                        let step = 0;
                        const timer = setInterval(() => {
                            step++;
                            a.volume = Math.max(0, startVol * (1 - step / steps));
                            if (step >= steps) clearInterval(timer);
                        }, (fadeOutLast * 1000) / steps);
                    }
                    // Overlap: avvia il prossimo prima della fine
                    if (n < repeat && overlap > 0 && remaining <= overlap) {
                        a.removeEventListener('timeupdate', onTick);
                        playNext(n + 1);
                    }
                };
                a.addEventListener('timeupdate', onTick);
            } else if (n < repeat) {
                a.addEventListener('ended', () => playNext(n + 1), { once: true });
            }
            // Morte senza anticipo (parallelOffset=0)
            if (parallelSound && n === parallelAt && parallelOffset === 0) {
                a.addEventListener('ended', () => {
                    if (!parallelStarted) {
                        parallelStarted = true;
                        const p = new Audio(parallelSound);
                        p.volume = App._sfxVol();
                        p.play().catch(() => {});
                    }
                }, { once: true });
            }
            a.play().catch(() => {});
        };
        playNext(1);
    },

    _playBossHalfVideo(videoFile, delay = 2000) {
        if (!videoFile) return;
        setTimeout(() => {
            // Stessa logica di playEvent con stopMusic: false — la musica continua
            if (this.musicLoop && this.musicLoop.isPlaying()) {
                this._eventMusicRestore = this.musicLoop.getVolume();
            }
            this.playVideo(videoFile);
        }, delay);
    },

    adjustHp(playerName, delta, skipHurtSound = false, skipHealSound = false) {
        if (this.hpState[playerName] === undefined) return;
        const prev = this.hpState[playerName];
        const ch = CHARACTERS[playerName];
        const maxHp = (ch && ch.hp) ? ch.hp : 4;
        this.hpState[playerName] = Math.max(0, Math.min(maxHp, prev + delta));
        const current = this.hpState[playerName];

        if (!skipHurtSound && delta < 0 && current > 0 && ch?.hurtSound) {
            this._playActionSound(ch.hurtSound);
        }
        if (!skipHealSound && delta > 0) {
            this._playActionSound('audio/sfx/cura-dopo-boss.wav');
        }

        const el = document.getElementById(`hp-${playerName}`);
        if (el) {
            el.textContent = current;
            el.classList.add('hp-flash');
            el.addEventListener('animationend', () => el.classList.remove('hp-flash'), { once: true });
        }

        if (current !== prev) this._refreshEquipmentPanel(playerName);

        if (current === 0 && prev > 0) this._onPlayerDeath(playerName);

        // Volpe alle Strette: ogni volta che Gray Fox subisce danni
        if (delta < 0 && current > 0 && playerName === 'Gray Fox') {
            const ch = CHARACTERS[playerName];
            const hasAbility = ch?.abilities?.some(a => a.id === 'volpe-alle-strette');
            if (hasAbility) this._showVolpePopup(playerName);
        }
    },

    _showVolpePopup(playerName) {
        const consumed = this.equipmentConsumedState[playerName] || {};
        const gearEquip = (this.playerEquipment[playerName] || []).filter(id => {
            if (!id) return false;
            const eq = EQUIPMENT[id];
            return eq?.isGear === true;
        });
        if (!gearEquip.length) return;
        this._volpePendingPlayer = playerName;
        const sel = document.getElementById('volpe-popup-select');
        if (sel) {
            sel.innerHTML = gearEquip.map(id => {
                const eq = EQUIPMENT[id];
                const current = typeof consumed[id] === 'number' ? consumed[id] : (eq.charges ?? 0);
                return `<option value="${id}">${eq.name} (⚙ ${current})</option>`;
            }).join('');
        }
        document.getElementById('volpe-popup').style.display = 'flex';
    },

    volpeAlleStretteConfirm() {
        document.getElementById('volpe-popup').style.display = 'none';
        const playerName = this._volpePendingPlayer;
        this._volpePendingPlayer = null;
        const sel = document.getElementById('volpe-popup-select');
        const equipId = sel?.value;
        if (!playerName || !equipId) return;
        const eq = EQUIPMENT[equipId];
        if (!eq) return;
        const consumed = this.equipmentConsumedState[playerName] || {};
        const current = typeof consumed[equipId] === 'number' ? consumed[equipId] : (eq.charges ?? 0);
        consumed[equipId] = current + 1; // nessun cap: può superare il massimo
        this.equipmentConsumedState[playerName] = consumed;
        this._refreshEquipmentPanel(playerName);
        const sidebarSection = document.getElementById(`eq-charge-sidebar-${playerName}`);
        if (sidebarSection) sidebarSection.outerHTML = this._buildManualChargeHtml(playerName);
    },

    volpeAlleStretteSalta() {
        document.getElementById('volpe-popup').style.display = 'none';
        this._volpePendingPlayer = null;
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

    _lockStage(isGameOver = false) {
        document.getElementById('stage-active')?.classList.add('stage-locked');
        if (isGameOver) {
            document.getElementById('player-sidebar')?.classList.add('game-over');
        }
    },

    _unlockStage() {
        document.getElementById('stage-active')?.classList.remove('stage-locked');
        document.getElementById('player-sidebar')?.classList.remove('game-over');
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
        // Se nessun giocatore ha più il marker !, termina l'alert
        const anyAlert = this.stagePlayers?.some(p => this.markerState[p]?.alert);
        if (!anyAlert && this.alertState !== 'normal') {
            this.resetAlert();
        }
    },

    // ============================================
    // ATTACK RESULT POPUP
    // ============================================
    showAttackResultPopup(playerName, actionId, actionObj = null) {
        const popup = document.getElementById('attack-result-popup');
        if (!popup) return;
        const bossData = this.currentStage?.isBoss ? BOSSES[this.currentStage.name] : null;
        if (bossData?.disableAttackPopup) return;

        // Risolvi sempre l'azione (serve sia per il filtro boss che per le reazioni)
        const resolvedAction = actionObj ?? (() => {
            if (!playerName || !actionId) return null;
            const ch = CHARACTERS[playerName];
            return [...(ch?.fixedActions || []), ...(ch?.defaultVariableActions || [])].find(a => a.id === actionId) ?? null;
        })();
        this._pendingAttackActionObj = resolvedAction;
        this._pendingAttackPlayer   = playerName;
        this._pendingAttackActionId = actionId;

        // Boss stage con nemici HP-tracciati → popup danni boss
        if (this.currentStage?.isBoss && (this.currentStage.bossEnemies || []).length > 0) {
            const actionCategory = resolvedAction?.category ?? null;
            const enemies = this.currentStage.bossEnemies.filter(e => {
                if ((this.bossHpState[e.id] ?? 0) <= 0) return false;
                if (e.defensePopup && !this.mantisDefenseSolved) return false;
                if (e.excludeFrom && actionCategory && e.excludeFrom.includes(actionCategory)) return false;
                if (!e.damageFrom) return true;
                return actionCategory && e.damageFrom.includes(actionCategory);
            });
            if (enemies.length === 0) {
                // Nessun nemico danneggiabile da questa categoria: suona audio "attacco ignorato" se disponibile
                const allEnemies = this.currentStage.bossEnemies.filter(e => (this.bossHpState[e.id] ?? 0) > 0);
                const sounds = allEnemies.flatMap(e => e.blockedAttackSounds || []);
                if (sounds.length > 0) {
                    const src = sounds[Math.floor(Math.random() * sounds.length)];
                    setTimeout(() => {
                        const sfx = new Audio(src);
                        sfx.volume = App._sfxVol();
                        sfx.play().catch(() => {});
                    }, 500);
                }
                return;
            }
            this._pendingBossDamageAmount = 0;
            this._pendingBossDamageEnemy  = enemies[0].id;
            document.getElementById('attack-result-title').textContent = 'DANNI AL BOSS';
            document.getElementById('attack-result-options').innerHTML = this._buildBossDamagePopupHtml(enemies);
            popup.style.display = 'flex';
            return;
        }

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

    _buildBossDamagePopupHtml(enemies) {
        const targetHtml = enemies.length > 1
            ? `<div class="boss-dmg-targets">${enemies.map(e =>
                `<button class="attack-result-btn boss-dmg-target${e.id === this._pendingBossDamageEnemy ? ' active' : ''}"
                    onclick="App.selectBossDamageTarget('${e.id}')">${e.name}</button>`
              ).join('')}</div>`
            : `<div class="boss-dmg-enemy-name">${enemies[0].name}</div>`;
        return `
            ${targetHtml}
            <div class="boss-dmg-counter">
                <button class="attack-result-btn boss-dmg-adj" onclick="App.adjustBossDamagePending(-1)">−</button>
                <span id="boss-dmg-amount" class="boss-dmg-amount">${this._pendingBossDamageAmount}</span>
                <button class="attack-result-btn boss-dmg-adj" onclick="App.adjustBossDamagePending(1)">+</button>
            </div>
            <div class="boss-dmg-actions">
                <button class="attack-result-btn" onclick="App.closeAttackResultPopup()">ANNULLA</button>
                <button class="attack-result-btn attack-result-hit" onclick="App.confirmBossDamage()">CONFERMA</button>
            </div>`;
    },

    selectBossDamageTarget(enemyId) {
        this._pendingBossDamageEnemy = enemyId;
        document.querySelectorAll('.boss-dmg-target').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.boss-dmg-target').forEach(btn => {
            if (btn.getAttribute('onclick')?.includes(`'${enemyId}'`)) btn.classList.add('active');
        });
    },

    adjustBossDamagePending(delta) {
        this._pendingBossDamageAmount = Math.max(0, (this._pendingBossDamageAmount || 0) + delta);
        const el = document.getElementById('boss-dmg-amount');
        if (el) el.textContent = this._pendingBossDamageAmount;
    },

    confirmBossDamage() {
        const enemyId = this._pendingBossDamageEnemy;
        const amount  = this._pendingBossDamageAmount || 0;
        const action  = this._pendingAttackActionObj;
        this._trackAttackHit();
        this.closeAttackResultPopup();
        if (amount > 0 && enemyId) {
            if (enemyId === 'ocelot') this._ocelotZeroStreak = 0;
            const enemy = this.currentStage?.bossEnemies?.find(e => e.id === enemyId);
            const hs = enemy?.hitSequence;
            if (hs && action?.attackType === 'physical' && !action?.noHitSound) {
                // Sequenza rapida colpo+ferita (stile CQC) — suoni gestiti qui, HP aggiornato silenziosamente
                const prevHp = this.bossHpState?.[enemyId] ?? 0;
                const maxHp  = this.bossMaxHpState?.[enemyId] ?? 0;
                const isFirstHit = !this._bossFirstHitUsed[enemyId];
                if (isFirstHit) this._bossFirstHitUsed[enemyId] = true;
                this.adjustBossHp(enemyId, -amount, false);
                const newHp = this.bossHpState?.[enemyId] ?? 0;
                const crossedHalf = maxHp > 0 && prevHp > maxHp / 2 && newHp > 0 && newHp <= maxHp / 2;
                if (newHp > 0) {
                    if (isFirstHit && enemy.firstHitVideo) {
                        this._playBossHalfVideo(enemy.firstHitVideo);
                    } else if (crossedHalf && enemy.hitHalfVideo) {
                        this._playBossHalfVideo(enemy.hitHalfVideo);
                    }
                }
                // Sequenza: (colpo→ferito) × hits, ultimo ferito sempre ferito+
                // Ogni coppia dura PAIR_MS ms; il ferito parte WOUND_OFFSET ms dopo il colpo
                const hits       = Math.min(Math.max(amount, 1), 3);
                const WOUND_OFFSET = 150; // ms: colpo → ferito dentro la stessa coppia
                const PAIR_MS      = 300; // ms tra l'inizio di una coppia e la successiva
                let lastAudio = null;
                for (let i = 0; i < hits; i++) {
                    const isLast  = i === hits - 1;
                    const pairT   = i * PAIR_MS + (isLast && hits > 1 ? 150 : 0);
                    const woundFile = isLast ? (amount > 1 ? (hs.woundPlusSound || hs.woundSound) : hs.woundSound) : hs.woundSound;
                    setTimeout(() => {
                        const a = new Audio(hs.hitSound); a.volume = App._sfxVol(); a.play().catch(() => {});
                    }, pairT);
                    setTimeout(() => {
                        const a = new Audio(woundFile); a.volume = App._sfxVol();
                        if (isLast) {
                            lastAudio = a;
                            if (newHp === 0) {
                                a.addEventListener('ended', () => this._triggerBossKo(enemy), { once: true });
                            } else if (crossedHalf && enemy.hitHalfSound) {
                                a.addEventListener('ended', () => this.playSfx(enemy.hitHalfSound), { once: true });
                            } else {
                                const dmgEntry = (enemy.damageSounds || []).find(ds => ds.damage === amount);
                                if (dmgEntry) {
                                    const sounds = dmgEntry.sounds || (dmgEntry.sound ? [dmgEntry.sound] : []);
                                    const snd = sounds[Math.floor(Math.random() * sounds.length)];
                                    const delay = dmgEntry.delay ?? 1000;
                                    a.addEventListener('ended', () => setTimeout(() => this.playSfx(snd), delay), { once: true });
                                } else if (enemy.hitExtraSounds?.length) {
                                    const extra = enemy.hitExtraSounds[Math.floor(Math.random() * enemy.hitExtraSounds.length)];
                                    a.addEventListener('ended', () => setTimeout(() => this.playSfx(extra), 300), { once: true });
                                }
                            }
                        }
                        a.play().catch(() => {});
                    }, pairT + WOUND_OFFSET);
                }
            } else {
                if (action?.attackType === 'physical' && !action?.noHitSound) {
                    const colpo = new Audio('audio/sfx/colpo-fisico.wav');
                    colpo.volume = App._sfxVol();
                    colpo.play().catch(() => {});
                }
                const enemyForExtra = this.currentStage?.bossEnemies?.find(e => e.id === enemyId);
                if (enemyForExtra?.hitExtraSounds?.length && enemyForExtra.hitSound) {
                    const prevHpW  = this.bossHpState?.[enemyId] ?? 0;
                    const maxHpW   = this.bossMaxHpState?.[enemyId] ?? 0;
                    this.adjustBossHp(enemyId, -amount, false);
                    const newHp    = this.bossHpState?.[enemyId] ?? 0;
                    const crossedHalfW = maxHpW > 0 && prevHpW > maxHpW / 2 && newHp > 0 && newHp <= maxHpW / 2;
                    const hits = Math.min(Math.max(amount, 1), 3);
                    const GAP = 400;
                    for (let i = 0; i < hits; i++) {
                        const isLast = i === hits - 1;
                        setTimeout(() => {
                            this._playSfxOnce(enemyForExtra.hitSound, isLast ? () => {
                                if (newHp === 0) {
                                    this._triggerBossKo(enemyForExtra);
                                } else if (crossedHalfW && enemyForExtra.hitHalfSound) {
                                    setTimeout(() => this.playSfx(enemyForExtra.hitHalfSound), 300);
                                } else {
                                    const extra = enemyForExtra.hitExtraSounds[Math.floor(Math.random() * enemyForExtra.hitExtraSounds.length)];
                                    setTimeout(() => this.playSfx(extra), 300);
                                }
                            } : null);
                        }, i * GAP);
                    }
                } else if (enemy?.damageSelectorPopup) {
                    const prevHp = this.bossHpState?.[enemyId] ?? 0;
                    const isLethal = amount >= prevHp;
                    this.adjustBossHp(enemyId, -amount, false);
                    this._playElicotteroHitSounds(amount, isLethal, isLethal ? enemy : null);
                } else {
                    this.adjustBossHp(enemyId, -amount, true, action?.category ?? null);
                }
            }
            // Reazione Ocelot quando Baker viene colpito con arma a distanza
            if (enemyId === 'baker') {
                const cat = action?.category;
                if (cat === 'pistol' || cat === 'rifle') {
                    setTimeout(() => this.playSfx('audio/sfx/ocelot/a chi stai mirando.wav'), 800);
                }
            }
        } else if (amount === 0 && enemyId === 'ocelot') {
            const cat = action?.category;
            if (cat === 'pistol' || cat === 'rifle') {
                this._ocelotZeroStreak = (this._ocelotZeroStreak || 0) + 1;
                if (this._ocelotZeroStreak % 2 === 0) {
                    setTimeout(() => this.playSfx('audio/sfx/ocelot/bella mossa eroe.wav'), 300);
                }
            }
        }
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

        if (action?.attackType === 'physical' && !action?.noHitSound) {
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

        const hitSoundFile = (action?.attackType === 'physical' && !action?.noHitSound) ? 'audio/sfx/colpo-fisico.wav' : null;

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
        this.trackStat('kills');
    },

    // Atterramento silenzioso: kill automatica → diminuisce guardie + stat kill
    processAutoKill(playerName) {
        this._decreaseGuardInZone(playerName);
        this.trackStat('kills_silent');
    },

    _decreaseGuardInZone(playerName) {
        const zone = (this.playerZoneState && this.playerZoneState[playerName] !== undefined)
            ? this.playerZoneState[playerName] : 0;
        this._applyEnemyCount(zone, -1);
    },

    _getDefaultEnemies(stage) {
        if (!stage || !stage.enemies) return [];
        return stage.enemies.map(() => 3);
    },

    _radioRestoreGuards() {
        const stage = this.currentStage;
        if (!stage || !this.enemyState) return;

        // radioEnemies può essere:
        // - array: soglie per zona (indipendente da numero giocatori)
        // - oggetto { N: [...] }: soglie per zona indicizzate per numero di giocatori
        let thresholds = stage.radioEnemies;
        if (thresholds && !Array.isArray(thresholds)) {
            const count = this.stagePlayers?.length || 1;
            thresholds = thresholds[count] ?? thresholds[Object.keys(thresholds).sort((a,b) => b-a).find(k => k <= count)] ?? null;
        }

        if (Array.isArray(thresholds)) {
            // Ripristina le guardie nelle zone dove si trovano i giocatori
            // fino alla soglia di quella zona
            const playerZones = new Set(
                this.stagePlayers.map(p => this.playerZoneState[p] ?? 0)
            );
            playerZones.forEach(zone => {
                const threshold = thresholds[zone];
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
        this._startZoneSfx(zoneIndex);
        // Non cambiare musica se alert/evasion è attivo
        if (this.alertState !== 'normal') return;
        const ids = stage.musicIds || [];
        const id  = ids[zoneIndex];
        if (!id) return;
        if (id === this.lastMusicId) return; // già nella zona giusta
        if (useElevator) {
            this.playMusic(id); // playMusic gestisce già l'elevator
        } else {
            this.playMusicAtVolume(id, this._getMusicVolumeNum());
        }
    },

    // SFX periodici per zona (es. corvi nel Magazzino)
    _zoneSfxInterval: null,

    _startZoneSfx(zoneIndex) {
        this._stopZoneSfx();
        const cfg = this.currentStage?.zoneSfx?.[zoneIndex];
        if (!cfg?.sounds?.length || !cfg?.interval) return;
        this._zoneSfxInterval = setInterval(() => {
            const file = cfg.sounds[Math.floor(Math.random() * cfg.sounds.length)];
            this.playSfx(file);
        }, cfg.interval);
    },

    _stopZoneSfx() {
        if (this._zoneSfxInterval) { clearInterval(this._zoneSfxInterval); this._zoneSfxInterval = null; }
    },

    setPlayerZone(playerName, zoneIndex) {
        const revert = () => {
            const sel = document.querySelector(`.zone-select[onchange*="${playerName}"]`);
            if (sel) sel.value = this.playerZoneState[playerName] ?? 0;
        };
        // Blocco cambio zona finché un evento specifico non è stato cliccato
        const blockUntil = this.currentStage?.blockZoneChangeUntilEvent;
        if (blockUntil && !this.eventClickedState[blockUntil]) { revert(); return; }
        // Blocco cambio zona durante alert
        if (this.currentStage?.blockZoneChangeInAlert) {
            const anyAlert = this.stagePlayers?.some(p => this.markerState[p]?.alert);
            if (anyAlert) { revert(); return; }
        }
        // Vincolo adiacenza zone
        const adjacency = this.currentStage?.zoneAdjacency;
        const currentZone = this.playerZoneState[playerName] ?? 0;
        const targetZone = parseInt(zoneIndex);
        if (adjacency && !adjacency[currentZone]?.includes(targetZone) && targetZone !== currentZone) { revert(); return; }
        this.playerZoneState[playerName] = targetZone;
        // Suona il cambio zona solo per il giocatore corrente
        const isActive = this.stagePlayers?.length === 1
            ? true
            : (this.vrMode
                ? this.turnPhase === 'players' && this.selectedPlayerForTurn === playerName
                : this.turnPhase === 'players' && this.playerSubPhase === 'active' && this.selectedPlayerForTurn === playerName);
        if (isActive && this.vrMode && this.currentStage?.elevator) {
            const sfx = new Audio(this.currentStage.elevator);
            sfx.volume = this._sfxVol();
            sfx.play().catch(() => {});
        }
        // Cambia musica solo se è il giocatore attivo in questo momento (campagna)
        if (!this.vrMode && isActive) this._playMusicForZone(parseInt(zoneIndex), true);
        // Aggiorna pannello equipment se lo stage ha restrizioni di zona
        if (this.currentStage?.zoneRestrictions) this._refreshEquipmentPanel(playerName);
        // Se lo stage ha adiacenza zone, ricostruisce la card per aggiornare le opzioni disabled
        if (adjacency) this._rebuildPlayerCard(playerName);
        // Aggiorna disponibilità eventi (la zona del giocatore può sbloccarli)
        this._updateEventButtonsForTurn();
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
            if (c.cameraOnly && !this._stageHasCameras(stage, this.playerZoneState[playerName] ?? 0)) return;
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
            if (isCamera) setTimeout(() => this.triggerAlert(), 1000);
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
        // Scoperto: esce dallo scatolone
        if (this.boxState[playerName]) {
            this.boxState[playerName] = false;
            this._refreshEquipmentPanel(playerName);
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
        if (!anyAlert) {
            this._returnToNormal();
            // Se lo stage blocca le zone durante alert, ricostruisce la sidebar per sbloccarle
            if (this.currentStage?.blockZoneChangeInAlert) {
                this.buildPlayerSidebar(this.currentStage);
            }
        }
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
            const normalVolume = this._getMusicVolumeNum();
            if (this.vrMode) {
                const isSoloGrayFox = this.stagePlayers?.length === 1 && this.stagePlayers[0] === 'Gray Fox';
                const vrMusicKey = isSoloGrayFox ? 'ninja-vr' : (this.vrCurrentBossId ? 'mission-vr-boss' : 'mission-vr-training');
                const vrCfg = CONFIG.music[vrMusicKey];
                if (vrCfg) {
                    this.musicLoop = this.createSeamlessLoop(vrCfg.file, normalVolume, vrCfg.loopOverlap, this._cfgLoopPoints(vrCfg));
                    this.musicLoop.play();
                }
                return;
            }
            const stageIds = this.currentStage?.musicIds || [];
            const idToPlay = (this.lastMusicId && stageIds.includes(this.lastMusicId))
                ? this.lastMusicId
                : (stageIds[0] || null);
            if (idToPlay) this.playMusicAtVolume(idToPlay, normalVolume);
        });

        this.alertState = 'normal';
        this._inCameraSight = false;
        this.updateAlertButtons();
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
        this._popupMandatoryPlayers = stage.mandatoryPlayers || [];
        const autoSelected = players.filter(p => p === 'Snake' || this._popupMandatoryPlayers.includes(p));
        this._pendingSelectedPlayers = autoSelected.length ? autoSelected : [];

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
                const required = (!this._vrPopupMode && p === 'Snake') || (this._popupMandatoryPlayers || []).includes(p);
                return `<div class="player-chip${isSel ? ' selected' : ''}${required ? ' required' : ''}"
                    style="border-color:${color};color:${color}"
                    onclick="App._togglePopupPlayer('${p}')">◆ ${p}${required ? ' ✦' : ''}</div>`;
            }).join('');
        const startBtn = document.querySelector('.players-popup-start-btn');
        if (startBtn) startBtn.disabled = selected.length === 0;
    },

    _togglePopupPlayer(name) {
        if ((!this._vrPopupMode && name === 'Snake') || (this._popupMandatoryPlayers || []).includes(name)) return;
        const sel = this._pendingSelectedPlayers;
        const idx = sel.indexOf(name);
        if (idx === -1) sel.push(name);
        else if (sel.length > 1) sel.splice(idx, 1);
        this._renderPlayersPopupList();
    },

    startStageFromPopup() {
        const popup = document.getElementById('players-popup');
        if (popup) popup.style.display = 'none';

        // Modalità VR
        if (this._vrPopupMode) {
            if (!this._pendingSelectedPlayers?.length) return;
            const boss  = this._vrPendingBoss;
            const stage = this._vrPendingStage;
            this._vrPendingBoss  = null;
            this._vrPendingStage = null;
            // Mostra popup equipment se ci sono oggetti sbloccati
            const unlocked = this._getAllUnlockedEquip();
            const players  = this._pendingSelectedPlayers;
            const hasOwnerItems = players.some(p =>
                Object.values(EQUIPMENT).some(eq => eq.owner && [].concat(eq.owner).includes(p))
            );
            if (unlocked.length > 0 || hasOwnerItems) {
                this._showEquipmentPopup();
                // Dopo _doStartStage verrà chiamato il normale flusso;
                // intercettiamo il termine di _doStartStage impostando _vrPendingLaunch
                this._vrPendingLaunch = { boss, stage };
            } else {
                this._doLaunchVrStage(boss, stage);
            }
            return;
        }

        if (!this._pendingStageId || !this._pendingSelectedPlayers?.length) return;

        const unlocked  = this._getAllUnlockedEquip();
        const players   = this._pendingSelectedPlayers || [];
        const onlySnake = players.length === 1 && players[0] === 'Snake';
        if (unlocked.length > 0 || !onlySnake) {
            this._showEquipmentPopup();
        } else {
            this._doStartStage();
        }
    },

    _doStartStage() {
        const players = this._pendingSelectedPlayers;
        const isExtreme = this.session?.difficulty === 'EXTREME';
        const maxSlots  = isExtreme ? 2 : 3;
        if (this.session) this._persistSession();
        const stageId = this._pendingStageId;
        this._pendingStageId = null;
        this._pendingSelectedPlayers = null;
        this._popupAllPlayers = null;
        this.selectStage(stageId, players);
    },

    // ============================================
    // EQUIPMENT SELECTION POPUP
    // ============================================

    _showEquipmentPopup() {
        const players = this._pendingSelectedPlayers;

        const isExtreme = this.session?.difficulty === 'EXTREME';
        const maxSlots  = isExtreme ? 2 : 3;

        this.playerEquipment = {};
        this.playerAttachments = {};
        players.forEach(p => {
            this.playerEquipment[p]   = Array(maxSlots).fill(null);
            this.playerAttachments[p] = Array(maxSlots).fill(null);
        });

        this._renderEquipmentPopup();
        const stage = STAGES.find(s => s.id === this._pendingStageId);
        const notice = document.getElementById('equipment-popup-notice');
        if (notice) {
            const reqEq = stage?.requiredEquipment;
            if (reqEq) {
                const eqName = EQUIPMENT[reqEq]?.name || reqEq;
                notice.textContent = `⚠ Almeno 1 giocatore deve equipaggiare: ${reqEq} — ${eqName}`;
                notice.style.display = '';
            } else {
                notice.style.display = 'none';
                notice.textContent = '';
            }
        }
        document.getElementById('equipment-popup').style.display = 'flex';
    },

    _renderEquipmentPopup() {
        const players   = this._pendingSelectedPlayers;
        const unlocked  = this._getAllUnlockedEquip();
        const isExtreme = this.session?.difficulty === 'EXTREME';
        const maxSlots  = isExtreme ? 2 : 3;
        const content   = document.getElementById('equipment-popup-content');
        const n = players.length;
        content.className = `equipment-popup-content eq-layout-${n}`;
        const box = content.closest('.equipment-popup-box');
        if (box) box.className = `equipment-popup-box eq-box-${n}`;

        content.innerHTML = players.map(p => {
            const color   = this.PLAYER_COLORS[p] || 'var(--codec-green)';
            const slots   = (this.playerEquipment[p] || [null, null, null]).slice(0, maxSlots);

            const slotsHtml = slots.map((slotId, i) => {
                const isInactive = i > 0 && !slots[i - 1];
                const usedIds    = this._getAllUsedEquipment(p, i);
                // Include anche gli item con owner === p non ancora nell'unlocked pool
                const ownerItems = Object.keys(EQUIPMENT).filter(id => EQUIPMENT[id].owner && !EQUIPMENT[id].rewardOnly && [].concat(EQUIPMENT[id].owner).includes(p) && !unlocked.includes(id));
                const pool       = [...unlocked, ...ownerItems];
                const noWeapons  = !!(CHARACTERS[p]?.noWeapons);
                const baseEquip  = CHARACTERS[p]?.baseEquipment || [];
                const sortFn = (a, b) => {
                    const ai = baseEquip.indexOf(a), bi = baseEquip.indexOf(b);
                    if (ai !== -1 && bi !== -1) return ai - bi;
                    if (ai !== -1) return -1;
                    if (bi !== -1) return 1;
                    return a.localeCompare(b, undefined, { numeric: true });
                };
                const eligible = pool.filter(id =>
                    (!EQUIPMENT[id].owner || [].concat(EQUIPMENT[id].owner).includes(p))
                    && !EQUIPMENT[id].stageOnly
                    && !EQUIPMENT[id].attachesTo
                    && !(noWeapons && EQUIPMENT[id].type === 'weapon'));
                const available = eligible.filter(id => !usedIds.has(id)).sort(sortFn);
                const takenElsewhere = eligible.filter(id => usedIds.has(id) && id !== slotId).sort(sortFn);

                const ddId = `eq-dd-${p}-${i}`;
                const allOpts = [
                    { value: '', label: '— nessuno —', taken: false },
                    ...available.map(id => ({ value: id, label: `${id} — ${EQUIPMENT[id]?.name || id}`, taken: false })),
                    ...(slotId && !available.includes(slotId) && !takenElsewhere.find(x => x === slotId) && !EQUIPMENT[slotId]?.attachesTo
                        ? [{ value: slotId, label: `${slotId} — ${EQUIPMENT[slotId]?.name || slotId}`, taken: false }]
                        : []),
                    ...takenElsewhere.map(id => ({ value: id, label: `${id} — ${EQUIPMENT[id]?.name || id}`, taken: true })),
                ];
                const selectedLabel = slotId
                    ? (allOpts.find(o => o.value === slotId)?.label || slotId)
                    : '— nessuno —';
                const optionsHtml = allOpts.map((o, j) => `
                    <li class="eq-dd-option${o.value === slotId ? ' selected' : ''}${o.taken ? ' eq-dd-option-taken' : ''}"
                        data-value="${o.value}"
                        onmouseenter="App._eqDdHover('${ddId}', ${j})"
                        onmousedown="event.preventDefault();App._eqDdSelect('${p}', ${i}, '${o.value}')">
                        ${o.label}
                    </li>`).join('');

                // Checkbox attachment: appare solo se lo slot ha un'arma con subtype corrispondente
                const slotEq = slotId ? EQUIPMENT[slotId] : null;
                const attachCheckboxes = slotEq ? pool
                    .filter(id => EQUIPMENT[id]?.attachesTo === slotEq.itemSubtype)
                    .map(id => {
                        const att = EQUIPMENT[id];
                        const isChecked = this.playerAttachments[p]?.[i] === id;
                        // Disabilita se già usato altrove (un'altra slot/giocatore)
                        const usedElsewhere = !isChecked && Object.entries(this.playerAttachments).some(
                            ([op, slots]) => slots?.some((v, oi) => v === id && !(op === p && oi === i))
                        );
                        return `<label class="eq-attachment-check${usedElsewhere ? ' disabled' : ''}">
                            <input type="checkbox" ${isChecked ? 'checked' : ''} ${usedElsewhere ? 'disabled' : ''}
                                onchange="App._toggleAttachment('${p}',${i},'${id}',this.checked)">
                            ${att.name}
                        </label>`;
                    }).join('') : '';

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
                    ${attachCheckboxes}
                </div>`;
            }).join('');

            return `<div class="eq-player-block" style="--player-color:${color}">
                <div class="eq-player-name" style="color:${color}">◆ ${p.toUpperCase()}</div>
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
        full:     'audio/sfx/oggetto-full.wav',
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

    _toggleAttachment(playerName, slotIndex, itemId, checked) {
        if (!this.playerAttachments[playerName]) {
            const maxSlots = this.session?.difficulty === 'EXTREME' ? 2 : 3;
            this.playerAttachments[playerName] = Array(maxSlots).fill(null);
        }
        this.playerAttachments[playerName][slotIndex] = checked ? itemId : null;
        this._renderEquipmentPopup();
    },

    _eqDdSelect(playerName, slotIndex, value) {
        const ddId = `eq-dd-${playerName}-${slotIndex}`;
        // Blocca se l'item è già equipaggiato da qualcun altro
        if (value) {
            const usedIds = this._getAllUsedEquipment(playerName, slotIndex);
            if (usedIds.has(value)) {
                this._eqDdClose(ddId, false);
                this._playEquipSound('full');
                return;
            }
        }
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
        const stage = STAGES.find(s => s.id === this._pendingStageId);
        const reqEq = stage?.requiredEquipment;
        if (reqEq) {
            const players = this._pendingSelectedPlayers || [];
            const hasIt = players.some(p =>
                (this.playerEquipment[p] || []).includes(reqEq)
            );
            if (!hasIt) {
                const notice = document.getElementById('equipment-popup-notice');
                if (notice) {
                    notice.style.display = '';
                    notice.classList.remove('equipment-popup-notice-shake');
                    void notice.offsetWidth;
                    notice.classList.add('equipment-popup-notice-shake');
                }
                return;
            }
        }
        document.getElementById('equipment-popup').style.display = 'none';
        if (this._vrPendingLaunch) {
            const { boss, stage } = this._vrPendingLaunch;
            this._vrPendingLaunch = null;
            this._doLaunchVrStage(boss, stage);
            return;
        }
        this._doStartStage();
    },

    triggerAlert() {
        if (!this.vrMode && (!this.currentStage || this._isEffectiveBoss(this.currentStage))) return;
        const sounds = CONFIG.alertSounds;

        if (this.alertState === 'normal') {
            this.trackStat('alerts');
            const vol = this._getMusicVolumeNum();
            this.stopMusic();

            // Partono subito entrambi i loop: alert a volume pieno, evasion a volume 0.
            // Il passaggio tra i due è solo un crossfade di volume, senza creazioni on-demand.
            const alertCfg   = CONFIG.music[this.vrMode ? 'encounter-vr' : 'encounter'];
            const evasionCfg = CONFIG.music[this.vrMode ? 'evasion-vr'   : 'evasion'];

            if (this.alertLoop)   { this.alertLoop.stop();   this.alertLoop   = null; }
            if (this.evasionLoop) { this.evasionLoop.stop(); this.evasionLoop = null; }

            this.alertLoop   = this.createSeamlessLoop(alertCfg.file,   vol, alertCfg.loopOverlap,   this._cfgLoopPoints(alertCfg));
            this.evasionLoop = this.createSeamlessLoop(evasionCfg.file, 0,   evasionCfg.loopOverlap, this._cfgLoopPoints(evasionCfg));
            this.alertLoop.play();
            this.evasionLoop.play();

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

        // evasionLoop è già in riproduzione (a volume 0): basta fare il crossfade.
        const vol = this._getAlertVolumeNum();
        this.crossfadeLoops(this.alertLoop, this.evasionLoop, vol);

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
        const isAlert = this.alertState !== 'normal';
        document.querySelectorAll('#music-buttons .btn-sound').forEach(btn => {
            btn.classList.toggle('btn-disabled', isAlert);
        });

        const btnAlert = document.getElementById('btn-alert');
        const btnEvasion = document.getElementById('btn-evasion');
        const btnReturn = document.getElementById('btn-return');
        if (!btnAlert || !btnEvasion || !btnReturn) return;

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

    showGameOverConfirm() {
        const popup = document.getElementById('gameover-confirm-popup');
        if (popup) {
            popup.style.display = 'flex';
            popup.querySelector('[autofocus]')?.focus();
        }
    },

    cancelGameOverConfirm() {
        const popup = document.getElementById('gameover-confirm-popup');
        if (popup) popup.style.display = 'none';
    },

    confirmGameOver() {
        const popup = document.getElementById('gameover-confirm-popup');
        if (popup) popup.style.display = 'none';
        if (this.vrMode) {
            const cfg = CONFIG.vrSounds['tempo-scaduto'];
            if (cfg) {
                const a = new Audio(cfg.file);
                a.volume = this._sfxVol();
                a.onended = () => this.triggerGameOver();
                a.play().catch(() => this.triggerGameOver());
                return;
            }
        }
        this.triggerGameOver();
    },

    triggerGameOver(specificSoundId = null) {
        if (!this.currentStage) return;
        this.stopMusic();
        this.stopAlertSystem();
        this.trackStat('continues');
        this._lockStage(true);
        // In VR usa sempre l'audio 19
        if (this.vrMode) specificSoundId = '19';
        // Suono specifico (es. morte Meryl) oppure random dal pool dello stage
        const pool = this.currentStage.gameOverSounds || CONFIG.gameOverSounds;
        if (pool && pool.length > 0 || specificSoundId) {
            const id = specificSoundId || pool[Math.floor(Math.random() * pool.length)];
            const file = id.includes('/') ? id : `${CONFIG.gameOverSoundsPath}${id}.mp3`;
            const triggerAt = CONFIG.gameOverSoundsTiming?.[id] ?? 4;
            const video = document.getElementById('video-player');
            let soundPlayed = false;
            const onTimeUpdate = () => {
                if (!soundPlayed && video.currentTime >= triggerAt) {
                    soundPlayed = true;
                    video.removeEventListener('timeupdate', onTimeUpdate);
                    this._gameOverSoundListener = null;
                    this.playSfx(file);
                }
            };
            this._gameOverSoundListener = onTimeUpdate;
            video.addEventListener('timeupdate', onTimeUpdate);
        }
        // Video Game Over — al termine o stop manuale: se non ancora salvato → Mei Ling, altrimenti personaggi
        const stageAtGameOver = this.currentStage;
        const vrBossIdAtGameOver = this.vrCurrentBossId;
        const vrStageIdAtGameOver = this.vrCurrentStageId;
        this._pendingVideoEndCallback = () => {
            this.hidePlayerSidebar();
            // In VR: niente schermata salvataggio, si riparte dalla selezione giocatori
            if (this.vrMode) {
                const boss = vrBossIdAtGameOver ? VR_CONFIG.bosses.find(b => b.id === vrBossIdAtGameOver) : null;
                const vrStage = VR_CONFIG.stages.find(s => s.id === vrStageIdAtGameOver);
                if (vrStage) this._showVrPlayersPopup(boss, vrStage);
                return;
            }
            const savedFor = this.session?.savedForStage ?? 0;
            if (savedFor >= stageAtGameOver.id) {
                this.showPlayersPopup(stageAtGameOver);
            } else if (stageAtGameOver.id === 1 || stageAtGameOver.id === 2 || stageAtGameOver.id === 14) {
                // Stage 1: nessun save screen prima del primo stage
                // Stage 2 e 14: il salvataggio scatta dopo l'intro, non prima dei personaggi
                this.showPlayersPopup(stageAtGameOver);
            } else {
                this._triggerInlineSave(stageAtGameOver);
            }
        };
        this.setActiveVideoBtn(document.getElementById('btn-game-over'));
        this.playVideo('video/Game_Over.mp4');
    },

    _sfxPool: {},

    // Riproduce un file audio una volta sola via Web Audio API e chiama onEnded al termine.
    // Fallback su HTML5 Audio se il buffer non è ancora in cache.
    _playSfxOnce(file, onEnded) {
        const play = (buffer) => {
            try {
                if (this._audioCtx.state === 'suspended') this._audioCtx.resume();
                const src = this._audioCtx.createBufferSource();
                src.buffer = buffer;
                src.connect(this._audioCtx.destination);
                if (onEnded) src.onended = onEnded;
                src.start(0);
            } catch(e) {
                console.warn('_playSfxOnce WAA:', e);
                onEnded?.();
            }
        };
        if (this._audioCtx && this._bufferCache[file]) {
            play(this._bufferCache[file]);
        } else if (this._audioCtx) {
            this._loadBuffer(file).then(play).catch(() => onEnded?.());
        } else {
            // Fallback HTML5
            const a = new Audio(file);
            if (onEnded) a.addEventListener('ended', onEnded, { once: true });
            a.play().catch(() => onEnded?.());
        }
    },

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
                if (sfx.thenVideo) {
                    // Suona l'audio una volta, poi avvia il video (volume musica → 0), poi (opzionale) un altro audio
                    this._playSfxOnce(sfx.file, () => {
                        if (this.currentStage !== stage) return;
                        // Porta il volume a 0 senza fermare il loop; stopVideo lo ripristinerà via _eventMusicRestore
                        if (this.musicLoop && this.musicLoop.isPlaying()) {
                            this._eventMusicRestore = this.musicLoop.getVolume();
                            this.musicLoop.setVolume(0);
                        }
                        if (sfx.thenSfx) {
                            this._pendingVideoEndCallback = () => {
                                if (this.currentStage === stage) this._playSfxOnce(sfx.thenSfx);
                            };
                        }
                        this.playVideo(sfx.thenVideo);
                    });
                } else {
                    this.playSfx(sfx.file, null, sfx.volume);
                    if (sfx.interval) {
                        const id = setInterval(() => {
                            if (this.currentStage !== stage) { clearInterval(id); return; }
                            this.playSfx(sfx.file, null, sfx.volume);
                        }, sfx.interval);
                        this._sfxOnMusicStartTimers.push({ type: 'interval', id });
                    }
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
        // Score screen
        if (this.currentScreen === 'score-screen') {
            const scoreSavePopup = document.getElementById('score-save-popup');
            const popupOpen = scoreSavePopup && scoreSavePopup.style.display !== 'none';
            if (popupOpen) {
                if (e.key === 'Escape') { scoreSavePopup.style.display = 'none'; e.preventDefault(); }
                return;
            }
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.promptScoreSave();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.showScreen('main-menu');
            }
            return;
        }

        // Inline save popup: intercetta prima di tutto
        const inlineSavePopup = document.getElementById('inline-save-question');
        if (inlineSavePopup && inlineSavePopup.style.display !== 'none') {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                e.preventDefault();
                this._inlineSaveFocus(this._inlineSaveFocused === 'yes' ? 'no' : 'yes');
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (this._inlineSaveFocused === 'yes') this._inlineSaveYes();
                else this._inlineSaveNo();
            }
            return;
        }

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
    VR_STATE_KEY: 'mgs_vr_state',
    MEMORY_BOX_KEY: 'MGS_MEMORY_BOX',
    _vrState: null,

    initSession() {
        const raw = localStorage.getItem(this.SESSION_KEY);
        this.session = raw ? { ...this._newSession(), ...JSON.parse(raw) } : this._newSession();
        this._loadVrState();
        // Migrazione: rimuovi dalla sessione gli equip ora tracciati in VR state
        this._deduplicateVrEquipFromSession();
    },

    _deduplicateVrEquipFromSession() {
        const vrEquip = this._vrState?.vrUnlockedEquipment || [];
        if (!vrEquip.length || !this.session?.unlockedEquipment?.length) return;
        const before = this.session.unlockedEquipment.length;
        this.session.unlockedEquipment = this.session.unlockedEquipment.filter(id => !vrEquip.includes(id));
        if (this.session.unlockedEquipment.length !== before) this._persistSession();
    },

    _loadVrState() {
        const raw = localStorage.getItem(this.VR_STATE_KEY);
        const defaults = { vrCompleted: {}, vrRewards: {}, vrLeaderboard: {}, vrUnlockedEquipment: [] };
        this._vrState = raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
    },

    _saveVrState() {
        localStorage.setItem(this.VR_STATE_KEY, JSON.stringify(this._vrState));
    },

    // Persiste gli equipaggiamenti della sessione corrente nel VR state globale
    // Da chiamare ogni volta che si sblocca un equip in campagna
    _syncCampaignEquipToVrState() {
        if (!this._vrState || !this.session) return;
        const pool   = this.session.unlockedEquipment || [];
        const vrEquip = this._vrState.vrUnlockedEquipment || (this._vrState.vrUnlockedEquipment = []);
        let changed = false;
        pool.forEach(id => { if (!vrEquip.includes(id)) { vrEquip.push(id); changed = true; } });
        if (changed) this._saveVrState();
    },

    // ============================================
    // MEMORY BOX — storage globale equipaggiamenti
    // ============================================
    _getMemoryBox() {
        const raw = localStorage.getItem(this.MEMORY_BOX_KEY);
        return raw ? JSON.parse(raw) : [];
    },
    _saveMemoryBox(ids) {
        localStorage.setItem(this.MEMORY_BOX_KEY, JSON.stringify(ids));
    },
    _addToMemoryBox(...ids) {
        const box = this._getMemoryBox();
        ids.forEach(id => { if (/^\d{3}$/.test(id) && !box.includes(id)) box.push(id); });
        this._saveMemoryBox(box);
    },

    // Restituisce la lista dalla Memory Box globale
    _getAllUnlockedEquip() {
        return this._getMemoryBox();
    },

    // VR equipment è letto dinamicamente da _vrState in _getAllUnlockedEquip — nessuna azione necessaria
    _mergeVrEquipIntoSession() {},

    _newSession() {
        return {
            stage: 1,
            difficulty: '',
            savedForStage: 0,    // ultimo stage per cui è stato effettuato un salvataggio
            alerts: 0,
            kills: 0,
            kills_silent: 0,
            rations_used: 0,
            continues: 0,
            saves: 0,
            rounds: 0,
            trappola: false,
            bandana_used: false,
            mimetica_used: false,
            startTime: new Date().toISOString(),
            timestamp: new Date().toISOString(),
            // Campagna: persistono tra gli stage
            unlockedEquipment: [],   // ID equipaggiamenti sbloccati attraverso le ricompense (campagna + VR merge)
        };
    },

    _persistSession() {
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(this.session));
    },

    trackStat(stat) {
        if (!this.session || !(stat in this.session)) return;
        this.session[stat]++;
        this._persistSession();
        if (this.showSessionStats) {
            const block = document.querySelector('.session-stats-block');
            if (block) block.outerHTML = this._buildSessionStatsHtml();
        }
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
        this.session = { ...this._newSession(), ...block };
        this._mergeVrEquipIntoSession();
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
        const unlockTabs = () => {
            document.querySelectorAll('.card-tab').forEach(t => { t.disabled = false; });
        };
        if (this._skipSaveIntroVideo) {
            this._skipSaveIntroVideo = false;
            unlockTabs();
            this.focusCard(1);
            return;
        }
        const sc = CONFIG.saveScreen || {};
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
        const isInline = this._inInlineSaveMode;
        const postScreen = this._postSaveScreen;
        this._postSaveScreen = null;
        const src = (isInline && this._inlineSaveVideoPath('save')) || this._randomSaveVideo(CONFIG.saveScreen && CONFIG.saveScreen.outro);
        const onEnd = () => {
            this._saveOutroActive = false;
            if (isInline) {
                this._afterInlineSaveComplete();
            } else if (postScreen === 'intro') {
                this.startIntroVideo();
            } else if (postScreen === 'main-menu') {
                this.goToMainMenu();
            } else if (postScreen) {
                this.cardReturnScreen = 'main-menu';
                this.showScreen(postScreen);
            } else {
                this.cardReturnScreen = 'main-menu';
                this.showScreen('stage-active');
            }
        };
        if (!src) { onEnd(); return; }
        const returnTo = this.cardReturnScreen;
        this._saveOutroActive = (returnTo === 'stage-active') || isInline;
        this.setActiveVideoBtn(document.getElementById('save-btn-outro'));
        this._playSaveVideo(src, (returnTo === 'stage-active' || isInline || postScreen) ? onEnd : null);
    },

    _playNotSaveOutro() {
        if (this._inInlineSaveMode) { this._inlineSaveNo(); return; }
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
            player.onerror = null;
            player.src = src;
            player.style.display = 'block';
            player.play().catch(e => console.warn('Save video:', e.message));
            player.onended = () => {
                this._saveVideoEnding = true;
                this.stopSaveVideo();
                this._saveVideoEnding = false;
                if (onEnd) onEnd();
            };
            player.onerror = () => {
                player.onerror = null;
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
            if (wasSaveOutro && this._inInlineSaveMode) {
                this._afterInlineSaveComplete();
            } else {
                this.cardReturnScreen = 'main-menu';
                this.showScreen('stage-active');
            }
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
                    if (this._inInlineSaveMode) {
                        this._afterInlineSaveComplete();
                    } else {
                        this.cardReturnScreen = 'main-menu';
                        this.showScreen('stage-active');
                    }
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
        // Sblocca EXTREME se almeno un salvataggio ha la bandana (023) tra gli equipment sbloccati
        const hasBandanaInAnyCard = [1, 2].some(cardNum => {
            const card = this._getCard(cardNum);
            return Object.values(card).some(block =>
                Array.isArray(block?.unlockedEquipment) && block.unlockedEquipment.includes('023')
            );
        });
        if (hasBandanaInAnyCard) {
            localStorage.setItem('mgs_extreme_unlocked', '1');
        }
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
            const unlocked = this._getAllUnlockedEquip();
            if (unlocked.length > 0) {
                this._pendingStageId = 1;
                this._pendingSelectedPlayers = ['Snake'];
                this._showEquipmentPopup();
            } else {
                this.selectStage(1);
            }
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

    _blockRightHtml(block) {
        const disc = (block.stage >= 12) ? 'DISC II' : 'DISC I';
        const diff = block.difficulty || 'NORMAL';
        const rounds = block.rounds || 0;
        const hh = String(Math.floor(rounds / 60)).padStart(2, '0');
        const mm = String(rounds % 60).padStart(2, '0');
        return `<div class="block-right">
            <span class="block-disc">${disc}</span>
            <span class="block-difficulty">${diff}</span>
            <span class="block-time">${hh}:${mm}</span>
        </div>`;
    },

    _vrProgress() {
        const vr = this._vrState;
        if (!vr) return 0;
        const completed = Object.values(vr.vrCompleted || {}).filter(Boolean).length;
        const rewards   = Object.keys(vr.vrRewards || {}).filter(k => k !== 'bonus' && vr.vrRewards[k]).length;
        const bonus     = vr.vrRewards?.bonus ? 1 : 0;
        const raw = completed * 2.4 + rewards * 1.1 + bonus * 1.5;
        return raw === 0 ? 0 : Math.min(100, Math.round(raw * 10) / 10);
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
                    rows.push(`<div class="card-block-wrap">
                        <div class="card-block used${focCls}" id="card-block-${id}" onclick="App.selectBlock('${id}')" onmouseover="App.focusBlock('${id}')">
                            <div class="block-left">
                                <div class="block-left-campaign">
                                    <span class="block-num">BLOCK ${num}</span>
                                    <span class="block-stage-name">${stageName}</span>
                                </div>
                            </div>
                            ${this._blockRightHtml(block)}
                        </div>
                        <button class="block-delete-btn" title="Cancella" onclick="App._promptDeleteBlock('${id}')"></button>
                    </div>`);
                } else if (!firstEmptyFound) {
                    firstEmptyFound = true;
                    const focCls = this.focusedBlock === id ? ' focused' : '';
                    this._visibleBlockIds.push(id);
                    rows.push(`<div class="card-block empty new-block${focCls}" id="card-block-${id}" onclick="App.selectBlock('${id}')" onmouseover="App.focusBlock('${id}')">
                        <div class="block-left">
                            <span class="block-num">BLOCK ${num}</span>
                            <span class="block-new">[NEW BLOCK]</span>
                        </div>
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
                let leftContent = '';
                if (block) {
                    const stage = STAGES.find(s => s.id === block.stage);
                    const stageName = stage ? stage.name : `STAGE ${String(block.stage).padStart(2, '0')}`;
                    const date = new Date(block.timestamp).toLocaleDateString('it-IT');
                    leftContent = `<span class="block-stage">${stageName}</span>
                                   <span class="block-date">${date}</span>`;
                } else {
                    leftContent = `<span class="block-empty">— VUOTO —</span>`;
                }
                const hoverAttr = block ? ` onmouseover="App.focusBlock('${id}')"` : '';
                const blockHtml = `<div class="card-block ${block ? 'used' : 'empty'} ${disabledClass}"
                            id="card-block-${id}" onclick="App.selectBlock('${id}')"${hoverAttr}>
                            <div class="block-left">
                                <div class="block-left-campaign">
                                    <span class="block-num">BLOCK ${String(i + 1).padStart(2, '0')}</span>
                                    ${leftContent}
                                </div>
                            </div>
                            ${block ? this._blockRightHtml(block) : ''}
                        </div>`;
                if (block) {
                    return `<div class="card-block-wrap">${blockHtml}<button class="block-delete-btn" title="Cancella" onclick="App._promptDeleteBlock('${id}')"></button></div>`;
                }
                return blockHtml;
            }).join('');
        }
    },

    _promptDeleteBlock(blockId) {
        this._pendingDeleteBlock = blockId;
        const popup = document.getElementById('delete-block-popup');
        if (popup) popup.style.display = 'flex';
    },

    _confirmDeleteBlock() {
        const popup = document.getElementById('delete-block-popup');
        if (popup) popup.style.display = 'none';
        const blockId = this._pendingDeleteBlock;
        this._pendingDeleteBlock = null;
        if (!blockId) return;

        const card = this._getCard(this.selectedCard);

        // Trova l'indice del blocco eliminato (es. block_03 → 3)
        const deletedNum = parseInt(blockId.replace('block_', ''), 10);

        // Fai slittare tutti i blocchi successivi di una posizione
        for (let i = deletedNum; i < 15; i++) {
            const current = `block_${String(i).padStart(2, '0')}`;
            const next    = `block_${String(i + 1).padStart(2, '0')}`;
            if (card[next]) {
                card[current] = card[next];
            } else {
                delete card[current];
                break;
            }
        }

        this._setCard(this.selectedCard, card);
        this._buildCardBlocks();
    },

    _cancelDeleteBlock() {
        this._pendingDeleteBlock = null;
        document.getElementById('delete-block-popup').style.display = 'none';
    },

    selectBlock(blockId) {
        const block = this._getCard(this.selectedCard)[blockId];
        if (this.cardScreenMode === 'save') {
            if (block) {
                // Blocco occupato: chiedi conferma sovrascrittura
                this.playSfx(CONFIG.menuSounds['confirm-save'].file);
                this.selectedBlock = blockId;
                document.querySelectorAll('.card-block').forEach(el => el.classList.remove('selected'));
                document.getElementById(`card-block-${blockId}`)?.classList.add('selected');
                const confirmArea = document.getElementById('block-confirm-area');
                if (!confirmArea) return;
                confirmArea.innerHTML = `
                    <span class="confirm-msg">Sovrascrivere il salvataggio?</span>
                    <button class="btn-codec btn-small" onclick="App.confirmBlock()"><span class="btn-inner">✓ CONFERMA</span></button>
                    <button class="btn-codec btn-small btn-stop" onclick="App.cancelBlock()"><span class="btn-inner">✗ ANNULLA</span></button>
                `;
                confirmArea.style.display = '';
            } else {
                // Blocco vuoto: salva direttamente
                this._doSave(blockId);
            }
            return;
        }
        // Load mode: chiedi conferma
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
        // Aggiorna stage e savedForStage con il prossimo stage (quello che si sta per iniziare)
        if (this._inInlineSaveMode && this.session) {
            const targetId = this._inlineSaveNextStage?.id ?? this.session.stage;
            if (targetId) {
                this.session.stage = targetId;
                this.session.savedForStage = targetId;
            }
        }
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
            setTimeout(() => {
                const stage = STAGES.find(s => s.id === this.session.stage);
                if (!stage) return;
                // Rendi visibile stage-active (players-popup è dentro questo screen)
                // senza inizializzarlo — il popup apparirà sopra e poi selectStage farà tutto
                const sa = document.getElementById('stage-active');
                if (sa) sa.classList.add('active');
                this.currentScreen = 'stage-active';
                this.showPlayersPopup(stage);
            }, 2000);
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

        // Cursore personalizzato globale
        document.addEventListener('mousemove', (e) => {
            const cursor = document.getElementById('mantis-cursor');
            if (cursor) { cursor.style.left = e.clientX + 'px'; cursor.style.top = e.clientY + 'px'; }
        });

        // Preload suoni menu e VR nel pool per riproduzione immediata
        [...Object.values(CONFIG.menuSounds), ...Object.values(CONFIG.vrSounds)].forEach(s => {
            const a = new Audio(s.file);
            a.preload = 'auto';
            a.load();
            this._sfxPool[s.file] = a;
        });
    },

    // ============================================
    // VR TRAINING
    // ============================================

    showVrCardScreen() {
        this._goToVrMenu();
    },

    _goToVrMenu() {
        this.vrNav = { level: 'top', bossId: null };
        this._renderVrScreen();
        this.showScreen('vr-screen');
    },

    _renderVrScreen() {
        this._renderVrBreadcrumb();
        this._renderVrContent();
    },

    _renderVrBreadcrumb() {
        const bar = document.getElementById('vr-breadcrumb-bar');
        if (!bar) return;
        const { level, bossId } = this.vrNav;
        const boss = bossId ? VR_CONFIG.bosses.find(b => b.id === bossId) : null;
        const lines = [{ label: 'VR TRAINING', depth: 0 }];
        if (level === 'bosslist' || level === 'stagelist' || level === 'training') {
            lines.push({ label: level === 'training' ? 'TRAINING MODE' : 'BOSS VARIANT', depth: 1 });
        }
        if ((level === 'stagelist') && boss) {
            lines.push({ label: boss.name, depth: 2 });
        }
        bar.innerHTML = lines.map((l, i) => {
            const isLast = i === lines.length - 1;
            const indent = '&nbsp;'.repeat(l.depth * 4);
            return `<div class="vr-breadcrumb-line${isLast ? ' active' : ''}">
                ${indent}<span class="vr-bc-arrow">${isLast ? '▶' : '◆'}</span> ${l.label}
            </div>`;
        }).join('');
    },

    _renderVrContent() {
        const { level, bossId } = this.vrNav;
        const content = document.getElementById('vr-menu-content');
        if (!content) return;
        if (level === 'top') {
            this._renderVrTop(content);
        } else if (level === 'bosslist') {
            this._renderVrBossList(content);
        } else if (level === 'stagelist') {
            this._renderVrStageList(content, bossId);
        } else if (level === 'training') {
            this._renderVrTraining(content);
        }
    },

    _vrSequentialRender(parentEl, htmlItems, onDone) {
        const elenco = CONFIG.vrSounds['elenco'];
        const playElenco = () => {
            if (elenco) { const a = new Audio(elenco.file); a.volume = this._sfxVol(); a.play().catch(() => {}); }
        };
        // Append all items hidden immediately to reserve layout space
        const elements = htmlItems.map(html => {
            const tmp = document.createElement('div');
            tmp.innerHTML = html.trim();
            const el = tmp.firstElementChild || tmp;
            el.style.visibility = 'hidden';
            parentEl.appendChild(el);
            return el;
        });
        // After 1s, reveal one by one every 250ms with elenco sound
        let i = 0;
        const revealNext = () => {
            if (i >= elements.length) { if (onDone) onDone(); return; }
            elements[i].style.visibility = '';
            playElenco();
            i++;
            if (i < elements.length) setTimeout(revealNext, 200);
            else if (onDone) onDone();
        };
        setTimeout(revealNext, 1000);
    },

    _renderVrTop(content) {
        const totalStages = VR_CONFIG.stages.length;
        const trainingDone = VR_CONFIG.stages.filter(s => this._vrState?.vrCompleted?.[`training_${s.id}`]).length;
        const pct = this._vrProgress();
        content.innerHTML = '';
        const listEl = document.createElement('div');
        listEl.className = 'vr-menu-list';
        content.appendChild(listEl);
        const items = [
            `<div class="vr-menu-item" onclick="App._vrNavTo('training')" onmouseenter="App.playSfx(CONFIG.menuSounds['choice'].file)">
                <span class="vr-item-arrow">▶</span>
                <span class="vr-item-label">TRAINING MODE</span>
                <span class="vr-item-info">${trainingDone}/${totalStages}</span>
            </div>`,
            `<div class="vr-menu-item" onclick="App._vrNavTo('bosslist')" onmouseenter="App.playSfx(CONFIG.menuSounds['choice'].file)">
                <span class="vr-item-arrow">▶</span>
                <span class="vr-item-label">BOSS VARIANT</span>
                <span class="vr-item-info">${VR_CONFIG.bosses.length} boss</span>
            </div>`,
        ];
        this._vrSequentialRender(listEl, items, () => {
            const progressEl = document.createElement('div');
            progressEl.className = 'vr-progress-bar-wrap';
            progressEl.innerHTML = `
                <div class="vr-progress-label">PROGRESS</div>
                <div class="vr-progress-track">
                    <div class="vr-progress-fill" style="width:${pct}%"></div>
                </div>
                <div class="vr-progress-pct">${pct} %</div>
                <button class="vr-reset-btn" title="Azzera progresso VR" onclick="App._promptResetVrState()"></button>`;
            content.appendChild(progressEl);
        });
    },

    _renderVrBossList(content) {
        const total = VR_CONFIG.stages.length;
        content.innerHTML = '';
        const listEl = document.createElement('div');
        listEl.className = 'vr-menu-list';
        content.appendChild(listEl);
        const items = VR_CONFIG.bosses.map(boss => {
            const completed = VR_CONFIG.stages.filter(s => this._vrState?.vrCompleted?.[`boss_${boss.id}_${s.id}`]).length;
            return `<div class="vr-menu-item" onclick="App._vrNavTo('stagelist','${boss.id}')" onmouseenter="App.playSfx(CONFIG.menuSounds['choice'].file)">
                <span class="vr-item-arrow">▶</span>
                <span class="vr-item-label">${boss.name}</span>
                <span class="vr-item-info">${completed}/${total}</span>
            </div>`;
        });
        this._vrSequentialRender(listEl, items);
    },

    _renderVrStageList(content, bossId) {
        const boss = VR_CONFIG.bosses.find(b => b.id === bossId);
        if (!boss) return;
        content.innerHTML = '';
        const listEl = document.createElement('div');
        listEl.className = 'vr-stage-list';
        content.appendChild(listEl);
        const items = VR_CONFIG.stages.map((stage, idx) => {
            const key = `boss_${boss.id}_${stage.id}`;
            const done = !!(this._vrState?.vrCompleted?.[key]);
            const unlocked = this.vrUnlockAll || done
                || idx === 0
                || !!(this._vrState?.vrCompleted?.[`boss_${boss.id}_${VR_CONFIG.stages[idx - 1]?.id}`]);
            const cls = done ? ' vr-stage-done' : (!unlocked ? ' vr-stage-locked' : '');
            const badge = done ? '<span class="vr-stage-check">✓</span>' : (!unlocked ? '<span class="vr-stage-lock">■</span>' : '');
            const click = unlocked ? `onclick="App.launchVrStage('${boss.id}',${stage.id})" onmouseenter="App.playSfx(CONFIG.menuSounds['choice'].file)"` : '';
            return `<div class="vr-stage-item${cls}" ${click}>
                <span class="vr-stage-num">${String(stage.vrIndex ?? stage.id % 100).padStart(2,'0')}</span>
                <span class="vr-stage-name">${stage.name}</span>
                ${badge}
                ${unlocked ? this._vrLeaderboardHtml(`boss_${boss.id}_${stage.id}`, stage.id) : ''}
            </div>`;
        });
        this._vrSequentialRender(listEl, items);
    },

    _renderVrTraining(content) {
        content.innerHTML = '';
        const listEl = document.createElement('div');
        listEl.className = 'vr-stage-list';
        content.appendChild(listEl);
        const items = VR_CONFIG.stages.map((stage, idx) => {
            const key = `training_${stage.id}`;
            const done = !!(this._vrState?.vrCompleted?.[key]);
            const unlocked = this.vrUnlockAll || done
                || idx === 0
                || !!(this._vrState?.vrCompleted?.[`training_${VR_CONFIG.stages[idx - 1]?.id}`]);
            const cls = done ? ' vr-stage-done' : (!unlocked ? ' vr-stage-locked' : '');
            const badge = done ? '<span class="vr-stage-check">✓</span>' : (!unlocked ? '<span class="vr-stage-lock">■</span>' : '');
            const click = unlocked ? `onclick="App.launchVrStage(null,${stage.id})" onmouseenter="App.playSfx(CONFIG.menuSounds['choice'].file)"` : '';
            return `<div class="vr-stage-item${cls}" ${click}>
                <span class="vr-stage-num">${String(stage.vrIndex ?? stage.id % 100).padStart(2,'0')}</span>
                <span class="vr-stage-name">${stage.name}</span>
                ${badge}
                ${unlocked ? this._vrLeaderboardHtml(`training_${stage.id}`, stage.id) : ''}
            </div>`;
        });
        this._vrSequentialRender(listEl, items);
    },

    _vrNavTo(level, bossId = null, silent = false) {
        if (!silent) this.playSfx(CONFIG.vrSounds['confirm'].file);
        this.vrNav = { level, bossId };
        this._renderVrScreen();
    },

    vrBack() {
        const { level } = this.vrNav;
        this.playSfx(CONFIG.vrSounds['return'].file);
        if (level === 'top') {
            this.goToMainMenu();
        } else if (level === 'bosslist' || level === 'training') {
            this._vrNavTo('top', null, true);
        } else if (level === 'stagelist') {
            this._vrNavTo('bosslist', null, true);
        }
    },

    launchVrStage(bossId, stageId) {
        const stage = VR_CONFIG.stages.find(s => s.id === stageId);
        if (!stage) return;
        const boss = bossId ? VR_CONFIG.bosses.find(b => b.id === bossId) : null;
        this.vrCurrentBossId = bossId || null;
        this.vrCurrentStageId = stageId;
        this._showVrPlayersPopup(boss, stage);
    },

    _showVrPlayersPopup(boss, stage) {
        const popup = document.getElementById('players-popup');
        if (!popup) { this._doLaunchVrStage(boss, stage); return; }

        document.getElementById('players-popup-stage-id').textContent = boss ? boss.name : 'TRAINING MODE';
        document.getElementById('players-popup-stage-name').textContent = stage.name;
        const typeEl = document.getElementById('players-popup-type');
        typeEl.textContent = boss ? 'VR BOSS VARIANT' : 'VR TRAINING';
        typeEl.style.color = 'var(--codec-green)';
        const startBtnInner = popup.querySelector('.players-popup-start-btn .btn-inner');
        if (startBtnInner) startBtnInner.textContent = '▶ INIZIA STAGE';

        this._vrPopupMode = true;
        this._vrPendingBoss  = boss;
        this._vrPendingStage = stage;
        this._popupAllPlayers = Object.keys(CHARACTERS);
        this._popupMandatoryPlayers = [];
        // Pre-seleziona Snake se presente, altrimenti il primo
        const allCh = this._popupAllPlayers;
        this._pendingSelectedPlayers = allCh.includes('Snake') ? ['Snake'] : [allCh[0]];
        this._renderPlayersPopupList();
        popup.style.display = 'flex';
    },

    _doLaunchVrStage(boss, stage) {
        this.vrMode = true;
        const players = this._pendingSelectedPlayers?.length
            ? [...this._pendingSelectedPlayers]
            : ['Snake'];
        this.stagePlayers = players;
        this._pendingSelectedPlayers = null;
        this._popupAllPlayers = null;
        this._vrPopupMode = false;

        // Inizializza stato HP/marker (senza reset campagna)
        this.hpState       = this.hpState       || {};
        this.markerState   = this.markerState   || {};
        this.playerZoneState = {};
        players.forEach(p => {
            const ch = CHARACTERS[p];
            this.hpState[p] = (ch && ch.hp) ? ch.hp : 4;
            if (!this.markerState[p]) this.markerState[p] = { alert: false, inter: false };
            this.playerZoneState[p] = stage.playerStartZones?.[p] ?? 0;
        });
        this.bossHpState = {};
        this.bossMaxHpState = {};
        this._bossSpecialBtnUsed = {};
        this.eventClickedState = {};
        this.perPlayerEventCount = {};
        this._vrUscitaUnlocked = false;
        this._vrUscitaJustUnlocked = false;
        this._vrGenerazioneUscitaPlayed = false;
        this._vrRankRestricted = false;
        this.liquidSkullCount = 0;

        // Header
        const titleEl  = document.getElementById('active-stage-title');
        const statusEl = document.getElementById('stage-status');
        if (titleEl)  titleEl.textContent  = boss ? `${boss.name} — ${stage.name}` : stage.name;
        if (statusEl) statusEl.textContent = boss ? 'VR BOSS VARIANT' : 'VR TRAINING';

        // Nasconde il player video ma lascia i pulsanti visibili (OBIETTIVO/USCITA come INTRO/OUTRO)
        const videoWrapper = document.getElementById('video-wrapper');
        if (videoWrapper) videoWrapper.style.display = 'none';
        const btnIntro = document.getElementById('btn-intro');
        if (btnIntro) btnIntro.style.display = 'none';
        const btnOutro = document.getElementById('btn-outro');
        if (btnOutro) btnOutro.querySelector('.btn-inner').textContent = '▶ USCITA';
        const turnSec = document.getElementById('turn-section');
        if (turnSec) turnSec.style.display = 'none';

        // Usa direttamente il VR stage come currentStage (ha già tutti i campi)
        this._vrFakeStage = stage;
        this.currentStage = stage;
        this.initEnemyState(this._vrFakeStage);
        this.buildEventButtons(this._vrFakeStage);
        this.buildMusicButtons(this._vrFakeStage);
        this.buildAlertSection(this._vrFakeStage);
        this.buildTurnSection(this._vrFakeStage, players);

        // NEXT button
        const btnNext = document.getElementById('btn-next-stage');
        const idx = VR_CONFIG.stages.findIndex(s => s.id === stage.id);
        const hasNext = idx < VR_CONFIG.stages.length - 1;
        if (btnNext) {
            if (hasNext) {
                btnNext.style.display = '';
                btnNext.disabled = true;
                btnNext.style.opacity = '0.3';
                btnNext.querySelector('.btn-inner').textContent = 'NEXT ▶';
            } else {
                btnNext.style.display = 'none';
            }
        }

        // Back button
        const backBtn = document.getElementById('btn-stage-back');
        if (backBtn) backBtn.textContent = '◄ VR';

        // Sidebar giocatori (senza stats sessione, con equipment condiviso)
        // In Boss Variant aggiunge il boss come riga HP in cima
        const sidebar = document.getElementById('player-sidebar');
        if (sidebar) {
            let bossHtml = '';
            if (boss) {
                const n = players.length;
                const bossHp = boss.hpByPlayerCount
                    ? (boss.hpByPlayerCount[n] ?? boss.hpByPlayerCount[Object.keys(boss.hpByPlayerCount).map(Number).sort((a,b)=>b-a).find(k=>k<=n)] ?? 4)
                    : (boss.hp || 4);
                this.bossHpState[boss.id] = bossHp;
                this.bossMaxHpState[boss.id] = bossHp;
                bossHtml = this._buildVrBossHpCard(boss);
            }
            const vrCameraHtml = this._buildCameraIndicatorHtml(stage);
            sidebar.innerHTML = bossHtml + players.map(p => this._buildPlayerCard(p)).join('') + vrCameraHtml;
            sidebar.style.display = 'flex';
        }

        this.showScreen('stage-active');

        // Avvia jingle-inizio subito (siamo nel contesto del gesto utente)
        if (this.musicLoop) { this.musicLoop.stop(); this.musicLoop = null; }
        this._vrJingleDone = false;
        const jingleCfg = CONFIG.vrSounds['jingle-inizio'];
        if (jingleCfg) {
            if (this._vrJingleAudio) { this._vrJingleAudio.pause(); this._vrJingleAudio = null; }
            this._vrJingleAudio = new Audio(jingleCfg.file);
            this._vrJingleAudio.volume = this._getMusicVolumeNum();
            this._vrJingleAudio.play().catch(e => console.warn('jingle-inizio:', e));
        }
        setTimeout(() => {
            this._vrJingleDone = true;
            this._updateVrIntroBtn();
        }, 8000);

        let objText;
        if (stage.objectiveDynamic) {
            const lines = (stage.events || [])
                .filter(e => e.playerOwner && players.includes(e.playerOwner))
                .map(e => `${e.playerOwner === 'Gray Fox' ? 'Fox' : e.playerOwner} su ${e.label.replace('INDICATORE ', '')}`);
            objText = (stage.objectivePrefix ? stage.objectivePrefix + '\n' : '') + lines.join('\n');
        } else {
            objText = Array.isArray(stage.objective)
                ? stage.objective[Math.min(players.length, stage.objective.length) - 1]
                : stage.objective;
        }
        const modeLabel = boss ? 'VR BOSS VARIANT' : 'VR MISSION';
        setTimeout(() => this._vrShowTypewriterIntro(stage.name, modeLabel, objText || ''), 300);
    },

    _buildVrBossHpCard(boss) {
        const hp    = this.bossHpState[boss.id]  ?? boss.hp ?? 4;
        const skullHtml = boss.id === 'liquid'
            ? `<span class="vr-skull-icon" style="margin-left:0.4rem">&#128128;</span><span class="vr-skull-count" id="liquid-skull-count" style="margin-left:0.2rem">${this.liquidSkullCount ?? 0}</span>`
            : '';
        return `<div class="player-card boss-enemy-card" id="vr-boss-card-${boss.id}">
            <div class="player-card-name" style="color:var(--codec-red)">${boss.name}</div>
            <div class="hp-tracker">
                <button class="hp-btn" onclick="App._vrBossHit('${boss.id}')">&#x2212;</button>
                <span class="hp-value" id="vr-boss-hp-${boss.id}">${hp}</span>
                <button class="hp-btn" onclick="App._vrBossHeal('${boss.id}')">+</button>
                ${skullHtml}
            </div>
        </div>`;
    },

    _vrBossHit(bossId) {
        const boss = VR_CONFIG.bosses.find(b => b.id === bossId);
        if (!boss) return;
        const current = this.bossHpState[bossId] ?? boss.hp ?? 4;
        if (current <= 0) return;
        const newHp = current - 1;
        this.bossHpState[bossId] = newHp;
        if (newHp > 0) {
            let hitSoundFile = boss.hitSound;
            if (bossId === 'liquid' && (this.liquidSkullCount ?? 0) >= 2 && boss.hitSoundAlt) {
                hitSoundFile = boss.hitSoundAlt;
            }
            if (hitSoundFile) {
                const audio = new Audio(hitSoundFile);
                audio.volume = this._sfxVol();
                audio.play().catch(() => {});
            }
        }
        this._refreshVrBossCard(bossId);
        if (bossId === 'liquid' && newHp <= 0) {
            this._liquidSkullTrigger(boss);
        }
    },

    _liquidSkullTrigger(boss) {
        this.liquidSkullCount = (this.liquidSkullCount ?? 0) + 1;
        // Aggiorna il display del teschio
        const skullEl = document.getElementById('liquid-skull-count');
        if (skullEl) skullEl.textContent = this.liquidSkullCount;
        // Mostra popup dado
        const n = this.liquidSkullCount;
        const diceText = document.getElementById('liquid-skull-dice-text');
        if (diceText) diceText.textContent = `Lancia ${n} ${n === 1 ? 'dado bianco' : 'dadi bianchi'}.\nAlmeno un "!" ?`;
        const popup = document.getElementById('liquid-skull-popup');
        if (popup) popup.style.display = 'flex';
    },

    _liquidSkullRollResult(success) {
        const popup = document.getElementById('liquid-skull-popup');
        if (popup) popup.style.display = 'none';
        const boss = VR_CONFIG.bosses.find(b => b.id === 'liquid');
        if (!boss) return;
        if (success) {
            // Liquid sconfitto — suona KO poi oggetto-spawn (solo se reward non ancora sbloccata)
            if (boss.koSound) {
                const audio = new Audio(boss.koSound);
                audio.volume = this._sfxVol();
                const rewardNew = boss.rewardEquip && !this._vrState?.vrRewards?.['boss_liquid'];
                if (rewardNew) {
                    const spawnCfg = CONFIG.vrSounds?.['oggetto-spawn'];
                    if (spawnCfg) {
                        audio.onended = () => {
                            const b = new Audio(spawnCfg.file);
                            b.volume = this._sfxVol();
                            b.play().catch(() => {});
                        };
                    }
                }
                audio.play().catch(() => {});
            }
        } else {
            // Liquid si cura completamente
            const maxHp = this.bossMaxHpState['liquid'] ?? boss.hp ?? 4;
            this.bossHpState['liquid'] = maxHp;
            this._refreshVrBossCard('liquid');
        }
    },

    _vrBossHeal(bossId) {
        const boss = VR_CONFIG.bosses.find(b => b.id === bossId);
        if (!boss) return;
        const current = this.bossHpState[bossId] ?? 0;
        const max = this.bossMaxHpState[bossId] ?? boss.hp ?? 4;
        if (current >= max) return;
        this.bossHpState[bossId] = current + 1;
        this._refreshVrBossCard(bossId);
    },

    _refreshVrBossCard(bossId) {
        const boss = VR_CONFIG.bosses.find(b => b.id === bossId);
        if (!boss) return;
        const val = document.getElementById(`vr-boss-hp-${bossId}`);
        if (val) val.textContent = this.bossHpState[bossId] ?? 0;
        if ((this.bossHpState[bossId] ?? 0) <= 0 && boss.koSound && bossId !== 'liquid') {
            const audio = new Audio(boss.koSound);
            audio.volume = this._sfxVol();
            const rewardNew = boss.rewardEquip && !this._vrState?.vrRewards?.[`boss_${bossId}`];
            if (rewardNew) {
                const spawnCfg = CONFIG.vrSounds?.['oggetto-spawn'];
                if (spawnCfg) {
                    audio.onended = () => {
                        const b = new Audio(spawnCfg.file);
                        b.volume = this._sfxVol();
                        b.play().catch(() => {});
                    };
                }
            }
            audio.play().catch(() => {});
        }
    },

    _vrShowTypewriterIntro(stageName, modeLabel, text) {
        const overlay   = document.getElementById('vr-intro-overlay');
        const textEl    = document.getElementById('vr-intro-text');
        const modeEl    = document.getElementById('vr-intro-mode');
        const stageEl   = document.getElementById('vr-intro-stage-name');
        if (!overlay || !textEl) return;
        if (modeEl)  modeEl.textContent  = modeLabel;
        if (stageEl) stageEl.textContent = stageName;
        this._vrIntroFullText = text;
        textEl.textContent = '';
        overlay.style.display = 'flex';
        this._updateVrIntroBtn();

        if (this._vrTypewriterTimer) clearInterval(this._vrTypewriterTimer);
        let i = 0;
        this._vrTypewriterTimer = setInterval(() => {
            textEl.textContent += text[i];
            i++;
            if (i >= text.length) {
                clearInterval(this._vrTypewriterTimer);
                this._vrTypewriterTimer = null;
            }
        }, 28);
    },

    vrIntroConfirm() {
        const btn = document.getElementById('vr-intro-confirm-btn');
        if (btn && btn.disabled) return;
        if (this._vrTypewriterTimer) { clearInterval(this._vrTypewriterTimer); this._vrTypewriterTimer = null; }
        document.getElementById('vr-intro-overlay').style.display = 'none';
        this._vrPlayStartSequence();
    },

    _updateVrIntroBtn() {
        const btn = document.getElementById('vr-intro-confirm-btn');
        if (!btn) return;
        const ready = !!this._vrJingleDone;
        btn.disabled = !ready;
        btn.style.opacity = ready ? '1' : '0.3';
    },

    _updateVrUscitaBtn() {
        const btn = document.getElementById('btn-outro');
        if (!btn) return;
        const stage = this._vrFakeStage;

        // Conta eventi: se requiredEventCount, serve un minimo (basato su numero giocatori)
        let eventsDone = false;
        const required = (stage?.events || []).filter(e => e.requiredForOutro
            && (!e.playerOwner || (this.stagePlayers || []).includes(e.playerOwner)));
        if (stage?.requiredEventCount) {
            const idx = Math.min((this.stagePlayers?.length || 1), stage.requiredEventCount.length) - 1;
            const threshold = stage.requiredEventCount[idx];
            const doneCount = required.reduce((sum, e) => {
                const val = this.eventClickedState[e.id];
                return sum + (e.multiClick ? (typeof val === 'number' ? val : 0) : (val ? 1 : 0));
            }, 0);
            eventsDone = doneCount >= threshold;
        } else {
            eventsDone = required.length === 0 || required.every(e => !!this.eventClickedState[e.id]);
        }

        // Nodi disattivati: controlla regola per numero giocatori
        if (stage?.uscitaRequiresNodeDisabled) {
            const rules = stage.uscitaRequiresNodeDisabled;
            const idx = Math.min((this.stagePlayers?.length || 1), rules.length) - 1;
            const rule = rules[idx];
            const nodeEvents = (stage.events || []).filter(e => e.canDecrement);
            const disabled = nodeEvents.map(e => typeof this.eventClickedState[e.id] === 'number' ? this.eventClickedState[e.id] : 0);
            const totalDisabled = disabled.reduce((a, b) => a + b, 0);
            const zonesWithAny = disabled.filter(d => d > 0).length;
            let nodeMet = true;
            if (rule.minPerZone != null) nodeMet = disabled.every(d => d >= rule.minPerZone);
            if (rule.total != null)      nodeMet = nodeMet && totalDisabled >= rule.total;
            if (rule.minZones != null)   nodeMet = nodeMet && zonesWithAny >= rule.minZones;
            if (!nodeMet) eventsDone = false;
        }

        // Quando la soglia viene raggiunta per la prima volta, segnala con un flag.
        // Il suono "generazione-uscita" viene suonato da playEvent() dopo che finisce l'audio evento.
        if (eventsDone && !this._vrUscitaUnlocked) {
            this._vrUscitaUnlocked = true;
            this._vrUscitaJustUnlocked = true;
        }

        // Tutti i giocatori attivi devono aver cliccato il loro evento playerOwner
        if (stage?.uscitaRequiresAllPlayerEvents) {
            const playerEvents = (stage.events || []).filter(e => e.playerOwner && e.requiredForOutro);
            const activePlayerEvents = playerEvents.filter(e => this.stagePlayers.includes(e.playerOwner));
            if (!activePlayerEvents.every(e => !!this.eventClickedState[e.id])) eventsDone = false;
        }

        // Zona richiesta: controlla il giocatore attivo (uscitaRequiresZone), tutti in una zona specifica (uscitaRequiresAllInZone) o tutti nella stessa zona (uscitaRequiresAllSameZone)
        let zoneMet = true;
        if (stage?.uscitaRequiresAllSameZone) {
            const players = this.stagePlayers || [];
            const zones = players.map(p => this.playerZoneState[p] ?? 0);
            zoneMet = players.length > 0 && zones.every(z => z === zones[0]);
        } else if (stage?.uscitaRequiresAllInZone != null) {
            const req = stage.uscitaRequiresAllInZone;
            const players = this.stagePlayers || [];
            zoneMet = players.length > 0 && players.every(p => (this.playerZoneState[p] ?? 0) === req);
        } else if (stage?.uscitaRequiresZone != null) {
            const req = stage.uscitaRequiresZone;
            const activePlayer = this._activePlanciaPlayer();
            if (activePlayer) {
                zoneMet = (this.playerZoneState[activePlayer] ?? 0) === req;
            } else {
                zoneMet = (this.stagePlayers || []).some(p => (this.playerZoneState[p] ?? 0) === req);
            }
        }

        const enabled = eventsDone && zoneMet;
        const wasEnabled = !btn.disabled;
        btn.disabled = !enabled;
        btn.style.opacity = enabled ? '1' : '0.3';
        if (enabled && !wasEnabled) {
            const everyEnable = !!stage?.uscitaSoundEveryEnable;
            if (everyEnable || !this._vrGenerazioneUscitaPlayed) {
                if (!everyEnable) this._vrGenerazioneUscitaPlayed = true;
                if (!this._suppressNextGenerazioneUscita) {
                    const cfg = CONFIG.vrSounds?.['generazione-uscita'];
                    if (cfg) { const a = new Audio(cfg.file); a.volume = this._sfxVol(); a.play().catch(() => {}); }
                }
            }
        }
    },

    _vrPlayStartSequence() {
        const vol = this._sfxVol();
        const startMusic = () => {
            if (!this.vrMode) return;
            const turnSec = document.getElementById('turn-section');
            if (turnSec) turnSec.style.display = '';
            this._updateVrUscitaBtn();
            if (this.currentStage?.startInAlert) {
                this.triggerAlert();
                (this.stagePlayers || []).forEach(p => {
                    if (this.markerState[p]) this.markerState[p].alert = true;
                    const btn = document.getElementById(`marker-alert-${p}`);
                    if (btn) btn.classList.add('active');
                });
                return;
            }
            const isSoloGrayFox = this.stagePlayers?.length === 1 && this.stagePlayers[0] === 'Gray Fox';
            const vrMusicKey = isSoloGrayFox ? 'ninja-vr' : (this.vrCurrentBossId ? 'mission-vr-boss' : 'mission-vr-training');
            const vrMusicCfg = CONFIG.music[vrMusicKey];
            if (vrMusicCfg) {
                if (this.musicLoop) { this.musicLoop.stop(); this.musicLoop = null; }
                this.musicLoop = this.createSeamlessLoop(vrMusicCfg.file, this._getMusicVolumeNum(), vrMusicCfg.loopOverlap, this._cfgLoopPoints(vrMusicCfg));
                this.musicLoop.play();
            }
        };

        // inizio: parte 1s prima che finisca preinizio, poi avvia musica+turni
        const inizioCfg = CONFIG.vrSounds['inizio'];
        this._vrSeqAudio2 = inizioCfg ? new Audio(inizioCfg.file) : null;
        if (this._vrSeqAudio2) {
            this._vrSeqAudio2.volume = vol;
            this._vrSeqAudio2.onended = startMusic;
        }

        // preinizio: avvia subito, triggera inizio 1s prima della fine
        const preinCfg = CONFIG.vrSounds['preinizio'];
        if (!preinCfg) { startMusic(); return; }
        this._vrSeqAudio = new Audio(preinCfg.file);
        this._vrSeqAudio.volume = vol;
        let inizioStarted = false;
        this._vrSeqAudio.ontimeupdate = () => {
            if (!inizioStarted && this._vrSeqAudio.duration > 0
                && this._vrSeqAudio.currentTime >= this._vrSeqAudio.duration - 1) {
                inizioStarted = true;
                if (this._vrSeqAudio2) this._vrSeqAudio2.play().catch(() => { startMusic(); });
                else startMusic();
            }
        };
        this._vrSeqAudio.onended = () => {
            if (!inizioStarted) startMusic(); // fallback se duration non disponibile
        };
        this._vrSeqAudio.play().catch(() => { startMusic(); });
    },

    vrCompleteStage() {
        this.stopMusic();
        if (this.alertLoop)   { this.alertLoop.stop();   this.alertLoop   = null; }
        if (this.evasionLoop) { this.evasionLoop.stop(); this.evasionLoop = null; }

        const key = this.vrCurrentBossId
            ? `boss_${this.vrCurrentBossId}_${this.vrCurrentStageId}`
            : `training_${this.vrCurrentStageId}`;
        if (!this._vrState.vrCompleted) this._vrState.vrCompleted = {};
        this._vrState.vrCompleted[key] = true;

        // --- Rewards ---
        if (!this._vrState.vrRewards) this._vrState.vrRewards = {};
        if (!this._vrState.vrUnlockedEquipment) this._vrState.vrUnlockedEquipment = [];
        const newRewards = [];
        const vrEquip = this._vrState.vrUnlockedEquipment;

        const displayRewards = []; // tutti i reward applicabili (nuovi o già ottenuti) da mostrare nel popup
        this._vrMemoryBoxBefore = new Set(this._getMemoryBox());
        const _unlockEquip = (id) => {
            if (!vrEquip.includes(id)) vrEquip.push(id);
            newRewards.push(id);
            this._addToMemoryBox(id);
        };
        const _addDisplay = (id) => { if (!displayRewards.includes(id)) displayRewards.push(id); };

        // Stage reward: prima volta che si completa questo stage (in qualsiasi modalità)
        const stage = this._vrFakeStage;
        const stageRewardKey = `stage_${this.vrCurrentStageId}`;
        if (stage?.rewardEquip) {
            if (!this._vrState.vrRewards[stageRewardKey]) {
                this._vrState.vrRewards[stageRewardKey] = true;
                _unlockEquip(stage.rewardEquip);
            }
            _addDisplay(stage.rewardEquip);
        }

        // Boss reward: prima volta che si sconfigge questo boss (boss a 0 HP al completamento)
        const boss = this.vrCurrentBossId ? VR_CONFIG.bosses.find(b => b.id === this.vrCurrentBossId) : null;
        const bossRewardKey = this.vrCurrentBossId ? `boss_${this.vrCurrentBossId}` : null;
        const bossDefeated = boss && (this.bossHpState?.[boss.id] ?? 1) <= 0;
        if (bossDefeated && boss?.rewardEquip && bossRewardKey) {
            if (!this._vrState.vrRewards[bossRewardKey]) {
                this._vrState.vrRewards[bossRewardKey] = true;
                _unlockEquip(boss.rewardEquip);
            }
            _addDisplay(boss.rewardEquip);
        }

        // Bonus reward (equipment 030): tutti e 11 i reward sbloccati
        const allRewardKeys = [
            ...VR_CONFIG.stages.map(s => `stage_${s.id}`),
            ...VR_CONFIG.bosses.map(b => `boss_${b.id}`),
        ];
        if (allRewardKeys.every(k => !!this._vrState.vrRewards[k])) {
            if (!this._vrState.vrRewards.bonus) {
                this._vrState.vrRewards.bonus = true;
                _unlockEquip('030');
            }
            _addDisplay('030');
        }

        // Calcola il rank (1-4) in base alla classifica (aggiorna il leaderboard)
        const rounds = this.turnRound;
        const lbKey = this.vrCurrentBossId
            ? `boss_${this.vrCurrentBossId}_${this.vrCurrentStageId}`
            : `training_${this.vrCurrentStageId}`;
        let rank = this._vrUpdateLeaderboard(lbKey, this.vrCurrentStageId, rounds);
        // BANDANA (023) o Mimetica Ottica (030) usati → rank non può essere 1
        if (rank === 1 && this._vrRankRestricted) rank = 2;

        this._vrSaveProgress();

        // Blocca tutta l'interfaccia
        this._lockStage();

        const vol = this._sfxVol();

        const showPopupAndRank = () => {
            const cfg = CONFIG.vrSounds[`vr-mission-${rank}`];
            let onAudioEnd = null; // sarà impostato da _vrShowCompletionPopup
            if (cfg) {
                const a = new Audio(cfg.file);
                a.volume = vol;
                const triggerAnim = () => { setTimeout(() => { if (onAudioEnd) onAudioEnd(); }, 1000); };
                a.onended = triggerAnim;
                a.play().catch(triggerAnim);
            } else {
                setTimeout(() => { if (onAudioEnd) onAudioEnd(); }, 1000);
            }
            const btnNext = document.getElementById('btn-next-stage');
            if (btnNext) {
                const hide = !!this.currentStage?.noNextButton;
                btnNext.style.display = hide ? 'none' : '';
                if (!hide && btnNext.style.display !== 'none') {
                    btnNext.disabled = false;
                    btnNext.style.opacity = '1';
                }
            }
            onAudioEnd = this._vrShowCompletionPopup(displayRewards, newRewards, rank, lbKey);
        };

        const playPrefine = () => {
            const cfg = CONFIG.vrSounds['prefine'];
            if (!cfg) { showPopupAndRank(); return; }
            const a = new Audio(cfg.file);
            a.volume = vol;
            a.play().catch(() => {});
            // Popup + vr-mission-X partono 500ms dopo l'inizio di prefine
            setTimeout(showPopupAndRank, 250);
        };

        // 1. Jingle fine parte subito
        const jingleCfg = CONFIG.vrSounds['jingle-fine'];
        if (jingleCfg) {
            const a = new Audio(jingleCfg.file);
            a.volume = vol;
            a.play().catch(() => {});
        }

        // 2. Sequenza personalizzata (es. stage 06) o default
        const seq = this.currentStage?.completionSequence;
        const seqDelay = this.currentStage?.completionSequenceDelay ?? 4000;
        const preFineDelay = this.currentStage?.completionPreFineDelay ?? 0;

        if (seq?.length) {
            setTimeout(() => {
                let i = 0;
                const playNext = () => {
                    if (i >= seq.length) {
                        setTimeout(playPrefine, preFineDelay);
                        return;
                    }
                    const cfg = CONFIG.vrSounds[seq[i++]];
                    if (!cfg) { playNext(); return; }
                    const a = new Audio(cfg.file);
                    a.volume = cfg.volume !== undefined ? cfg.volume : vol;
                    a.onended = playNext;
                    a.play().catch(() => playNext());
                };
                playNext();
            }, seqDelay);
        } else {
            setTimeout(playPrefine, 4000);
        }
    },

    _vrShowCompletionPopup(displayRewards = [], newlyUnlocked = [], playerRank = null, lbKey = null) {
        const pct = this._vrProgress();
        const overlay = document.getElementById('vr-completion-popup');
        if (!overlay) return null;
        const pctEl = document.getElementById('vr-completion-pct');
        if (pctEl) pctEl.textContent = pct + '%';
        // Salva per vrCompletionClose (quali erano nuovi vs già posseduti)
        this._vrDisplayRewards   = displayRewards;
        this._vrNewlyUnlocked    = new Set(newlyUnlocked);
        const rewardsEl = document.getElementById('vr-completion-rewards');
        if (rewardsEl) {
            if (displayRewards.length > 0) {
                rewardsEl.innerHTML = displayRewards.map(id => {
                    const equip = EQUIPMENT?.[id];
                    const label = equip ? `${id} — ${equip.name}` : id;
                    return `<div class="vr-reward-item" data-equip-id="${id}">★ EQUIPAGGIAMENTO ${label}</div>`;
                }).join('');
                rewardsEl.style.display = '';
            } else {
                rewardsEl.style.display = 'none';
            }
        }
        // Classifica con riga del giocatore intermittente
        const lbEl = document.getElementById('vr-completion-leaderboard');
        if (lbEl && lbKey) {
            const lb = this._vrGetLeaderboard(lbKey, this.vrCurrentStageId);
            const medals = ['1ST', '2ND', '3RD'];
            const rows = lb.map((e, i) => {
                const isPlayer = !e.isDefault && playerRank !== null && (i + 1) === playerRank;
                const valCls   = e.isDefault ? 'vr-lb-default' : 'vr-lb-player';
                const blinkId  = isPlayer ? ` id="vr-lb-player-row"` : '';
                return `<div class="vr-lb-row ${valCls}"${blinkId}>
                    <span class="vr-lb-pos">${medals[i]}</span>
                    <span class="vr-lb-val">${e.rounds}</span>
                </div>`;
            }).join('');
            lbEl.innerHTML = `<div class="vr-lb vr-lb-popup">${rows}</div>`;
            lbEl.style.display = '';
            // Blink JS con suono "rank" per la riga del giocatore
            if (playerRank !== null && playerRank <= 3) {
                const rankCfg = CONFIG.vrSounds['rank'];
                const playRankSfx = () => {
                    if (rankCfg) { const a = new Audio(rankCfg.file); a.volume = this._sfxVol(); a.play().catch(() => {}); }
                };
                playRankSfx();
                let visible = true;
                const blinkStep = () => {
                    const row = document.getElementById('vr-lb-player-row');
                    if (!row || !this._vrBlinkInterval) return;
                    visible = !visible;
                    row.style.opacity = visible ? '1' : '0';
                    if (visible) playRankSfx();
                    this._vrBlinkInterval = setTimeout(blinkStep, visible ? 1000 : 500);
                };
                this._vrBlinkInterval = setTimeout(blinkStep, 1000);
            }
        } else if (lbEl) {
            lbEl.style.display = 'none';
        }
        overlay.style.display = 'flex';

        // Re-abilita il pulsante OK (potrebbe essere rimasto disabilitato da una run precedente)
        const okBtn = overlay.querySelector('[onclick*="vrCompletionClose"]');
        if (okBtn) { okBtn.disabled = false; okBtn.style.opacity = ''; }

        // Restituisce la callback che anima i reward in (chiamata da showPopupAndRank dopo vr-mission-X + 1s)
        return () => {
            if (!rewardsEl || displayRewards.length === 0) return;
            const items = [...rewardsEl.querySelectorAll('.vr-reward-item')];
            const spawnCfg = CONFIG.vrSounds?.['oggetto-spawn'];
            let vIdx = 0;
            const animVrIn = () => {
                if (vIdx >= items.length) return;
                const el = items[vIdx++];
                el.classList.add('rewards-item-in');
                if (spawnCfg) { const a = new Audio(spawnCfg.file); a.volume = this._sfxVol(); a.play().catch(() => {}); }
                if (vIdx < items.length) setTimeout(animVrIn, 200);
            };
            animVrIn();
        };
    },

    vrCompletionClose() {
        if (this._vrBlinkInterval) { clearTimeout(this._vrBlinkInterval); this._vrBlinkInterval = null; }

        const overlay   = document.getElementById('vr-completion-popup');
        const rewardsEl = overlay?.querySelector('#vr-completion-rewards');
        // Prendi TUTTI i reward item (anche quelli non ancora animati in) e forzali visibili
        const allItems  = rewardsEl ? [...rewardsEl.querySelectorAll('.vr-reward-item')] : [];
        allItems.forEach(el => el.classList.add('rewards-item-in'));
        const visItems  = allItems;

        // Disabilita pulsante OK durante animazione
        const okBtn = overlay?.querySelector('.vr-completion-ok-btn, [onclick*="vrCompletionClose"]');
        if (okBtn) { okBtn.disabled = true; okBtn.style.opacity = '0.35'; }

        const doClose = () => {
            if (overlay) overlay.style.display = 'none';
            this._unlockStage();
            this._vrDisplayRewards = null;
            this._vrNewlyUnlocked  = null;
        };

        if (visItems.length === 0) { setTimeout(doClose, 2000); return; }

        const fullFile = this._equipSounds?.full;
        const presoCfg = CONFIG.vrSounds?.['oggetto-preso'];
        let idx = 0;

        const animOut = () => {
            if (idx >= visItems.length) { setTimeout(doClose, 2000); return; }
            const el     = visItems[idx++];
            const itemId = el.dataset.equipId || null;
            const wasInBox = itemId && this._vrMemoryBoxBefore ? this._vrMemoryBoxBefore.has(itemId) : false;

            if (wasInBox) {
                // FULL: glitch + label + oggetto-full
                const label = document.createElement('span');
                label.className = 'rewards-item-full-label';
                label.textContent = 'FULL';
                el.appendChild(label);
                if (fullFile) { const a = new Audio(fullFile); a.volume = this._sfxVol(); a.play().catch(() => {}); }
                el.classList.add('rewards-item-glitch');
                setTimeout(animOut, 900);
            } else {
                // PRESO: fade + oggetto-preso
                if (presoCfg) { const a = new Audio(presoCfg.file); a.volume = this._sfxVol(); a.play().catch(() => {}); }
                el.style.transition = 'opacity 0.3s ease';
                el.style.opacity = '0';
                setTimeout(animOut, 400);
            }
        };

        animOut();
    },

    _vrSaveProgress() {
        this._saveVrState();
    },

    _promptResetVrState() {
        const popup = document.getElementById('vr-reset-popup');
        if (popup) popup.style.display = 'flex';
    },

    _cancelResetVrState() {
        const popup = document.getElementById('vr-reset-popup');
        if (popup) popup.style.display = 'none';
    },

    _confirmResetVrState() {
        const popup = document.getElementById('vr-reset-popup');
        if (popup) popup.style.display = 'none';
        localStorage.removeItem(this.VR_STATE_KEY);
        this._loadVrState();
        this._renderVrContent();
    },

    _exitVrStage() {
        this.vrMode = false;
        this.stopAllAudio();
        this.hidePlayerSidebar();
        document.getElementById('vr-intro-overlay').style.display = 'none';
        document.getElementById('vr-completion-popup').style.display = 'none';
        if (this._vrTypewriterTimer) { clearInterval(this._vrTypewriterTimer); this._vrTypewriterTimer = null; }
        if (this._vrJingleAudio)  { this._vrJingleAudio.pause();  this._vrJingleAudio  = null; }
        if (this._vrSeqAudio)     { this._vrSeqAudio.pause();     this._vrSeqAudio     = null; }
        if (this._vrSeqAudio2)    { this._vrSeqAudio2.pause();    this._vrSeqAudio2    = null; }
        // Ripristina back button
        const backBtn = document.getElementById('btn-stage-back');
        if (backBtn) backBtn.textContent = '◄ MENU';
        // Ripristina NEXT
        const btnNext = document.getElementById('btn-next-stage');
        if (btnNext) { btnNext.style.display = 'none'; btnNext.disabled = true; btnNext.style.opacity = '0.3'; }
        // Ripristina sezioni
        const videoWrapper = document.getElementById('video-wrapper');
        if (videoWrapper) videoWrapper.style.display = '';
        const btnIntroR = document.getElementById('btn-intro');
        if (btnIntroR) btnIntroR.style.display = '';
        const btnOutroR = document.getElementById('btn-outro');
        if (btnOutroR) { btnOutroR.querySelector('.btn-inner').textContent = '▶ OUTRO'; btnOutroR.disabled = false; btnOutroR.style.opacity = '1'; }
        const turnSecR = document.getElementById('turn-section');
        if (turnSecR) turnSecR.style.display = '';
    },

    // ============================================
    // OPTION SCREEN
    // ============================================
    _initOptionScreen() {
        const q = id => document.getElementById(id);
        const musicSlider = q('opt-music-vol');
        if (musicSlider) { musicSlider.value = this.defaultMusicVolume; this._optUpdateVal('opt-music-val', this.defaultMusicVolume); }
        const sfxSlider = q('opt-sfx-vol');
        if (sfxSlider) { sfxSlider.value = this.sfxVolume; this._optUpdateVal('opt-sfx-val', this.sfxVolume); }
        const menuSlider = q('opt-menu-vol');
        if (menuSlider) { menuSlider.value = this.menuMusicVolume; this._optUpdateVal('opt-menu-val', this.menuMusicVolume); }
        const statsToggle = q('opt-session-stats');
        if (statsToggle) statsToggle.checked = this.showSessionStats;
        const vrToggle = q('opt-vr-unlock');
        if (vrToggle) vrToggle.checked = this.vrUnlockAll;
    },

    _optUpdateVal(id, val) {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    },

    setOptMusicVol(val) {
        this.defaultMusicVolume = parseInt(val);
        this._optUpdateVal('opt-music-val', val);
        if (this.musicLoop) this.musicLoop.setVolume(val / 100);
        const stageSlider = document.getElementById('music-volume');
        if (stageSlider) stageSlider.value = val;
    },

    setOptSfxVol(val) {
        this.sfxVolume = parseInt(val);
        this._optUpdateVal('opt-sfx-val', val);
    },

    setOptMenuVol(val) {
        this.menuMusicVolume = parseInt(val);
        this._optUpdateVal('opt-menu-val', val);
        if (this.menuMusicLoop) this.menuMusicLoop.setVolume(val / 100);
    },

    setOptSessionStats(checked) {
        this.showSessionStats = checked;
        const block = document.querySelector('.session-stats-block');
        if (block) block.outerHTML = this._buildSessionStatsHtml();
    },

    setOptVrUnlock(checked) {
        this.vrUnlockAll = checked;
        // Se il menu VR stage list è visibile, aggiorna
        if (this.vrNav?.level === 'stagelist') {
            this._renderVrContent();
        }
    },

    // ============================================
    // MEMORY BOX SCREEN
    // ============================================
    showMemoryBoxScreen() {
        this._renderMemoryBoxList();
        this.showScreen('memory-box-screen');
    },

    _renderMemoryBoxList() {
        const list = document.getElementById('memory-box-list');
        if (!list) return;
        const box = this._getMemoryBox();
        // Only numbered 001-032
        const allIds = Object.keys(EQUIPMENT).filter(id => /^\d{3}$/.test(id)).sort();
        const unlocked = allIds.filter(id => box.includes(id));
        if (unlocked.length === 0) {
            list.innerHTML = '<div class="memory-box-empty">Nessun equipaggiamento sbloccato.</div>';
            const count = document.getElementById('memory-box-count');
            if (count) count.textContent = `0 / ${allIds.length}`;
            return;
        }
        list.innerHTML = unlocked.map(id => {
            const eq = EQUIPMENT[id];
            return `<div class="memory-box-item" id="mbox-item-${id}">
                <span class="memory-box-id">${id}</span>
                <span class="memory-box-name">${eq ? eq.name : id}</span>
                <button class="memory-box-delete-btn" onmouseenter="App.playSfx(CONFIG.menuSounds['choice'].file)" onclick="App.playSfx(CONFIG.menuSounds['confirm-save'].file); App._memoryBoxDeleteConfirm('${id}')">🗑</button>
            </div>`;
        }).join('');
        const count = document.getElementById('memory-box-count');
        if (count) count.textContent = `${unlocked.length} / ${allIds.length}`;
    },

    _memoryBoxDeleteConfirm(id) {
        if (id === '031') {
            const blocked = [1, 2].some(n => {
                const raw = localStorage.getItem(`mgs_card_${n}`);
                if (!raw) return false;
                const card = JSON.parse(raw);
                return Object.values(card).some(s => (s?.savedForStage ?? 0) >= 5);
            });
            if (blocked) {
                const popup = document.getElementById('memory-box-delete-blocked-popup');
                if (popup) popup.style.display = 'flex';
                return;
            }
        }
        this._pendingMemoryBoxDelete = id;
        const popup = document.getElementById('memory-box-delete-popup');
        if (!popup) return;
        const eq = EQUIPMENT[id];
        const nameEl = document.getElementById('memory-box-delete-name');
        if (nameEl) nameEl.textContent = eq ? `${id} — ${eq.name}` : id;
        popup.style.display = 'flex';
    },

    _memoryBoxDeleteCancel() {
        this._pendingMemoryBoxDelete = null;
        const popup = document.getElementById('memory-box-delete-popup');
        if (popup) popup.style.display = 'none';
    },

    _memoryBoxDeleteConfirmed() {
        const id = this._pendingMemoryBoxDelete;
        this._pendingMemoryBoxDelete = null;
        const popup = document.getElementById('memory-box-delete-popup');
        if (popup) popup.style.display = 'none';
        if (!id) return;
        this._saveMemoryBox(this._getMemoryBox().filter(x => x !== id));
        this._renderMemoryBoxList();
    },

    // ============================================
    // SPECIAL SCREEN
    // ============================================
    showSpecialScreen() {
        const btn = document.getElementById('special-demo-theater-btn');
        if (btn) btn.style.display = this._isDemoTheaterUnlocked() ? '' : 'none';
        this.showScreen('special-screen');
    },

    // ============================================
    // DEMO THEATER
    // ============================================
    _isDemoTheaterUnlocked() {
        if (localStorage.getItem('mgs_extreme_unlocked')) return true;
        return [1, 2].some(n => {
            const raw = localStorage.getItem(`mgs_card_${n}`);
            if (!raw) return false;
            try {
                const card = JSON.parse(raw);
                return Object.values(card).some(b => Array.isArray(b?.unlockedEquipment) && b.unlockedEquipment.includes('023'));
            } catch { return false; }
        });
    },

    _demoTheaterPlaylist: [
        // Stage 01 — Molo di carico
        { file: "video/stage_01_intro.mp4", musicId: "cavern", musicDelay: 65000, musicVolume: 10 },
        { file: "video/Stage_01_A.mp4" },
        { file: "video/Stage_01_Outro.mp4" },
       
        // Stage 02 — Eliporto
        { file: "video/stage_02_intro.mp4" },
		 // Save screen 02
        { file: "video/mei ling/pre-save-02.mp4" },
        { file: "video/mei ling/save-02.mp4" },
        { file: "video/stage_02_outro.mp4" },
        // Save screen 03
        { file: "video/mei ling/pre-save-03.mp4" },
        { file: "video/mei ling/save-03.mp4" },
        // Stage 03 — Celle di detenzione
        { file: "video/stage_03_intro.mp4" },
        { file: "video/stage_03_A.mp4" },
        { file: "video/stage_03_B.mp4" },
        { file: "video/stage_03_outro.mp4" },
        // Save screen 04
        { file: "video/mei ling/pre-save-04.mp4" },
        { file: "video/mei ling/save-04.mp4" },
        // Stage 04 — Revolver Ocelot
        { file: "video/stage_04_intro.mp4" },
        { file: "video/stage_04_outro.mp4" },
        // Save screen 05
        { file: "video/mei ling/pre-save-05.mp4" },
        { file: "video/mei ling/save-05.mp4" },
        // Stage 05 — Imboscata del carro armato
        { file: "video/stage_05_intro.mp4" },
        { file: "video/stage_05_outro.mp4" },
        // Save screen 06
        { file: "video/mei ling/pre-save-06.mp4" },
        { file: "video/mei ling/save-06.mp4" },
        // Stage 06 — Deposito testate nucleari
        { file: "video/stage_06_intro.mp4", musicId: "warhead", musicDelay: 66533, musicVolume: 20, musicStartOffset: 106.02 },
        { file: "video/stage_06_A.mp4" },
        { file: "video/stage_06_outro.mp4" },
        // Save screen 07
        { file: "video/mei ling/pre-save-07.mp4" },
        { file: "video/mei ling/save-07.mp4" },
        // Stage 07 — Cyborg Ninja
        { file: "video/stage_07_intro.mp4", musicId: "duel", musicDelay: 106240, musicVolume: 20 },
        { file: "video/stage_07_ninja_prima_ferita.mp4" },
        { file: "video/stage_07_ninja_ombra.mp4" },
        { file: "video/stage_07_ninja_ferita.mp4" },
        { file: "video/stage_07_outro.mp4" },
        // Save screen 08 — Psycho Mantis legge la memory card
        { file: "video/mei ling/pre-save-08.mp4" },
		 { file: "video/mei ling/save-08.mp4" },
        
       
        // Stage 08 — Psycho Mantis
        { file: "video/stage_08_intro.mp4" },
		{ file: "video/mantis/a-c-s-.mp4" },
        { file: "video/mantis/mantis_dimostrazione.mp4" },
        { file: "video/stage_08_outro.mp4" },
        // Save screen 09
        { file: "video/mei ling/pre-save-09.mp4" },
        { file: "video/mei ling/save-09.mp4" },
        // Stage 09 — Evasione
        { file: "video/stage_09_intro.mp4" },
        { file: "video/stage_09_outro_part1_ketchup.mp4" },
        { file: "video/stage_09_outro_part2.mp4" },
        // Save screen 10
        { file: "video/mei ling/pre-save-10.mp4" },
        { file: "video/mei ling/save-10.mp4" },
        // Stage 10 — Elicottero da guerra
        { file: "video/stage_10_intro.mp4" },
        { file: "video/stage_10_outro.mp4" },
        // Save screen 11
        { file: "video/mei ling/pre-save-11.mp4" },
        { file: "video/mei ling/save-11.mp4" },
        // Stage 11 — Sniper Wolf
        { file: "video/stage_11_intro.mp4" },
        { file: "video/stage_11_outro.mp4" },
        // Save screen 12
        { file: "video/mei ling/pre-save-12.mp4" },
        { file: "video/mei ling/save-12.mp4" },
        // Stage 12 — Vulcan Raven
        { file: "video/stage_12_intro.mp4" },
        { file: "video/stage_12_outro.mp4" },
        // Save screen 13
        { file: "video/mei ling/pre-save-13.mp4" },
        { file: "video/mei ling/save-13.mp4" },
        // Stage 13 — Sovrascrittura PAL
        { file: "video/stage_13_intro.mp4" },
        { file: "video/stage_13_outro.mp4" },
        
        // Stage 14 — Metal Gear REX
        { file: "video/stage_14_intro.mp4" },
		// Save screen 14
        { file: "video/mei ling/pre-save-14.mp4" },
        { file: "video/mei ling/save-14.mp4" },
        { file: "video/stage_14_outro.mp4" },
    ],

    showDemoTheater() {
        this._demoTheaterIndex = 0;
        this._demoTheaterEndedListener = null;
        this._demoTheaterMusicTimer = null;
        this.showScreen('demo-theater-screen');
        this._demoTheaterPlayNext();
    },

    _demoTheaterPlayNext() {
        const playlist = this._demoTheaterPlaylist;
        const idx = this._demoTheaterIndex;
        const video = document.getElementById('demo-theater-video');
        if (!video) return;

        if (idx >= playlist.length) {
            this.stopDemoTheater();
            this.showSpecialScreen();
            return;
        }

        const item = playlist[idx];

        // Stop previous music and listeners
        this.stopMusic();
        if (this._demoTheaterEndedListener) {
            video.removeEventListener('ended', this._demoTheaterEndedListener);
            this._demoTheaterEndedListener = null;
        }
        if (this._demoTheaterMusicTimer) {
            video.removeEventListener('timeupdate', this._demoTheaterMusicTimer);
            this._demoTheaterMusicTimer = null;
        }

        // Music with delay (same mechanism as stage intros)
        if (item.musicId) {
            const triggerTime = (item.musicDelay || 0) / 1000;
            const vol = (item.musicVolume || 20) / 100;
            const offset = item.musicStartOffset ?? null;
            const onTime = () => {
                if (video.currentTime >= triggerTime) {
                    video.removeEventListener('timeupdate', onTime);
                    this._demoTheaterMusicTimer = null;
                    const savedStage = this.currentStage;
                    this.currentStage = null;
                    this.playMusicAtVolume(item.musicId, vol, offset);
                    this.currentStage = savedStage;
                }
            };
            this._demoTheaterMusicTimer = onTime;
            video.addEventListener('timeupdate', onTime);
        }

        // Auto-advance on end
        this._demoTheaterEndedListener = () => {
            this._demoTheaterEndedListener = null;
            this._demoTheaterIndex++;
            this._demoTheaterPlayNext();
        };
        video.addEventListener('ended', this._demoTheaterEndedListener, { once: true });

        // Update counter
        const info = document.getElementById('demo-theater-info');
        if (info) info.textContent = `${idx + 1} / ${playlist.length}`;

        // Play video (keep same element — no close/reopen)
        video.src = item.file;
        video.play().catch(e => console.warn(e.message));
    },

    demoTheaterSkip() {
        const video = document.getElementById('demo-theater-video');
        if (!video) return;
        if (this._demoTheaterEndedListener) {
            video.removeEventListener('ended', this._demoTheaterEndedListener);
            this._demoTheaterEndedListener = null;
        }
        if (this._demoTheaterMusicTimer) {
            video.removeEventListener('timeupdate', this._demoTheaterMusicTimer);
            this._demoTheaterMusicTimer = null;
        }
        video.pause();
        this._demoTheaterIndex++;
        this._demoTheaterPlayNext();
    },

    stopDemoTheater() {
        const video = document.getElementById('demo-theater-video');
        if (video) {
            if (this._demoTheaterEndedListener) {
                video.removeEventListener('ended', this._demoTheaterEndedListener);
                this._demoTheaterEndedListener = null;
            }
            if (this._demoTheaterMusicTimer) {
                video.removeEventListener('timeupdate', this._demoTheaterMusicTimer);
                this._demoTheaterMusicTimer = null;
            }
            video.pause();
            video.removeAttribute('src');
            video.load();
        }
        this.stopMusic();
    },
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