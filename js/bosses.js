/**
 * MGS BOARD GAME COMPANION — BOSSES
 *
 * Dati specifici dei boss: meccaniche, fasi, carte speciali.
 * La chiave corrisponde al nome del boss (uguale a stage.name per gli stage isBoss: true).
 *
 * Struttura boss:
 *   stageId:   id dello stage corrispondente
 *   phases:    array di fasi del boss (da definire)
 *   abilities: capacità speciali del boss (da definire)
 */

const BOSSES = {

    // disableAttackPopup: true → durante la boss fight il popup "RISULTATO ATTACCO"
    // (NESSUN COLPO / COLPITO / COLPITO E SCONFITTO) non viene mostrato.
    // Utile per boss con meccaniche di danno proprie (es. Ocelot con HP tracciati a parte).

    "REVOLVER OCELOT":         { disableAttackPopup: false },
    "IMBOSCATA DEL CARRO ARMATO": { disableAttackPopup: false },
    "NINJA CYBORG":            { disableAttackPopup: false },
    "PSYCHO MANTIS":           { disableAttackPopup: false },
    "HELICOPTER GUNSHIP":      { disableAttackPopup: false },
    "SNIPER WOLF":             { disableAttackPopup: false },
    "VULCAN RAVEN":            { disableAttackPopup: false },
    "METAL GEAR REX":          { disableAttackPopup: false },

};
