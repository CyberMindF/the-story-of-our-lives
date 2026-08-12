# Inventario dei contenuti CMS

Inventario preparato il 12/08/2026 per la branch `feature/content-editor`.

## Legenda

- **plain_text**: un testo singolo, modificabile con textarea.
- **paragraphs**: più paragrafi ordinati.
- **collection**: elementi strutturati con ID e posizione; richiede un editor dedicato.
- **document**: contenuto lungo strutturato in sezioni, non adatto all'editor generico.
- **replace**: una modifica sostituisce il valore corrente.
- **history**: una nuova versione può restare consultabile insieme alle precedenti.
- **Migrato**: già presente in `content_entries` tramite la migrazione 0036.
- **Da migrare**: contenuto editoriale ancora nel template, in TypeScript o in un JSON.
- **Dinamico**: contenuto già salvato nel DB tramite una funzione specifica; non va duplicato
  nel CMS generico.
- **Funzionale**: resta nel codice perché serve all'interfaccia o al funzionamento.

Le modalità `history` indicate qui sono una raccomandazione: sono riservate ai messaggi
personali che possono rappresentare momenti diversi. Le normali correzioni continuano a usare
“Salva modifica”; “Aggiungi nuova versione” rimane una scelta esplicita.

## Testi semplici e a paragrafi

