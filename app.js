/**
 * MGS BOARD GAME COMPANION - APP
 */

const App = {
    currentScreen: 'boot-screen',
    currentStage: null,
    ytPlayer: null,
    ytReady: false,
    musicAudio: null,
    ambientAudio: null,
    currentMusicBtn: null,
    currentAmbientBtn: null,

    // ============================================
    // SCREEN MANAGEMENT
    // ============================================
    showScreen(screenId) {
        // Fade out current
        const current = document.querySelector('.screen.active');
        if (current) {
            current.classList.remove('active');
        }

        // Small delay for transition feel
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
            const hasIntro = stage.intro && stage.intro.id;
            const hasOutro = stage.outro && stage.outro.id;
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
            btnIntro.disabled = !stage.intro || !stage.intro.id;
            btnIntro.style.opacity = stage.intro && stage.intro.id ? '1' : '0.3';
        }
        if (btnOutro) {
            btnOutro.disabled = !stage.outro || !stage.outro.id;
            btnOutro.style.opacity = stage.outro && stage.outro.id ? '1' : '0.3';
        }

        // Reset video
        this.stopVideo();

        // Show screen
        this.showScreen('stage-active');
    },

    // ============================================
    // YOUTUBE PLAYER
    // ============================================
    initYouTube() {
        // Load YouTube IFrame API
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScript = document.getElementsByTagName('script')[0];
        firstScript.parentNode.insertBefore(tag, firstScript);
    },

    onYouTubeReady() {
        this.ytReady = true;
    },

    createPlayer(videoId, startSeconds, endSeconds) {
        const placeholder = document.getElementById('video-placeholder');
        if (placeholder) placeholder.style.display = 'none';

        // Destroy existing player
        if (this.ytPlayer) {
            try { this.ytPlayer.destroy(); } catch(e) {}
            this.ytPlayer = null;
        }

        // Recreate the div
        const wrapper = document.getElementById('video-wrapper');
        let playerDiv = document.getElementById('youtube-player');
        if (!playerDiv) {
            playerDiv = document.createElement('div');
            playerDiv.id = 'youtube-player';
            wrapper.appendChild(playerDiv);
        }

        const playerVars = {
            autoplay: 1,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            hl: 'it',
        };

        if (startSeconds > 0) playerVars.start = startSeconds;
        if (endSeconds > 0) playerVars.end = endSeconds;

        this.ytPlayer = new YT.Player('youtube-player', {
            videoId: videoId,
            playerVars: playerVars,
            events: {
                onReady: (e) => e.target.playVideo(),
                onStateChange: (e) => {
                    const stopBtn = document.getElementById('btn-stop-video');
                    if (e.data === YT.PlayerState.PLAYING) {
                        if (stopBtn) stopBtn.style.display = '';
                    } else if (e.data === YT.PlayerState.ENDED || e.data === YT.PlayerState.PAUSED) {
                        // Keep stop visible as long as player exists
                    }
                }
            }
        });
    },

    playIntro() {
        if (!this.currentStage || !this.currentStage.intro || !this.currentStage.intro.id) return;
        const v = this.currentStage.intro;
        this.createPlayer(v.id, v.start || 0, v.end || 0);
    },

    playOutro() {
        if (!this.currentStage || !this.currentStage.outro || !this.currentStage.outro.id) return;
        const v = this.currentStage.outro;
        this.createPlayer(v.id, v.start || 0, v.end || 0);
    },

    stopVideo() {
        if (this.ytPlayer) {
            try { this.ytPlayer.destroy(); } catch(e) {}
            this.ytPlayer = null;
        }
        // Recreate placeholder
        const wrapper = document.getElementById('video-wrapper');
        if (wrapper) {
            // Remove old player div
            const oldPlayer = document.getElementById('youtube-player');
            if (oldPlayer) oldPlayer.remove();

            // Show placeholder
            const placeholder = document.getElementById('video-placeholder');
            if (placeholder) placeholder.style.display = '';

            // Recreate player div for next use
            const newPlayer = document.createElement('div');
            newPlayer.id = 'youtube-player';
            wrapper.appendChild(newPlayer);
        }
        const stopBtn = document.getElementById('btn-stop-video');
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
            container.innerHTML = '<div class="no-audio-msg">Nessun effetto sonoro configurato. Aggiungi file .mp3 in audio/sfx/</div>';
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
            container.innerHTML = '<div class="no-audio-msg">Nessuna musica configurata. Aggiungi file .mp3 in audio/music/</div>';
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

        // Stop current music
        this.stopMusic();

        this.musicAudio = new Audio(track.file);
        this.musicAudio.loop = true;
        this.musicAudio.volume = (document.getElementById('music-volume')?.value || 50) / 100;

        this.musicAudio.play().then(() => {
            // Show controls
            const controls = document.getElementById('music-controls');
            if (controls) controls.style.display = '';

            // Highlight button
            this.currentMusicBtn = document.getElementById(`music-btn-${index}`);
            if (this.currentMusicBtn) this.currentMusicBtn.classList.add('playing');
        }).catch(e => {
            console.warn('Impossibile riprodurre:', track.file, e.message);
        });
    },

    setMusicVolume(val) {
        if (this.musicAudio) {
            this.musicAudio.volume = val / 100;
        }
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
            container.innerHTML = '<div class="no-audio-msg">Nessun suono ambientale configurato. Aggiungi file .mp3 in audio/ambient/</div>';
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
        if (this.ambientAudio) {
            this.ambientAudio.volume = val / 100;
        }
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
        this.initYouTube();

        // Keyboard: Enter on stage cards
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

// YouTube API callback
function onYouTubeIframeAPIReady() {
    App.onYouTubeReady();
}

// Boot
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
