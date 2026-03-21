/**
 * MGS BOARD GAME COMPANION — EQUIPMENT CONFIG
 *
 * Ogni equipaggiamento ha un ID numerico a 3 cifre (stringa).
 * Il campo `action` segue la stessa struttura delle azioni in characters.js:
 *   name:       nome dell'azione mostrato in UI
 *   cost:       costo in token azione
 *   desc:       descrizione completa della regola
 *   dice:       array di { color: "white"|"black", count: N }
 *   noise:      true → l'azione genera rumore (segnalino !)
 *   attack:     true → è un attacco
 *   attackType: "ranged" | "physical"
 *   targets:    numero di bersagli
 *
 * Ogni equip ha anche:
 *   name:  nome dell'oggetto
 *   type:  "weapon" | "item" | "special"
 */

const EQUIPMENT = {

    "001": {
        name: "PISTOLA (CALIBRO .45)",
        type: "weapon",
        action: {
            name: "SPARA",
            cost: 1,
            // alertImmediate: colloca SUBITO il segnalino ! rosso sotto il personaggio (senza dado)
            // Diverso da noise:true che richiede dado bianco a fine turno
            desc: "Attacca 1 bersaglio in Linea di Vista. RUMOROSA: Colloca il tuo segnalino ! sotto la tua miniatura.",
            dice: [{ color: "white", count: 1 }],
            alertImmediate: true,
            attack: true,
            attackType: "ranged",
            targets: 1,
            sound: "audio/sfx/socom.wav",
        },
    },

    "002": {
        name: "RAZIONI",
        type: "item",
        // consumable: una volta usata è disabilitata per tutto lo stage (non recuperabile)
        consumable: true,
        action: {
            name: "CONSUMA",
            cost: 1,
            desc: "Scarta fino a 2 danni. Poi scarta questa carta.",
            sound: "audio/sfx/Razione usata.mp3",
            heal: 2,
        },
    },

    "003": {
        name: "GRANATA CHAFF",
        type: "item",
        consumable: true,
        action: {
            name: "GETTA",
            cost: 1,
            desc: "Fino alla fine del round, i giocatori ignorano le telecamere e i sensori in questa zona. Se ci sono guardie nella tua zona, attiri l'attenzione. Poi scarta questa carta.",
            sound: "audio/sfx/chaff.wav",
        },
    },

    "M01": {
        name: "PISTOLA (CALIBRO .50)",
        owner: "Meryl",
        type: "weapon",
        action: {
            name: "SPARA",
            cost: 1,
            desc: "Attacca 1 bersaglio in Linea di Vista. RUMOROSA: Colloca il tuo segnalino ! sotto la tua miniatura.",
            dice: [{ color: "white", count: 1 }],
            alertImmediate: true,
            attack: true,
            attackType: "ranged",
            targets: 1,
            sound: "audio/sfx/socom.wav",
        },
    },

    "M02": {
        name: "FUCILE D'ASSALTO LEGGERO",
        owner: "Meryl",
        type: "weapon",
        // charges: numero di utilizzi disponibili prima che l'equipaggiamento venga disabilitato.
        // Diverso da consumable:true (1 uso). Lo stato corrente è tracciato in equipmentConsumedState.
        charges: 3,
        action: {
            name: "SPARA",
            cost: 1,
            desc: "Attacca 1 bersaglio in Linea di Vista. RUMOROSA: Colloca il tuo segnalino ! sotto la tua miniatura.",
            dice: [{ color: "white", count: 2 }],
            alertImmediate: true,
            attack: true,
            attackType: "ranged",
            targets: 1,
            sound: "audio/sfx/attacco-guardia.wav",
        },
    },

};
