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
        "encounter":    { name: "Encounter",                file: "audio/music/encounter.mp3" },
        "cavern":       { name: "Cavern",                   file: "audio/music/Cavern.mp3", loopOverlap: 0.07},
        "intruder":     { name: "Intruder",                 file: "audio/music/intruder.mp3" },
        "duel":         { name: "Duel",                     file: "audio/music/duel.mp3" },
        "mantis":       { name: "Mantis Hymn",              file: "audio/music/mantis-hymn.mp3" },
        "blast":        { name: "Blast Furnace",            file: "audio/music/blast-furnace.mp3" },
        "rex":          { name: "REX Lair",                 file: "audio/music/rex-lair.mp3" },
        "escape":       { name: "Escape",                   file: "audio/music/escape.mp3" },
        "best":         { name: "The Best Is Yet To Come",  file: "audio/music/best-is-yet-to-come.mp3" },
    },

    // ============================================
    // MAPPA AMBIENTALI (id → file)
    // loopOverlap: secondi di sovrapposizione per loop seamless (opzionale, default 0.05)
    // ============================================
    ambient: {
        "arctic-wind":      { name: "Vento Artico",     file: "audio/ambient/arctic-wind.mp3" },
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
            intro: "video/Stage_01_Intro.mp4",
            outro: "video/Stage_01_Outro.mp4",
            musicIds: ["cavern"],
            ambientIds: [],
            musicDuringIntro: true,     // true = musica parte durante intro
            musicIntroDelay: 67000,          // secondi dall'inizio dell'intro
            musicIntroVolume: 20,        // volume 0-100 durante l'intro
        },
        {
            id: 2,
            name: "Heliport",
            type: "SNEAKING MISSION",
            isBoss: false,
            description: "Attraversamento dell'eliporto",
            intro: "",
            outro: "",
            musicIds: [],
            ambientIds: [],
            musicDuringIntro: false,
            musicIntroDelay: 0,
            musicIntroVolume: 20,
        },
        {
            id: 3,
            name: "Holding Cells",
            type: "SNEAKING MISSION",
            isBoss: false,
            description: "Salvataggio del presidente della DARPA",
            intro: "",
            outro: "",
            musicIds: [],
            ambientIds: [],
            musicDuringIntro: false,
            musicIntroDelay: 0,
            musicIntroVolume: 20,
        },
        {
            id: 4,
            name: "Revolver Ocelot",
            type: "BOSS BATTLE",
            isBoss: true,
            description: "Scontro con Revolver Ocelot",
            intro: "",
            outro: "",
            musicIds: ["duel"],
            ambientIds: [],
            musicDuringIntro: false,
            musicIntroDelay: 0,
            musicIntroVolume: 20,
        },
        {
            id: 5,
            name: "Tank Ambush",
            type: "BOSS BATTLE",
            isBoss: true,
            description: "Imboscata del carro armato M1",
            intro: "",
            outro: "",
            musicIds: ["duel"],
            ambientIds: [],
            musicDuringIntro: false,
            musicIntroDelay: 0,
            musicIntroVolume: 20,
        },
        {
            id: 6,
            name: "Nuclear Warhead Storage Building",
            type: "SNEAKING MISSION",
            isBoss: false,
            description: "Infiltrazione nel deposito testate nucleari",
            intro: "",
            outro: "",
            musicIds: [],
            ambientIds: [],
            musicDuringIntro: false,
            musicIntroDelay: 0,
            musicIntroVolume: 20,
        },
        {
            id: 7,
            name: "Cyborg Ninja",
            type: "BOSS BATTLE",
            isBoss: true,
            description: "Scontro con il Cyborg Ninja",
            intro: "",
            outro: "",
            musicIds: ["duel"],
            ambientIds: [],
            musicDuringIntro: false,
            musicIntroDelay: 0,
            musicIntroVolume: 20,
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
        },
    ],

    // ============================================
    // SUONI MENU
    // loopOverlap: secondi di sovrapposizione per loop seamless (opzionale, default 0.05)
    // ============================================
    menuSounds: {
        "menu-intro":   { name: "Menu Intro",   file: "audio/sfx/menu-intro.mp3" },
        "menu-loop":    { name: "Menu Loop",     file: "audio/sfx/menu-loop.mp3", loopOverlap: 0.11},
        "choice":       { name: "Choice",        file: "audio/sfx/choice.mp3" },
        "confirm":      { name: "Confirm",       file: "audio/sfx/confirm.mp3" },
        "return":       { name: "Return",        file: "audio/sfx/return.mp3" },
    },

    // ============================================
    // MAPPA SUONI ALERT (id → file)
    // loopOverlap: secondi di sovrapposizione per loop seamless (opzionale, default 0.05)
    // ============================================
    alertSounds: {
        "discovery":        { name: "Eccolo!",                  file: "audio/sfx/discovery.mp3" },
        "alert-loop":       { name: "Alert",                    file: "audio/sfx/alert-loop.mp3", loopOverlap: 0.10},
        "evasion-loop":     { name: "Evasion",                  file: "audio/sfx/evasion-loop.mp3", loopOverlap: 0.07},
        "this-way":         { name: "Da questa parte!",         file: "audio/sfx/this-way.mp3" },
        "return-to-posts":  { name: "Tornate ai vostri posti",  file: "audio/sfx/return-to-posts.mp3" },
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
        { id: "kill-silenziosa", nameNormal: "Kill silenziosa",  fileNormal: "audio/sfx/Kill-silenziosa.mp3" },
        { id: "kill",            nameNormal: "Kill",             fileNormal: "audio/sfx/kill.mp3" },
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
        { name: "Game Over",     file: "audio/sfx/game-over.mp3",     icon: "✕",  isAlert: false },
        { name: "Item",          file: "audio/sfx/item.mp3",          icon: "★",  isAlert: false },
        { name: "Razione",       file: "audio/sfx/ration.mp3",        icon: "+",  isAlert: false },
        { name: "Scoperto",      file: "audio/sfx/spotted.mp3",       icon: "?",  isAlert: false },
        { name: "Continue",      file: "audio/sfx/continue.mp3",      icon: "▶",  isAlert: false },
        { name: "Guardia KO",    file: "audio/sfx/guard-ko.mp3",      icon: "◆",  isAlert: false },
    ],
};