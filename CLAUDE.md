# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Sviluppo locale

Nessun build system o dipendenze npm. Aprire un server HTTP locale nella root del progetto:

```bash
python3 -m http.server 8000
# oppure
npx serve .
```

Poi aprire `http://localhost:8000`. Il server è necessario perché i file audio non sono caricabili via `file://` per policy del browser.

## Architettura

App web statica, zero dipendenze, HTML/CSS/JS puro.

### Flusso dell'applicazione

```
press-start-screen → intro-screen (video) → main-menu → stage-select → stage-active
```

Ogni "schermata" è un `<div class="screen">` nel DOM, sempre presente ma nascosto (`display: none`). Solo uno alla volta ha `.active` (`display: block`). La transizione è gestita da `App.showScreen(id)` con un gap di 100ms tra rimozione e aggiunta della classe.

### File principali

- **`js/config.js`** — unico file di configurazione. Contiene le mappe `music`, `ambient`, `alertSounds`, `menuSounds`, `sfx`, e l'array `stages`. **Questo è il file da modificare per aggiungere contenuti** (audio, video, nuovi stage).
- **`js/app.js`** — singleton globale `App`. Gestisce tutto: navigazione schermate, riproduzione audio, menu PS1, sistema alert.
- **`css/style.css`** — stile completo, tema Codec MGS (verde/rosso su nero).
- **`index.html`** — struttura DOM statica. Le card degli stage e i pulsanti audio vengono generati da JS.

### Audio: Seamless Loop Player

`App.createSeamlessLoop(file, volume, loopOverlap)` crea un player dual-buffer (audioA/audioB) che avvia la traccia successiva `loopOverlap` secondi prima della fine, eliminando il gap del loop nativo HTML5. Restituisce un oggetto `{ play, stop, setVolume, getVolume, isPlaying }`.

Ogni tipo di audio ha il suo loop attivo come proprietà di `App`:
- `App.musicLoop` — musica di stage
- `App.ambientLoop` — suoni ambientali
- `App.alertLoop` / `App.evasionLoop` — sistema alert
- `App.menuMusicLoop` / `App.menuIntroAudio` — musica menu

### Menu PS1

Il menu usa un "wheel" CSS con tre voci (`prev`, `current`, `next`) posizionate in `absolute`. La navigazione aggiunge classi `slide-up`/`slide-down` che attivano CSS transitions, poi JS aggiorna il testo e resetta via `style.transition = 'none'` + reflow.

La splash (`#menu-splash`) usa `CSS transition: opacity 3s linear` (NON keyframe animation) per poter essere resettata affidabilmente con `classList.remove + void offsetHeight + classList.add`.

### Sistema Alert

`App.alertState` ha tre valori: `'normal'` → `'alert'` → `'evasion'` → `'normal'`. Le transizioni tra alert-loop e evasion-loop usano `App.crossfadeLoops()` (crossfade di 1.5s). Il sistema alert è disabilitato durante le boss fight (`stage.isBoss: true`).

### Configurare uno stage in `config.js`

```js
{
    id: 1,
    name: "Cargo Dock",
    type: "SNEAKING MISSION",   // o "BOSS BATTLE"
    isBoss: false,
    intro: "video/Stage_01_Intro.mp4",   // "" se assente
    outro: "video/Stage_01_Outro.mp4",
    musicIds: ["cavern"],                 // chiavi da CONFIG.music
    ambientIds: [],                       // chiavi da CONFIG.ambient
    musicDuringIntro: true,
    musicIntroDelay: 67000,              // ms dall'inizio del video intro
    musicIntroVolume: 20,                // 0-100
}
```

`loopOverlap` nei file audio (default `0.05` s) va aumentato se si sentono click a fine loop; il valore ottimale dipende dall'encoding del file.