| Content key | Tipo | Modalità | Fonte attuale | Stato | Note |
|---|---|---:|---|---|---|
| `portone.introduzione` | plain_text | replace | `portone.html` | **Deciso: resta nel codice** | Testo del software (istruzioni di accesso), non un testo personale — nessuna modifica prevista |
| `portone.indizio.introduzione` | plain_text | replace | `portone.html` | **Deciso: resta nel codice** | Stesso motivo di `portone.introduzione` |
| `portone.indizio.parole` | plain_text | replace | `portone.html` | **Deciso: resta nel codice** | Stesso motivo di `portone.introduzione` |
| `mondo-bianco.canzone.citazione` | paragraphs | replace | DB | **Migrato** (12/08/2026) | I 4 versi restano un unico blocco con `<br>` (a-capo singoli, non paragrafi separati); aggiunto supporto a `\n`→`<br>` in `EditorialText` |
| `mondo-bianco.benvenuta` | plain_text | history | DB + `mondo-bianco.html` | **Migrato** | La seed è `replace`: da valutare passaggio a `history` |
| `mappamondo.introduzione` | plain_text | history | DB | **Migrato** | “Il racconto di come tutto è nato” resta titolo strutturale |
| `ponti.introduzione` | plain_text | history | DB | **Migrato** | Spiegazione personale del Bifrost |
| `ponti.solo.introduzione` | plain_text | replace | `ponti.html` | Non applicabile | La card “Se ti sentirai sola…” non ha oggi un corpo separato da migrare |
| `ponti.bifrost.descrizione` | plain_text | replace | DB | **Migrato** | Descrizione del documento Bifrost |
| `ponti.linguaggio.descrizione` | plain_text | replace | DB | **Migrato** | Descrizione del Linguaggio Segreto |
| `ponti.chat.descrizione` | plain_text | replace | DB | **Migrato** | Descrizione del vecchio documento Chat |
| `calendario.introduzione` | plain_text | history | DB + `calendario.html` | **Migrato** | La seed è `replace`: è un messaggio datato, consigliato `history` |
| `cuffiette.playlist.introduzione` | plain_text | history | DB | **Migrato** | Introduzione alla playlist |
| `cuffiette.canzoni.introduzione` | plain_text | history | DB | **Migrato** | Testo prima delle nove canzoni |
| `cuffiette.parole-rubate.introduzione` | plain_text | replace | DB | **Migrato** | Introduzione alle citazioni |
| `storie.introduzione` | plain_text | history | DB | **Migrato** | Messaggio personale in apertura |
| `storie.suggerimento.eyebrow` | plain_text | replace | DB | **Migrato** (12/08/2026) | “Una pagina ancora bianca”; contenitore passato da `span` a `div` (grid item, vedi nota sotto) |
| `storie.suggerimento.titolo` | plain_text | replace | DB | **Migrato** (12/08/2026) | “Lasciami una storia”; stesso motivo di `storie.suggerimento.eyebrow` |
| `storie.suggerimento.introduzione` | plain_text | replace | DB | **Migrato** | Istruzione visibile del modulo |
| `mappa.introduzione` | paragraphs | history | DB | **Migrato** | Due paragrafi personali |
| `bacheca.introduzione` | paragraphs | history | DB | **Migrato** (12/08/2026) | Testo recuperato da `bacheca.json`; wired solo in `BachecaPreview` (route attiva) |
| `lettere.introduzione` | plain_text | history | DB + `lettere.html` | **Migrato** | Consigliato `history` per conservare il vecchio significato della pagina |
| `domande.introduzione` | plain_text | history | DB | **Migrato** | Origine personale del Pozzo dei Dubbi |
| `cose-insieme.introduzione` | plain_text | history | DB + `cose-insieme.html` | **Migrato** | Messaggio legato al momento in cui la lista è stata condivisa |
| `cose-insieme.sblocco.introduzione` | plain_text | replace | DB | **Migrato** | Testo sopra la domanda NSFW |
| `ricettario.eyebrow` | plain_text | replace | DB | **Migrato** | “Il nostro personalissimo libro di ricette” |
| `ricettario.introduzione` | plain_text | replace | DB + `ricettario.html` | **Migrato** | Coerente come `replace` |
| `tavolo.introduzione` | plain_text | history | DB | **Migrato** | Messaggio personale e legato a un momento preciso |
| `gdr.introduzione` | paragraphs | history | DB | **Migrato** | Tre paragrafi su perché e come giocare |
| `gdr.prezzo-verita.conclusione-regole` | plain_text | replace | DB | **Migrato** | Invito personale ad avviare l'avventura |
| `gdr.prezzo-verita.maga.introduzione` | plain_text | replace | DB | **Migrato** | Istruzione visibile sulla scheda |
| `gdr.prezzo-verita.appunti.introduzione` | plain_text | replace | DB | **Migrato** | Istruzione visibile sugli appunti |
| `linguaggio-segreto.introduzione` | plain_text | history | DB | **Migrato** | Perché esiste il linguaggio |
| `linguaggio-segreto.ntfy-istruzioni` | plain_text | replace | DB | **Migrato** | Istruzione visibile e modificabile |
| `linguaggio-segreto.esempi-introduzione` | plain_text | replace | DB | **Migrato** | Testo prima degli esempi |
| `linguaggio-segreto.messaggio-indizio` | plain_text | replace | DB | **Migrato** | “Prova a decifrarlo…” |
| `linguaggio-segreto.messaggio-codice` | plain_text | replace | DB | **Migrato** (12/08/2026) | Messaggio finale in simboli |
| `messaggio-criptato.istruzioni` | plain_text | replace | `messaggio-criptato.html` | **Bloccato** | Il testo contiene un link a un sito esterno (AES Decryption); la sintassi link di `EditorialText` supporta solo rotte interne. Coerente con la decisione già presa: il Messaggio Criptato non ha un editor CMS dedicato |
| `il-cielo.citazione` | plain_text | replace | DB | **Migrato** | “Sotto lo stesso cielo.” |
| `impostazioni-mondo.introduzione` | plain_text | replace | DB | **Migrato** | Significato condiviso delle modifiche |
| `impostazioni-mondo.temi.introduzione` | plain_text | replace | DB | **Migrato** | Istruzione del selettore temi |
| `impostazioni-mondo.effetti.introduzione` | plain_text | replace | DB | **Migrato** | Spiegazione dei preset |
| `suggerimenti.introduzione` | plain_text | replace | DB | **Migrato** | Spiega cosa si può proporre |
| `profilo.introduzione` | plain_text | replace | DB | **Migrato** (12/08/2026) | Testo puramente descrittivo |
| `not-found.messaggio` | plain_text | replace | `not-found.html` | **Deciso: resta nel codice** | Stesso motivo di `portone.*` |
| `cruciverba.titolo` | plain_text | replace | DB | **Migrato** (12/08/2026) | Titolo editoriale del gioco, renderizzato in `<h1 id="title">` |
| `cruciverba.sottotitolo` | plain_text | replace | DB | **Migrato** (12/08/2026) | Sottotitolo personale, renderizzato nel `<p id="subtitle">` |

