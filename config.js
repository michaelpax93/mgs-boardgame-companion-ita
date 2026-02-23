/**
 * MGS BOARD GAME COMPANION - CONFIGURAZIONE
 * 
 * ============================================
 * COME CONFIGURARE I VIDEO E I SUONI
 * ============================================
 * 
 * VIDEO YOUTUBE:
 * Per ogni stage puoi configurare un video di intro e uno di outro.
 * Inserisci l'ID del video YouTube (la parte dopo "v=" nell'URL).
 * Esempio: se il link è https://www.youtube.com/watch?v=ABC123
 * l'ID è "ABC123"
 * 
 * Puoi anche specificare start/end in secondi per tagliare il video:
 *   intro: { id: "ABC123", start: 30, end: 120 }
 * 
 * SUONI:
 * I suoni vanno nella cartella "audio/" con le sottocartelle:
 *   audio/sfx/      - effetti sonori
 *   audio/music/     - musica di sottofondo
 *   audio/ambient/   - suoni ambientali
 * 
 * Formati supportati: .mp3, .ogg, .wav
 * Per aggiungere suoni personalizzati, metti i file nella cartella 
 * corretta e aggiungili alla configurazione qui sotto.
 */

const CONFIG = {

    // ============================================
    // STAGES DELLA CAMPAGNA
    // ============================================
    stages: [
        {
            id: 1,
            name: "Cargo Dock",
            type: "SNEAKING MISSION",
            isBoss: false,
            description: "Infiltrazione a Shadow Moses Island",
            // VIDEO: Inserisci gli ID dei video YouTube in italiano
            // Cerca su YouTube: "Metal Gear Solid ITA cargo dock cutscene"
            intro: { id: "QgCK_NE4EXU", start: 1570, end: 1687 },  // Video intro prima della missione
            outro: { id: "QgCK_NE4EXU", start: 1688, end: 1735 },   // Video outro dopo la missione
        },
        {
            id: 2,
            name: "Heliport",
            type: "SNEAKING MISSION",
            isBoss: false,
            description: "Attraversamento dell'eliporto",
            intro: { id: "QgCK_NE4EXU", start: 0, end: 0 },
            outro: { id: "QgCK_NE4EXU", start: 0, end: 0 },
        },
        {
            id: 3,
            name: "Holding Cells",
            type: "SNEAKING MISSION",
            isBoss: false,
            description: "Salvataggio del presidente della DARPA",
            intro: { id: "QgCK_NE4EXU", start: 0, end: 0 },
            outro: { id: "QgCK_NE4EXU", start: 0, end: 0 },
        },
        {
            id: 4,
            name: "Revolver Ocelot",
            type: "BOSS BATTLE",
            isBoss: true,
            description: "Scontro con Revolver Ocelot",
            intro: { id: "QgCK_NE4EXU", start: 0, end: 0 },
            outro: { id: "QgCK_NE4EXU", start: 0, end: 0 },
        },
        {
            id: 5,
            name: "Tank Ambush",
            type: "BOSS BATTLE",
            isBoss: true,
            description: "Imboscata del carro armato M1",
            intro: { id: "QgCK_NE4EXU", start: 0, end: 0 },
            outro: { id: "QgCK_NE4EXU", start: 0, end: 0 },
        },
        {
            id: 6,
            name: "Nuclear Warhead Storage Building",
            type: "SNEAKING MISSION",
            isBoss: false,
            description: "Infiltrazione nel deposito testate nucleari",
            intro: { id: "QgCK_NE4EXU", start: 0, end: 0 },
            outro: { id: "QgCK_NE4EXU", start: 0, end: 0 },
        },
        {
            id: 7,
            name: "Cyborg Ninja",
            type: "BOSS BATTLE",
            isBoss: true,
            description: "Scontro con il Cyborg Ninja",
            intro: { id: "QgCK_NE4EXU", start: 0, end: 0 },
            outro: { id: "QgCK_NE4EXU", start: 0, end: 0 },
        },
        {
            id: 8,
            name: "Psycho Mantis",
            type: "BOSS BATTLE",
            isBoss: true,
            description: "Scontro con Psycho Mantis",
            intro: { id: "QgCK_NE4EXU", start: 0, end: 0 },
            outro: { id: "QgCK_NE4EXU", start: 0, end: 0 },
        },
        {
            id: 9,
            name: "Prison Break",
            type: "SNEAKING MISSION",
            isBoss: false,
            description: "Fuga dalla cella di prigionia",
            intro: { id: "QgCK_NE4EXU", start: 0, end: 0 },
            outro: { id: "QgCK_NE4EXU", start: 0, end: 0 },
        },
        {
            id: 10,
            name: "Helicopter Gunship",
            type: "BOSS BATTLE",
            isBoss: true,
            description: "Scontro con l'Hind D di Liquid",
            intro: { id: "QgCK_NE4EXU", start: 0, end: 0 },
            outro: { id: "QgCK_NE4EXU", start: 0, end: 0 },
        },
        {
            id: 11,
            name: "Sniper Wolf",
            type: "BOSS BATTLE",
            isBoss: true,
            description: "Duello con Sniper Wolf",
            intro: { id: "QgCK_NE4EXU", start: 0, end: 0 },
            outro: { id: "QgCK_NE4EXU", start: 0, end: 0 },
        },
        {
            id: 12,
            name: "Vulcan Raven",
            type: "BOSS BATTLE",
            isBoss: true,
            description: "Scontro con Vulcan Raven",
            intro: { id: "QgCK_NE4EXU", start: 0, end: 0 },
            outro: { id: "QgCK_NE4EXU", start: 0, end: 0 },
        },
        {
            id: 13,
            name: "PAL Override",
            type: "SNEAKING MISSION",
            isBoss: false,
            description: "Sovrascrittura del codice PAL",
            intro: { id: "QgCK_NE4EXU", start: 0, end: 0 },
            outro: { id: "QgCK_NE4EXU", start: 0, end: 0 },
        },
        {
            id: 14,
            name: "Metal Gear REX",
            type: "BOSS BATTLE",
            isBoss: true,
            description: "Battaglia finale contro Metal Gear REX",
            intro: { id: "QgCK_NE4EXU", start: 0, end: 0 },
            outro: { id: "QgCK_NE4EXU", start: 0, end: 0 },
        },
    ],

    // ============================================
    // EFFETTI SONORI
    // Aggiungi i tuoi file .mp3 nella cartella audio/sfx/
    // ============================================
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

    // ============================================
    // MUSICA DI SOTTOFONDO
    // Aggiungi i tuoi file .mp3 nella cartella audio/music/
    // ============================================
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

    // ============================================
    // SUONI AMBIENTALI (loop)
    // Aggiungi i tuoi file .mp3 nella cartella audio/ambient/
    // ============================================
    ambient: [
        { name: "Vento Artico",    file: "audio/ambient/arctic-wind.mp3" },
        { name: "Macchinari",      file: "audio/ambient/machinery.mp3" },
        { name: "Neve",            file: "audio/ambient/snow.mp3" },
        { name: "Allarme Base",    file: "audio/ambient/base-alarm.mp3" },
        { name: "Radio Statica",   file: "audio/ambient/radio-static.mp3" },
    ],
};
