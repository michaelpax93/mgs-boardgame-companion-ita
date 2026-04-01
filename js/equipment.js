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

    "007": {
        name: "GRANATA",
        type: "item",
        itemType: "esplosivo",
        itemSubtype: "granata",
        consumable: true,
        action: {
            name: "GETTA",
            cost: 1,
            desc: "Bersaglia 1 casella in Linea di Vista entro 5 caselle. Infliggi 2 danni a tutte le miniature entro 2 dalla casella bersaglio e in Linea di Vista di quest'ultima. Poi scarta questa carta. RUMOROSA: colloca il tuo ! sotto la tua miniatura.",
            alertImmediate: true,
            attack: true,
            attackType: "ranged",
            targets: 1,
            category: "grenade",
            sound: "audio/sfx/granata.wav",
        },
    },

    "010": {
        name: "SCATOLA DI CARTONE A",
        type: "item",
        itemType: "oggetto",
        itemSubtype: "scatola",
        action: {
            name: "NASCONDITI",
            cost: 1,
            desc: "Se non sei in Linea di Vista di una guardia o una telecamera, sostituisci la tua miniatura con la miniatura della scatola di cartone. Nascosto: Le guardie e le telecamere ti considerano come se fossi una miniatura di una guardia. Sostituisci la scatola di cartone con la tua miniatura se: Salti una guardia; Entri nella Linea di Vista, o attraversi la Linea di Vista, di una guardia o una telecamera; Effettui una qualsiasi azione diversa da Movimento Furtivo, Scatto o Concentrazione. \"Una scatola di cartone?\": Se una guardia termina il suo movimento orientata verso di te e in una casella adiacente alla tua, sostituisci la scatola di cartone con la tua miniatura.",
            sound: "audio/sfx/oggetto-togliere.wav",
        },
    },

    "009": {
        name: "NIKITA",
        type: "weapon",
        itemType: "arma a distanza",
        itemSubtype: "lanciarazzi",
        charges: 3,
        action: {
            name: "LANCIA",
            cost: 1,
            desc: "Se non ce ne sono sulla mappa, colloca 1 missile in una casella adiacente vuota e scarta 1 proiettile. Poi tira 2 dadi neri e muovi il missile, in una singola direzione, di un numero di caselle pari al risultato di 1 dei dadi. Poi puoi fare lo stesso con l'altro risultato. Se il missile sta per muoversi contro un ostacolo o si trova nella stessa casella di una miniatura, attacca tutte le miniature entro 1 casella e in Linea di Vista. Poi rimuovi il missile. Se si muove fuori dalla mappa, rimuovi il missile. RUMOROSA: Colloca il tuo segnalino ! sotto la tua miniatura.",
            dice: [{ color: "white", count: 3 }],
            alertImmediate: true,
            attack: true,
            attackType: "ranged",
            targets: 1,
            category: "missile",
            usesCharge: true,
        },
    },

    "E06B": {
        name: "NIKITA",
        type: "weapon",
        itemType: "arma a distanza",
        itemSubtype: "lanciarazzi",
        stageOnly: true,   // ottenibile solo tramite evento, non selezionabile in pre-stage
        action: {
            name: "LANCIA",
            cost: 1,
            desc: "Se non ce ne sono sulla mappa, colloca 1 missile in una casella adiacente vuota. Poi tira 2 dadi neri e muovi il missile, in una singola direzione, di un numero di caselle pari al risultato di 1 dei dadi. Poi puoi fare lo stesso con l'altro risultato. Se il missile sta per muoversi contro un ostacolo o si trova nella stessa casella di una miniatura, attacca tutte le miniature entro 1 casella e in Linea di Vista. Poi rimuovi il missile. Se si muove fuori dalla mappa, rimuovi il missile. RUMOROSA: Colloca il tuo segnalino ! sotto la tua miniatura.",
            dice: [{ color: "white", count: 3 }],
            alertImmediate: true,
            attack: true,
            attackType: "ranged",
            targets: 1,
            category: "missile",
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

    "013": {
        name: "SCHEDA D'ACCESSO DI LIVELLO 3",
        type: "item",
        itemType: "oggetto",
        itemSubtype: "scheda d'accesso",
        consumable: true,
        action: {
            name: "USA",
            cost: 1,
            desc: "Sblocca 1 porta di livello 3 o inferiore nella tua casella. Poi scarta questa carta.",
            sound: "audio/sfx/porta.wav",
        },
    },

    "GF1": {
        name: "MIMETICA OTTICA",
        owner: "Gray Fox",
        type: "item",
        itemType: "tecnologia",
        itemSubtype: "mimetica",
        charges: 2,
        isGear: true,
        action: {
            name: "ATTIVA MIMETIZZAZIONE",
            cost: 1,
            usesCharge: true,
            oncePerTurn: true,
            desc: "Scarta 1 ingranaggio. Fino alla fine del tuo turno, non collocare il tuo ! quando ti trovi in Linea di Vista di una guardia o di una telecamera. Le guardie non attaccano quando le salti.",
            sound: "audio/sfx/mimetica.wav",
        },
    },

    "GF2": {
        name: "SPADA AD ALTA FREQUENZA",
        owner: "Gray Fox",
        type: "weapon",
        itemType: "arma da mischia",
        itemSubtype: "spada",
        charges: 3,
        isGear: true,
        manualCharge: true,
        inlineCharge: true,
        action: {
            name: "FENDENTE",
            cost: 1,
            desc: "Attacca tutte le miniature adiacenti. Puoi scartare 1 Ingranaggio per tirare +1 dado bianco.",
            dice: [{ color: "white", count: 1 }],
            attack: true,
            attackType: "physical",
            noHitSound: true,
            targets: "all-adjacent",
            category: "sword",
            sound: "audio/azioni/ninja/katana.wav",
            inlineChargeOnce: true,
        },
        passive: {
            desc: "Quando sei il bersaglio di un attacco,<br>puoi scartare 1 Ingranaggio<br>per applicare -1 a tutti i risultati dei dadi.",
        },
    },

    "GF3": {
        name: "CANNONE DA BRACCIO",
        owner: "Gray Fox",
        type: "weapon",
        itemType: "arma a distanza",
        itemSubtype: "cannone",
        charges: 3,
        isGear: true,
        inlineCharge: true,
        action: {
            name: "SPARA",
            cost: 1,
            desc: "Attacca 1 bersaglio in Linea di Vista. Puoi scartare un qualsiasi numero di ingranaggi. Tira +1 dado bianco per ogni ingranaggio scartato. RUMOROSA: Colloca il tuo segnalino ! sotto la tua miniatura.",
            dice: [{ color: "white", count: 1 }],
            attack: true,
            attackType: "ranged",
            alertImmediate: true,
            targets: 1,
            category: "cannon",
            sound: "audio/sfx/cannone-ninja.wav",
        },
    },

    "HE1": {
        name: "RAZIONI",
        owner: "Otacon",
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

    "HE2": {
        name: "MIMETICA OTTICA AVANZATA",
        owner: "Otacon",
        type: "item",
        itemType: "tecnologia",
        itemSubtype: "mimetica",
        charges: 2,
        actions: [
            {
                name: "ATTIVA MIMETIZZAZIONE",
                cost: 1,
                usesCharge: true,
                oncePerTurn: true,
                desc: "Scarta 1 ingranaggio. Fino alla fine del tuo turno, non collocare il tuo ! quando ti trovi in Linea di Vista di una guardia o di una telecamera. Le guardie non attaccano quando le salti.",
                sound: "audio/sfx/mimetica.wav",
            },
            {
                name: "RICARICA",
                cost: 2,
                desc: "Se non ci sono ingranaggi su questa carta, colloca 1 ingranaggio su di essa.",
                requiresExhausted: true,
                grantsCharge: 1,
            },
        ],
    },

    "011": {
        name: "MEDICINE",
        type: "item",
        itemType: "oggetto",
        itemSubtype: "medicina",
        consumable: true,
        action: {
            name: "USA",
            cost: 0,
            desc: "Usa in qualsiasi momento durante il tuo turno per ripristinare tutti i tuoi segnalini concentrazione. Poi scarta questa carta.",
            restoreConcentration: true,
            sound: "audio/sfx/diazepam-medicine.wav",
        },
    },

    "015": {
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

    "017": {
        name: "LANCIAMISSILI",
        type: "weapon",
        itemType: "arma a distanza",
        itemSubtype: "missile",
        charges: 3,
        action: {
            name: "LANCIA",
            cost: 1,
            desc: "Scarta 1 proiettile e colloca 1 missile in una casella adiacente vuota. Poi muovi il missile in linea retta, allontanandolo dalla tua miniatura finché non sta per muoversi contro un ostacolo o non occupa la stessa casella di una miniatura. Quando succede, attacca tutte le miniature entro 1 casella e in Linea di Vista. Poi rimuovi il missile. Se si muove fuori dalla mappa, rimuovi il missile. RUMOROSA: Colloca il tuo segnalino ! sotto la tua miniatura.",
            dice: [{ color: "white", count: 3 }],
            alertImmediate: true,
            attack: true,
            attackType: "ranged",
            targets: 1,
            category: "missile",
            usesCharge: true,
        },
    },

    "018": {
        name: "FUCILE DI PRECISIONE",
        type: "weapon",
        itemType: "arma a distanza",
        itemSubtype: "fucile",
        charges: 6,
        action: {
            name: "SPARA",
            cost: 2,
            sound: "audio/sfx/cecchino-sparo.wav",
            desc: "Scarta 1 proiettile. Attacca 1 bersaglio in Linea di Vista. RUMOROSA: Colloca il tuo segnalino ! sotto la tua miniatura.",
            dice: [{ color: "white", count: 3 }],
            alertImmediate: true,
            attack: true,
            attackType: "ranged",
            targets: 1,
            usesCharge: true,
        },
    },

    "020": {
        name: "FAZZOLETTO",
        type: "item",
        itemType: "oggetto",
        itemSubtype: "indumento",
        owner: "Otacon",
        passive: {
            desc: '"Questo fazzoletto apparteneva a mia madre" — Sniper Wolf. 1 Volta per round, mentre hackeri, puoi modificare di +/−1 il risultato di 1 singolo dado nero.',
        },
    },

    "021": {
        name: "GIUBBOTTO ANTIPROIETTILE",
        type: "item",
        itemType: "oggetto",
        itemSubtype: "indumento",
        owner: ["Snake", "Meryl"],
        passive: {
            desc: "+1 difesa.",
        },
    },

    "016": {
        name: "CORDA",
        type: "item",
        itemType: "oggetto",
        itemSubtype: "corda",
        charges: 5,
        action: {
            name: "LEGA",
            cost: 1,
            desc: "Colloca 1 corda da questa carta in una guardia KO adiacente. Questa guardia KO ignora gli effetti Risveglio delle Guardie sulle carte ordini delle guardie. Se una guardia si muove su una corda, scarta immediatamente la corda.",
            usesCharge: true,
        },
    },

};
