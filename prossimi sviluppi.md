# Piano di lavoro

Scaletta concordata il 09/08/2026, dopo il porting Angular e la componentizzazione. Le cose
ancora aperte (da fare, in corso, o bloccate su contenuti di Rory) stanno in cima, così si
vedono subito senza scorrere; tutto quello già completato è più sotto, in ordine di fase.

## Da fare / in corso

- [~] #25 — Mappa: Sicilia. Struttura pronta in `map.json` (destinazione tra Olanda e Roma,
  coordinate su Catania) con le 4 foto vere già al loro posto (fiume Amenano/Catania, Gole
  dell'Alcantara, laghetti di Cavagrande del Cassibile/Avola, Isola Bella a Taormina —
  scaricate e convertite in webp, la foto di Avola croppata del 15% sopra/sotto su richiesta).
  **Resta solo il testo**: i 4 paragrafi sono ancora segnaposto (`[... testo da scrivere]`).
  Aggiornata anche la validazione hardcoded in `mappa.ts` (si aspettava esattamente 6
  destinazioni, ora 7).
- #26 — Mappa: completare Roma, aspetta il testo vero
- [~] #34 — “Il Ricettario”: pagina realizzata con card lunghe, ingredienti, procedimento,
  filtri “Fatta insieme / Da provare” e collegamento ai Suggerimenti già preselezionato.
  Contiene le ricette del Piano Aprilia e le aggiunte richieste da Rory. **Da fare**:
  sostituire la ricetta placeholder del pollo al curry con la loro versione definitiva e
  ricostruire ingredienti/procedimento dei biscotti di pasta frolla.
- #b1 - Finire di implementare tutte le foto nella bacheca e sistemare la visualizzazione
- #e1 - Aggiungere qualcosa a "le cuffiette", per creare insieme una playlist su spotify, in modo che lei possa proporne di nuove e pure io. Magari devono essere accettate dall'altro per poter dire "si inseriamole"?
- #e2 - Tema love, molto "rosa" tipo fragola e panna
- #e3 - Animazione sfondi stickers, con immagini piccolina e stupide come stickers per l'appunto tipo arcobaleni, unicorni, gelati, soli, lune, orsetti, cuori, caramelle, cose così. Però non penso che voglio delle emoji e nemmeno svg o css plain, se deve essere un svg devono essere carini come disegnini. Nel pannello delle impostazioni del mondo, puoi decidere quali stickers vuoi che si vefano "cadere"
- #e4 - Un gioco nella sezione giochi di "carte" dove è possibile collezionare carte queste carte sono tipo, cose nostre, come stickers nostri o immagini nostre, le carte possono avere rarità maggiori (quindi carte dello stesso tipo ma con rarità diverse) e ce le possiamo scambiare, una bustina contiene 5 carte, casuali, e possiamo scambiarle in modo asincrono, poi c'è una pagina "album" dove è possibile vederle tutte. Una bustina si guadagna ogni 10 minuti passati sul sito, ma alla registrazione te ne da 3. Deve essere possibile guardare l'album dell'altro, con doppioni segnalati
- #e5 - Aggiungere una chat asincrona, nei ponti, che sostituisce il vecchio documento di chat, anche se pure quello rimarrà disponibile nel dubbio
- #e6 - Test generalee fix finali mobile
- #e7 - Animazione bolle di sapone, che vagano un po' per lo schermo e poi scoppiano
- #e8 - Animazione cuori possono essere molto piccoli e molto grandi, vagano un po' per lo schermo in modo legiadro e poi fanno un piccolo fadeout leggero
---

## Da non fare

- [x] #24 — ricerca globale protetta: scartata. Le aree del sito sono poche e riconoscibili;
  indicizzare contenuti protetti e formati diversi aggiungerebbe complessità senza risolvere
  un bisogno emerso nell'uso reale. Da rivalutare solo se in futuro diventerà concretamente
  difficile ritrovare i contenuti.

---

## Fatto

### Extra (fuori scaletta, chiesti il 12/08/2026)

- [x] #c1 — verifica generale della telemetria completata. Le aperture di tutte le pagine e
  le principali scritture erano già registrate; aggiunti gli eventi mancanti per cambio di
  tema/impostazioni del mondo, cambio nickname, lettura di una nuova lettera, proposta di una
  Storia e richiesta di un suggerimento nel cruciverba. Gli autosalvataggi degli appunti GDR
  restano volutamente esclusi per non creare un evento a ogni pausa di scrittura.
- [x] #16 — seconda avventura GDR: “La casa che trattiene il respiro” è visibile soltanto
  come card “Coming soon”, senza esporre testo o sistemi incompleti.
- [x] #33 — “Cose da fare insieme” è diventata **L'Agenda delle Idee**: tutte le attività
  sono mantenute nell'ordine originale con periodo approssimativo, categorie filtrabili e
  stati condivisi “Da fare / Fatto / Da rifare”. Comprende la vecchia #23 nella categoria
  Giochi e permette di proporre nuove idee attraverso i Suggerimenti. Le righe NSFW arrivano
  dal server solo dopo lo sblocco temporaneo; il tentativo e la risposta vengono registrati
  negli eventi come dichiarato nella modale.
- [x] Uniformata la pagina **La Stanza dei Bottoni** (prima “Impostazioni del Mondo”): testi
  meno ripetitivi, nome ed emoji aggiornati. Corretto il componente `app-select` condiviso:
  menu opaco e leggibile e card portata davanti alle sorelle durante l'apertura. Uniformate
  anche la freccia di ritorno delle pagine interne, il pulsante in fondo e la barra profilo
  alle superfici e ai colori del tema.

### Extra (fuori scaletta, chiesto l'11/08/2026)

- [x] #b2 — Restyle del selettore temi: spostato come prima sezione di Impostazioni del
  Mondo e trasformato in una griglia responsive di card con vere anteprime del cielo, nome,
  breve descrizione e stato attivo. “Notte” rinominato “Night Sky”. Ripreso il linguaggio
  visivo delle icone legacy senza emoji: luna e stelle per Night Sky, onda per Ocean, drappo
  per Velvet e le lettere storiche D/R per Red of You e Green of Me. Gli stili ora vivono nel
  componente `theme-switcher`, non nel CSS scoped della pagina padre.

- [x] #35 — Cruciverba: aggiunto il bottone “Suggerimento”. Non rivela lettere o soluzioni:
  propone casualmente uno dei piccoli pegni affettuosi definiti in
  `web/public/content/crossword-hints.json` da fare in chat e invita poi a
  chiedere il suggerimento direttamente a Rory. La stessa richiesta non viene proposta due
  volte di seguito.

### Extra (fuori scaletta, chiesti il 10/08/2026 — secondo giro)

- [x] #27 — rendere più personali le scritte ancora generiche: riletto tutto il testo del
  sito (ogni pagina, i JSON di contenuto) — era già quasi ovunque scritto in prima persona
  rivolto a lei, con ricordi specifici. Solo due testi risultavano davvero "scritti da
  Claude" (Linguaggio Segreto, già segnalati nel codice); sostituiti col testo vero (vedi
  #38-#41). Il resto (comprese le regole del GDR e le istruzioni di Messaggio Criptato,
  valutate e lasciate intenzionalmente così) non richiedeva modifiche.
- [x] #37 — "Leggi questo ricordo" nella card di anteprima della Mappa è diventato "Vai alla
  meta".
- [x] #38 — Linguaggio Segreto: aggiunta l'interazione dei cinque cuori nella tabella stessa
  (`.....` → "Ti amo", con la spiegazione dei cinque cuori) invece di tenerla come sezione a
  sé separata in alto (rimossa, era ridondante). Il significato di `0` è ora "Sono sul
  documento / Ti ho scritto".
- [x] #39 — Colonna del simbolo nella tabella troppo stretta (8rem): con simboli come
  ">>> oppure <<<" il testo sforava e restava appiccicato al significato. Allargata a 11rem
  con più padding.
- [x] #40 — Aggiunta una spiegazione per (quasi) ogni simbolo della tabella, sotto il
  significato in corsivo più piccolo — testo preso quasi parola per parola da quello scritto
  da Rory. Lasciato senza spiegazione solo `0`, di cui lui stesso non ricorda l'origine.
