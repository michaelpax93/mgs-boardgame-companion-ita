/**
 * MGS BOARD GAME COMPANION - CONFIGURAZIONE
 * 
 * VIDEO LOCALI:
 * Metti i file .mp4 nella cartella "video/" e inserisci il percorso qui.
 * Esempio: intro: "video/stage01-intro.mp4"
 * Se non c'è video, lascia stringa vuota: ""
 * 
 * SUONI:
 *   audio/sfx/      - effetti sonori
 *   audio/music/     - musica di sottofondo
 *   audio/ambient/   - suoni ambientali
 */

const CONFIG = {

    stages: [
        {
            id: 1,
            name: "Cargo Dock",
            type: "SNEAKING MISSION",
            isBoss: false,
            description: "Infiltrazione a Shadow Moses Island",
            intro: "",
            outro: "",
        },
        {
            id: 2,
            name: "Heliport",
            type: "SNEAKING MISSION",
            isBoss: false,
            description: "Attraversamento dell'eliporto",
            intro: "",
            outro: "",
        },
        {
            id: 3,
            name: "Holding Cells",
            type: "SNEAKING MISSION",
            isBoss: false,
            description: "Salvataggio del presidente della DARPA",
            intro: "",
            outro: "",
        },
        {
            id: 4,
            name: "Revolver Ocelot",
            type: "BOSS BATTLE",
            isBoss: true,
            description: "Scontro con Revolver Ocelot",
            intro: "",
            outro: "",
        },
        {
            id: 5,
            name: "Tank Ambush",
            type: "BOSS BATTLE",
            isBoss: true,
            description: "Imboscata del carro armato M1",
            intro: "",
            outro: "",
        },
        {
            id: 6,
            name: "Nuclear Warhead Storage Building",
            type: "SNEAKING MISSION",
            isBoss: false,
            description: "Infiltrazione nel deposito testate nucleari",
            intro: "",
            outro: "",
        },
        {
            id: 7,
            name: "Cyborg Ninja",
            type: "BOSS BATTLE",
            isBoss: true,
            description: "Scontro con il Cyborg Ninja",
            intro: "",
            outro: "",
        },
        {
            id: 8,
            name: "Psycho Mantis",
            type: "BOSS BATTLE",
            isBoss: true,
            description: "Scontro con Psycho Mantis",
            intro: "",
            outro: "",
        },
        {
            id: 9,
            name: "Prison Break",
            type: "SNEAKING MISSION",
            isBoss: false,
            description: "Fuga dalla cella di prigionia",
            intro: "",
            outro: "",
        },
        {
            id: 10,
            name: "Helicopter Gunship",
            type: "BOSS BATTLE",
            isBoss: true,
            description: "Scontro con l'Hind D di Liquid",
            intro: "",
            outro: "",
        },
        {
            id: 11,
            name: "Sniper Wolf",
            type: "BOSS BATTLE",
            isBoss: true,
            description: "Duello con Sniper Wolf",
            intro: "",
            outro: "",
        },
        {
            id: 12,
            name: "Vulcan Raven",
            type: "BOSS BATTLE",
            isBoss: true,
            description: "Scontro con Vulcan Raven",
            intro: "",
            outro: "",
        },
        {
            id: 13,
            name: "PAL Override",
            type: "SNEAKING MISSION",
            isBoss: false,
            description: "Sovrascrittura del codice PAL",
            intro: "",
            outro: "",
        },
        {
            id: 14,
            name: "Metal Gear REX",
            type: "BOSS BATTLE",
            isBoss: true,
            description: "Battaglia finale contro Metal Gear REX",
            intro: "",
            outro: "",
        },
    ],

    sfx: [
        { name: "Alert",         file: "audio/sfx/alert.mp3",         icon: "!" },
        { name: "Alert Cancel",  file: "audio/sfx/alert-cancel.mp3",  icon: "~" },
        { name: "Codec",         file: "audio/sfx/codec.mp3",         icon: "☎" },
        { name: "Codec End",     file: "audio/sfx/codec-end.mp3",     icon: "☎" },
        { name: "Game Over",     file: "audio/sfx/game-over.mp3",     icon: "✕" },
        { name: "Item",          file: "audio/sfx/item.mp3",          icon: "★" },
        { name: "Razione",       file: "audio/sfx/ration.mp3",        icon: "+" },
        { name: "Scoperto",      file: "audio/sfx/spotted.mp3",       icon: "?" },
        { name: "Continue",      file: "audio/sfx/continue.mp3",      icon: "▶" },
        { name: "Guardia KO",    file: "audio/sfx/guard-ko.mp3",      icon: "◆" },
    ],

    music: [
        { name: "Encounter",         file: "audio/music/encounter.mp3" },
        { name: "Cavern",            file: "audio/music/cavern.mp3" },
        { name: "Intruder",          file: "audio/music/intruder.mp3" },
        { name: "Duel",              file: "audio/music/duel.mp3" },
        { name: "Mantis Hymn",       file: "audio/music/mantis-hymn.mp3" },
        { name: "Blast Furnace",     file: "audio/music/blast-furnace.mp3" },
        { name: "REX Lair",          file: "audio/music/rex-lair.mp3" },
        { name: "Escape",            file: "audio/music/escape.mp3" },
        { name: "The Best Is Yet To Come", file: "audio/music/best-is-yet-to-come.mp3" },
    ],

    ambient: [
        { name: "Vento Artico",    file: "audio/ambient/arctic-wind.mp3" },
        { name: "Macchinari",      file: "audio/ambient/machinery.mp3" },
        { name: "Neve",            file: "audio/ambient/snow.mp3" },
        { name: "Allarme Base",    file: "audio/ambient/base-alarm.mp3" },
        { name: "Radio Statica",   file: "audio/ambient/radio-static.mp3" },
    ],
};