/**
 * MGS BOARD GAME COMPANION - APP
 * Versione con video locali (.mp4)
 */

const App = {
    currentScreen: 'boot-screen',
    currentStage: null,
    musicAudio: null,
    ambientAudio: null,
    currentMusicBtn: null,
    currentAmbientBtn: null,

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

        // Update header
        const title = document.getElementById('active-stage-title');
        if (title) title.textContent = `STAGE ${String(stage.id).padStart(2, '0')} — ${stage.name.toUpperCase()}`;

        const status = document.getElementById('stage-status');
        if (status) {
            status.textContent = stage.isBoss ? 'BOSS BATTLE' : 'SNEAKING MISSION';
            status.style.color = stage.isBoss ? 'var(--codec-red)' : 'var(--codec-orange)';
            status.style.borderColor = stage.isBoss ? 'rgba(255, 58, 58, 0.3)' : 'rgba(255, 140, 58, 0.3)';
        }

        // Update video buttons
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

        // Reset video
        this.stopVideo();

        this.showScreen('stage-active');
    },

    // ============================================
    // VIDEO PLAYER (locale)
    // ============================================
    playVideo(src) {
        if (!src || src.length === 0) return;

        const player = document.getElementById('video-player');
        const placeholder = document.getElementById('video-placeholder');
        const stopBtn = document.getElementById('btn-stop-video');

        if (placeholder) placeholder.style.display = 'none';
        if (player) {
            player.src = src;
            player.style.display = 'block';
            player.play().catch(e => {
                console.warn('Impossibile riprodurre video:', e.message);
            });
        }
        if (stopBtn) stopBtn.style.display = '';
    },

    playIntro() {
        if (!this.currentStage) return;
        this.playVideo(this.currentStage.intro);
    },

    playOutro() {
        if (!this.currentStage) return;
        this.playVideo(this.currentStage.outro);
    },

    stopVideo() {
        const player = document.getElementById('video-player');
        const placeholder = document.getElementById('video-placeholder');
        const stopBtn = document.getElementById('btn-stop-video');

        if (player) {
            player.pause();
            player.removeAttribute('src');
            player.load();
            player.style.display = 'none';
        }
        if (placeholder) placeholder.style.display = '';
        if (stopBtn) stopBtn.style.display = 'none';
    },

    // ============================================
    // SOUND EFFECTS
    // ============================================
    initSoundButtons() {
        this.initSfxButtons();
        this.initMusicButtons();
        this.initAmbientButtons();
    },

    initSfxButtons() {
        const container = document.getElementById('sfx-buttons');
        if (!container) return;

        if (CONFIG.sfx.length === 0) {
            container.innerHTML = '<div class="no-audio-msg">Nessun effetto sonoro configurato.</div>';
            return;
        }

        container.innerHTML = CONFIG.sfx.map((sfx, i) => `
            <button class="btn-sound" onclick="App.playSfx(${i})" title="${sfx.name}">
                <span class="sfx-icon">${sfx.icon || '♪'}</span> ${sfx.name}
            </button>
        `).join('');
    },

    playSfx(index) {
        const sfx = CONFIG.sfx[index];
        if (!sfx) return;

        const audio = new Audio(sfx.file);
        audio.volume = 0.8;
        audio.play().catch(e => {
            console.warn('Impossibile riprodurre:', sfx.file, e.message);
        });
    },

    // ============================================
    // BACKGROUND MUSIC
    // ============================================
    initMusicButtons() {
        const container = document.getElementById('music-buttons');
        if (!container) return;

        if (CONFIG.music.length === 0) {
            container.innerHTML = '<div class="no-audio-msg">Nessuna musica configurata.</div>';
            return;
        }

        container.innerHTML = CONFIG.music.map((track, i) => `
            <button class="btn-sound" id="music-btn-${i}" onclick="App.playMusic(${i})">
                ♪ ${track.name}
            </button>
        `).join('');
    },

    playMusic(index) {
        const track = CONFIG.music[index];
        if (!track) return;

        this.stopMusic();

        this.musicAudio = new Audio(track.file);
        this.musicAudio.loop = true;
        this.musicAudio.volume = (document.getElementById('music-volume')?.value || 50) / 100;

        this.musicAudio.play().then(() => {
            const controls = document.getElementById('music-controls');
            if (controls) controls.style.display = '';

            this.currentMusicBtn = document.getElementById(`music-btn-${index}`);
            if (this.currentMusicBtn) this.currentMusicBtn.classList.add('playing');
        }).catch(e => {
            console.warn('Impossibile riprodurre:', track.file, e.message);
        });
    },

    setMusicVolume(val) {
        if (this.musicAudio) this.musicAudio.volume = val / 100;
    },

    stopMusic() {
        if (this.musicAudio) {
            this.musicAudio.pause();
            this.musicAudio.currentTime = 0;
            this.musicAudio = null;
        }
        if (this.currentMusicBtn) {
            this.currentMusicBtn.classList.remove('playing');
            this.currentMusicBtn = null;
        }
        const controls = document.getElementById('music-controls');
        if (controls) controls.style.display = 'none';
    },

    // ============================================
    // AMBIENT SOUNDS
    // ============================================
    initAmbientButtons() {
        const container = document.getElementById('ambient-buttons');
        if (!container) return;

        if (CONFIG.ambient.length === 0) {
            container.innerHTML = '<div class="no-audio-msg">Nessun suono ambientale configurato.</div>';
            return;
        }

        container.innerHTML = CONFIG.ambient.map((amb, i) => `
            <button class="btn-sound" id="ambient-btn-${i}" onclick="App.playAmbient(${i})">
                ◊ ${amb.name}
            </button>
        `).join('');
    },

    playAmbient(index) {
        const amb = CONFIG.ambient[index];
        if (!amb) return;

        this.stopAmbient();

        this.ambientAudio = new Audio(amb.file);
        this.ambientAudio.loop = true;
        this.ambientAudio.volume = (document.getElementById('ambient-volume')?.value || 30) / 100;

        this.ambientAudio.play().then(() => {
            const controls = document.getElementById('ambient-controls');
            if (controls) controls.style.display = '';

            this.currentAmbientBtn = document.getElementById(`ambient-btn-${index}`);
            if (this.currentAmbientBtn) this.currentAmbientBtn.classList.add('playing');
        }).catch(e => {
            console.warn('Impossibile riprodurre:', amb.file, e.message);
        });
    },

    setAmbientVolume(val) {
        if (this.ambientAudio) this.ambientAudio.volume = val / 100;
    },

    stopAmbient() {
        if (this.ambientAudio) {
            this.ambientAudio.pause();
            this.ambientAudio.currentTime = 0;
            this.ambientAudio = null;
        }
        if (this.currentAmbientBtn) {
            this.currentAmbientBtn.classList.remove('playing');
            this.currentAmbientBtn = null;
        }
        const controls = document.getElementById('ambient-controls');
        if (controls) controls.style.display = 'none';
    },

    // ============================================
    // STOP ALL
    // ============================================
    stopAllAudio() {
        this.stopVideo();
        this.stopMusic();
        this.stopAmbient();
    },

    // ============================================
    // INIT
    // ============================================
    init() {
        this.initStageGrid();
        this.initSoundButtons();

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.currentScreen === 'stage-active') {
                    this.stopAllAudio();
                    this.showScreen('stage-select');
                }
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});