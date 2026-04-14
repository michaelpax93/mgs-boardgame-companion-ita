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
		"encounter-vr":    { name: "Encounter-Vr",       file: "audio/music/Encounter-Vr.mp3",       introStart: 0,     loopStart: 0.300,  loopEnd: 29.900  },
        "evasion":      { name: "Evasion",         file: "audio/music/Evasion.mp3",         introStart: 0,     loopStart: 77.500, loopEnd: 127.431 },
		"evasion-vr":      { name: "Evasion-Vr",         file: "audio/music/Evasion-Vr.mp3",         introStart: 0.800,     loopStart: 96.055, loopEnd: 127.845 },
        "cavern":       { name: "Cavern",          file: "audio/music/Cavern.mp3",          introStart: 0,     loopStart: 0.822,  loopEnd: 92.806  },
        "intruder-1":   { name: "Intruder 1",      file: "audio/music/Intruder_1.mp3",      introStart: 0,     loopStart: 0.740,  loopEnd: 65.880  },
        "intruder-2":   { name: "Intruder 2",      file: "audio/music/Intruder_2.mp3",      introStart: 0,     loopStart: 22.750, loopEnd: 90.830  },
        "intruder-3":   { name: "Intruder 3",      file: "audio/music/Intruder_3.mp3",      introStart: 14.250,    loopStart: 71.300, loopEnd: 133.700 },
        "intruder-4":   { name: "Intruder 4",      file: "audio/music/Intruder_3.mp3",      introStart: 45.450,    loopStart: 71.300, loopEnd: 133.700 },
        "duel":         { name: "Duel",            file: "audio/music/Duel.mp3",            introStart: 0,         loopStart: 58.400, loopEnd: 116.000 },
        "warhead":      { name: "Warhead Storage", file: "audio/music/Warhead_Storage.mp3", introStart: 20.100,    loopStart: 33.850, loopEnd: 131.900 },
        "arctic-wind":  { name: "Vento Artico",    file: "audio/music/arctic-wind.mp3",     introStart: 24.874, loopStart: 24.874, loopEnd: 109.323 },
		"furnace":      { name: "Blast Furnace", file: "audio/music/Blast_Furnace.mp3", 	introStart: 0,     loopStart: 70.522, loopEnd: 146.689 },
		"rex-lair":      { name: "Rex Lair", file: "audio/music/Rex_Lair.mp3", 				introStart: 0,     loopStart: 57.100, loopEnd: 153.500 },
		"mission-vr-training": { name: "Mission-Vr-Training",  file: "audio/music/Mission-Vr-Training.mp3", introStart: 0, loopStart: 63.990, loopEnd: 127.350},
		"mission-vr-boss":     { name: "Mission-Vr-Boss",      file: "audio/music/Mission-Vr-Boss.mp3",     introStart: 0, loopStart: 51.115, loopEnd: 135.751 },
		"ninja-vr":            { name: "Ninja-Vr",             file: "audio/music/Ninja-Vr.mp3",            introStart: 0, loopStart: 67.224, loopEnd: 126.846 },
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
    // SUONI VR TRAINING
    // ============================================
    vrSounds: {
        "confirm":       { file: "audio/sfx/vr-mission/confirm.wav"       },
        "return":        { file: "audio/sfx/vr-mission/return.wav"          },
        "jingle-inizio":       { file: "audio/sfx/vr-mission/jingle-inizio.mp3"       },
        "preinizio":           { file: "audio/sfx/vr-mission/preinizio.wav"           },
        "inizio":              { file: "audio/sfx/vr-mission/inizio.wav"              },
        "generazione-uscita":  { file: "audio/sfx/vr-mission/generazione-uscita.wav"  },
        "jingle-fine":         { file: "audio/sfx/vr-mission/jingle-fine.mp3"         },
        "prefine":             { file: "audio/sfx/vr-mission/prefine.wav"             },
        "vr-mission-1":        { file: "audio/sfx/vr-mission/vr-mission-1.wav"        },
        "vr-mission-2":        { file: "audio/sfx/vr-mission/vr-mission-2.wav"        },
        "vr-mission-3":        { file: "audio/sfx/vr-mission/vr-mission-3.wav"        },
        "vr-mission-4":        { file: "audio/sfx/vr-mission/vr-mission-4.wav"        },
        "tempo-poco":          { file: "audio/sfx/vr-mission/tempo-poco.wav"          },
        "tempo-scaduto":       { file: "audio/sfx/vr-mission/tempo-scaduto.wav"       },
        "elenco":              { file: "audio/sfx/vr-mission/elenco.wav"              },
        "rank":                { file: "audio/sfx/vr-mission/rank.wav"                },
        "fine":                { file: "audio/sfx/vr-mission/fine.wav"                },
        "vr-mission-conclusione": { file: "audio/sfx/vr-mission/vr-mission-conclusione.wav", volume: 1.0 },
        "oggetto-preso":  { file: "audio/sfx/oggetto-preso.wav"  },
        "oggetto-spawn":  { file: "audio/sfx/oggetto-spawn.wav"  },
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
        "10","11","12","13","14","15","16","17","18","19",
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

// ============================================
// VR TRAINING CONFIG
// ============================================
const VR_CONFIG = {
    stageProgress: 2.4,  // % per completamento (qualsiasi stage × qualsiasi modalità)

    // Popolato da stages.js dopo il caricamento (VR_STAGES con vrStage: true)
    stages: [],

    // Boss Variant: ogni boss ha nome e suoni ferito/morte.
    // Le missioni sono le stesse 6 di stages[] sopra, con il boss presente.
    bosses: [
        {
            id: 'ocelot', name: 'OCELOT',
            hpByPlayerCount: { 1: 5, 2: 8, 3: 11, 4: 14 },
            hitSound: "audio/sfx/ocelot/ocelot-colpito.wav",
            koSound:  "audio/sfx/ocelot/ocelot-ko.wav",
            rewardEquip: '026',
        },
        {
            id: 'mantis', name: 'MANTIS',
            hpByPlayerCount: { 1: 6, 2: 9, 3: 12, 4: 15 },
            hitSound: "audio/sfx/mantis/ferito.wav",
            koSound:  "audio/sfx/mantis/morte.wav",
            rewardEquip: '014',
        },
        {
            id: 'wolf', name: 'WOLF',
            hpByPlayerCount: { 1: 5, 2: 8, 3: 11, 4: 14 },
            hitSound: "audio/sfx/wolf/ferito1.wav",
            koSound:  "audio/sfx/wolf/morte.wav",
            rewardEquip: '019',
        },
        {
            id: 'raven', name: 'RAVEN',
            hpByPlayerCount: { 1: 6, 2: 10, 3: 14, 4: 18 },
            hitSound: "audio/sfx/raven/ferito+.wav",
            koSound:  "audio/sfx/raven/morte.wav",
            rewardEquip: '027',
        },
        {
            id: 'liquid', name: 'LIQUID',
            hpByPlayerCount: { 1: 2, 2: 3, 3: 4, 4: 5 },
            hitSound:    "audio/sfx/liquid/ferito.wav",
            hitSoundAlt: "audio/sfx/liquid/ferito+.wav",
            koSound:     "audio/sfx/liquid/morte.wav",
            rewardEquip: '025',
        },
    ],
};
