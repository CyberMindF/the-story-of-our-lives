# #e4 — Il gioco di carte collezionabili

Design concordato con Rory il 14/08/2026, dopo una sessione di domande dedicata. Questo
documento è pensato per essere letto ed eseguito da un'altra sessione/AI senza il contesto
della conversazione originale: ogni decisione riporta anche il *perché*, non solo il *cosa*.

Riferimento di contesto obbligatorio prima di iniziare: leggere `CLAUDE.md` (zero duplicazione
di codice, dove vive cosa nella SPA Angular) e la voce `#e4` in `prossimi sviluppi.md` (la
richiesta originale di Rory, testuale).

## Cos'è

Un gioco di carte collezionabili con soggetti "nostri" (foto di coppia, sticker usati in chat,
emoji) invece di contenuti generici. Si trova nella sezione Giochi del sito (Tavolo da Gioco o
analogo, da confermare con la struttura di routing esistente). Bustine casuali si guadagnano
passivamente stando sul sito, le carte si scambiano in modo asincrono tra i due account, esiste
un album per vedere la propria collezione e quella dell'altro.

## Modello concettuale

Tre livelli, in quest'ordine di contenimento:

1. **Set** — un contenitore tematico esplicito con nome, es. "Set Emoji 1", "Settembre 2026",
   "Set Giochini". Entità di prima classe nel DB (tabella dedicata), non un tag libero: Rory ha
   chiesto esplicitamente di poter "sapere le collezioni", e prevede che i set aumentino nel
   tempo mano a mano che carica materiale.
2. **Design** — un soggetto concreto dentro un set: una foto specifica, uno sticker specifico,
   un'emoji specifica. **Decisione importante**: niente livello "edizione/ristampa" separato.
   Se lo stesso soggetto (es. "voi due al mare") ricompare in un momento diverso, è semplicemente
   un nuovo design indipendente, non una variante dello stesso design. Rory ha confermato
   esplicitamente questa scelta dopo che gli è stato spiegato il parallelo con le carte Pokémon
   (Pikachu ha più carte distinte, non "ristampe" di un'unica carta).
3. **Finitura** — ogni design esiste in **5 varianti fisse**: `flat`, `oro`, `smeraldo`,
   `rubino`, `diamante`. La finitura è ciò che determina la rarità, non il design in sé. La
   combinazione (design, finitura) è la "carta" concreta che viene posseduta, pescata e
   scambiata.

**Doppione** = stesso design + stessa finitura, posseduto in quantità ≥ 2. Due finiture diverse
dello stesso design NON sono doppioni tra loro: contano come due carte distinte in album.
Questo è stato confermato esplicitamente da Rory dopo la domanda diretta ("sì il doppione sono
stesso design e rifinitura").

## Meccanica delle bustine

- Si matura **1 bustina ogni 10 minuti** di permanenza sul sito (tempo cumulativo, anche a più
  riprese nella giornata — non serve una sessione continua di 10 minuti).
- Le bustine maturate si accumulano **senza tetto massimo**: nessun limite di bustine in sospeso,
  a differenza di altri sistemi a "energia" tipici dei mobile game. Decisione esplicita di
  Rory ("accumulo continuo, nessun tetto").
- Alla registrazione si ricevono **3 bustine bonus** (dalla richiesta originale di Rory in
  `prossimi sviluppi.md`).
- Ogni bustina contiene **5 carte**.
- Distribuzione delle finiture per carta pescata, "piramide ripida" (scelta esplicita di Rory
  tra le opzioni proposte):

  | Finitura | Probabilità |
  |----------|-------------|
  | flat     | ~60%        |
  | oro      | ~25%        |
  | smeraldo | ~10%        |
  | rubino   | ~4%         |
  | diamante | ~1%         |

  Il design specifico pescato dentro una finitura è scelto a caso uniformemente tra tutti i
  design disponibili in tutti i set attivi (salvo decisione futura di pesare per set).

- **Apertura bustina**: nessuna animazione elaborata alla prima versione. Reveal semplice delle
  5 carte (flip o fade in sequenza), coerente con l'esperienza già fatta su #f6 (Barattolo dei
  Pensieri) dove tentativi di animazioni complesse (scale/clip-path, poi pannelli 3D con
  cerniere) sono stati scartati due volte per risultato scadente rispetto allo sforzo. **Ma**:
  l'architettura del componente di apertura va scritta in modo che un'animazione più ambiziosa
  possa sostituire il solo reveal in un secondo momento, senza riscrivere la logica di
  estrazione/assegnazione carte — separare nettamente "logica di pesca" (server, già
  deterministica quando la bustina viene aperta) da "presentazione" (componente client,
  sostituibile).

## Scambi (trade)

- Proposta **N carte contro N carte**, dove N può essere anche 0 da un lato (si può proporre
  "ti do X, non voglio nulla in cambio").
- Ogni proposta può includere un **messaggio di testo libero opzionale** (es. per accompagnare
  lo scambio con una promessa o un commento — richiesta esplicita di Rory).
- Flusso a stati:
  1. `proposta` — A sceglie carte proprie da dare + carte desiderate dall'album di B (+ messaggio
     opzionale) e invia.
  2. B può: **accettare** (esegue lo scambio, sposta le carte tra i due possessi, stato →
     `completato`), **rifiutare** (stato → `rifiutato`, fine), o **controproporre** (nuova
     proposta con carte/messaggio diversi, stato torna a `proposta` con mittente invertito,
     link alla proposta precedente per lo storico).
