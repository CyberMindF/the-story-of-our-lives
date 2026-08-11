# Piano di lavoro

Scaletta concordata il 09/08/2026, dopo il porting Angular e la componentizzazione. Le cose
ancora aperte (da fare, in corso, o bloccate su contenuti di Rory) stanno in cima, così si
vedono subito senza scorrere; tutto quello già completato è più sotto, in ordine di fase.

## Da fare / in corso

- #16 — seconda avventura GDR: aspetta titolo/testo/regole
- [~] #25 — Mappa: Sicilia. Struttura pronta in `map.json` (destinazione tra Olanda e Roma,
  coordinate su Catania) con le 4 foto vere già al loro posto (fiume Amenano/Catania, Gole
  dell'Alcantara, laghetti di Cavagrande del Cassibile/Avola, Isola Bella a Taormina —
  scaricate e convertite in webp, la foto di Avola croppata del 15% sopra/sotto su richiesta).
  **Resta solo il testo**: i 4 paragrafi sono ancora segnaposto (`[... testo da scrivere]`).
  Aggiornata anche la validazione hardcoded in `mappa.ts` (si aspettava esattamente 6
  destinazioni, ora 7).
- #26 — Mappa: completare Roma, aspetta il testo vero
- #23 — zona giochi/cose da fare insieme
- #24 — ricerca globale protetta (già segnata come rimandata)
- #33 — Liste delle cose da fare insieme (la mia lista delle note)
- #34 — Pagina delle nostre ricette?
- #35 — implentare anche nu bottone "suggerimento" che in realtà le dice solo di venirmelo a chiedere e facendo "qualcosa" per me, anche se ancora non so cosa
- #a3 - Creare un'animazione di lanterne che salgono. Per darti una rederenze come quando su terraria c'è festa degli npc di notte e si vedono le lanternine che salgono nel cielo. Come la notte delle lanterne in thailandia, da capire quando metterla, in che tema o se fare un tema diverso
- #a4 - Creare una pagina "il cielo" dove è possibile vedere semplicemente la luna, la luna deve cambiare chiamando una API di qualche servizio esterno (se possibile) che da la fase lunare e noi la ricreiamo e la mostriamo. Qui è possibile godersi il cielo stellato, lunato, lanternato, ecc.
- #a5 - creare sfondi animati anche per gli altri temi

---

## Fatto

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