- [x] #41 — Aggiunta una sezione "Frasi vere, di quando lo abbiamo inventato" con le 12 frasi
  reali (combinazioni di simboli) dal messaggio del 08/04/2026 sull'app ntfy — anche il testo
  della nota "perché esiste questo linguaggio" in cima alla pagina è stato sostituito con
  quello vero di Rory (non più l'abbozzo di Claude), stesso per la spiegazione generale dei
  puntini incrementali.
- [x] #36 — Card di anteprima della Mappa (quella con foto + titolo + estratto + link) tagliava
  il fondo — verificato con misure reali (Playwright) che a schermi non larghissimi il
  contenuto (immagine + testo) superava l'altezza reale del riquadro anche di 100+ px, e
  `overflow: hidden` nascondeva in silenzio il link "Vai alla meta" senza che si notasse.
  Passata da grid a flex: l'immagine si restringe fino a un minimo, il testo si prende lo
  spazio restante e — solo nei casi estremi — scorre al suo interno invece di sparire.
  Verificato che il link resti sempre raggiungibile su più larghezze (1440/1100/950/900px).

### Extra (fuori scaletta, chiesti il 10/08/2026 — terzo giro)

- [x] #20 — player audio proprio: completato (SoundCloud/YouTube già sostituiti ovunque nel
  sito in una sessione precedente). Redesign ulteriore del player condiviso
  (`web/src/app/shared/audio-player/`): nuovo layout "card" verticale con copertina grande
  (usato in apertura del Mondo Bianco) accanto alla pillola "line" di prima (liste come le
  Cuffiette); waveform reale via Web Audio API, generata solo al primo play effettivo per non
  aprire `AudioContext` inutili sulle pagine con più tracce; stato di caricamento che ignora un
  secondo click mentre il buffering è in corso (prima sembrava "non partire"); fix al
  trascinamento della barra di ricerca (il rilascio del puntatore si intercetta su tutta la
  finestra, non solo sull'input, che è troppo stretto per non uscirne durante un drag reale).
  Copertina di default condivisa (`audio-default-cover.webp`) per le tracce senza immagine
  propria. Non verificato visivamente in questa sessione (nessun tool browser disponibile):
  compilazione TypeScript pulita, asset e copertina confermati serviti via `curl`, resta da
  dare un'occhiata a occhio su `localhost:4201`.
- Miniature per la Bacheca dei Ricordi: generate (480px, script già esistente
  `scripts/build-bacheca-thumbnails.mjs`) e caricate su R2 per tutte le 130 foto, con
  `thumbKey` aggiunto a ognuna in `bacheca.json` (il supporto in `bacheca.ts`/`.html` era già
  presente da una sessione precedente, mancava solo l'esecuzione dello script). Verificato che
  un oggetto thumb esista davvero su R2 scaricandolo con `wrangler r2 object get`.
- [x] #a1 — colore del tema Notte (the-white-world) scurito di circa il 13% (`#17243a` →
  `#141f32`), leggermente più notturno senza perdere leggibilità — aggiornato in tre punti che
  devono restare identici (`:root`, l'override del tema in `themes.css`, il cielo in
  `world-atmosphere.css`, e lo swatch del selettore in `theme.service.ts`), altrimenti torna il
  lampo di colore sbagliato al primo paint (bug #12).
- [x] #a2 — le 150 stelle ora si affievoliscono e riaccendono (mai fino a sparire) invece di
  restare fisse — durata e ritardo dell'animazione randomizzati per stella in
  `world-stars.ts`, altrimenti pulserebbero tutte in sincrono (effetto palesemente finto).
  Rispettato `prefers-reduced-motion`. Solo il colore delle stelle cambia per tema come prima
  (es. Ocean, l'unico cielo diurno); opacità e animazione restano uguali ovunque.
  **Seguito (segnalato subito dopo la prima versione)**: il ciclo era troppo lento (3-7s) e il
  calo troppo lieve (fino al 55% dell'opacità base), praticamente impercettibile. Accorciato a
  ~0.9-1.9s e approfondito fino al 15%. Aggiunta anche una seconda animazione sull'alone
  (box-shadow) delle sole stelle "luminose", che ora cresce e si restringe in sincrono con il
  brillio invece di restare una macchia fissa — corretto di conseguenza anche
  `prefers-reduced-motion`, che senza un selettore esplicito su `.is-bright` non disattivava
  questa nuova animazione (specificità più alta della sola regola `.world-star`).
  **Altri due giri di feedback dopo aver visto il risultato a schermo**: troppo veloce →
  rallentato (durata raddoppiata 0.9-1.9s → 1.8-3.8s) e alone un po' più grande al picco
  (11px/3px → 14px/3.6px); ancora troppo veloce → durata raddoppiata di nuovo, 3.6-7.6s
  (ritardo scalato di conseguenza a 0-10s in entrambi i giri, per restare proporzionato al
  ciclo più lungo). Questa volta verificato a schermo da Rory, non solo dal CSS compilato.
- [x] #a3 — lanterne che salgono. Prima versione: solo nel tema Notte, 8 lanterne poche e
  distanziate nel tempo. Componente nuovo (`world-lanterns`), estratto anche il generatore di
  numeri casuali (prima duplicato identico in `world-stars.ts`) in un helper condiviso
  `shared/random.ts`.
  **Seguito, dopo aver visto una foto di riferimento (festa delle lanterne in Thailandia,
  cielo denso di lanterne calde)**: 8 erano troppo poche e troppo deboli. Salite a 36, più
  grandi (1.6-3.4rem), bagliore a tre strati (drop-shadow stretto+intenso, medio, largo e
  diffuso — uno solo sembrava finto). Rivista anche la scelta "solo tema Notte": Rory ha fatto
  notare che non ha senso legarle a un tema specifico, meglio un interruttore a sé. Vedi #a5
  qui sotto per l'infrastruttura condivisa che ne è nata. Non verificato a schermo in un
  browser reale in questa sessione: confermato via build di produzione (chunk/CSS compilati)
  e un test end-to-end con due account di prova sull'endpoint delle impostazioni.
- [x] #a5 — sfondi animati per gli altri temi, in parte: durante #a2 era emerso per caso che il
  brillio/alone delle stelle non è mai stato scoped al tema Notte — gira già su tutti e 5 i
  temi. Discutendo di #a3 (le lanterne "non possono stare sempre nel tema Notte"), invece di
  creare temi dedicati o proliferare varianti per tema, è nata un'idea più grande di Rory:
  una "stanza" del mondo dove attivare/disattivare gli effetti, **condivisa tra i due
  account** (non una preferenza per dispositivo come il tema) — chi accende/spegne qualcosa lo
  vede cambiare anche l'altro. Costruita l'infrastruttura: tabella `world_settings`
  (chiave/valore + chi l'ha toccata per ultimo), endpoint `/api/world-settings` (GET/POST
  autenticati, allowlist esplicita delle chiavi note), `WorldSettingsService` letto al
  bootstrap dell'app, nuova pagina `/impostazioni-mondo` con un toggle vero (checkbox nascosta
  + switch in CSS, accessibile da tastiera), raggiungibile come scorciatoia extra dal Mondo
  Bianco. Per ora l'unico interruttore è "lanterne" (non più legate a nessun tema); aggiungerne
  altri in futuro (es. per gli altri temi) è solo una riga in più nell'allowlist e nella
  pagina, non una nuova migrazione. **Non ancora fatto**: nessun effetto dedicato per i 4 temi
  diversi da Notte, solo l'infrastruttura per poterli aggiungere e renderli togglabili.
  Verificato end-to-end con due account di prova (poi ripuliti dal DB, sessioni/eventi
  compresi): il valore è davvero condiviso tra account diversi, non solo persistito per uno.
  **Migrazione applicata solo in locale** (`--local`): quella sul D1 di produzione
  (`--remote`) resta da fare a mano, non l'ha applicata Claude.
- [x] #a7 — secondo interruttore nella stanza appena costruita per #a5: le stelle nel cielo,
  prima sempre attive su ogni tema, ora spegnibili — stessa infrastruttura di #a5
  (`world_settings`, allowlist, `WorldSettingsService`), solo una nuova migrazione di seed
  (0023) e una riga in più nella pagina. Toggle della pagina reso generico
  (`toggleSetting(key, event)`) invece di duplicare il metodo che c'era solo per le lanterne.
  Verificato end-to-end con un account di prova (poi ripulito): default `true`, spegni/riaccendi,
  letto correttamente insieme a "lanterns" nella stessa risposta. Anche questa migrazione è
  applicata solo in locale, non sul D1 di produzione.
- [x] #a6 — terzo interruttore nella stanza: la luna, con la fase reale di oggi. A differenza
  di #a4 (la pagina "il cielo" pensata a parte, con un'API esterna vera) qui la fase è
  **calcolata**, non presa da un servizio esterno — un elemento di sfondo sempre presente su
  ogni pagina non deve dipendere dalla rete. Formula astronomica standard (riferimento noto di
  luna nuova + durata del mese sinodico, `shared/moon-phase.ts`), mappata su una delle 8 emoji
  di fase (🌑→🌘). Un solo elemento fisso in un angolo del cielo (non 150 come le stelle, non
  50 come le lanterne — la luna è una sola), bagliore freddo/argenteo per distinguerla dal
  caldo delle lanterne. Stessa infrastruttura di #a5/#a7 (migrazione 0024, allowlist, terzo
  toggle nella pagina). Verificato end-to-end con un account di prova (poi ripulito). Anche
  questa migrazione resta da applicare sul D1 di produzione.
  **Seguito, chiesto subito dopo**: Rory ha notato due macchie di luce statiche già presenti
  nel cielo di "the-white-world" (radial-gradient nella regola base di
  `world-atmosphere.css`) e ha chiesto di toglierle, visto che ora è la luna vera a fare da
  fonte di luce — poi ha esteso la richiesta a **tutti** i radial-gradient decorativi degli
  altri temi (Ocean compreso), non solo quelli del tema Notte: con luna/stelle/lanterne ora
  elementi veri e personalizzabili, un bagliore statico e non spegnibile restava "rumore"
  fuori dal loro controllo. Tolti da tutti e 5 i temi (rimane solo il gradiente lineare del
  cielo per ciascuno); rimossa anche `--world-glow`, la custom property diventata inutilizzata.
  **Secondo seguito**: la luna-emoji era "brutta e piccola", e mancava il selettore di fase
  scelta a mano che Rory aveva effettivamente chiesto fin dall'inizio (perso nel primo giro).
  Chiesto a Rory come vuole la resa prima di rifarla (sfera CSS con ombra reale vs. emoji
  grande) invece di indovinare senza poterla vedere — scelta la sfera. Ridisegnata come tre
  livelli CSS: un disco con sfumatura (per dare volume), una metà sempre scura (sinistra se
  crescente, destra se calante) e un'ellisse che si somma o sottrae a quella metà in base alla
  fase — geometria del terminatore lunare verificata numericamente (area scura attesa vs.
  ottenuta ai 4 punti cardinali e alle fasi intermedie) prima di scriverla, non "a occhio".
  Molto più grande (`clamp(4.5rem, 9vw, 8rem)` invece di un'emoji a 2.6rem). Aggiunto anche il
  selettore di fase mancante: `world_settings` ha ora una colonna `value` generica (migrazione
  0025, non solo per la luna: pensata per impostazioni future non booleane), popolata da un
  `<select>` nella pagina Impostazioni con "fase reale di oggi" più le 8 fasi scelte a mano —
  la stessa lista (`MOON_PHASE_LABEL`) è pensata per essere riusata da #a4 in futuro. Verificato
  end-to-end con un account di prova (poi ripulito): value preservato quando si cambia solo
  enabled, rifiuto di valori sconosciuti (400). Anche questa migrazione resta da applicare sul
  D1 di produzione.
  **Terzo seguito**: bagliore reso leggermente più luminoso (opacità e raggio dei due strati
  di drop-shadow alzati un po').
- [x] #a8 — tema condiviso tra i due account, non più una preferenza per dispositivo: quarto
  "interruttore" nella stanza (anche se qui `enabled` non ha senso ed è sempre `true`, conta
  solo `value` — stesso schema generico già usato per la fase della luna). Selettore spostato
  dalla barra utente (dove viveva in ogni pagina) alla pagina Impostazioni del Mondo, come
  card più grandi con il nome sempre visibile invece che a comparsa su hover — stesso
  componente `ThemeSwitcher` di prima, solo con un CSS diverso per il nuovo contesto (zero
  duplicazione, non un secondo componente). Le vecchie regole CSS compatte per la barra utente
  sono state rimosse (morte, nessuno le usa più). `ThemeService.applyTheme` distingue ora due
  tipi di persistenza (`persistLocal`/`persistRemote`): la scelta dell'utente aggiorna
  entrambe, la sincronizzazione dal server all'avvio (`applySharedTheme`, chiamata dopo
  `WorldSettingsService.load()`) aggiorna solo la cache locale senza rimandarla al server da
  cui è appena arrivata. `localStorage` resta com'era pensato: solo la cache che lo script
  inline in `index.html` legge prima del primo paint, non più la fonte di verità — quindi il
  fix del bug #12 (lampo di colore sbagliato) resta intatto. Nessun polling/WebSocket, come
  specificato: l'altro account vede il cambio al prossimo caricamento/navigazione. Verificato
  end-to-end con un account di prova (poi ripulito) e con una build di produzione pulita.
  Anche questa migrazione (0026) resta da applicare sul D1 di produzione.
- [x] #a4 — pagina minimale "Il Cielo" (`/il-cielo`): solo la luna, grande e centrata, con la
  stessa fase condivisa scelta in Impostazioni del Mondo (auto o manuale — stessa regola,
  `resolveMoonPhaseFraction`, non due implementazioni). Stelle e lanterne di sfondo non
  richiedevano nulla di nuovo: sono già globali (`app.html`), presenti su ogni pagina compresa
  questa. Nessuna API esterna, come specificato — riusa il calcolo locale già esistente.
  Lavoro principale: estratta la sfera della luna (disco + ombra a falce/gibbosa) dal
  componente di sfondo `world-moon.ts` in un componente a sé, `MoonDisc`
  (`shared/moon-disc.ts` + `styles/components/moon-disc.css`), senza posizionamento né
  dimensione propri — riempie sempre il contenitore di chi la usa. `world-moon.ts` (piccola,
  fissa in un angolo, su ogni pagina) e la nuova pagina (grande, centrata) sono ora due
  contesti diversi che riusano lo stesso identico componente invece di duplicare la geometria
  del terminatore lunare una seconda volta. Aggiunta anche una scorciatoia extra dal Mondo
  Bianco (🌌), come le altre non ufficiali.
  **Seguito, dopo feedback di Rory sulla prima versione**: la pagina rispettava ancora la fase
  scelta a mano — corretto, qui la fase è sempre quella reale di oggi, la personalizzazione è
  un'altra pagina (Impostazioni del Mondo). Layout rifatto da zero, "molto più minimale":
  niente hero, niente link, niente etichetta di fase — solo un piccolo titolo e la luna. Trovati
  (stavolta con uno screenshot vero via Playwright, non solo build/curl — installato al volo,
  autenticazione simulata con un cookie di sessione + le chiavi sessionStorage della Chiave)
  due bug reali che senza vederli sarebbero rimasti: il titolo era in `position:absolute` e si
  agganciava al contenitore dell'header della shell invece che al proprio, sovrapponendosi
  illeggibile; e `:host{display:flex}` restringeva l'intera `<app-shell>` (un fratello nel
  flusso, non contenuto interno) alla larghezza del solo contenuto invece di restare piena.
  Corretto tornando a `:host{display:block}` (come ogni altra pagina) e a un titolo in flusso
  normale, mai assoluto. Altri due giri di rifinitura dopo aver visto lo screenshot: la luna
  centrata a metà pagina spostata più in alto, con vuoto sotto ("è una luna, sta in cielo"); il
  titolo, prima una piccola etichetta maiuscola smunta, passato al font serif dei titoli
  poetici del sito. Nascosta anche la luna piccola di sfondo su questa pagina
  (`body.sky-view-page .world-moon{display:none}`): con quella grande al centro sarebbero
  state due lune insieme. Verificato a schermo (desktop e mobile) prima di consegnare, non solo
  con build/curl come nel resto della sessione.
- [x] #b3-a (primo dei quattro) — brillantini per il tema Red of You: componente nuovo
  `world-sparkles.ts`, puntini che lampeggiano rapidi e vanno a zero (a differenza del brillio
  delle stelle, che scende senza mai sparire) — un vero luccichio intermittente, non le stelle
  ricolorate. Visibile solo col tema Red of You attivo. Verificato a schermo con Playwright a
  ogni giro, non solo build/curl.
  **Due giri di feedback dopo averli visti dal vivo**: colore scaldato da rosa tenue a
  oro/rosa (troppo simile alle stelle in uno screenshot fermo) — poi corretto di nuovo a
  bianco puro su richiesta di Rory (l'oro non andava bene), quantità alzata da 70 a 100.
  Aggiunto anche l'interruttore condiviso in Impostazioni del Mondo, mancante nella prima
  versione (gated solo sul tema, ragionamento sbagliato): Rory ha chiarito che **ogni** nuovo
  effetto deve avere il proprio interruttore, non solo quelli "neutri" come stelle/lanterne/
  luna — regola da applicare anche ai prossimi tre temi. Stesso schema di sempre: chiave
  "sparkles" in `world_settings` (migrazione 0027), allowlist, toggle nella pagina — le due
  condizioni (tema attivo + interruttore acceso) si sommano nel componente.
  **Completati anche gli altri tre**, stesso schema (componente + toggle condiviso, migrazione
  0028 per tutte e tre le chiavi insieme): `world-leaves.ts` per Green of Me, sagome scure e
  semitrasparenti (`filter: brightness(0)` sull'emoji 🍃, non foglie colorate — l'idea è
  l'ombra, non la foglia) che cadono ruotando nel vento; `world-shells.ts` per Ocean, uniche a
  muoversi in orizzontale (attraversano lo schermo, non cadono/salgono come gli altri tre),
  emoji 🐚 scaldata verso l'arancione con un filtro CSS (il colore base è rosa/crema);
  `world-petals.ts` per Velvet, stessa meccanica delle foglie ma più lenta e morbida, colore
  pieno (non ombre — qui sono davvero petali, emoji 🌸), idea di Claude non ancora confermata
  da Rory ma già costruita. #b3-a è così completo: un effetto per ognuno dei 4 temi non-Notte,
  ognuno col proprio interruttore.

  **Bug grave trovato dopo, con #b3-b**: la home del Mondo Bianco è risultata completamente
  vuota — collisione di nomi CSS. La singola conchiglia si chiamava `.world-shell`, ma quel
  nome era già preso: `mondo-bianco.html` passa `shellClass="world-shell"` ad `AppShell` per
  il proprio contenitore principale ("shell" nel senso di involucro, non conchiglia). Le
  regole delle conchiglie (`opacity:0` di partenza, un filtro colore pesante) si applicavano
  per errore all'intera pagina. Trovato solo grazie a uno screenshot vero (build/curl non lo
  avrebbero mai mostrato: DOM e stili computati sembravano corretti, il problema era solo nel
  risultato visivo finale) — rinominata in `.world-seashell`, e ricontrollati tutti gli altri
  nomi introdotti in questa sessione per lo stesso rischio.

  **#b3-b, fatto insieme al resto**: rimosso il vincolo "solo su quel tema" da tutti e quattro
  gli effetti (Rory: i temi sono preset che consigliano/accendono un effetto di default —
  `THEME_DEFAULT_EFFECT` in `theme.service.ts`, si attiva solo quando è davvero una scelta
  della persona, non nella sincronizzazione — ma restano comunque disponibili su qualunque
  tema). Pagina Impostazioni riorganizzata in gruppi per tema ("Su ogni tema", "Consigliato
  per X"); avviso ⚠️ su luna/stelle quando il tema attivo è diurno (oggi solo Ocean).

  **Altro giro di feedback dal vivo**: le conchiglie non piacevano — sostituite da onde del
  mare vere (`world-waves.ts`), tre livelli SVG sovrapposti con un loop orizzontale perfetto
  (pattern ripetuto due volte, `translateX` da 0 a -50%, il punto di ricongiungimento non si
  vede mai) invece di un elemento decorativo sparso. Le foglie non piacevano (l'emoji 🍃 mostra
  due foglioline insieme, e lo zig-zag laterale sembrava un vento brusco): passate a 🍂 (una
  sola foglia) con una deriva morbida in un'unica direzione invece di cambiare verso due volte.
  I fiori di Velvet sono diventati selezionabili (come la fase della luna: value in
  `world_settings`, non solo enabled) tra tre forme — fiori rosa (🌸), margherite (🌼, sbiancate
  con `filter: grayscale + brightness`, di serie hanno il centro giallo) e petali di rosa veri
  disegnati in CSS puro (border-radius asimmetrico, nessuna emoji di petalo esiste in Unicode)
  — o "mix" di tutte e tre. Velvet stesso schiarito un po' (bg-color e cielo, ~40% più chiari):
  aveva perso il bagliore ambientale tolto in un giro precedente e si leggeva quasi nero piatto
  invece che "viola scuro". Verificato tutto a schermo con Playwright su tutti e 5 i temi
  insieme (stelle/luna/lanterne/brillantini/foglie/onde/fiori tutti accesi contemporaneamente)
  prima di consegnare, non solo build/curl. Migrazione 0029 (sostituisce "shells" con "waves",
  mai arrivata in produzione) applicata solo in locale.

  **Ultimo giro, tre correzioni insieme**: Rory aveva chiarito meglio cosa intendeva con
  "preset" — non solo accendere l'effetto del tema scelto lasciando invariato il resto, ma un
  vero preset esclusivo ("tipo ocean disattiva tutto tranne mare"). `THEME_DEFAULT_EFFECT` è
  diventato `THEME_PRESET` in `theme.service.ts`: quando la scelta del tema è davvero della
  persona (`persistRemote` non forzato a `false`, quindi non la sincronizzazione dal server né
  l'applicazione della cache locale all'avvio), scorre tutte le chiavi effetto e le accende o
  spegne secondo il preset del tema — non solo la propria. Restano comunque libere da
  riaccendere o mescolare a mano dopo: il preset decide solo il punto di partenza.
  Di conseguenza l'avviso ⚠️ "poco senso su un cielo diurno" è diventato superfluo (scegliere
  Ocean spegne comunque luna/stelle da solo) ed è stato tolto, insieme al gruppo "Su ogni
  tema" che leggeva stonato accanto a quell'avviso: ora è "Consigliato per Night Sky", uguale
  agli altri quattro gruppi, con un'unica nota in cima alla sezione che spiega il
  comportamento esclusivo dei preset invece di ripeterla group per group.
  Anche la margherita (prima l'emoji 🌼 sbiancata con un filtro grayscale, effetto "in bianco e
  nero" che non piaceva) e il petalo di rosa (prima colore rosa/magenta, poi corretto in rosso
  vero, ma con la forma — un div con border-radius asimmetrico — che non convinceva comunque)
  sono passati a un vero SVG disegnato, stesso trattamento della luna (`MoonDisc`): il primo
  tentativo di petalo era due lobi simmetrici che a schermo si leggevano come un cuoricino
  invece che come un petalo — corretto con un contorno a goccia con una sola punta, niente
  doppio lobo, per non somigliare a un cuore. Stesso trattamento per le foglie: dall'emoji 🍂
  filtrata a un profilo SVG a punta singola con una vena centrale — "non sono singole, userei
  un CSS o SVG" era il punto di Rory. Verificato di nuovo tutto a schermo con Playwright,
  passando esplicitamente per ogni tema dal selettore reale (non impostando `world_settings`
  a mano) per controllare l'esclusività del preset, più un rendering isolato dei tre SVG
  (foglia, petalo, margherita) a dimensione grande per controllare le sole forme senza
  l'animazione. Nessun errore in console, nessuna nuova migrazione necessaria.

  **Due ritocchi finali**: centro della margherita passato da avorio tenue (troppo spento) a
  giallo acceso. Caduta delle foglie passata da una deriva a senso unico a un mezzo zig-zag —
  un solo cambio di direzione a metà caduta, non l'oscillazione ripetuta scartata in un giro
  precedente perché sembrava vento. Verificato tracciando la posizione orizzontale di una
  foglia nel tempo (sale e poi scende, confermando l'inversione) e con uno screenshot dal vivo.

- [x] #c2 — pesci per Ocean: nuovo effetto `world-fish.ts`, a differenza degli altri non cade
  né sale nel cielo ma nuota in orizzontale — metà degli esemplari verso destra, metà verso
  sinistra, con un lieve dondolio verticale durante la traversata, in una fascia bassa dello
  schermo sopra il livello delle onde. Due forme disegnate in SVG (nessuna emoji era
  abbastanza chiara): polpo (cupola piena + cinque tentacoli in stroke) e pesce rosso (corpo
  pieno + due pinne triangolari), selezionabili — o "mix" — come per i fiori di Velvet. Stesso
  schema di sempre: chiave "fish" in `world_settings` (migrazione 0031, applicata solo in
  locale), allowlist, toggle + selettore forma in Impostazioni, aggiunto al preset di Ocean
  insieme alle onde. Verificato compilazione e build puliti, nessuna collisione di nomi CSS, e
  la meccanica di nuoto/direzione/dondolio in una pagina isolata (non nell'app vera: mentre
  lavoravo `world_settings` mostrava segni di uso reale in corso — cambio tema e alcuni
  interruttori spenti negli ultimi minuti — quindi ho evitato di toccare l'account condiviso
  per non interferire). **Da vedere dal vivo appena possibile** per confermare a schermo vero.

### Bug chiusi

- [x] Scroll che restava fermo cambiando pagina — mancava `withInMemoryScrolling` nel router
  (`web/src/app/app.config.ts`).
- [x] Card del calendario senza colore mese — `--calendar-green`/`--calendar-red` erano su
  `.calendar-page` (pensato per il `<body>`), ma il CSS di pagina è scoped al componente da
  quando è uno `styleUrl`; spostate su `:host` (`web/src/styles/pages/calendar.css`).
- [x] La conferma della Chiave (`isAccessUnlocked`) non scadeva quasi mai: viveva in
  `sessionStorage`, valido finché la scheda del browser resta aperta — ma su mobile (o
  riscrivendo sempre l'indirizzo nella stessa scheda) la scheda non si "chiude" mai davvero, e
  la Chiave non veniva più richiesta anche a distanza di giorni. Ora scade dopo un'ora di
  inattività reale, non da quando è stata data: si rinnova navigando (`authGuard`) e
  interagendo con la pagina (`App`), così non chiede mai la Chiave a metà di un uso attivo.
- [x] **Bug grave, preesistente**: i form con `(ngSubmit)` in `Lettere`, `Suggerimenti`,
  `Storie` e `Avventura` non hanno mai funzionato — nessuno dei loro componenti importava
  `FormsModule`, quindi la direttiva `NgForm` di Angular non era mai attiva e `(ngSubmit)`
  non si legava a niente. Il click su "invia" faceva submit nativo del browser (GET alla
  pagina corrente con i campi in query string, tipo `?body=...`), niente arrivava
  all'endpoint. Scoperto perché Rory ha segnalato che una domanda scritta nella nuova pagina
  Domande non appariva da nessuna parte — il DB era davvero vuoto anche dopo l'invio.
  Verificato con un click reale via browser automatizzato (non con `curl -F`, che bypassa il
  form e quindi non l'avrebbe mai fatto emergere): prima del fix l'URL cambiava in
  `/domande?questionText=...` e nessuna `POST` veniva mai inviata; dopo il fix `POST
  /api/questions` parte correttamente e l'URL resta pulito. Aggiunto `FormsModule` a tutti e
  cinque i componenti (incluso il nuovo `Domande`/`QuestionCard`, che avevano lo stesso
  problema). Prima di questo non era mai stato verificato nessun invio di form tramite un
  click reale del browser in nessuna sessione precedente — solo tramite chiamate dirette
  all'API, che aggirano il problema.

### Extra (fuori scaletta, chiesti durante la Fase B)

- [x] #31 — occhiolino "mostra password" nel Portone: un solo campo condiviso da login e
  registrazione, quindi un solo toggle copre entrambi. Icona rifatta con un design pulito
  (Feather-style) dopo segnalazione che quella iniziale era storta.
- [x] #32 — calendario: aggiunto l'1 luglio 2026 (esame di maturità + mazzo di rose con la
  lettera), ora 29 date.
- [x] #30 — favicon rifatta: il cuore su tessera crema non c'entrava con nient'altro nel sito.
  Sostituito con un cerchio rosso infuocato su cielo notturno, coerente col ⭕ usato in ogni
  header e con "il cerchio" della canzone. Stesso file riusato anche come sigillo decorativo
  sulla card del Portone (`portone-seal`), verificato che stia bene anche lì.

### Extra (fuori scaletta, chiesti il 10/08/2026)

- [x] Icona del Pozzo dei Dubbi: il secchio 🪣 non piaceva. Sostituito con ⛲ (fontana) sia
  nella tile del Mondo Bianco sia nel titolo della pagina `/domande`.
- [x] Messaggio Criptato: la nota con le istruzioni usava `.card--handwritten` (la superficie
  "lettera scritta a mano"), fuori posto per un testo che non è una lettera — passata alla
  card normale, tolto il font serif corsivo. Aggiunto un nuovo blocco con il link originale
  (cifrato con Cesare, `Messaggio criptato/Link originale.md` nella root del repo — non era
  ancora arrivato sul sito) accanto al titolo cifrato.
- [x] Lettere: il testo scritto a mano usava Georgia corsivo, un serif finto che "non sembra
  per niente scritto a mano". Sostituito con Caveat, un vero font corsivo (SIL OFL,
  self-hosted in `web/public/fonts/`, variable font — un solo file copre tutti i pesi), estratto
  in una classe condivisa `.handwritten-text` (`cards.css`) e riusato anche dalla lettera
  finale del cruciverba e dal Linguaggio Segreto, non solo da Lettere.
  - Lettere lunghe non scorrono più in verticale dentro il foglio: il testo si dispone in
    colonne CSS larghe quanto il riquadro (una colonna = una pagina) e si sfoglia con due
    frecce e un'animazione di scorrimento, invece di un semplice `overflow-y: auto`. Il
    numero di pagine si ricalcola da solo al resize e quando il font Caveat finisce di
    caricare (le metriche del testo cambiano leggermente rispetto al fallback).
- [x] Mappa — puntina "etichetta tagliata" al bordo: la Thailandia (coordinate reali, non
  scelte apposta) proietta a x≈74% sulla mappa; l'etichetta al hover apriva sempre verso
  destra e usciva dal contenitore scrollabile, restando tagliata a metà ("Thai…"). Prima
  ancora, un bug distinto rendeva invisibile anche il fix già previsto per questo: il CSS
  puntava a `.map-pin[data-destination-id="prossima-meta"]` ma il template non scriveva mai
  quell'attributo (selettore morto, stesso tipo di bug delle cuffiette in Fase C). Risolto in
  modo generale invece che per quel solo id: `mappa.ts` calcola per ogni puntina se aprire
  l'etichetta a sinistra (`pin.x >= 70`), così qualunque destinazione futura vicina al bordo
  ne beneficia. La puntina "prossima meta" (coordinate `null`) è stata anche ricentrata: prima
  cadeva in basso a destra per un fallback hardcoded (`{x:89, y:87}`), rischiando di passare
  inosservata; ora è al centro (`{x:50, y:50}`).
- [x] Mappa — il diario di viaggio ora supporta la sequenza "paragrafo da solo, immagine+testo,
  testo+immagine, ..." richiesta: un paragrafo senza foto agganciata occupa tutta la larghezza
  invece di lasciare una colonna vuota, e una foto può avere `"position": "after"` in
  `map.json` per comparire sotto il testo invece che sopra (di default resta sopra).
- [x] Ambiente di sviluppo: il frontend (`ng serve`) partiva sulla porta di default 4200,
  rischiando conflitti con altre istanze già aperte (successo più volte in questa sessione).
  Fissata a `4201` in `web/angular.json`; una sessione Claude che deve avviare una propria
  istanza per verifiche usa `4202` (mai 4201, per non toccare un server già aperto
  dall'utente). Il backend resta condiviso su `8788` per entrambi, non ha senso duplicarlo.
  Aggiunto `npm run dev` (`scripts/dev.sh`) per avviare backend+frontend con un solo comando;
  dettagli in `README.md`.

### Fase A — Quick win (COMPLETATA)

- [x] #12 — bug bottone rosso poi verde al caricamento: il tema salvato veniva applicato solo
  in `Portone.ngOnInit`, dopo il primo paint di Angular — su ogni altra pagina (o refresh
  diretto) restava sempre il tema di default finché il JS non girava. Aggiunto uno script
  inline in `web/src/index.html` che applica il tema da `localStorage` prima del primo paint,
  e centralizzata la chiamata a `ThemeService.applySavedTheme()` in `App` (non più solo nel
  Portone).
- [x] #10 — lettera finale alla fine del cruciverba: non è più il dialog generico "Cruciverba
  completato", ora è un vero fogliettino di carta (stessa superficie `.card--handwritten`
  condivisa con Lettere) al posto del messaggio. Testo invariato (già esistente), solo la
  presentazione è cambiata — vedi `crossword-modals.html`.
- [x] #8 — selettore temi: ogni pallino ha ora un'icona (🌙🌊💜❤️💚) sempre visibile e il nome
  del tema come piccola etichetta a comparsa su hover/focus (non più solo il `title` nativo,
  lento/inconsistente e assente su touch).
- [x] #29 — calendario: aggiunto il 20 maggio 2026, "La rinascita di Fuochetto"
  (`web/public/content/calendar.json`, ora 28 date).

### Fase B — Fondamenta visive (COMPLETATA)

- [x] #1 — temi coerenti: i colori di testo hardcoded (`#f4f7fb`, `#d1dde6`, `#b8cad9`, ripetuti
  identici su tutte le pagine) sono ora `var(--text-color)`/`var(--muted-color)`, quindi
  cambiano davvero con il tema — verificato che il colore effettivo cambi passando a
  "red-of-you".
  - **Seguito (segnalato dall'utente dopo la prima passata)**: erano rimaste ~25 sfumature di
    blu-grigio quasi identiche ma non esattamente uguali (`aebfcd`, `d8e2eb`, `c3d1dc`, ecc.),
    scritte a mano leggermente diverse pagina per pagina nel tempo — stesso ruolo di testo
    secondario, mai toccate dal cambio tema. Mappate anche queste su `var(--muted-color)`/
    `var(--text-color)`. Lasciati fuori di proposito: oro degli accent (`.btn-accent` e affini,
    già annotato come fuori perimetro in `buttons.css`), testo su carta chiara (card del
    calendario, `card--paper` del mappamondo, la lettera finale del cruciverba — lì il
    muted-color chiaro sarebbe illeggibile), e i verdi semantici di successo nei GDR.
  - Restano fuori (intenzionalmente) anche i bordi/sfondi `rgba(255,255,255,.XX)` sparsi: non
    variano per tema oggi, un giro dedicato in un secondo momento se serve davvero.
- [x] #13 — stile unificato bottoni/card: già in buona parte fatto durante la componentizzazione
  (`.btn`, `.card`, `.card--*` condivisi, usati in 9 pagine su 16); non ho trovato duplicazioni
  vistose da normalizzare oltre a quello.
- [x] Cielo/atmosfera per tema (chiesto il 09/08/2026): le stelle in realtà c'erano già su
  tutti i temi (150 ovunque, mai limitate a "the-white-world"), ma il cielo restava sempre lo
  stesso blu notte — `themes.css` aveva già un gradiente diverso per ogni tema ma non si è mai
  visto: `body.world-atmosphere` (in `world-atmosphere.css`) ha la stessa specificità e carica
  dopo, quindi vinceva sempre lui. Spostati i 4 gradienti (velvet/sea/red-of-you/green-of-me)
  dentro `world-atmosphere.css`, dove ora sono davvero applicati — verificato con screenshot
  che ogni tema ha un cielo genuinamente diverso (viola scuro, verde bosco, verdemare chiaro
  di giorno, vinaccia). Sea è chiaro invece che notturno: stelle scurite per restare visibili.
  "The-white-world" invariato (è il cielo storico del sito). Altri effetti (oltre al cielo)
  rimandati, come richiesto.

### Fase C — Redesign di pagina (dopo la Fase B, per non rifarle due volte)

- [x] #3 — bacheca dei ricordi: indice in cima impilato un blocco per mese/incontro
  (Settembre, poi Maggio, poi "Extra" con I video/Altre cose affiancate), ciascuno con una
  vera griglia di giorni sotto — i dati erano già organizzati così, mancava solo la
  presentazione (prima una fila piatta di pillole centrate). Le foto con didascalia (poche,
  scelte) diventano card grandi a piena larghezza con il testo subito sotto; quelle senza
  descrizione restano un filmino compatto di 2-3 per riga. I due link YouTube della pagina
  (prima bottoni "apri contenuto esterno", mescolati ai video Drive) sono ora incorporati
  come player veri e piccoli (~24rem), stesso pattern privacy-enhanced di Storie/Mappamondo.
  Tutto verificato con screenshot reali su un account di prova (poi ripulito dal DB).
- [x] #6 — i ponti: la pagina era un elenco di vecchi Google Doc pre-lancio, resa obsoleta da
  Lettere. Non ho cancellato nulla di reale (i 3 link Drive funzionano ancora) — "La Cassetta
  delle Lettere" è ora la card in evidenza, i vecchi ponti sono raccolti in un pannello
  richiudibile secondario ("I ponti di prima, da quando vivevamo ancora su Drive").
- [x] #7 — cuffiette: traccia bonus. Causa trovata: il CSS puntava a `#bonus-audio`, un id che
  non esiste da nessuna parte nel template (selettore morto) — il player nativo del browser
  era quindi completamente senza stile, una pillola bianca larga ~300px in mezzo a una pagina
  scura. Stesso pattern "rivela al click" già usato per le 9 canzoni (bottone dorato, mai
  autoplay) e `color-scheme: dark` sull'elemento audio così anche il widget nativo, una volta
  rivelato, si vede scuro invece che nel tema chiaro di default del browser.
- [x] #9 — centralizzare di più le lettere: cercato ogni `routerLink="/lettere"` nell'app,
  trovato **un solo** punto d'ingresso in tutto il sito (dentro I Ponti, pagina di per sé poco
  visibile). Aggiunta una scorciatoia diretta sotto la griglia dei luoghi nella home del Mondo
  Bianco — non una nona card: la griglia ha un vincolo esplicito nel codice ("restano
  esattamente otto") lasciato apposta intatto.
- [x] #11 + #17 — accorciare la navigazione dei GDR / navigazione responsive: aggiunta
  un'icona "casa" fissa nella userbar (tutte le pagine tranne il Mondo Bianco stesso) che porta
  dritti lì in un click, invece dei 4 passaggi precedenti (avventura → il prezzo della verità →
  gdr → tavolo da gioco → mondo bianco). Verificato anche su mobile: nessun overflow.
  - **Bug trovato per strada**: la navigazione a 3 link tra Avventura/La Tua Maga/I Tuoi
    Appunti (`IpdvNavigation`) era senza stile da quando è stata estratta in un componente
    condiviso — i link blu sottolineati di default del browser, non le pillole previste. Stesso
    tipo di bug della card del calendario (Fase A/B): il CSS restava nel file di pagina invece
    che nello `styleUrl` del componente, quindi l'encapsulation di Angular non lo faceva mai
    arrivare a destinazione. Controllati anche gli altri componenti condivisi (dialog,
    form-status, header, userbar, back-link): usano tutti CSS già globale, nessun altro caso.
- [x] #5 — mappamondo: le 7 card-scena e il box della canzone usavano `card--paper` (carta
  bianca opaca), l'unica pagina a farlo insieme al calendario — stonava col resto del sito.
  Passate alla `.card` condivisa (stessa di mondo-bianco/bacheca/ponti/ecc.), compresa la card
  finale che aveva un bordo colorato dedicato, tolto per allinearla alle altre. Le etichette
  R:/D: erano blu/mogano scuri pensati per leggersi su carta chiara: ora verde/rosso fissi
  (non `var(--focus-color)`, il colore identifica chi parla e non deve cambiare con il tema) —
  riusati colori già presenti nel sito, non nuovi: verde = `--correct-color` di :root, rosso =
  `--active-color` del tema "red-of-you".

### Fase D — Feature nuova (tocca anche il backend)

- [x] #2 — pagina profilo: nuova `/profilo` (link dal saluto in userbar) con due form
  indipendenti, nickname e password. Cambio password richiede quella attuale come conferma
  (403 se sbagliata); la precedente viene loggata in `events` (`section: "auth"`,
  `event_type: "password_changed"`, `metadata.previousPassword`) **prima** dell'update e
  in modo atteso, non fire-and-forget come gli altri eventi — se il log fallisce il cambio
  non avviene, così il ricordo non si perde mai in silenzio. Password restano in chiaro nel
  DB come richiesto esplicitamente, nessun hashing aggiunto. L'occhiolino mostra/nascondi
  password, prima solo dentro Portone, è stato estratto in un componente condiviso
  (`app-password-field`) usato ora da entrambe le pagine invece di duplicarlo — Portone
  aggiornato di conseguenza, stesso comportamento visivo (verificato con screenshot). Nessuna
  nuova migrazione: riusata la tabella `events` già esistente.
- [x] #28 — pagina domande: item rimasto orfano nel backlog dettagliato, mai smistato in
  nessuna fase — trovato rileggendo tutto il file. Nuova `/domande` (nuova tabella
  `questions`, migrazione `0021`), simmetrica: chiunque dei due può chiedere o rispondere,
  non si può rispondere alla propria domanda. Domanda e risposta si possono modificare, ogni
  modifica logga il testo precedente in `events` **prima** di scrivere l'update (stesso
  schema del cambio password: se il log fallisce, la modifica non avviene) — verificato
  davvero rinominando temporaneamente la tabella `events` per forzare il fallimento e
  controllando che la riga in `questions` restasse intatta. Estratta `normalizeRequiredText`
  (prima locale solo a `letters.js`) in un helper condiviso (`functions/api/_shared/text.js`)
  invece di duplicarla. Ogni domanda in lista ha il proprio stato di invio indipendente
  (componente `QuestionCard` con una `FormSubmission` propria via DI, non condivisa tra le
  righe). Raggiungibile da Ponti e da una scorciatoia extra nel Mondo Bianco, come Lettere.
  Verificato end-to-end con due account di prova (poi ripuliti dal DB): permessi, log
  dell'evento precedente, e rendering reale della pagina.
- [x] Riorganizzazione Lettere/Domande (richiesta di Rory): nel mondo devono starci solo
  luoghi fisici, non "Lettere"/"Domande" come concetti astratti. Tolte le loro card da Ponti
  (che ora è solo un elenco di metodi per comunicare, non un luogo). "Le Lettere" diventa
  ovunque "La Cassetta delle Lettere" (📫); "Le Domande" diventa "Il Pozzo dei Dubbi" (🪣,
  idea di Rory — un pozzo da cui pescare i dubbi), col testo della pagina adattato al tema
  del pozzo. Restano raggiungibili come scorciatoie extra nella griglia del Mondo Bianco
  (fuori dagli otto luoghi ufficiali), non più da Ponti. Nessun cambio di route/tabelle,
  solo testo e collocazione visibili.

### Fase F — Troppo vaghi per partire, serve scoping veloce insieme

- [x] #22 — linguaggio segreto: scoping fatto in conversazione (contenuto vero fornito da
  Rory: tabella simboli a 6 categorie, i 5 cuori rossi = "ti amo"). Nuova pagina
  `/linguaggio-segreto`, raggiungibile da una quinta card nei Ponti ("un altro ponte per
  comunicare in codice", idea di Rory) invece che nascosta dietro un easter egg — scartato
  sia l'unlock segreto sia metterla dentro la Bacheca. Testo introduttivo e messaggio in
  codice (`. & ... <>`) sono un abbozzo scritto da Claude su richiesta esplicita di Rory
  ("scrivi lo tu per adesso"), segnalato con commento nel codice, da riscrivere quando vuole.
  Verificato con screenshot: tabella e testo leggibili sia sul pannello scuro sia sulla carta
  scritta a mano (due bug di contrasto/spaziatura trovati e corretti prima di consegnare).
- [x] #21 — messaggio criptato: nuova pagina `/tavolo-da-gioco/messaggio-criptato`, sua
  sezione a sé (non nascosto dentro un gioco esistente, come richiesto). Contenuto reale
  fornito da Rory (cartella `Messaggio criptato/` alla radice del repo, export Notion): 5
  blocchi B1-B5 in cifrario a sostituzione + più blob AES (titolo, "utili", un aiuto per
  blocco) da decifrare con un tool esterno (browserling AES Decrypt) e una password unica.
  Vista la fragilità di un cifrario (un carattere sbagliato lo rompe), il contenuto è stato
  estratto in modo **programmatico** dall'HTML originale invece che ritrascritto a mano, e
  verificato byte per byte (tutti i 10 blob AES unici e i 5 paragrafi cifrati coincidono
  esattamente) prima di scrivere la pagina definitiva. Nessuna verifica automatica nel
  sito: si decifra fuori, con lo strumento esterno indicato nel testo originale.
- [x] Menu di `app-select` (selettore condiviso, usato per fase luna/forma fiori/forma pesci
  in Impostazioni del Mondo) a volte del tutto trasparente e apparentemente "dietro" le card
  successive. Non era un problema di z-index (verificato con `elementFromPoint`: il menu è
  sempre stato correttamente sopra) — il menu si appoggiava per intero a `backdrop-filter:
  blur(22px)` su uno sfondo quasi trasparente (`--panel-color`, 5% alpha) per essere leggibile;
  annidato dentro una `.card` che ha già il suo `backdrop-filter`, il blur a volte non compone
  (browser headless sempre, hardware reale a volte), lasciando uno sfondo praticamente
  invisibile attraverso cui si leggeva a fuoco il contenuto sottostante — sembrava dietro
  perché in pratica ci si vedeva attraverso. Stesso fix già usato da `.card--dialog` per lo
  stesso motivo: sfondo quasi opaco via `color-mix(var(--bg-color), var(--text-color))`,
  niente più backdrop-filter da far dipendere dalla composizione GPU. Verificato con uno
  script isolato (stessa struttura card+select, non l'app vera: `world_settings` mostrava
  ancora segni di uso reale) che riproduceva il bug esatto e confermava la correzione, più un
  confronto visivo su tutti e 5 i temi.
- [x] CMS (`planning editor contenuti.md`, Fase 2 — identità, ruoli e sicurezza): prima fetta
  concreta su `feature/content-editor`. Migrazioni 0033 (`identity`/`role` su `users`, default
  `lei`/`member`, promozione esplicita a `lui`/`admin` solo per l'email di Rory — Desy non si è
  ancora registrata, quindi non c'era un secondo indirizzo da promuovere) e 0034
  (`admin_mode_enabled` su `sessions`, non su `users`: la Modalità admin dura per la sessione,
  non è un permesso permanente). `functions/api/_shared/permissions.js` con la mappa
  ruolo→permessi dal documento; `getAuthenticatedSession` ora porta anche identity/role/
  adminModeEnabled, così ogni endpoint futuro può controllarli senza una query in più.
  Endpoint `auth/admin-mode` (solo role "admin") per accenderla/spegnerla, con evento di audit.
  Frontend: `AuthService` espone `isAdmin`/`adminModeEnabled`; interruttore "Modalità admin" in
  Profilo, visibile solo a chi ha già role admin — nessun controllo lato client sostituisce
  quello del backend, è solo per non mostrare un controllo inutile a chi non può usarlo.
  Riusato l'interruttore di Impostazioni del Mondo invece di ricostruirne uno: estratto in
  `styles/components/toggle-switch.css` (prima duplicato sarebbe stato in due file di pagina,
  contro la regola di zero duplicazione), aggiunto alla lista `styles` globale di
  `angular.json` — che ha richiesto un riavvio del dev server per essere raccolta (le nuove
  voci in quell'array non si ricaricano a caldo). Verificato con due account di prova (uno
  member, uno promosso admin a mano in locale): il riquadro non compare per member, compare e
  funziona per admin, lo stato sopravvive a un refresh perché letto dal server. Non è un bug
  ma buono da sapere: uno screenshot a pagina intera di Playwright su questa pagina mostrava
  uno strappo chiaro sotto la piega — artefatto noto di `background-attachment: fixed` con le
  catture "fullPage", sparito con uno screenshot normale su viewport scrollato; il sito vero
  non ne risente. **Restano da fare, non toccate in questo giro**: Fase 1 (inventario di tutti
  i contenuti), Fase 3 (tabelle `content_entries`/`content_versions` e le loro API), Fase 5+
  (editor vero e proprio, versionamento, pagina dei log). Migrazioni applicate solo in locale.
- [x] CMS (`planning editor contenuti.md`, Fase 3 — fondamenta del CMS): su
  `feature/content-editor`. Migrazione 0035 con `content_entries` (valore corrente, letto da
  `body` per i contenuti `replace` o da `current_version_id` per quelli `history`) e
  `content_versions` (cronologia, popolata solo per `history`). API in `functions/api/content/`:
  `GET/POST /api/content` (lista per il futuro pannello e creazione, `content.edit`/
  `content.create`), `GET/PUT/DELETE /api/content/:key` (lettura con elenco versioni leggero e
  `?versionId=` per una versione specifica, modifica, eliminazione — `content.read`/
  `content.edit`/`content.delete`). `PUT` distingue esplicitamente "Salva modifica" (corregge il
  testo in vigore, sulla versione corrente se `history`) da "Aggiungi nuova versione"
  (`createVersion: true`, inserisce una riga in più lasciando intatta la cronologia) come deciso
  nel piano. Primo uso reale di `hasPermission()` da `functions/api/_shared/permissions.js`,
  finora definito ma non richiamato da nessun endpoint. Validazione (chiave, etichetta, tipo,
  modalità, lunghezza del testo) solo lato backend in `functions/api/content/_shared.js`. Nuovi
  tipi di evento (`content_created`, `content_updated`, `content_version_added`,
  `content_deleted`) in `_shared/events.js`. Migrazione applicata e verificata solo in locale.
  **Restano da fare**: Fase 1 (inventario completo), Fase 4 (migrazione effettiva dei JSON/testi
  Angular nel database — per ora le tabelle sono vuote), Fase 5+ (editor frontend, pannello,
  pagina dei log).
- [x] CMS (`planning editor contenuti.md`, Fase 4 ridotta + prima fetta di Fase 5 — migrazione
  delle introduzioni testuali e componente di visualizzazione condiviso): su
  `feature/content-editor`. Migrazione 0036: le 5 introduzioni testuali chiaramente hardcoded nei
  template (non quelle già esternalizzate in `web/public/content/*.json` per mappa/bacheca/
  storie/cuffiette, che restano JSON in attesa dei rispettivi editor dedicati di Fase 7, per non
  confondere "migrazione al CMS generico" con "raccolta strutturata") — `mondo-bianco.benvenuta`,
  `ricettario.introduzione`, `calendario.introduzione`, `cose-insieme.introduzione`,
  `lettere.introduzione`, tutte `plain_text`/`replace`. `created_by` risolto con un `JOIN` su
  `users.email` invece di un id hardcoded, così la migrazione resta valida sia in locale sia in
  remoto. Nuovo `ContentService` (`web/src/app/core/content.service.ts`, stesso pattern a
  `fetch`+`credentials: 'same-origin'` di `AuthService`, non `HttpClient`: il progetto non lo usa
  da nessuna parte) e componente condiviso `EditorialText` (`web/src/app/shared/editorial-text/`)
  che legge `body` da `GET /api/content/:key` e lo spacca in paragrafi — usato dalle 5 pagine al
  posto del testo hardcoded, così la modifica di un solo file di componente vale per tutte
  (regola di zero duplicazione). Nessun controllo di modifica in pagina ancora: `EditorialText` è
  solo lettura, l'editor arriva con il resto della Fase 5. Verificato con una query diretta su D1
  locale che le 5 righe siano state inserite con lunghezza attesa e `created_by` corretto;
  `tsc --noEmit` pulito. **Non verificato in browser**: `ng build`/`ng serve` in questo ambiente
  richiedono Node ≥22.22.3/24.15.0, qui è installato v24.14.1 — nessun bug noto, solo build non
  eseguibile in locale in questo giro. **Restano da fare**: Fase 1 (inventario completo, incluse
  le raccolte JSON), il resto della Fase 4 (raccolte strutturate), Fase 5 (editor vero e proprio,
  versionamento selettivo, pulsante "Modifica" in modalità admin), Fase 6+ (pannello, log).
- [x] CMS (`planning editor contenuti.md`, Fase 5 — editor dei testi e versioni): su
  `feature/content-editor`. `EditorialText` diventa l'editor vero e proprio, non solo lettura:
  pulsante "✏️ Modifica" visibile solo con `authService.isAdmin() && authService.adminModeEnabled()`
  (pattern riusato identico da `profilo.html`, la sicurezza reale resta comunque sul backend —
  ogni endpoint `/api/content` richiede il permesso, il frontend nasconde solo un controllo
  inutile a chi non può usarlo); textarea con anteprima live (stessi paragrafi mostrati in
  lettura), annullamento prima del salvataggio, "Salva modifica"/"Aggiungi nuova versione"
  distinti come da piano — il secondo compare solo se `versioningMode === 'history'`. Aggiunto
  anche il selettore delle versioni (`‹ Versione 1 · Versione 2 › `) per i contenuti storici, con
  nota quando si sta leggendo una versione non corrente. `ContentService.save()` ora ha un tipo
  di ritorno dedicato (`ContentSaveResult`) invece di spacciare la risposta parziale del `PUT`
  per un `ContentEntry` completo: dopo un salvataggio storico si ricarica l'intero contenuto dal
  server per la cronologia aggiornata, un salvataggio `replace` aggiorna lo stato in locale senza
  un giro a vuoto. CSS dedicato in `styles/components/editorial-text.css`, referenziato via
  `styleUrls` sul componente (stesso pattern di `password-field`/`app-select`, non nell'array
  globale di `angular.json`). `tsc --noEmit` pulito; non verificato in browser per lo stesso
  limite di Node già segnalato sopra. Le 5 chiavi migrate restano tutte `replace`: il percorso
  "history" è implementato ma non ancora esercitato da nessun contenuto reale — da verificare
  quando la Fase 4 completa (in corso separatamente) porterà il primo contenuto storico.
  **Restano da fare**: Fase 1 (inventario, in corso separatamente), resto Fase 4 (raccolte
  strutturate), Fase 6 (pannello indice contenuti, pagina log), Fase 7 (editor dedicati).
- [x] CMS (`planning editor contenuti.md`, Fase 4 — secondo lotto guidato da
  `inventario contenuti CMS.md`, prodotto da Codex in parallelo su questa stessa branch): su
  `feature/content-editor`. Due migrazioni. La **0037** corregge un'assunzione mia: le 4 chiavi
  già migrate (`mondo-bianco.benvenuta`, `calendario.introduzione`, `lettere.introduzione`,
  `cose-insieme.introduzione`) erano state seedate `replace` senza una vera decisione — non era
  scritto da nessuna parte, l'avevo scelto io. L'inventario raccomanda `history` per i messaggi
  personali legati a un momento preciso, confermato da Rory: la migrazione crea la prima
  `content_versions` da ciascun `body` esistente e libera `content_entries.body` (per `history`
  il valore non vive più lì, vedi `functions/api/content/[key].js`). La **0038** aggiunge 17
  chiavi nuove, tutte `replace`, con un `INSERT` separato per riga invece di un unico
  `UNION ALL`: D1/SQLite ha un limite sui termini di una SELECT composta, superato a 17 righe
  (`SQLITE_ERROR: too many terms in compound SELECT` — la migrazione con `UNION ALL` non si
  applica affatto, non registrata come applicata, nessun dato parziale). Testato con reset
  completo del D1 locale (`rm -rf .wrangler/state/v3/d1`) e riapplicazione di tutte le 38
  migrazioni da zero, poi verificato con una query diretta che le 4 `history` leggano
  correttamente da `content_versions` (`body` NULL su `content_entries`, `current_version_id`
  valorizzato) e le 18 `replace` abbiano il testo diretto.
  **Scelte di esclusione, non solo di ordine** — testi individuati dall'inventario ma lasciati
  nel codice per limiti reali del componente o dell'architettura attuale, non per pigrizia:
  `portone.*` e `not-found.messaggio` (pagine raggiungibili senza sessione — `GET /api/content`
  richiede sempre un utente autenticato, quindi risponderebbe 401 prima del login rompendo
  proprio le pagine che un utente non loggato deve vedere); `messaggio-criptato.istruzioni`
  (contiene un link `<a>` inline necessario per usare la pagina — `EditorialText` renderizza
  solo paragrafi di testo semplice, un editor lo trasformerebbe in testo non cliccabile);
  `mondo-bianco.canzone.citazione` (versi separati da `<br>` dentro un unico paragrafo — lo split
  di `EditorialText` riconosce solo paragrafi separati da riga vuota, non interruzioni singole);
  `linguaggio-segreto.messaggio-codice` (non è prosa ma il codice letterale di un puzzle: un
  editor generico lo esporrebbe a modifiche accidentali che romperebbero l'enigma);
  `storie.suggerimento.eyebrow`/`.titolo` (etichette brevi dentro `<span>`/`<strong>` inline,
  `EditorialText` renderizza sempre `<p>` — nesting non valido). Tutti i testi marcati `history`
  ancora "Da migrare" nell'inventario (Ponti, Mappamondo, Domande, Tavolo, GDR, Linguaggio
  Segreto, Cuffiette, Storie, Mappa, Bacheca) restano fuori da questo lotto: la decisione
  `history` per le chiavi *nuove* non è stata ancora presa, solo per le 4 già migrate.
  `tsc --noEmit` pulito; non verificato in browser per lo stesso limite di Node.
  **Restano da fare**: le collezioni strutturate (Fase 4 prosegue con calendario/ricettario per
  primi secondo l'ordine consigliato dall'inventario), i testi `history` non ancora confermati,
  Fase 6/7.
- [x] CMS (`planning editor contenuti.md`, Fase 6 — pannello e pagina log): su
  `feature/content-editor`. Colmato un buco esplicitamente nei criteri di completamento della
  prima milestone ("Un accesso diretto alla pagina log senza `events.view` restituisce 403") che
  era rimasto del tutto assente finora. Nuovo endpoint `GET /api/events`
  (`functions/api/events/`): filtri per identità/sezione/tipo evento/periodo, paginazione,
  ordinamento dal più recente, un `JOIN` su `users` per esporre `identity`/`nickname` senza
  duplicare quell'informazione nella tabella eventi. Ogni consultazione registra a sua volta un
  evento `admin_log_viewed` (nuovo tipo in `_shared/events.js`) — non genera rumore perché è
  un'azione singola per visita alla pagina, non per riga letta. Nuovo `adminGuard`
  (`core/admin.guard.ts`), da usare dopo `authGuard` sulle rotte riservate: si affida al
  `currentUser` già risolto da `authGuard` invece di rifare una chiamata di rete, così la pagina
  non compare per un istante prima del controllo (stesso principio richiesto dal piano per il
  resolver). La vera barriera resta comunque il backend — l'endpoint verifica `events.view`
  indipendentemente da cosa fa il frontend. Due pagine nuove protette da `authGuard`+`adminGuard`:
  `/log` (filtri, tabella, paginazione) e `/contenuti` (indice di sola lettura di
  `content_entries`, riusa `GET /api/content` già esistente dalla Fase 3, con ricerca ed elenco
  tipi lato client — il salvataggio resta sulla pagina dove il contenuto vive, questo è solo per
  trovarli). Collegamenti a entrambe in `profilo.html`, visibili solo con
  `adminModeEnabled()` acceso, accanto all'interruttore della modalità admin. `tsc --noEmit`
  pulito; non verificato in browser (stesso limite di Node), e non ho potuto far girare
  `wrangler pages dev` per un test end-to-end perché richiede una build Angular già pronta in
  `web/dist/`, che qui non riesco a produrre.
  **Restano da fare**: verifica visiva reale (serve Node aggiornato o farlo girare altrove),
  applicare tutte le migrazioni al D1 di produzione (finora solo locale), le collezioni
  strutturate, le decisioni aperte sull'inventario, Fase 8 (export/backup).
- [x] CMS (`planning editor contenuti.md`, Fase 4 — terzo lotto, testi `history` ancora
  hardcoded): su `feature/content-editor`. Migrazione 0039: `ponti.introduzione`,
  `domande.introduzione`, `tavolo.introduzione`, `gdr.introduzione` (`paragraphs`, tre paragrafi),
  `linguaggio-segreto.introduzione` (`paragraphs`, due paragrafi) — tutti creati direttamente
  `history` fin dall'inizio (entry + prima `content_versions` in un solo passaggio), a differenza
  del primo lotto dove le 4 chiavi erano nate `replace` per assunzione e poi corrette. Restano
  fuori: `mappamondo.introduzione` (bloccato dalla decisione #3 sull'inventario, non ancora
  presa: racconto modificabile o documento immutabile); le introduzioni ancora in JSON
  (`cuffiette.playlist/canzoni.introduzione`, `storie.introduzione`, `mappa.introduzione`,
  `bacheca.introduzione`) — richiedono anche di aggiornare il consumo lato frontend
  (`StaticContentService`), rimandate a un giro dedicato insieme alle rispettive collezioni
  strutturate. Verificato con query diretta su D1 locale: tutte e 5 `history` con
  `current_version_id` valorizzato e lunghezza del testo coerente. `tsc --noEmit` pulito.
  **A questo punto la Fase 4 sui testi semplici/paragrafi è quasi esaurita**: restano solo le
  introduzioni JSON delle raccolte (da fare insieme a Fase 7) e i pochi testi esclusi per limiti
  reali di `EditorialText` (link inline, interruzioni di riga, codice di puzzle, etichette
  inline) o perché raggiungibili senza sessione. Il grosso del lavoro non ancora fatto è altrove:
  raccolte strutturate (Fase 4 prosegue/Fase 7), decisioni #2/#3/#4/#5 dell'inventario, Fase 8,
  e soprattutto **applicare tutto a produzione** — finora ogni migrazione è stata verificata solo
  su D1 locale.

---

## Backlog dettagliato

1. Implementare i temi in modo coerente anche nel resto del mondo bianco (grande)
    1. Il selettore c'è già su tutte le 17 pagine (09/08/2026) e cambia `--focus-color` e il tint del cielo stellato, ma i colori di ogni pagina (`web/src/styles/pages/*.css`) restano perlopiù hardcoded invece di usare le variabili di `themes.css` — quindi cambiando tema oggi si vede poco. È il refactoring pagina per pagina di cui sopra.
2. implementare una piccola pagina "profilo" dove poter cambiare il nick e password
    1. fare in modo che se c'è un cambio password, la precedente venga loggata per memoria
3. la bacheca dei ricordi è ancora totalmente da rivedere
5. capire se il mappamondo si può migliorare
6. i ponti allo stato attuale è una pagina un po' inutile, un po' "cimitero", potrebbe diventare leggermente più piccola o non mettere il focus su i ponti ma sulle lettere
7. rivedere la parte della traccia bonus nelle cuffiette, fa un po' schifo
8. rivedere il selettore dei temi, non mi piace molto in questo momento, non mostra il nome ne le icone dei temi
9. capire come centralizzare un po' di più le lettere
10. aggiungere la lettera finale alla fine del cruciverba
11. capire come ottimizzare le pagine dei gdr, perché attualmente sono tante pagine e ci si perde un po', per tornare indietro ci vuole una vita. Attualmente il percorso è il mondom bianco->tavolo da gioco->giochi di ruolo->il prezzo della verità->le 3 pagine dell'avventura. Veramente troppi passaggi
12. c'è ancora quel bug che il colore del bottone inizialmente è rosso, poi diventa verde
13. Tutto il sito non sembra avere uno stile unificato, come card, bottoni, stili, in generale. Ovvio non è che tutte le pagine devono essere uguali, ma almeno avere un design riconoscibile tra loro. 
Portati qui dalla vecchia `CHECKLIST_MIGRAZIONE_MONDO_BIANCO.md` (ora eliminata, cronologia completa nella storia di git):

16. Aggiungere la seconda avventura del Gioco di Ruolo. Rory ha già pronta una seconda storia giocabile, con un regolamento diverso da "Il Prezzo della Verità" (non condividono lo stesso sistema di regole). Struttura già pronta ad accoglierla: `tavolo-da-gioco/gdr/index.html` elenca le avventure in `.tavolo-games-grid-compact` (oggi solo IPDV), ognuna con pagina propria (`tavolo-da-gioco/gdr/<slug>/index.html`) sul modello di `tavolo-da-gioco/gdr/il-prezzo-della-verita/`. Non condividere il regolamento tra le due: ognuna tiene il proprio. Aspettare titolo, testo e regole da Rory prima di crearla.
17. Progettare la navigazione responsive: rendere raggiungibili luoghi e ritorno alla home su desktop e telefono mantenendo orientamento e accessibilità.
20. Sostituire l'embed SoundCloud delle Cuffiette con un player audio proprio del sito, quando i nove brani saranno ospitati direttamente (R2 o storage posseduto) invece che su SoundCloud.
21. Aggiungere anche il messaggio criptato ai giochi.
22. Aggiungere il nostro linguaggio segreto da qualche parte (magari introducendo qualcosa di speciale per i 5 cuori e per il cerchio).
23. Aggiungere una zona dei giochi da fare insieme, con didascalia sotto. Come se fosse la lista delle mie note sul telefono ma qui, condivisa, magari anche lei può suggerire giochi o cosa da fare (capire se solo giochi o cose da fare insieme o se farle entrambe in modo diviso). https://www.youtube.com/shorts/4jmIPLqo7Hc
24. Ricerca globale protetta: cercare per parola dentro titoli, date, storie, canzoni, mete e ricordi tutti insieme, invece di aprire ogni pagina a cercare a occhio. Deve restare autenticata (nessun contenuto indicizzabile o raggiungibile da chi non ha fatto login). Rimandata: più un'idea per quando il sito avrà più contenuto da cercare, che una necessità adesso.
25. La Mappa — aggiungere la Sicilia tra le mete (è la terra di Rory, tanti posti bellissimi). Posti già in mente: il fiume Amenano sotto l'ostello (a Catania), le Gole dell'Alcantara, i laghetti di Avola (probabilmente Cavagrande del Cassibile, le piscine naturali vicino Avola — da confermare). Isola Bella a Taormina. Da scrivere insieme quando Rory ha i testi pronti, stesso trattamento delle altre mete (non un posto "originale" preesistente, va segnato come aggiunta).
26. La Mappa — completare Roma: nel contenuto attuale (`web/public/content/map.json`) è ancora un segnaposto quasi vuoto ("roma roma", nessuna immagine) — fedele all'originale Notion, che la lasciava incompleta apposta. Serve il testo vero da Rory prima di poterla scrivere.

27. Rendere le scritte più personali/romantiche, alla fine il sito "sono io" mentre l'utilizzatrice è lei. Quidni il sito bene o male è tutto "parlato" come se parlassi a lei, mentre per alcuni testi è stato scelto di renderli generici. Individuali e renderli personali

28. Una pagina per le mie domande, a cui vorrei che rispondesse, quindi deve essere tipo "domanda" e tipo text box dove lei potrebbe rispondere alle domande. Ovviamente richiede un salvataggio in DB

29. Aggiungere al calendario 20 maggio, la rinascia di fuochetto

30. Rivedere la favicon

31. Aggiungere un occhiolino "mostra password" nei campi password del Portone, sia nel login che nella registrazione.

32. Aggiungere l'1 luglio, il giorno del suo esame di maturità, e il giorno che le ho mandato il mazzo di rosa con la lettera
