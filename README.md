# 🎮 MGS Board Game Companion

Un'app web companion per il gioco da tavolo **Metal Gear Solid: The Board Game** (CMON).

Aggiunge un'esperienza cinematografica alla sessione di gioco con video intro/outro per ogni stage e un soundboard con effetti sonori, musica di sottofondo e suoni ambientali.

> ⚡ Ispirato a [metal-gear-solid-soundboard](https://wikiti.github.io/metal-gear-solid-soundboard/) di Wikiti

## 🖥️ Demo

👉 **[Apri l'app](https://TUOUSERNAME.github.io/mgs-boardgame-companion/)**

*(Sostituisci `TUOUSERNAME` con il tuo username GitHub dopo il deploy)*

## ✨ Funzionalità

- **14 Stage** della campagna Shadow Moses
- **Video Intro/Outro** per ogni stage (YouTube embed, cutscene in italiano)
- **Soundboard** con effetti sonori iconici (Alert, Codec, Game Over, ecc.)
- **Musica di sottofondo** con controllo volume e loop
- **Suoni ambientali** (vento artico, macchinari, neve, ecc.)
- **Design Codec-inspired** con scanlines e animazioni
- **Zero dipendenze** — HTML/CSS/JS puro
- **Responsive** — funziona su desktop, tablet e smartphone
- **GitHub Pages ready** — deploy immediato

## 🚀 Setup Rapido

### 1. Clona il repository

```bash
git clone https://github.com/TUOUSERNAME/mgs-boardgame-companion.git
cd mgs-boardgame-companion
```

### 2. Aggiungi i Video YouTube

Apri `js/config.js` e inserisci gli ID dei video YouTube per ogni stage.

Per trovare l'ID: se il link è `https://www.youtube.com/watch?v=ABC123`, l'ID è `ABC123`.

Puoi anche specificare i secondi di inizio e fine per tagliare la parte esatta della cutscene:

```javascript
{
    id: 1,
    name: "Cargo Dock",
    // ...
    intro: { id: "ABC123", start: 0, end: 180 },   // Primi 3 minuti
    outro: { id: "DEF456", start: 45, end: 120 },   // Da 0:45 a 2:00
},
```

### 3. Aggiungi i File Audio

Crea le cartelle per i file audio e inserisci i tuoi file `.mp3`:

```
audio/
├── sfx/           ← Effetti sonori (alert.mp3, codec.mp3, game-over.mp3, ecc.)
├── music/         ← Musica di sottofondo (encounter.mp3, duel.mp3, ecc.)
└── ambient/       ← Suoni ambientali (arctic-wind.mp3, machinery.mp3, ecc.)
```

Poi aggiorna la configurazione in `js/config.js` con i nomi corretti dei file.

### 4. Testa in locale

Apri un server locale (necessario per i file audio):

```bash
# Con Python 3
python3 -m http.server 8000

# Con Node.js
npx serve .
```

Poi apri `http://localhost:8000` nel browser.

### 5. Deploy su GitHub Pages

1. Crea un nuovo repository su GitHub
2. Pusha tutto il codice
3. Vai in **Settings → Pages → Source: main branch**
4. L'app sarà disponibile su `https://TUOUSERNAME.github.io/mgs-boardgame-companion/`

## 📁 Struttura del Progetto

```
mgs-boardgame-companion/
├── index.html          ← Pagina principale
├── css/
│   └── style.css       ← Stili (tema Codec MGS)
├── js/
│   ├── config.js       ← ⚙️ CONFIGURAZIONE (video, suoni, stage)
│   └── app.js          ← Logica dell'app
├── audio/              ← 🔊 I tuoi file audio (da aggiungere)
│   ├── sfx/
│   ├── music/
│   └── ambient/
└── README.md
```

## ⚙️ Personalizzazione

### Aggiungere uno Sound Effect

In `js/config.js`, aggiungi un oggetto nell'array `sfx`:

```javascript
sfx: [
    // ...effetti esistenti...
    { name: "Nuovo Suono", file: "audio/sfx/nuovo-suono.mp3", icon: "♦" },
],
```

### Aggiungere Musica

```javascript
music: [
    // ...tracce esistenti...
    { name: "Nuova Traccia", file: "audio/music/nuova-traccia.mp3" },
],
```

### Aggiungere Suoni Ambientali

```javascript
ambient: [
    // ...suoni esistenti...
    { name: "Pioggia", file: "audio/ambient/pioggia.mp3" },
],
```

## 🎬 Dove Trovare i Contenuti

### Video (Cutscene in Italiano)
Cerca su YouTube: `"Metal Gear Solid" ITA cutscene` oppure `"Metal Gear Solid" italiano film completo` e annota gli ID e i timestamp per ogni stage.

### Audio
- **Effetti Sonori**: cercali su siti come [101soundboards.com](https://www.101soundboards.com) o [myinstants.com](https://www.myinstants.com)
- **Musica**: la colonna sonora originale di MGS1 è facilmente reperibile
- **Ambientali**: siti come [freesound.org](https://freesound.org) per vento, neve, macchinari

## 📜 Note Legali

Questo è un progetto fan-made non ufficiale, creato per uso personale come companion del gioco da tavolo ufficiale. Metal Gear Solid è un marchio registrato di Konami Digital Entertainment. Il gioco da tavolo è pubblicato da CMON.

## 🤝 Contribuire

Pull request benvenute! Se hai idee per migliorare l'app:

1. Fork del repository
2. Crea un branch (`git checkout -b feature/nuova-funzione`)
3. Commit delle modifiche (`git commit -m 'Aggiunta nuova funzione'`)
4. Push al branch (`git push origin feature/nuova-funzione`)
5. Apri una Pull Request

---

*"A strong man doesn't need to read the future. He makes his own."*
— Solid Snake
