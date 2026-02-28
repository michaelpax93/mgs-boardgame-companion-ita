/**
 * MGS BOARD GAME COMPANION - CONFIGURAZIONE
 * 
 * VIDEO: metti i .mp4 nella cartella "video/" e scrivi il percorso
 * SUONI: metti i .mp3 nelle cartelle audio/sfx/, audio/music/, audio/ambient/
 * 
 * MUSIC MAP e AMBIENT MAP: ogni suono ha un ID univoco.
 * Poi ogni stage ha "musicIds" e "ambientIds" con la lista di ID disponibili.
 * 
 * MUSICA DURANTE INTRO:
 *   musicDuringIntro: true/false
 *     - false (default): la musica parte dopo la fine dell'intro
 *     - true: la musica parte durante l'intro
 *   musicIntroDelay: secondi dall'inizio dell'intro (es. 10 = parte al secondo 10)
 *   musicIntroVolume: volume da 0 a 100 durante l'intro (es. 20 = volume basso)
 */

const CONFIG = {

    // ============================================
    // MAPPA MUSICHE (id → file)
    // loopOverlap: secondi di sovrapposizione per loop seamless (opzionale, default 0.05)
    // ============================================
    music: {
        "introduction": { name: "Introduction",    file: "audio/music/Introduction.mp3",     introStart: 0, loopStart: 9.444, loopEnd: 20.999 },
        "encounter":    { name: "Encounter",       file: "audio/music/Encounter.mp3",        introStart: 0, loopStart: 1.069, loopEnd: 48.312 },
        "evasion":      { name: "Evasion",         file: "audio/music/Evasion.mp3",          introStart: 0, loopStart: 77.500, loopEnd: 127.431 },
        "cavern":       { name: "Cavern",          file: "audio/music/Cavern.mp3",           introStart: 0, loopStart: 0.822, loopEnd: 92.806 },
        "intruder-1":   { name: "Intruder 1",      file: "audio/music/Intruder_1.mp3",       introStart: 0, loopStart: 0.740, loopEnd: 65.880 },
        "intruder-2":   { name: "Intruder 2",      file: "audio/music/Intruder_2.mp3",       introStart: 0, loopStart: 22.750, loopEnd: 90.830 },
        "intruder-3":   { name: "Intruder 3",      file: "audio/music/Intruder_3.mp3",       introStart: 0, loopStart: 71.300, loopEnd: 133.700 },
        "duel":         { name: "Duel",            file: "audio/music/Duel.mp3",             introStart: 0, loopStart: 58.400, loopEnd: 116.000 },
        "warhead":      { name: "Warhead Storage", file: "audio/music/Warhead_Storage.mp3",  introStart: 0, loopStart: 33.850, loopEnd: 131.900 },
    },

    // ============================================
    // MAPPA AMBIENTALI (id → file)
    // loopOverlap: secondi di sovrapposizione per loop seamless (opzionale, default 0.05)
    // ============================================
    ambient: {
        "arctic-wind":      { name: "Vento Artico",     file: "audio/ambient/arctic-wind.mp3",    introStart: 0, loopStart: 24.874, loopEnd: 109.323 },
        "machinery":        { name: "Macchinari",       file: "audio/ambient/machinery.mp3" },
        "snow":             { name: "Neve",             file: "audio/ambient/snow.mp3" },
        "base-alarm":       { name: "Allarme Base",     file: "audio/ambient/base-alarm.mp3" },
        "radio-static":     { name: "Radio Statica",    file: "audio/ambient/radio-static.mp3" },
    },

    // ============================================
    // STAGES DELLA CAMPAGNA
    // ============================================
    stages: [
        {
            id: 1,
            name: "MOLO DI CARICO",
            type: "SNEAKING MISSION",
            isBoss: false,
            description: "Infiltrazione a Shadow Moses Island",
            intro: "video/stage_01_intro.mp4",
            outro: "video/stage_01_outro.mp4",
            events: [
                { id: "A", file: "video/stage_01_A.mp4", stopMusic: false },
            ],
            musicIds: ["cavern"],
            ambientIds: [],
            musicDuringIntro: true,     // true = musica parte durante intro
            musicIntroDelay: 66000,          // secondi dall'inizio dell'intro
            musicIntroVolume: 20,        // volume 0-100 durante l'intro
            gameOverSounds: ["02", "03", "04", "05"],
        },
        {
            id: 2,
            name: "ELIPORTO",
            type: "SNEAKING MISSION",
            isBoss: false,
            description: "Attraversamento dell'eliporto",
            intro: "video/stage_02_intro.mp4",
            outro: "video/stage_02_outro.mp4",
            musicIds: [],
            ambientIds: ["arctic-wind"],
            musicDuringIntro: false,
            musicIntroDelay: 0,
            musicIntroVolume: 20,
            gameOverSounds: ["02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"],
        },
        {
            id: 3,
            name: "CELLE DI DETENZIONE",
            type: "SNEAKING MISSION",
            isBoss: false,
            description: "Salvataggio del presidente della DARPA",
            intro: "video/stage_03_intro.mp4",
            outro: "video/stage_03_outro.mp4",
			events: [
                { id: "A", file: "video/stage_03_A.mp4", stopMusic: true },
				{ id: "B", file: "video/stage_03_B.mp4", stopMusic: true },
            ],
            musicIds: ["intruder-1", "intruder-2"],
            elevator: "audio/sfx/elevetor.mp3",
            ambientIds: [],
            startInAlert: true,
            musicDuringIntro: false,
            musicIntroDelay: 0,
            musicIntroVolume: 20,
            gameOverSounds: ["02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"],
        },
        {
            id: 4,
            name: "REVOLVER OCELOT",
            type: "BOSS BATTLE",
            isBoss: true,
            description: "Scontro con Revolver Ocelot",
            intro: "",
            outro: "video/stage_04_outro.mp4",
            musicIds: ["duel"],
            ambientIds: [],
            musicDuringIntro: false,
            musicIntroDelay: 0,
            musicIntroVolume: 20,
            gameOverSounds: ["14"],
        },
        {
            id: 5,
            name: "IMBOSCATA DEL CARRO ARMATO",
            type: "BOSS BATTLE",
            isBoss: true,
            description: "Imboscata del carro armato M1",
            intro: "video/stage_05_intro.mp4",
            outro: "video/stage_05_outro.mp4",
            musicIds: ["duel"],
            ambientIds: [],
            musicDuringIntro: false,
            musicIntroDelay: 0,
            musicIntroVolume: 20,
            gameOverSounds: ["02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"],
        },
        {
            id: 6,
            name: "Nuclear Warhead Storage Building",
            type: "SNEAKING MISSION",
            isBoss: false,
            description: "Infiltrazione nel deposito testate nucleari",
            intro: "video/stage_06_intro.mp4",
            outro: "video/stage_06_outro.mp4",
            musicIds: ["warhead", "intruder-2", "intruder-3"],
            elevator: "audio/sfx/elevetor.mp3",
            ambientIds: [],
            musicDuringIntro: false,
            musicIntroDelay: 0,
            musicIntroVolume: 20,
            gameOverSounds: ["02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"],
        },
        {
            id: 7,
            name: "Cyborg Ninja",
            type: "BOSS BATTLE",
            isBoss: true,
            description: "Scontro con il Cyborg Ninja",
            intro: "video/stage_07_outro.mp4",
            outro: "video/stage_07_outro.mp4",
            musicIds: ["duel"],
            ambientIds: [],
            musicDuringIntro: true,
            musicIntroDelay: 107000,
            musicIntroVolume: 20,
            gameOverSounds: null,
        },
        {
            id: 8,
            name: "Psycho Mantis",
            type: "BOSS BATTLE",
            isBoss: true,
            description: "Scontro con Psycho Mantis",
            intro: "",
            outro: "",
            musicIds: ["duel"],
            ambientIds: [],
            musicDuringIntro: false,
            musicIntroDelay: 0,
            musicIntroVolume: 20,
            gameOverSounds: null,
        },
        {
            id: 9,
            name: "Prison Break",
            type: "SNEAKING MISSION",
            isBoss: false,
            description: "Fuga dalla cella di prigionia",
            intro: "",
            outro: "",
            musicIds: [],
            ambientIds: [],
            musicDuringIntro: false,
            musicIntroDelay: 0,
            musicIntroVolume: 20,
            gameOverSounds: null,
        },
        {
            id: 10,
            name: "Helicopter Gunship",
            type: "BOSS BATTLE",
            isBoss: true,
            description: "Scontro con l'Hind D di Liquid",
            intro: "",
            outro: "",
            musicIds: ["duel"],
            ambientIds: [],
            musicDuringIntro: false,
            musicIntroDelay: 0,
            musicIntroVolume: 20,
            gameOverSounds: null,
        },
        {
            id: 11,
            name: "Sniper Wolf",
            type: "BOSS BATTLE",
            isBoss: true,
            description: "Duello con Sniper Wolf",
            intro: "",
            outro: "",
            musicIds: ["duel"],
            ambientIds: [],
            musicDuringIntro: false,
            musicIntroDelay: 0,
            musicIntroVolume: 20,
            gameOverSounds: null,
        },
        {
            id: 12,
            name: "Vulcan Raven",
            type: "BOSS BATTLE",
            isBoss: true,
            description: "Scontro con Vulcan Raven",
            intro: "",
            outro: "",
            musicIds: ["duel"],
            ambientIds: [],
            musicDuringIntro: false,
            musicIntroDelay: 0,
            musicIntroVolume: 20,
            gameOverSounds: null,
        },
        {
            id: 13,
            name: "PAL Override",
            type: "SNEAKING MISSION",
            isBoss: false,
            description: "Sovrascrittura del codice PAL",
            intro: "",
            outro: "",
            musicIds: [],
            ambientIds: [],
            musicDuringIntro: false,
            musicIntroDelay: 0,
            musicIntroVolume: 20,
            gameOverSounds: null,
        },
        {
            id: 14,
            name: "Metal Gear REX",
            type: "BOSS BATTLE",
            isBoss: true,
            description: "Battaglia finale contro Metal Gear REX",
            intro: "",
            outro: "",
            musicIds: ["duel"],
            ambientIds: [],
            musicDuringIntro: false,
            musicIntroDelay: 0,
            musicIntroVolume: 20,
            gameOverSounds: null,
        },
    ],

    // ============================================
    // SUONI MENU
    // loopOverlap: secondi di sovrapposizione per loop seamless (opzionale, default 0.05)
    // ============================================
    menuSounds: {
        "choice":        { name: "Choice",        file: "audio/sfx/choice.mp3" },
        "confirm":       { name: "Confirm",       file: "audio/sfx/confirm.mp3" },
        "confirm-save":  { name: "Confirm Save",  file: "audio/sfx/confirm-save.mp3" },
        "return":        { name: "Return",        file: "audio/sfx/return.mp3" },
    },

    // ============================================
    // MAPPA SUONI ALERT (id → file)
    // loopOverlap: secondi di sovrapposizione per loop seamless (opzionale, default 0.05)
    // ============================================
    alertSounds: {
        "discovery":        { name: "Eccolo!",                  file: "audio/sfx/discovery.mp3" },
        "this-way":         { name: "Da questa parte!",         file: "audio/sfx/this-way.mp3" },
        "return-to-posts":  { name: "Tornate ai vostri posti",  file: "audio/sfx/return-to-posts.mp3" },
    },

    // ============================================
    // SUONI GAME OVER (pool globale)
    // Ogni stage può avere gameOverSounds: ["01","03",...] per un sottoinsieme,
    // oppure null per usare tutti.
    // ============================================
    gameOverSoundsPath: "audio/sfx/game-over/",
    gameOverSounds: [
        "01","02","03","04","05","06","07","08","09",
        "10","11","12","13","14","15","16","17","18",
    ],

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
        // Video progressivi se l'utente esce senza salvare (01→02→03, poi intro+silence)
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
    // SUONI GUARDIE (solo sneaking mission)
    // Ogni voce ha una variante normale e una per alert/evasion
    // ============================================
    guardSounds: [
        {
            id: "cosa-e-stato",
            nameNormal: "Cosa è stato?",
            fileNormal: "audio/sfx/Cosa è stato.mp3",
            nameAlert:  "Ho sentito qualcosa!",
            fileAlert:  "audio/sfx/Ho sentito qualcosa.mp3",
        },
        {
            id: "sembrava-qualcuno",
            nameNormal: "Sembrava qualcuno",
            fileNormal: "audio/sfx/Sembrava qualcuno.mp3",
            nameAlert:  "Dove si sarà cacciato?",
            fileAlert:  "audio/sfx/Dove si sarà cacciato.mp3",
        },
        { id: "impronte",   nameNormal: "Di chi sono queste impronte?", fileNormal: "audio/sfx/Di chi sono queste impronte.mp3" },
        { id: "scatolone",  nameNormal: "E' solo uno scatolone",        fileNormal: "audio/sfx/E' solo uno scatolone.mp3" },
        { id: "fuori",      nameNormal: "Fuori dai piedi!",             fileNormal: "audio/sfx/Fuori dai piedi.mp3" },
        { id: "russare",    nameNormal: "Russare",                      fileNormal: "audio/sfx/Russare.mp3" },
        { id: "sbadiglio",  nameNormal: "Sbadiglio",                    fileNormal: "audio/sfx/Sbadiglio.mp3" },
        { id: "starnuto",       nameNormal: "Starnuto",         fileNormal: "audio/sfx/Starnuto.mp3" },
        { id: "kill-silenziosa", nameNormal: "Kill silenziosa",  fileNormal: "audio/sfx/Kill-silenziosa.mp3", track: "kills_silent" },
        { id: "kill",            nameNormal: "Kill",             fileNormal: "audio/sfx/kill.mp3",            track: "kills" },
        { id: "guardia-ko",      nameNormal: "Guardia KO",       fileNormal: "audio/sfx/guardia ko.mp3" },
        { id: "guardia-colpita", nameNormal: "Guardia colpita",  fileNormal: "audio/sfx/guardia colpita.mp3" },
    ],

    // ============================================
    // EFFETTI SONORI (globali, sempre visibili)
    // ============================================
    sfx: [
        { name: "Alert",         file: "audio/sfx/alert.mp3",         icon: "!",  isAlert: true },
        { name: "Alert Cancel",  file: "audio/sfx/alert-cancel.mp3",  icon: "~",  isAlert: false },
        { name: "Codec",         file: "audio/sfx/codec.mp3",         icon: "☎",  isAlert: false },
        { name: "Codec End",     file: "audio/sfx/codec-end.mp3",     icon: "☎",  isAlert: false },
        { name: "Game Over",     file: "audio/sfx/game-over.mp3",     icon: "✕",  isAlert: false, track: "continues" },
        { name: "Item",          file: "audio/sfx/item.mp3",          icon: "★",  isAlert: false },
        { name: "Razione",       file: "audio/sfx/ration.mp3",        icon: "+",  isAlert: false, track: "rations_used" },
        { name: "Scoperto",      file: "audio/sfx/spotted.mp3",       icon: "?",  isAlert: false },
        { name: "Continue",      file: "audio/sfx/continue.mp3",      icon: "▶",  isAlert: false },
        { name: "Guardia KO",    file: "audio/sfx/guard-ko.mp3",      icon: "◆",  isAlert: false },
    ],
};