/**
 * MGS BOARD GAME COMPANION — CONFIG
 *
 * Questo file contiene solo la configurazione audio e le impostazioni dell'app.
 * I dati di gioco sono nei file separati:
 *
 *   stages.js      → STAGES     (missioni della campagna)
 *   characters.js  → CHARACTERS (personaggi, azioni, capacità)
 *   equipment.js   → EQUIPMENT  (armi e oggetti)
 *   guards.js      → GUARDS     (suoni e carte ordini guardie)
 *   bosses.js      → BOSSES     (meccaniche boss)
 *
 * MAPPA MUSICHE:
 *   loopOverlap: secondi di sovrapposizione per loop seamless (opzionale, default 0.05)
 *   introStart:  offset di partenza in ms (se numero grande) o secondi (se <1000)
 *   loopStart/loopEnd: punti di loop in secondi
 */

const CONFIG = {

    // ============================================
    // MAPPA MUSICHE (id → file)
    // ============================================
    music: {
        "introduction": { name: "Introduction",    file: "audio/music/Introduction.mp3",    introStart: 0,     loopStart: 9.444,  loopEnd: 20.999  },
        "encounter":    { name: "Encounter",       file: "audio/music/Encounter.mp3",       introStart: 0,     loopStart: 1.069,  loopEnd: 48.312  },
        "evasion":      { name: "Evasion",         file: "audio/music/Evasion.mp3",         introStart: 0,     loopStart: 77.500, loopEnd: 127.431 },
        "cavern":       { name: "Cavern",          file: "audio/music/Cavern.mp3",          introStart: 0,     loopStart: 0.822,  loopEnd: 92.806  },
        "intruder-1":   { name: "Intruder 1",      file: "audio/music/Intruder_1.mp3",      introStart: 0,     loopStart: 0.740,  loopEnd: 65.880  },
        "intruder-2":   { name: "Intruder 2",      file: "audio/music/Intruder_2.mp3",      introStart: 0,     loopStart: 22.750, loopEnd: 90.830  },
        "intruder-3":   { name: "Intruder 3",      file: "audio/music/Intruder_3.mp3",      introStart: 14250,     loopStart: 71.300, loopEnd: 133.700 },
        "intruder-4":   { name: "Intruder 4",      file: "audio/music/Intruder_3.mp3",      introStart: 45450, loopStart: 71.300, loopEnd: 133.700 },
        "duel":         { name: "Duel",            file: "audio/music/Duel.mp3",            introStart: 0,     loopStart: 58.400, loopEnd: 116.000 },
        "warhead":      { name: "Warhead Storage", file: "audio/music/Warhead_Storage.mp3", introStart: 20100,     loopStart: 33.850, loopEnd: 131.900 },
        "arctic-wind":  { name: "Vento Artico",    file: "audio/music/arctic-wind.mp3",     introStart: 24874, loopStart: 24.874, loopEnd: 109.323 },
		"furnace":      { name: "Blast Furnace", file: "audio/music/Blast_Furnace.mp3", 	introStart: 0,     loopStart: 70.522, loopEnd: 146.689 },
		"rex-lair":      { name: "Rex Lair", file: "audio/music/Rex_Lair.mp3", 				introStart: 0,     loopStart: 57.100, loopEnd: 153.500 },
    },

    // ============================================
    // SUONI MENU
    // ============================================
    menuSounds: {
        "choice":       { name: "Choice",       file: "audio/sfx/choice.mp3"       },
        "confirm":      { name: "Confirm",      file: "audio/sfx/confirm.mp3"      },
        "confirm-save": { name: "Confirm Save", file: "audio/sfx/confirm-save.mp3" },
        "return":       { name: "Return",       file: "audio/sfx/return.mp3"       },
    },

    // ============================================
    // SUONI ALERT
    // ============================================
    alertSounds: {
        "discovery":       { name: "Eccolo!",               file: "audio/sfx/discovery.mp3"       },
        "this-way":        { name: "Da questa parte!",      file: "audio/sfx/this-way.mp3"        },
        "return-to-posts": { name: "Tornate ai vostri posti", file: "audio/sfx/return-to-posts.mp3" },
    },

    // ============================================
    // SUONI GAME OVER
    // Ogni stage può avere gameOverSounds: ["01","03",...] per un sottoinsieme,
    // oppure null per usare tutti.
    // ============================================
    gameOverSoundsPath: "audio/sfx/game-over/",
    gameOverSounds: [
        "01","02","03","04","05","06","07","08","09",
        "10","11","12","13","14","15","16","17","18",
    ],
    // Timing personalizzato per suoni specifici (secondi nel video game over).
    // Default: 4. Abbassare per far partire prima.
    gameOverSoundsTiming: {
        "15": 3,
    },

    // ============================================
    // SCHERMATA DI SALVATAGGIO
    // ============================================
    saveScreen: {
        intro: [
            "video/Save_Intro_01.mp4",
            "video/Save_Intro_02.mp4",
            "video/Save_Intro_03.mp4",
        ],
        outro: [
            "video/Save_Outro_01.mp4",
            "video/Save_Outro_02.mp4",
        ],
        noSaveOutro: [
            "video/No_Save_Outro_01.mp4",
            "video/No_Save_Outro_02.mp4",
            "video/No_Save_Outro_03.mp4",
        ],
        noSaveIntro: "video/No_Save_Intro.mp4",
        noSaveSilenceOutro: [
            "video/No_Save_Silence_Outro_01.mp4",
            "video/No_Save_Silence_Outro_02.mp4",
            "video/No_Save_Silence_Outro_03.mp4",
        ],
    },

    // ============================================
    // EFFETTI SONORI GLOBALI
    // ============================================
    sfx: [
        { name: "Alert",      file: "audio/sfx/alert.mp3",       icon: "!",  isAlert: true  },
        { name: "Alert Cancel",file: "audio/sfx/alert-cancel.mp3",icon: "~", isAlert: false },
        { name: "Codec",      file: "audio/sfx/codec.mp3",        icon: "☎", isAlert: false },
        { name: "Codec End",  file: "audio/sfx/codec-end.mp3",    icon: "☎", isAlert: false },
        { name: "Game Over",  file: "audio/sfx/game-over.mp3",    icon: "✕", isAlert: false, track: "continues"    },
        { name: "Item",       file: "audio/sfx/item.mp3",         icon: "★", isAlert: false },
        { name: "Razione",    file: "audio/sfx/ration.mp3",       icon: "+", isAlert: false, track: "rations_used" },
        { name: "Scoperto",   file: "audio/sfx/spotted.mp3",      icon: "?", isAlert: false },
        { name: "Continue",   file: "audio/sfx/continue.mp3",     icon: "▶", isAlert: false },
        { name: "Guardia KO", file: "audio/sfx/guard-ko.mp3",     icon: "◆", isAlert: false },
    ],

};