**Nota (12/08/2026):** questa tabella era rimasta ferma allo stato del 09/08/2026 mentre il lavoro
proseguiva — quasi tutte le righe segnate “Da migrare” erano in realtà già state migrate nelle
sessioni precedenti (migrazioni 0038/0039/0046) senza aggiornare questo file. Rifatta la
verifica riga per riga sul codice reale invece di fidarsi del documento.

**Nota tecnica:** i contenitori grid/flex non "collassano" il margine di default dei `<p>` dei
loro figli come farebbe il normale flusso a blocchi (scoperto migrando `storie.suggerimento.*`,
il riquadro cresceva ben oltre l'altezza prevista). Risolto alla radice in `EditorialText`
stesso (`:host p { margin: 0 } :host p + p { margin-top: 1em }`), non caso per caso nelle pagine
che lo usano.

## Collezioni strutturate

| Collection key | Elementi | Fonte attuale | Modalità | Editor richiesto | Note |
|---|---:|---|---|---|---|
| `mondo-bianco.luoghi` | 13 card | `mondo-bianco.html` | replace | Lista ordinabile | Route e disponibilità restano validate dal codice |
| `mappamondo.scene` | 7 scene | `mappamondo.html` | replace | Scene ordinate | Ogni scena: ID, numero, titolo, paragrafi/dialoghi |
| `ponti.collegamenti` | 4 card | `ponti.html` | replace | Lista ordinabile | Titolo, emoji, descrizione, URL/route |
| `calendario.eventi` | 29 | `calendar.json` | replace | **Editor Calendario** | ID data già stabile; ordinare per data |
| `cuffiette.canzoni` | 9 | `music.json` | replace | **Editor Cuffiette** | ID, titolo, introduzione, media key, testo |
| `cuffiette.parole-rubate` | raccolta citazioni | `music.json` | replace | Lista ordinabile | Citazione + fonte; attenzione a testi di terzi |
| `cuffiette.bonus` | 1 | `music.json` | replace | Campo dedicato | Disponibilità, etichetta e media key |
| `storie.raccolta` | 4 | `stories.json` | replace | **Editor Storie** | ID, titolo, data, corpo, audio/video/immagine opzionali |
| `mappa.destinazioni` | 7 | `map.json` | replace | **Editor Mappa** | ID, nome, coordinate, paragrafi, immagini, stato aperto |
| `bacheca.periodi` | 5 | D1 (`bacheca_periods`) | replace | **Editor Bacheca** | **Migrato** (12/08/2026) — lista piatta con CRUD+move |
| `bacheca.media` | 19 giorni, 302 blocchi | D1 (`bacheca_days`, `content` JSON validato) | replace | **Editor Bacheca** | **Migrato** (12/08/2026) — editor visuale "ibrido" (opzione D), non un CRUD granulare; `bacheca-layout.json`/`bacheca.json` eliminati, `devId` rimosso (non più necessario) |
| `lettere.raccolta` | dinamica | D1 `letters` | — | Già esistente | Non migrare nel CMS |
| `domande.raccolta` | dinamica | D1 `questions` | — | Già esistente | Non migrare nel CMS |
| `cose-insieme.attivita` | 77+ | `functions/api/together/_data.js` + D1 stato | replace | **Editor Agenda** | Testi/metadata ancora nel codice; stato già nel DB |
| `ricettario.ricette` | 13 | `recipes.json` | replace | **Editor Ricettario** | ID, titolo, tipo, nota, ingredienti, passaggi, fonte, placeholder |
| `gdr.avventure` | 2 | `gdr.html` | replace | Lista amministrativa | Una disponibile, una coming soon |
| `gdr.prezzo-verita.regole` | 5 blocchi | `il-prezzo-della-verita.html` | replace | Documento strutturato | Statistiche, esiti, abilità, stress e magia |
| `gdr.prezzo-verita.avventura` | documento, 41 blocchi | D1 (`gdr_blocks`, `document_key='avventura'`) | replace | **Editor GDR** | **Migrato** (12/08/2026) — 7 tipi di blocco (titolo, paragrafo, callout, immagine, griglia NPC, lista, tabella); turni iniziali restano dinamici (`gdr_turns`) |
| `gdr.prezzo-verita.maga-regole` | documento, 4 blocchi | D1 (`gdr_blocks`, `document_key='maga-regole'`) | replace | **Editor GDR** | **Migrato** (12/08/2026) — solo Abilità/tabella Effetti/Incantesimi; scheda utente (Aspetto/Statistiche/Inventario) resta dinamica come deciso |
| `gdr.prezzo-verita.turni` | dinamica | D1 `gdr_turns` | — | Già esistente | Non migrare nel CMS |
| `gdr.prezzo-verita.appunti` | dinamica | D1 `gdr_notes` | — | Già esistente | Non migrare nel CMS |
| `linguaggio-segreto.categorie` | 6 categorie, 25 simboli | D1 (`linguaggio_segreto_categories`/`_symbols`) | replace | **Editor Linguaggio Segreto** | **Migrato** (12/08/2026) — categorie e simboli sono due collezioni separate ma legate da `category_id`; comando "Sposta…" per cambiare categoria/posizione oltre al su/giù per le correzioni vicine |
| `linguaggio-segreto.esempi` | 12 | D1 (`linguaggio_segreto_examples`) | replace | **Editor Linguaggio Segreto** | **Migrato** (12/08/2026) — lista piatta, stesso pattern CRUD+move delle altre |
| `messaggio-criptato.blocchi` | 5 + utili | `messaggio-criptato.html` | replace | Documento strutturato | Titolo/link/blocchi cifrati e indizi |
| `cruciverba.definizioni` | 100 | `crossword_words` (D1) | replace | **Editor Cruciverba** | **Migrato** (12/08/2026), via `/api/crossword-words`; `data.json` eliminato |
| `cruciverba.suggerimenti` | 7 | `crossword-hints.json` | replace | Lista ordinabile | Piccoli pegni mostrati casualmente |
| `temi` | 5 | `theme.service.ts` | replace | Editor temi futuro | Nome, descrizione, swatch, icona; ID e logica restano nel codice |
| `impostazioni-mondo.effetti` | 8 | template + codice | replace | Editor effetti futuro | Titoli/descrizioni modificabili; chiavi e comportamento restano nel codice |

## Fonti duplicate o legacy da non migrare due volte

### Bacheca — **Risolto (12/08/2026)**

Migrazione completata in 5 fasi (editor "ibrido", opzione D concordata con Rory: editor
visuale per giorno, salvataggio dell'intero layout come JSON validato rigorosamente lato
server, non un CRUD granulare a 5 livelli — vedi `prossimi sviluppi.md` per il dettaglio).
`bacheca-layout.json`, `bacheca.json` e la vecchia implementazione non instradata
`pages/bacheca/bacheca.*` sono stati eliminati: nessuna fonte legacy residua. L'introduzione
era già stata migrata come `bacheca.introduzione` in una sessione precedente.

### Introduzione delle Cuffiette e link inline

`songsIntroduction` contiene la notazione speciale `[ 🌈 I Ponti ]`, che oggi il componente
delle Cuffiette trasforma a mano in un link verso `/ponti`. Il normale `EditorialText` tratta
invece tutto come testo semplice: migrandolo così com'è mostrerebbe le parentesi ma non un link
cliccabile.

**Decisione:** aggiungere all'editor generico un supporto minimo e controllato per link interni,
senza introdurre un editor formattato completo. È sufficiente una sintassi esplicita per testo e
route interne (per esempio `[🌈 I Ponti](/ponti)`), renderizzata in modo sicuro. Migrare quindi
anche `songsIntroduction` e rimuovere il caso speciale dalle Cuffiette.

### Contenuti già dinamici

Lettere, Domande, suggerimenti, turni GDR, appunti GDR, scheda della Maga e stati dell'Agenda
sono già dati utente nel DB. L'inventario include le loro introduzioni e i testi editoriali,
ma non deve riversare le righe dinamiche in `content_entries`.

## Contenuti funzionali da lasciare nel codice

Non devono diventare record CMS:

- etichette di pulsanti e controlli (`Salva`, `Annulla`, `Accedi`, filtri, select);
- messaggi di errore, caricamento, successo e validazione;
- `aria-label`, testi screen-reader e alt tecnici derivabili dai dati;
- placeholder dei form, salvo casi in cui diventino vere istruzioni editoriali;
- titoli strutturali (`Ingredienti`, `Procedimento`, `Statistiche`, `Inventario`);
- nomi delle route, chiavi API, ID tecnici e logica di autorizzazione;
- testi generati dal conteggio o dallo stato (`29 date da ricordare`, `Coming soon`);
- contenuti inseriti dagli utenti nelle tabelle dinamiche.

## Ordine di migrazione consigliato

1. Completare i testi semplici e a paragrafi, iniziando da quelli `history`.
2. Calendario e Ricettario: strutture piccole e regolari.
3. Storie e Cuffiette: strutturate ma con schema già pulito.
4. Mappa: paragrafi, coordinate e immagini.
5. Agenda delle Idee: unire metadata nel codice e stati già in D1.
6. Linguaggio Segreto e GDR: documenti annidati con editor specifici.
7. Cruciverba: preservare rigorosamente coordinate e soluzioni.
8. Bacheca per ultima: fonte duplicata, molti media e layout annidato. **Fatta (12/08/2026)**.
   Restano fuori solo le collezioni già escluse per decisione esplicita (Messaggio Criptato,
   nessun editor CMS previsto) o rimandate al futuro (editor di `temi` e
   `impostazioni-mondo.effetti`) — tutte le altre collezioni strutturate elencate in questo
   documento hanno ora un editor dedicato.

## Decisioni da confermare prima della Fase 4 completa

1. **Deciso:** la scelta tra `history`, `replace` e permanenza nel codice va fatta sul singolo
   testo, non sull'intera pagina. Devono diventare modificabili soprattutto i testi centrali e
   personali, il cui significato può evolvere nel tempo. Per esempio, il benvenuto del Mondo
   Bianco potrebbe passare da «eccoci qui finalmente…» a un nuovo messaggio come «ora il Mondo
   Bianco è sotto una nuova veste…»: in casi simili si salva una nuova versione senza perdere
   quella precedente. Micro-testi funzionali, etichette e descrizioni puramente tecniche restano
   nel codice; testi informativi correggibili ma privi di valore storico usano `replace`.
2. **Deciso:** nelle card del Mondo Bianco separare contenuto e navigazione. Nomi e descrizioni
   visibili sono contenuti editoriali modificabili; emoji, route, disponibilità, ordine e altra
   struttura funzionale restano nel codice.
3. **Deciso:** il Mappamondo deve essere modificabile dal sito tramite il suo editor strutturato,
   permettendo di aggiungere, aggiornare e organizzare luoghi e relativi contenuti.
4. **Deciso per il GDR:** deve poter essere ampliato dal sito, ma non tramite il semplice editor
   di paragrafi. Richiede in una fase dedicata un editor strutturato più ricco, capace di gestire
   almeno testo, immagini e blocchi/ordine. Nel frattempo i contenuti complessi restano nel
   codice senza considerarli esclusi dalla migrazione futura. **Il Messaggio Criptato è invece
   considerato concluso:** struttura, testo cifrato, indizi e soluzione restano nel codice;
   eventuali piccole correzioni saranno fatte direttamente lì, senza costruire un editor CMS.
   **Il Linguaggio Segreto è distinto dal Messaggio Criptato e deve invece essere modificabile
   dal sito:** è una raccolta destinata a crescere e richiede un editor strutturato dedicato per
   aggiungere, modificare, eliminare e ordinare categorie, simboli, significati ed esempi.
   L'editor resta una normale lista di campi, non un editor visuale complesso. Evitare il drag
   and drop: usare frecce su/giù per le correzioni vicine e un comando `Sposta…` per scegliere
   direttamente categoria e posizione (oppure l'elemento prima/dopo cui inserirlo), così anche
   uno spostamento dalla posizione 1 alla 70 richiede una sola operazione.
5. **Deciso:** `bacheca-layout.json` è la sola fonte strutturale della pagina attiva;
   `bacheca.json` serve soltanto a recuperare l'introduzione prima di diventare legacy.
6. **Deciso:** migrare `songsIntroduction` delle Cuffiette dopo aver aggiunto il supporto minimo
   e sicuro ai link interni nell'editor generico; niente editor rich-text completo per questo.
