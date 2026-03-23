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
 *   category:   slug usato da damageFrom per filtrare i danni ai boss
 *               ("pistol" | "rifle" | "grenade" | "mine" | "missile" | ...)
 *
 * Ogni equip ha anche:
 *   name:        nome dell'oggetto
 *   type:        "weapon" | "item" | "special"
 *   itemType:    categoria di primo livello (es. "arma a distanza")
 *   itemSubtype: categoria di secondo livello (es. "pistola")
 */

const EQUIPMENT = {

    "001": {
        name: "PISTOLA (CALIBRO .45)",
        type: "weapon",
        itemType: "arma a distanza",
        itemSubtype: "pistola",
        action: {
            name: "SPARA",
            cost: 1,
            desc: "Attacca 1 bersaglio in Linea di Vista. RUMOROSA: Colloca il tuo segnalino ! sotto la tua miniatura.",
            dice: [{ color: "white", count: 1 }],
            alertImmediate: true,
            attack: true,
            attackType: "ranged",
            targets: 1,
            category: "pistol",
            sound: "audio/sfx/socom.wav",
        },
    },

    "002": {
        name: "RAZIONI",
        type: "item",
        itemType: "oggetto",
        itemSubtype: "consumabile",
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
        itemType: "esplosivo",
        itemSubtype: "granata",
        consumable: true,
        action: {
            name: "GETTA",
            cost: 1,
            desc: "Fino alla fine del round, i giocatori ignorano le telecamere e i sensori in questa zona. Se ci sono guardie nella tua zona, attiri l'attenzione. Poi scarta questa carta.",
            category: "grenade",
            sound: "audio/sfx/chaff.wav",
        },
    },

    "004": {
        name: "GRANATA STORDENTE",
        type: "item",
        itemType: "esplosivo",
        itemSubtype: "granata",
        consumable: true,
        action: {
            name: "GETTA",
            cost: 1,
            desc: "Bersaglia 1 casella in Linea di Vista entro 5 caselle. Metti KO ogni guardia entro 2 caselle dalla casella bersaglio e in Linea di Vista di quest'ultima. RUMOROSA: Colloca il tuo segnalino ! sotto la tua miniatura.",
            alertImmediate: true,
            category: "grenade",
            sound: "audio/sfx/granata-stordente.wav",
            followUpByStage: { 4: "audio/sfx/ocelot/non ci vedo.wav" },
        },
    },

    "005": {
        name: "C-4",
        type: "item",
        itemType: "esplosivo",
        itemSubtype: "mina",
        charges: 2,
        actions: [
            {
                name: "PIAZZA",
                cost: 1,
                desc: "Colloca 1 C4 da questa carta in una casella adiacente.",
                usesCharge: true,
                setsFlag: "detonaActive",
                sound: "audio/sfx/c4-piazzato.wav",
            },
            {
                name: "DETONA",
                cost: 1,
                desc: "Ogni C4 infligge 2 danni a ogni miniatura entro 1 casella in Linea di Vista. Se ci sono guardie in quella zona e il tuo segnalino ! non si trova sulla mappa, colloca il tuo segnalino ! nella stessa casella del C4 più vicino alla tua miniatura. Poi rimuovi dalla mappa tutti i C4.",
                alertImmediate: true,
                requiresFlag: "detonaActive",
                clearsFlag: "detonaActive",
                attack: true,
                category: "mine",
                sound: "audio/sfx/c4-detonazione.wav",
            },
        ],
    },

    "006": {
        name: "RAZIONI",
        type: "item",
        itemType: "oggetto",
        itemSubtype: "consumabile",
        consumable: true,
        action: {
            name: "CONSUMA",
            cost: 1,
            desc: "Scarta fino a 2 danni. Poi scarta questa carta.",
            sound: "audio/sfx/Razione usata.mp3",
            heal: 2,
        },
    },

    "031": {
        name: "SCHEDA D'ACCESSO PAL",
        type: "special",
        itemType: "oggetto",
        itemSubtype: "scheda d'accesso",
        action: {
            name: "PASSIVA",
            cost: 0,
            desc: "Questa scheda d'accesso può sovrascrivere i codici di detonazione del Metal Gear REX. Ogni volta che tiri i dadi come parte di un'azione Interazione per sbloccare una porta, puoi ripetere il tiro di 1 dado.",
        },
    },

    "M01": {
        name: "PISTOLA (CALIBRO .50)",
        owner: "Meryl",
        type: "weapon",
        itemType: "arma a distanza",
        itemSubtype: "pistola",
        action: {
            name: "SPARA",
            cost: 1,
            desc: "Attacca 1 bersaglio in Linea di Vista. RUMOROSA: Colloca il tuo segnalino ! sotto la tua miniatura.",
            dice: [{ color: "white", count: 1 }],
            alertImmediate: true,
            attack: true,
            attackType: "ranged",
            targets: 1,
            category: "pistol",
            sound: "audio/sfx/socom.wav",
        },
    },

    "M02": {
        name: "FUCILE D'ASSALTO LEGGERO",
        owner: "Meryl",
        type: "weapon",
        itemType: "arma a distanza",
        itemSubtype: "fucile",
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
            usesCharge: true,
            category: "rifle",
            sound: "audio/sfx/attacco-guardia.wav",
        },
    },

};
