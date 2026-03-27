/**
 * MGS BOARD GAME COMPANION — CHARACTERS
 *
 * Ogni personaggio ha:
 *   fixedActions:           azioni sempre disponibili (indipendenti dallo stage)
 *   defaultVariableActions: azioni variabili di default (missioni di infiltrazione)
 *   abilities:              capacità passive/speciali (nessun costo token)
 *
 * Struttura azione:
 *   id:    identificatore univoco
 *   name:  nome mostrato in UI
 *   desc:  descrizione esatta della regola
 *   cost:  costo in token (numero o "X" = variabile)
 *   noise: true → rumore differito: a fine turno lancia 1 dado bianco per ogni azione con noise:true.
 *               Se esce ! (al posto dell'1), colloca il segnalino ? o ! sotto il personaggio.
 *               Diverso da alertImmediate:true (equipment) che colloca ! subito senza dado.
 *   dice:  array di { color: "white"|"black", count: N } — dadi da lanciare
 *
 * Override variabili per stage: definire stage.variableActions in stages.js
 *   { "NomePersonaggio": ["id-azione-1", "id-azione-2", ...] }
 *   Se assente si usano le defaultVariableActions del personaggio.
 */

const CHARACTERS = {

    "Snake": {
        hp: 4,
        hurtSound:     'audio/sfx/snake/ferito.wav',
        hurtPlusSound: 'audio/sfx/snake/ferito+.wav',
        deathSound:    'audio/sfx/snake/morte.wav',
        baseEquipment: [],   // Snake non ha equipaggiamento base fisso (ottiene tutto tramite ricompense)
        // Hotspots: definiscono ordine e tipo di ogni azione sulla plancia (fixed/variable/ability)
        hotspots: [
            // Azioni fisse — colonna sinistra (cerchio costo a sinistra di ogni riga)
            { ref: "movimento-furtivo",       type: "fixed",    cx: 41.8, cy: 14.3 },
            { ref: "scatto",                  type: "fixed",    cx: 41.8, cy: 29.4 },
            { ref: "attacco-corpo-a-corpo",   type: "fixed",    cx: 41.8, cy: 44.5 },
            { ref: "attacco-combo",           type: "fixed",    cx: 41.8, cy: 59.5 },
            { ref: "concentrazione",          type: "fixed",    cx: 41.8, cy: 74.6 },
            // Azioni variabili — colonna destra
            { ref: "trascinamento",           type: "variable", cx: 69.1,   cy: 11.9 },
            { ref: "interazione",             type: "variable", cx: 69.1,   cy: 28.3 },
            { ref: "bussata",                type: "variable", cx: 69.1,   cy: 44.6 },
            { ref: "atterramento-silenzioso", type: "variable", cx: 69.1,   cy: 61 },
            // Capacità — inizio riga testo in basso
            { ref: "attacco-furtivo",         type: "ability",  cx: 35.6,   cy: 86.3 },
            { ref: "lavoro-da-solo",          type: "ability",  cx: 35.6,   cy: 93.7 },
        ],
        concentrationTokens: [
            {
                id: "conc-1",
                label: "−1 [dice] / MOV.",
                desc: "Tira 1 dado bianco in meno oppure MOVIMENTO FURTIVO",
                cost: 1,
                dice: [{ color: "white", count: 1 }],
            },
            {
                id: "conc-2",
                label: "+2",
                desc: "+2 ad un dado quando lanci i dadi per una tua azione o quando vieni attaccato",
                cost: 1,
            },
            {
                id: "conc-3",
                label: "−2",
                desc: "-2 ad un dado quando lanci i dadi per una tua azione o quando vieni attaccato",
                cost: 1,
            },
            {
                id: "conc-4",
                label: "RIPETI",
                desc: "Ripetere il tiro di 1 dado",
                cost: 2,
            },
        ],
        fixedActions: [
            {
                id: "movimento-furtivo",
                name: "MOVIMENTO FURTIVO",
                desc: "Muovi 1",
                cost: 1,
				sound: "audio/azioni/snake/movimento-furtivo.wav"
            },
            {
                id: "scatto",
                name: "SCATTO",
                desc: "Muovi 2",
                cost: 1,
                noise: true,
				sound: "audio/azioni/snake/scatto.wav"
            },
            {
                id: "attacco-corpo-a-corpo",
                name: "ATTACCO CORPO A CORPO",
                desc: "Attacca 1 miniatura adiacente. Infliggi danni da KO",
                cost: 1,
                attack: true,
                attackType: "physical",
                category: "melee",
                targets: 1,
                dice: [{ color: "white", count: 1 }],
                sound: "audio/azioni/snake/attacco-corpo-a-corpo.wav",
            },
            {
                id: "attacco-combo",
                name: "ATTACCO COMBO",
                desc: "Attacca 1 miniatura adiacente. Infliggi danni da KO",
                cost: 2,
                attack: true,
                attackType: "physical",
                category: "melee",
                targets: 1,
                dice: [{ color: "white", count: 2 }, { color: "black", count: 1 }],
                sound: "audio/azioni/snake/attacco-combo.wav",
            },
            {
                id: "concentrazione",
                name: "CONCENTRAZIONE",
                desc: "Ripristina 1 segnalino concentrazione",
                cost: "X",
                sound: "audio/azioni/snake/concentrazione.wav",
            },
        ],
        defaultVariableActions: [
            {
                id: "trascinamento",
                name: "TRASCINAMENTO",
                desc: "Raccogli un soldato KO/ucciso nella tua casella o in una casella adiacente. Poi muovi 1 e colloca quel segnalino in una casella adiacente vuota",
                cost: 1,
                noise: true,
				sound: "audio/azioni/snake/trascinamento.wav"
            },
            {
                id: "interazione",
                name: "INTERAZIONE",
                desc: "Interagisci con un oggetto",
                cost: 1,
                dice: [{ color: "white", count: 1 }, { color: "black", count: 2 }],
				sound: "audio/azioni/snake/interazione.wav"
            },
            {
                id: "bussata",
                name: "BUSSATA",
                desc: "Attira l'attenzione nella tua casella",
                cost: 1,
                sound: "audio/azioni/snake/bussata.wav"
            },
            {
                id: "atterramento-silenzioso",
                name: "ATTERRAMENTO SILENZIOSO",
                desc: "Se la tua miniatura si trova alle spalle di una guardia adiacente, sostituisci la guardia con un token ucciso",
                cost: 2,
                autoKill: true,
				sound: "audio/azioni/snake/atterramento-silenzioso.wav"
            },
        ],
        abilities: [
            {
                id: "attacco-furtivo",
                name: "ATTACCO FURTIVO",
                type: "reactive",   // si attiva dopo una condizione, 1×/round
                desc: "1 volta per round, dopo che hai inflitto danni a un bersaglio che ti da le spalle e che si trova nella tua stessa riga/colonna, puoi infliggergli +1 danno dello stesso tipo.",
            },
            {
                id: "lavoro-da-solo",
                name: "\"LAVORO DA SOLO\"",
                type: "once",       // il giocatore sceglie quando usarla, 1×/round
                desc: "1 volta per round, quando usi un'arma e se non ci sono altri giocatori entro 2 caselle dalla tua miniatura, puoi aumentare o diminuire di 1 il risultato di un qualsiasi dado.",
            },
        ],
    },

    "Meryl": {
        hp: 4,
        hurtSound:     'audio/sfx/meryl/ferito.wav',
        hurtPlusSound: 'audio/sfx/meryl/ferito+.wav',
        deathSound:    'audio/sfx/meryl/morte.wav',
        gameOverSound: "15",
        debutStage: 3,                   // Prima apparizione: Stage 03
        baseEquipment: ["M01", "M02"],   // Equipaggiamento fisso al debutto in Stage 03
        hotspots: [
            { ref: "movimento-furtivo",      type: "fixed",    cx: 41.8, cy: 14.3 },
            { ref: "scatto",                 type: "fixed",    cx: 41.8, cy: 29.4 },
            { ref: "attacco-corpo-a-corpo",  type: "fixed",    cx: 41.8, cy: 44.5 },
            { ref: "attacco-combo",          type: "fixed",    cx: 41.8, cy: 59.5 },
            { ref: "concentrazione",         type: "fixed",    cx: 41.8, cy: 74.6 },
            { ref: "trascinamento",          type: "variable", cx: 69.1, cy: 11.9 },
            { ref: "interazione",            type: "variable", cx: 69.1, cy: 28.3 },
            { ref: "bussata",               type: "variable", cx: 69.1, cy: 44.6 },
            { ref: "ottenere-travestimento", type: "variable", cx: 69.1, cy: 61 },
            { ref: "non-sono-una-novellina", type: "ability",  cx: 35.6, cy: 86.3 },
            { ref: "posso-essere-d-aiuto",   type: "ability",  cx: 35.6, cy: 93.7 },
        ],
        concentrationTokens: [
            {
                id: "meryl-conc-1",
                label: "+1 [dice]",
                desc: "Quando tiri dadi, tira un dado bianco extra",
                cost: 2,
                dice: [{ color: "white", count: 1 }],
            },
            {
                id: "meryl-conc-2",
                label: "+2",
                desc: "+2 ad un dado quando lanci i dadi per una tua azione o quando vieni attaccato",
                cost: 1,
            },
            {
                id: "meryl-conc-3",
                label: "+/−1",
                desc: "+1 o −1 ad un dado quando lanci i dadi per una tua azione o quando vieni attaccato",
                cost: 1,
            },
            {
                id: "meryl-conc-4",
                label: "+ Azione",
                desc: "Ottieni 1 azione aggiuntiva",
                cost: 2,
                grantsAction: 1,
            },
        ],
        fixedActions: [
            {
                id: "movimento-furtivo",
                name: "MOVIMENTO FURTIVO",
                desc: "Muovi 1",
                cost: 1,
                sound: "audio/azioni/snake/movimento-furtivo.wav"
            },
            {
                id: "scatto",
                name: "SCATTO",
                desc: "Muovi 2",
                cost: 1,
                noise: true,
                sound: "audio/azioni/snake/scatto.wav"
            },
            {
                id: "attacco-corpo-a-corpo",
                name: "ATTACCO CORPO A CORPO",
                desc: "Attacca 1 miniatura adiacente. Infliggi danni da KO",
                cost: 1,
                attack: true,
                attackType: "physical",
                category: "melee",
                targets: 1,
                dice: [{ color: "white", count: 1 }],
                sound: "audio/azioni/meryl/attacco-corpo-a-corpo.wav",
            },
            {
                id: "attacco-combo",
                name: "ATTACCO COMBO",
                desc: "Attacca 1 miniatura adiacente. Infliggi danni da KO",
                cost: 2,
                attack: true,
                attackType: "physical",
                category: "melee",
                targets: 1,
                dice: [{ color: "white", count: 2 }, { color: "black", count: 1 }],
                sound: "audio/azioni/snake/attacco-combo.wav",
            },
            {
                id: "concentrazione",
                name: "CONCENTRAZIONE",
                desc: "Ripristina 1 segnalino concentrazione",
                cost: "X",
                sound: "audio/azioni/snake/concentrazione.wav",
            },
        ],
        defaultVariableActions: [
            {
                id: "trascinamento",
                name: "TRASCINAMENTO",
                desc: "Raccogli un soldato KO/ucciso nella tua casella o in una casella adiacente. Poi muovi 1 e colloca quel segnalino in una casella adiacente vuota",
                cost: 1,
                noise: true,
                sound: "audio/azioni/snake/trascinamento.wav"
            },
            {
                id: "interazione",
                name: "INTERAZIONE",
                desc: "Interagisci con un oggetto",
                cost: 1,
                dice: [{ color: "white", count: 1 }, { color: "black", count: 2 }],
                sound: "audio/azioni/snake/interazione.wav"
            },
            {
                id: "bussata",
                name: "BUSSATA",
                desc: "Attira l'attenzione nella tua casella",
                cost: 1,
                sound: "audio/azioni/snake/bussata.wav"
            },
            {
                id: "ottenere-travestimento",
                name: "OTTENERE TRAVESTIMENTO",
                desc: "Se sei adiacente ad una guardia ko o uccisa e il tuo segnalino allerta non si trova sulla mappa, sostituisci la tua miniatura con la miniatura di Meryl in incognito",
                cost: 2,
                sound: "audio/azioni/meryl/ottenere-travestimento.wav",
            },
        ],
        abilities: [
            {
                id: "non-sono-una-novellina",
                name: "\"NON SONO UNA NOVELLINA\"",
                type: "reactive",
                desc: "1 volta per round, quando attacchi e se ottieni un 6 non modificato, puoi infliggere +1 danno dello stesso tipo.",
            },
            {
                id: "posso-essere-d-aiuto",
                name: "\"POSSO ESSERE D'AIUTO\"",
                type: "passive",
                desc: "I giocatori entro 2 caselle dalla tua miniatura possono usare i tuoi segnalini concentrazione, a prescindere dalla Linea di Vista.",
            },
        ],
    },

    "Gray Fox": {
        hp: 4,
        hurtSound:     'audio/sfx/ninja/ferito.wav',
        hurtPlusSound: 'audio/sfx/ninja/ferito+.wav',
        deathSound:    'audio/sfx/ninja/morte.wav',
        debutStage: 9,
        baseEquipment: ["GF1", "GF2", "GF3"],
        hotspots: [
            // Azioni fisse
            { ref: "movimento-furtivo",     type: "fixed",    cx: 41.8, cy: 14.3 },
            { ref: "scatto",                type: "fixed",    cx: 41.8, cy: 29.4 },
            { ref: "attacco-corpo-a-corpo", type: "fixed",    cx: 41.8, cy: 44.5 },
            { ref: "attacco-combo",         type: "fixed",    cx: 41.8, cy: 59.5 },
            { ref: "concentrazione",        type: "fixed",    cx: 41.8, cy: 74.6 },
            // Azioni variabili — 4 slot, il 4° è vuoto sulla plancia
            { ref: "trascinamento",         type: "variable", cx: 69.1, cy: 11.9 },
            { ref: "interazione",           type: "variable", cx: 69.1, cy: 28.3 },
            { ref: "bussata",               type: "variable", cx: 69.1, cy: 44.6 },
            // Capacità — 3 righe in basso
            { ref: "sto-perdendo-me-stesso", type: "ability", cx: 35.6, cy: 82.0 },
            { ref: "mettiti-al-riparo",      type: "ability", cx: 35.6, cy: 88.5 },
            { ref: "volpe-alle-strette",     type: "ability", cx: 35.6, cy: 95.0 },
        ],
        concentrationTokens: [
            {
                id: "grayfox-conc-1",
                label: "+2",
                desc: "+2 al risultato di un dado quando lanci i dadi per una tua azione o quando vieni attaccato",
                cost: 1,
            },
            {
                id: "grayfox-conc-2",
                label: "+/−2",
                desc: "+2 o −2 al risultato di un dado quando lanci i dadi per una tua azione o quando vieni attaccato",
                cost: 2,
            },
            {
                id: "grayfox-conc-3",
                label: "−1 [dado nero]",
                desc: "Tira 1 dado nero in meno",
                cost: 2,
            },
            {
                id: "grayfox-conc-4",
                label: "+2 SCATTO",
                desc: "Muoversi di +2 caselle durante uno scatto",
                cost: 1,
            },
        ],
        fixedActions: [
            {
                id: "movimento-furtivo",
                name: "MOVIMENTO FURTIVO",
                desc: "Muovi 1",
                cost: 1,
                sound: "audio/azioni/ninja/movimento-furtivo.wav",
            },
            {
                id: "scatto",
                name: "SCATTO",
                desc: "Muovi 2",
                cost: 1,
                noise: true,
                sound: "audio/azioni/ninja/scatto.wav",
            },
            {
                id: "attacco-corpo-a-corpo",
                name: "ATTACCO CORPO A CORPO",
                desc: "Attacca 1 miniatura adiacente. Infliggi danni da KO",
                cost: 1,
                attack: true,
                attackType: "physical",
                category: "melee",
                targets: 1,
                dice: [{ color: "white", count: 1 }],
                sound: "audio/azioni/ninja/attacco-corpo-a-corpo.wav",
            },
            {
                id: "attacco-combo",
                name: "ATTACCO COMBO",
                desc: "Attacca 1 miniatura adiacente. Infliggi danni da KO",
                cost: 2,
                attack: true,
                attackType: "physical",
                category: "melee",
                targets: 1,
                dice: [{ color: "white", count: 2 }, { color: "black", count: 1 }],
                sound: "audio/azioni/ninja/attacco-combo.wav",
            },
            {
                id: "concentrazione",
                name: "CONCENTRAZIONE",
                desc: "Ripristina 1 segnalino concentrazione",
                cost: "X",
                sound: "audio/azioni/ninja/concentrazione.wav",
            },
        ],
        defaultVariableActions: [
            {
                id: "trascinamento",
                name: "TRASCINAMENTO",
                desc: "Raccogli un soldato KO/ucciso nella tua casella o in una casella adiacente. Poi muovi 1 e colloca quel segnalino in una casella adiacente vuota",
                cost: 1,
                noise: true,
                sound: "audio/azioni/snake/trascinamento.wav",
            },
            {
                id: "interazione",
                name: "INTERAZIONE",
                desc: "Interagisci con un oggetto",
                cost: 1,
                dice: [{ color: "white", count: 1 }, { color: "black", count: 2 }],
                sound: "audio/azioni/snake/interazione.wav",
            },
            {
                id: "bussata",
                name: "BUSSATA",
                desc: "Attira l'attenzione nella tua casella",
                cost: 1,
                sound: "audio/azioni/snake/bussata.wav",
            },
        ],
        abilities: [
            {
                id: "sto-perdendo-me-stesso",
                name: "\"STO PERDENDO ME STESSO\"",
                type: "passive",
                desc: "Mentre il tuo segnalino ! si trova nella tua zona, non puoi effettuare azioni Concentrazione.",
            },
            {
                id: "mettiti-al-riparo",
                name: "\"METTITI AL RIPARO!\"",
                type: "reactive",
                otherTurn: true,
                desc: "1 volta per round, quando una miniatura adiacente viene attaccata, puoi invece diventare tu il bersaglio.",
            },
            {
                id: "volpe-alle-strette",
                name: "VOLPE ALLE STRETTE",
                type: "reactive",
                desc: "Ogni volta che subisci danni, puoi collocare 1 ingranaggio su un tuo equipaggiamento.",
            },
        ],
    },

    "Otacon": {
        hp: 4,
        noWeapons: true,
        hurtSound:     'audio/azioni/otacon/ferito.wav',
        hurtPlusSound: 'audio/azioni/otacon/ferito+.wav',
        deathSound:    'audio/azioni/otacon/morte.wav',
        debutStage: 9,
        baseEquipment: ["HE1", "HE2"],
        hotspots: [
            // Azioni fisse — 4 slot (il 5° è vuoto sulla plancia)
            { ref: "hackeraggio-terminale",  type: "fixed",    cx: 41.8, cy: 14.3 },
            { ref: "ricerca-sistema",        type: "fixed",    cx: 41.8, cy: 29.4 },
            { ref: "accesso-sistema",        type: "fixed",    cx: 41.8, cy: 44.5 },
            { ref: "concentrazione",         type: "fixed",    cx: 41.8, cy: 59.5 },
            // Azioni variabili
            { ref: "movimento-furtivo",      type: "variable", cx: 69.1, cy: 11.9 },
            { ref: "scatto",                 type: "variable", cx: 69.1, cy: 28.3 },
            { ref: "bussata",               type: "variable", cx: 69.1, cy: 44.6 },
            { ref: "interazione",            type: "variable", cx: 69.1, cy: 61.0 },
            // Capacità — 3 righe in basso
            { ref: "non-sono-un-soldato",    type: "ability",  cx: 35.6, cy: 82.0 },
            { ref: "hacker",                 type: "ability",  cx: 35.6, cy: 88.5 },
            { ref: "chiamata-codec",         type: "ability",  cx: 35.6, cy: 95.0 },
        ],
        concentrationTokens: [
            {
                id: "otacon-conc-1",
                label: "+/−1",
                desc: "+1 o −1 al risultato di un dado quando lanci i dadi per una tua azione o quando vieni attaccato",
                cost: 1,
            },
            {
                id: "otacon-conc-2",
                label: "RIPETI [dado nero]",
                desc: "Ripetere il tiro di 1 dado nero",
                cost: 1,
                dice: [{ color: "black", count: 1 }],
            },
            {
                id: "otacon-conc-3",
                label: "+/−2",
                desc: "+2 o −2 al risultato di un dado quando lanci i dadi per una tua azione o quando vieni attaccato",
                cost: 2,
            },
            {
                id: "otacon-conc-4",
                label: "+1 [dado nero]",
                desc: "Tirare +1 dado nero. Può essere usato prima o dopo un qualsiasi tiro.",
                cost: 2,
                dice: [{ color: "black", count: 1 }],
            },
        ],
        fixedActions: [
            {
                id: "hackeraggio-terminale",
                name: "HACKERAGGIO DEL TERMINALE",
                desc: "Tenta di hackerare un terminale nella tua casella o in una casella adiacente.",
                cost: 1,
                dice: [{ color: "black", count: 4 }],
                sound: "audio/azioni/otacon/hacker.wav",
            },
            {
                id: "ricerca-sistema",
                name: "RICERCA DI UN SISTEMA",
                desc: "Quando ti trovi nella stessa casella o in una casella adiacente a un terminale hackerato, pesca 1 carta sistema. Se è la 4° carta, collocane 1 in cima o in fondo al mazzo di sistema.",
                cost: 1,
                sound: "audio/azioni/otacon/hacker.wav",
            },
            {
                id: "accesso-sistema",
                name: "ACCESSO AL SISTEMA",
                desc: "Tenta di accedere a una capacità su una carta sistema. Metti un dado nero con un + a fianco.",
                cost: 1,
                sound: "audio/azioni/otacon/hacker.wav",
            },
            {
                id: "concentrazione",
                name: "CONCENTRAZIONE",
                desc: "Ripristina 1 segnalino concentrazione",
                cost: "X",
                sound: "audio/azioni/snake/concentrazione.wav",
            },
        ],
        defaultVariableActions: [
            {
                id: "movimento-furtivo",
                name: "MOVIMENTO FURTIVO",
                desc: "Muovi 1",
                cost: 1,
                sound: "audio/azioni/snake/movimento-furtivo.wav",
            },
            {
                id: "scatto",
                name: "SCATTO",
                desc: "Muovi 2",
                cost: 1,
                noise: true,
                sound: "audio/azioni/snake/scatto.wav",
            },
            {
                id: "bussata",
                name: "BUSSATA",
                desc: "Attira l'attenzione nella tua casella",
                cost: 1,
                sound: "audio/azioni/snake/bussata.wav",
            },
            {
                id: "interazione",
                name: "INTERAZIONE",
                desc: "Interagisci con un oggetto",
                cost: 1,
                dice: [{ color: "black", count: 4 }],
                sound: "audio/azioni/snake/interazione.wav",
            },
        ],
        abilities: [
            {
                id: "non-sono-un-soldato",
                name: "\"NON SONO UN SOLDATO\"",
                type: "passive",
                desc: "Non puoi usare armi.",
            },
            {
                id: "hacker",
                name: "HACKER",
                type: "once",
                desc: "Mentre hackeri un terminale o accedi a una carta sistema, puoi tirare fino a +2 dadi bianchi.",
            },
            {
                id: "chiamata-codec",
                name: "CHIAMATA CODEC",
                type: "reactive",
                otherTurn: true,
                showsConcTokens: true,
                desc: "Puoi usare i tuoi segnalini concentrazione per modificare o ripetere il tiro dei dadi neri tirati da un altro giocatore.",
            },
        ],
    },

};