- Notifiche: badge/contatore nel sito (pattern già esistente altrove, es. Suggerimenti) **più**
  email tramite Resend — vedi sezione email sotto. Un trade in attesa di risposta genera
  notifica al destinatario; una risposta (accetta/rifiuta/controproposta) genera notifica al
  proponente originale.

## Album

- Organizzato a **"fogli"** per finitura, in ordine di rarità crescente (flat → oro → smeraldo
  → rubino → diamante).
- Ogni foglio è una **griglia fissa** con uno slot per ogni design esistente in quella finitura:
  i posseduti mostrano l'immagine reale, i mancanti mostrano una silhouette/placeholder — dà il
  senso di "quanto manca a completare" (richiesta esplicita di Rory: "griglia fissa con slot
  vuoti").
- **Vista comparativa** (per soddisfare la richiesta originale "deve essere possibile guardare
  l'album dell'altro, con doppioni segnalati"): due griglie affiancate, la propria e quella
  dell'altro, che scorrono/cambiano pagina **in modo sincronizzato** (stessa finitura/foglio
  visibile su entrambe contemporaneamente) — idea esplicita di Rory, distintiva rispetto al
  pattern "singola vista" usato altrove nel sito. I doppioni (proprie carte possedute in
  quantità ≥ 2) vanno evidenziati visivamente in entrambe le griglie.

## Email (infrastruttura condivisa con #f5)

Le notifiche di trade via email **sono la stessa infrastruttura richiesta da #f5** ("invio
email per gli aggiornamenti del sito") — le due voci del piano si fondono in una sola
implementazione di base, poi #e4 la consuma per un caso d'uso specifico. Non trattarle come
lavori separati.

- Servizio scelto: **Resend** (Rory ha confermato dopo la proposta, piano gratuito ~3000
  email/mese, buon supporto per Cloudflare Workers).
- Cloudflare Workers non può inviare SMTP direttamente: un servizio terzo è necessario, non
  opzionale.
- **Lavoro "da soli" obbligatorio**: creazione dell'account Resend, verifica del dominio
  mittente (record DNS TXT/CNAME), generazione della API key. Nessuna AI può farlo — richiede
  accesso al pannello Resend e al DNS del dominio, entrambi fuori dal filesystem del progetto.
  Va fatto da Rory *prima* che qualunque codice di invio email possa essere testato end-to-end
  (il codice si può scrivere prima, ma non verificare).

## Contenuti reali (carte, foto, sticker)

- Quantità di set/design iniziali **non ancora decisa** da Rory ("non lo so ancora, dipende da
  che voglia ho"). Non bloccare lo sviluppo del sistema su questo: costruire schema e editor
  admin prima, caricare i contenuti reali dopo, quando Rory ha materiale pronto.
- Pipeline di caricamento: sia via editor CMS admin sia inserimento diretto in chat con un'AI
  che poi scrive su DB — stessa architettura, stesso risultato finale in tabella. Non costruire
  due percorsi divergenti.
- **Lavoro "da solo" per Rory**: scegliere/fornire le foto, sticker ed emoji reali da usare come
  design. Nessuna AI può decidere cosa è "un ricordo nostro" — è materiale personale, non
  generabile né indovinabile.

## Schema dati (proposta, da rifinire in fase di migrazione)

```
carte_sets
  id, slug, nome, descrizione, created_at, position

carte_designs
  id, set_id (FK), nome, immagine_url (R2), position

carte_definizioni  -- combinazione design × finitura = una carta pescabile/scambiabile
  id, design_id (FK), finitura ('flat'|'oro'|'smeraldo'|'rubino'|'diamante')
  UNIQUE(design_id, finitura)

carte_possesso
  id, user_identity, carta_definizione_id (FK), quantita

carte_bustine_maturate
  id, user_identity, quantita_disponibile, ultimo_accumulo_at

carte_trade
  id, proponente_identity, destinatario_identity, stato
  ('proposto'|'accettato'|'rifiutato'|'controproposto'), messaggio, trade_precedente_id (FK,
  nullable, per lo storico delle controproposte), created_at

carte_trade_items
  id, trade_id (FK), lato ('offerta'|'richiesta'), carta_definizione_id (FK), quantita
```

Segue lo stesso pattern già in uso nel resto del sito: `user_identity` derivato sempre dalla
sessione lato server, mai dal client (stesso principio già applicato in #e12 Barattolo dei
Pensieri e #e5 Chat dei Ponti) — nessuna richiesta di trade o pesca bustina deve fidarsi di un
identificativo utente passato dal client.

## Piano di lavoro: dipendenze e parallelizzabilità

**Stato al 15/08/2026**: Blocchi 1-5 fatti (schema DB, bustine con accumulo/drop rate, album con
vista comparativa, editor admin set/design, scambi con proponi/accetta/rifiuta e badge, notifiche
email dei trade). Il gioco è usabile per intero. **Blocco 5 non ancora verificabile end-to-end**:
il codice è pronto e agganciato, ma con un solo account registrato (Rory) `notifyOtherIdentity`
non trova mai un destinatario — serve l'account di Desy (con `notify_email_updates` attivo) per
vedere un'email di trade reale arrivare. Semplificazioni introdotte durante
l'implementazione, non discusse prima con Rory ma coerenti col resto del piano: niente
riordino (move) per set e design nell'editor admin (si aggiungono in coda, aggiungibile dopo se
serve); un'unica immagine per design condivisa dalle 5 finiture (coerente col punto "non ancora
deciso" più sotto); UI di scambio funzionale con select/input semplici, non un selettore visivo
con anteprime delle carte.

Legenda: 🔀 parallelizzabile con altri task nello stesso blocco · ⛓️ blocca/è bloccato da altro
task · 🙋 richiede Rory personalmente, nessuna AI può completarlo da sola.

**Nota sull'email**: il sistema email (#f5, Resend) **non esiste ancora nel progetto** e non è
un prerequisito del gioco di carte. #e4 deve poter essere costruito e usato per intero — bustine,
scambi, album — con la sola notifica badge/contatore nel sito, che è il pattern già esistente
altrove (es. Suggerimenti) e non richiede nulla di nuovo. L'invio email dei trade è
un'aggiunta successiva, da agganciare **quando e se** #f5 viene implementato (da questa o da
un'altra sessione, in un momento qualunque, anche dopo che il gioco è già in uso) — vedi Blocco 4.
Non trattarla come blocco iniziale.

### Blocco 1 — fondamenta, nessuna dipendenza tra loro, si possono fare in parallelo (🔀) — ✅ fatto

Questi lavori toccano file diversi e non si aspettano a vicenda:

- **Migrazione schema DB** (tabelle sopra, numerazione a partire dalla prossima libera dopo
  `0088_add_ponti_chat.sql`) 🔀
- **Pattern R2 upload per immagini carte**, riusando lo schema stream-binario già esistente
  (Bacheca, Chat dei Ponti — "niente multipart, per non bufferizzare file grossi in memoria nel
  Worker", principio già stabilito nel progetto) 🔀
- **Componente `world-settings` / toggle pagina**: verificare se il gioco di carte necessita di
  un proprio ingresso in Atlante del Mappamondo e card dedicata (pattern già usato da #e12, #e10)
  — lavoro di routing/shell, indipendente dal resto 🔀

### Blocco 2 — logica di dominio, dipende dal Blocco 1 (schema DB) ⛓️ — ✅ fatto

- **Meccanica di maturazione bustine** (timer 10 minuti, accumulo senza tetto, bonus
  registrazione) — dipende dalla tabella `carte_bustine_maturate`
- **Logica di apertura bustina e drop rate** (piramide ripida pesata) — dipende da
  `carte_definizioni` e `carte_possesso`
- **Endpoint CRUD scambi** (proponi/accetta/rifiuta/controproponi) — dipende da `carte_trade` e
  `carte_trade_items`

Questi tre sono indipendenti *tra loro* una volta pronto lo schema, quindi ancora
parallelizzabili (🔀) nonostante dipendano tutti dal Blocco 1.

### Blocco 3 — superficie utente, dipende dal Blocco 2 per i dati reali ma il markup/stile si può abbozzare prima con dati finti — ✅ fatto

- **Componente apertura bustina** (reveal semplice, architettura sostituibile — vedi sopra) ⛓️
  logica di apertura
- **Editor admin set/design/carte** (CMS, pattern già consolidato nel progetto: creazione,
  modifica, riordino, upload immagine) ⛓️ schema DB, 🔀 rispetto agli altri task di questo blocco
- **Album — vista singola** (griglia a fogli per finitura, slot vuoti) ⛓️ possesso carte, 🔀
  rispetto agli altri
- **Album — vista comparativa a due griglie sincronizzate** ⛓️ dipende dalla vista singola
  (Blocco 3) già completa, non parallelizzabile con essa — è un'estensione, non un lavoro
  indipendente
- **UI proposta/risposta trade** ⛓️ endpoint scambi, 🔀 rispetto ad album e apertura bustina

### Blocco 4 — rifinitura, dopo che tutto il resto è verificabile end-to-end — ✅ fatto

- **Badge/contatore nel sito** per trade in sospeso ⛓️ endpoint scambi — questo è il **solo**
  meccanismo di notifica richiesto per considerare #e4 completo.
- Verifica end-to-end con Playwright su account di prova (pattern standard del progetto: sempre
  ripulito da D1/R2 locali dopo il test)

### Blocco 5 — opzionale, indipendente da tutto il resto — ✅ implementato il 15/08/2026, non ancora verificato con un secondo account reale

- **Notifiche email di trade**: agganciate a proponi/accetta/rifiuta/controproponi in
  `functions/api/carte-trade/`, usa `notifyOtherIdentity` da `functions/api/_shared/email.js`
  (vedi #f5 in `prossimi sviluppi.md` per l'infrastruttura Resend). Testato l'invio reale in
  generale (email di prova consegnata a rory982011@gmail.com), ma non lo scenario specifico di
  un trade — serve l'account di Desy registrato e con `notify_email_updates` attivo per vedere
  una di queste email arrivare davvero.

## Lavori che solo Rory può fare (riepilogo)

1. Scelta/fornitura del materiale reale (foto, sticker, emoji) da usare come design — nessuna AI
   può decidere cosa è "un ricordo nostro".
2. Decisione finale su quanti set/design lanciare all'inizio, e i loro nomi — menzionati come
   esempio ("Set Emoji 1", "Settembre 2026", "Set Giochini", "Set Fuochetto") ma non ancora una
   lista definitiva.
3. Eventuale bilanciamento dei drop rate dopo un primo periodo d'uso reale, se la piramide
   proposta risultasse troppo generosa o troppo avara — decisione di gusto, non tecnica.
4. Account Resend + verifica dominio DNS — richiesto **solo** se/quando si arriva al Blocco 5
   (notifiche email), non prima. Vedi sezione Email.

## Cosa NON è ancora deciso (da chiarire prima o durante l'implementazione)

- Route esatta del gioco (`/tavolo-da-gioco/carte`? sezione a parte?) e se serve una card
  propria nell'Atlante del Mappamondo.
- Se il design pescato dentro una bustina è uniforme su *tutti* i set attivi o pesato in qualche
  modo per set più recenti/rari.
- Se un utente può rifiutare/annullare una propria proposta di trade prima che l'altro risponda.
- Se le immagini dei design richiedono varianti generate lato client per le 5 finiture (es.
  overlay/filtro oro-smeraldo-rubino-diamante applicato alla stessa immagine base) o se ogni
  finitura ha un file immagine caricato a mano separatamente. Non discusso esplicitamente con
  Rory — da chiedere prima di costruire l'editor admin, perché cambia se l'upload è 1 immagine
  per design o 5 immagini per design.
