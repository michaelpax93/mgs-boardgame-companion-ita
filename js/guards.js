/**
 * MGS BOARD GAME COMPANION — GUARDS
 *
 * sounds: voci audio delle guardie (stato normale e stato alert/evasion)
 * orders: carte ordini delle guardie (da aggiungere)
 */

const GUARDS = {

    sounds: [
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
        { id: "impronte",        nameNormal: "Di chi sono queste impronte?", fileNormal: "audio/sfx/Di chi sono queste impronte.mp3" },
        { id: "scatolone",       nameNormal: "E' solo uno scatolone",         fileNormal: "audio/sfx/E' solo uno scatolone.mp3" },
        { id: "fuori",           nameNormal: "Fuori dai piedi!",              fileNormal: "audio/sfx/Fuori dai piedi.mp3" },
        { id: "russare",         nameNormal: "Russare",                       fileNormal: "audio/sfx/Russare.mp3" },
        { id: "sbadiglio",       nameNormal: "Sbadiglio",                     fileNormal: "audio/sfx/Sbadiglio.mp3" },
        { id: "starnuto",        nameNormal: "Starnuto",                      fileNormal: "audio/sfx/Starnuto.mp3" },
        { id: "kill-silenziosa", nameNormal: "Kill silenziosa",               fileNormal: "audio/sfx/Kill-silenziosa.mp3", track: "kills_silent" },
        { id: "kill",            nameNormal: "Kill",                          fileNormal: "audio/sfx/kill.mp3",            track: "kills" },
        { id: "guardia-ko",      nameNormal: "Guardia KO",                    fileNormal: "audio/sfx/guardia ko.mp3" },
        { id: "guardia-colpita", nameNormal: "Guardia colpita",               fileNormal: "audio/sfx/guardia colpita.mp3" },
    ],

    // Carte ordini delle guardie (da definire)
    orders: [],

};
