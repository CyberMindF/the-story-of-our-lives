# Il Mondo Bianco

Applicazione del Mondo Bianco con frontend HTML/CSS/JavaScript, autenticazione tramite Cloudflare Pages Functions e dati su D1. Il cruciverba e le future esperienze sono pagine interne protette.

## Avvio locale

Non aprire direttamente `index.html`: il caricamento di `data.json` e gli endpoint `/api/auth/*` richiedono un server. Anche `python3 -m http.server` non è più sufficiente, perché serve soltanto i file statici e non esegue Pages Functions.

Installa Wrangler, prepara la chiave locale e applica le migrazioni:

```bash
npm install
cp .dev.vars.example .dev.vars
npx wrangler d1 migrations apply DB --local
```

Modifica `WORLD_KEY` dentro `.dev.vars`, poi avvia:

```bash
npx wrangler pages dev .
```

Apri l'indirizzo mostrato da Wrangler, normalmente `http://localhost:8788`. La root mostra il Portone e l'accesso; dopo l'autenticazione si entra nell'hub su `http://localhost:8788/mondo-bianco/`. Il cruciverba è disponibile in `http://localhost:8788/tavolo-da-gioco/cruciverba/`.

## Autenticazione

Gli endpoint sono organizzati in `functions/api/auth/`:

- `POST /api/auth/register`: registra un nuovo utente e crea una sessione. Il nickname è scelto liberamente in fase di registrazione (facoltativo: se vuoto, resta la parte dell'email prima della chiocciola). La preferenza `notify_email_updates` è impostabile solo qui, non al login, perché prima dell'autenticazione non si conosce ancora l'utente per pre-spuntarla correttamente; salva solo la preferenza, l'invio delle email non è implementato.
- `POST /api/auth/login`: verifica email, password e chiave, poi crea una sessione.
- `GET /api/auth/session`: controlla se il token è ancora valido.
- `POST /api/auth/session`: con token valido, verifica nuovamente la chiave.

Il token originale viene inviato in un cookie `HttpOnly`; D1 conserva soltanto il suo hash. La sessione scade dopo 7 giorni e viene rinnovata per altri 7 giorni soltanto quando la chiave viene inviata correttamente. Il controllo automatico eseguito all'apertura non prolunga la sessione. La verifica della chiave vale solo per la scheda corrente tramite `sessionStorage`, quindi viene richiesta nuovamente dopo la chiusura della sessione browser.

### Pagine protette e ritorno dopo l'accesso

Le future pagine del Mondo Bianco possono usare il guard condiviso prima del proprio JavaScript:

```html
<script type="module" src="../auth-guard.js" data-auth-gateway="../"></script>
```

Il tag va inserito prima dello script specifico della pagina. Il guard nasconde il contenuto durante il rapido controllo iniziale e pubblica la Promise `window.mondoBiancoAuthReady`, che l'entry point della pagina deve attendere. `data-auth-gateway` deve indicare la directory che contiene il Portone; può essere `./`, `../` o un altro percorso relativo in base alla posizione della pagina. Se sessione o Chiave non sono valide, il guard conserva l'indirizzo richiesto e porta all'accesso principale. Dopo login, registrazione o conferma della sola Chiave, il browser torna automaticamente alla pagina iniziale. Sono accettate soltanto destinazioni dello stesso dominio e mai URL sotto `/api/`.

## Media privati (R2)

Il binding `MEDIA` punta al bucket R2 `the-white-world-media`, privato: nessun accesso pubblico o dominio personalizzato, l'unico modo per leggerlo è `GET /api/media/<percorso>`, che verifica la sessione prima di restituire l'oggetto (401 senza sessione valida, 400 su tentativi di path traversal, 404 se l'oggetto non esiste). Il frontend richiama questo endpoint da pagina già protetta dal guard, non serve altra autenticazione lato client.

Convenzione dei percorsi dentro il bucket, per sezione e variante:

```
<sezione>/<identificatore>/original/<file>   # originale conservato integralmente
<sezione>/<identificatore>/web/<file>        # versione ottimizzata per la visualizzazione
<sezione>/<identificatore>/thumb/<file>      # miniatura per gallerie/anteprime
```

Per esempio la Bacheca dei Ricordi userà `bacheca/<periodo>/<giorno>/original|web|thumb/<file>`; l'MP3 bonus delle Cuffiette userà semplicemente `cuffiette/bonus/<file>`. D1 conserva soltanto i percorsi/chiavi da associare ai contenuti, mai i file stessi.

In locale, `wrangler pages dev` emula R2 nello stesso modo di D1; per caricare un oggetto di prova:

```bash
npx wrangler r2 object put the-white-world-media/<percorso> --local --file <file-locale>
```

## La Bacheca dei Ricordi

`content/bacheca.json` (periodi → giorni → foto/testo/link esterni, nell'ordine originale) è ricostruito da `scripts/build-bacheca-content.mjs`, che legge l'HTML congelato dell'export invece del testo semplificato: solo così si recupera l'abbinamento reale tra ogni foto e la sua didascalia (il `<figcaption>` di Notion quando esiste). Lo script assegna anche la chiave R2 definitiva a ogni foto e scrive un manifest locale non pubblicato (`reports/export/bacheca-media-manifest.json`) con la mappa file-sorgente → chiave.

`scripts/upload-bacheca-media.mjs` carica gli originali secondo il manifest (`--local` per l'emulazione di sviluppo, `--remote` di default per il bucket vero). `scripts/build-bacheca-thumbnails.mjs` genera con `sharp` una miniatura da 480px per ogni foto e la carica sotto `.../thumb/`, aggiungendo `thumbKey` a ogni voce di `content/bacheca.json`. Entrambi sono idempotenti: si possono rilanciare in sicurezza.

La pagina `bacheca/` raggruppa le foto consecutive in una griglia con lightbox accessibile (tastiera, swipe, `<dialog>` nativo); i link a video/immagini esterne su Drive restano collegamenti esterni, non embed.

## Database

Le migrazioni sono in `migrations/`:

```bash
npx wrangler d1 migrations apply DB --local
```

Per applicarle al D1 configurato su Cloudflare:

```bash
npx wrangler d1 migrations apply DB --remote
```

Il binding D1 deve chiamarsi `DB`. `WORLD_KEY` deve essere configurata come secret nelle impostazioni del progetto Cloudflare Pages e non deve essere inserita in `wrangler.toml` o nel repository.

## Telemetria

La telemetria usa due endpoint autenticati e non rinnova la durata della sessione:

- `POST /api/telemetry/events`: registra eventi significativi delle diverse sezioni.
- `POST /api/telemetry/word-attempts`: registra i tentativi del cruciverba dopo un secondo di pausa.

La tabella `events` contiene sezione, tipo, versione dello schema, metadati JSON, utente e sessione. Validazione e inserimento SQL sono centralizzati in `recordEvent` dentro `functions/api/_shared/events.js` (`ALLOWED_EVENTS` elenca ogni tipo consentito). Gli eventi che il client può richiedere direttamente devono comparire anche in `CLIENT_EVENT_TYPES` dentro `functions/api/telemetry/events.js`; quelli registrati lato server (dopo una scrittura riuscita, tramite `context.waitUntil`) restano fuori da quella seconda lista apposta, così un client non può fingerli.

Il cruciverba registra `crossword_opened`, `crossword_closed`, `word_completed`, `crossword_completed` e `theme_changed`. La chiusura include durata e progresso, viene inviata una sola volta per apertura e usa una richiesta `keepalive` quando la pagina viene abbandonata.

Il resto del Mondo Bianco usa il client condiviso `assets/js/shared/telemetry.js` (`trackEvent(section, eventType, metadata)`):

- `world_page_opened` parte da sola su ogni pagina che carica `assets/js/world/main.js` (cioè quasi tutte le pagine del mondo): sezione derivata dal primo segmento del percorso, path completo nei metadata. Una pagina nuova risulta già tracciata senza dover toccare questo sistema di nuovo.
- Cuffiette: `song_played` al click che carica il player SoundCloud (è un iframe di terze parti, non possiamo leggere play/pausa/fine reali — il click è il segnale più vicino disponibile); la traccia bonus, essendo audio nativo, usa invece `play`/`ended` veri per `song_played`/`song_completed`; `playlist_link_clicked` sul link alla playlist esterna.
- Lettere, GDR, Suggerimenti: `letter_sent`, `gdr_turn_submitted`, `gdr_character_saved`, `suggestion_sent` sono registrati lato server subito dopo il salvataggio riuscito, con metadata minimi (es. lunghezza del testo o nome dell'avventura) — mai il testo scritto. Gli appunti GDR restano esclusi apposta: si autosalvano a ogni pausa di scrittura, tracciarli sarebbe rumoroso quanto tracciare i tasti.

I tentativi sono separati in `crossword_word_attempts`. Ogni parola usa come `word_id` il proprio numero progressivo nell'array di `data.json`, partendo da 1; non esiste un secondo ordinamento. Le celle interne ancora vuote sono rappresentate da `_`; le celle vuote finali vengono omesse. Il frontend evita richieste duplicate e il backend impedisce comunque inserimenti consecutivi identici per utente e parola.

Il backend legge la soluzione direttamente da `data.json` e calcola accuratezza posizionale, similarità di modifica, completezza e compatibilità complessiva. Un prefisso corretto può quindi avere compatibilità 100% ma completezza inferiore: per esempio `AFFET` rispetto ad `AFFETTO` ha compatibilità 100% e completezza 71,43%.

La tabella `sessions` resta la fonte ufficiale per autenticazione, scadenza e logout. La cronologia permanente registra invece in `events` le azioni `register`, `login_success`, `world_unlocked` e `logout`; `session_id` viene conservato come riferimento storico senza vincolo esterno, quindi gli eventi sopravvivono anche a una futura rimozione delle sessioni. I metadata auth contengono IP, user agent e, quando applicabile, i 7 giorni di validità.

Prima dell'autenticazione, `POST /api/visits` crea una visita anonima identificata dal cookie casuale `noi_visit`. Nel database viene conservato soltanto l'hash del token, insieme a IP, user agent e contesto Cloudflare. Se successivamente avviene login, registrazione o sblocco, `visit_session_links` collega la visita a utente e sessione; in caso contrario il record anonimo resta comunque disponibile.

## Aspetto del cruciverba

Il cruciverba (`tavolo-da-gioco/cruciverba/`) usa la stessa intestazione (`.place-header`/`.place-userbar`, con saluto, selettore tema, link ai Suggerimenti e logout), lo stesso link "torna a..." in fondo alla pagina e lo stesso cielo stellato (`world-atmosphere.css`) di tutte le altre pagine del Mondo Bianco — normalizzato il 09/08/2026, prima aveva una sua intestazione e nessun cielo. Il tema di default è `the-white-world` in `assets/css/themes.css`, ma come tutte le altre pagine è selezionabile (vedi sotto). È l'unica pagina non generata dal template condiviso: ha una shell diversa (`.app-shell`) ed è un caso singolo, non ripetuto, quindi non c'è duplicazione di markup da eliminare lì — l'header/userbar e il wiring del selettore tema restano scritti a mano in quella pagina, tenuti allineati manualmente a `templates/world-page.html`.

## Template delle pagine del Mondo Bianco

Le altre 16 pagine del Mondo Bianco (incluse le 4 del Gioco di Ruolo) sono generate da un template condiviso, invece di avere l'header/userbar/footer copiati a mano in ogni `index.html`:

- `templates/world-page.html`: lo scheletro condiviso (head, `.place-header`/`.place-userbar` con saluto, selettore tema, link Suggerimenti, logout, `<main>`, script comuni).
- `templates/pages/<slug>.content.html`: il contenuto specifico di ogni pagina (quello che va dentro `<main>`); `<slug>.extrabody.html` per markup extra fuori da `<main>` (es. i dialog di Bacheca e Lettere).
- `scripts/world-pages.manifest.mjs`: l'elenco delle pagine con titolo, classi, link "home", CSS/script aggiuntivi.
- `scripts/build-world-pages.mjs`: legge template + manifest + contenuti e riscrive gli `index.html` finali nel repo. Va rilanciato (`node scripts/build-world-pages.mjs`) ogni volta che si tocca il template o un frammento di contenuto; i file generati sono normali file statici, Cloudflare Pages non cambia modo di servirli.

Il selettore tema (5 pallini colorati: Notte/Ocean/Velvet/Red of You/Green of Me, gestito da `assets/js/shared/theme.js`) compare ora nella userbar di tutte queste pagine, con lo stesso `localStorage` già condiviso da sempre tra loro. Cambia subito `--focus-color` e il tint del cielo stellato; i colori hardcoded di ogni pagina non seguono ancora il tema — è un refactoring più profondo, non ancora fatto.

## Progresso persistente

Ogni parola in `data.json` possiede un `id` stabile, indipendente dall'ordine dell'array. Il database conserva esclusivamente lo stato dell'utente nella tabella `crossword_answers`, senza duplicare soluzione, definizione o coordinate.

- `GET /api/crossword/answers`: recupera tutte le risposte dell'utente autenticato.
- `PUT /api/crossword/answers/:wordId`: aggiorna una singola risposta tramite UPSERT.

Il backend legge la soluzione da `data.json` e calcola autonomamente `is_completed` e `completed_at`. Il frontend sincronizza dopo un secondo di pausa, evita valori duplicati e mantiene `localStorage` come fallback. Se il database è ancora vuoto, il progresso locale esistente viene trasferito automaticamente al primo caricamento.

## Proposte per Le Storie

La pagina `storie/` permette all'utente autenticato di lasciare una storia completa oppure un'idea da sviluppare. Il form accetta un titolo facoltativo, il testo, indicazioni sulla musica e indicazioni sulle immagini desiderate; non carica file e non pubblica automaticamente il contenuto.

`POST /api/stories/suggestions` ricava l'autore dalla sessione e assegna la data sul server. Le proposte vengono conservate in `story_suggestions` con stato iniziale `pending`, così possono essere revisionate prima di entrare nella raccolta pubblicata.

## Suggerimenti liberi

La pagina `suggerimenti/` permette all'utente autenticato di proporre qualunque idea per il Mondo Bianco, con una categoria obbligatoria (dove si vorrebbe applicare la modifica: Calendario, Mappa, Storie, Cuffiette, Bacheca, Ponti, Lettere, Tavolo da Gioco o Altro), un titolo facoltativo e un messaggio libero. È raggiungibile dal bottone "Suggerisci" nella pagina 404 interna.

`POST /api/suggestions` ricava l'autore dalla sessione, valida la categoria contro un elenco fisso (`CATEGORIES` in `functions/api/suggestions.js`) e conserva la proposta in `world_suggestions` con stato iniziale `pending`, sullo stesso modello delle proposte per Le Storie.

## Lettere

La pagina `lettere/` sostituisce l'idea originale della Cassetta delle Lettere (un upload manuale su Drive, necessario quando non si poteva chattare normalmente): ora che la comunicazione quotidiana passa da WhatsApp, resta solo il bisogno di lasciarsi un messaggio più lungo e pensato. Chi scrive compone solo testo (nessun allegato per ora); la lettura avviene in una vista dedicata in stile foglio di carta, corsivo, firmata con il nickname dell'autore.

Con soli due account non serve indicare un destinatario: `letters` in D1 conserva autore, testo, data e `read_at`; chi non ha scritto la lettera è per definizione chi la riceve. `GET /api/letters` elenca tutte le lettere con `isMine` calcolato lato server; `POST /api/letters` ne crea una nuova; `POST /api/letters/:id` la segna come letta, ma solo se chi la apre non ne è l'autore. Non è ancora raggiungibile dall'hub principale, per lo stesso motivo dei Suggerimenti: non è uno degli otto luoghi originali del Mondo Bianco.

## Il Prezzo della Verità

L'avventura del Gioco di Ruolo era finora un link esterno a un documento Google usato come "play-by-chat" manuale. Rory ha fornito l'export HTML dei 3 documenti originali (L'Avventura, La Tua Maga, I Tuoi Appunti) più le immagini dei personaggi; ora vivono dentro il sito, in `tavolo-da-gioco/gdr/il-prezzo-della-verita/`:

- `avventura/` — l'incipit completo (mondo, scuola, backstory, i 5 NPC con ritratto) fino all'apertura di Atto I, seguito da un vero thread di gioco: chi legge e il master scrivono i turni in ordine cronologico, salvati in D1 (`gdr_turns`, uno per avventura, condiviso tra i due account) tramite `GET`/`POST /api/gdr/turns`. I ritratti sono immagini pubbliche statiche in `assets/images/gdr/il-prezzo-della-verita/` (arte decorativa generata, non media personale, quindi niente `/api/media/`).
- `la-tua-maga/` — la scheda personaggio, compilabile: nome, gatta, descrizione, statistiche (Mente/Cuore/Corpo/Magia), Punti Stress, slot magia e inventario si salvano in D1 (`gdr_characters`, uno per utente per avventura) tramite `GET`/`POST /api/gdr/character`. Le parti fisse del regolamento (abilità speciali, elenco incantesimi, tabella "Effetti Selvaggi") restano testo di riferimento.
- `i-tuoi-appunti/` — un blocco note reale, salvato in D1 (`gdr_notes`, uno per utente per avventura) tramite `GET`/`POST /api/gdr/notes`, non in localStorage.

Le tre pagine sono collegate da una barra di pillole in cima (`.ipdv-nav`, stesso pattern dell'indice della Bacheca) invece che solo da link in mezzo al testo o da una sidebar fissa.

## Redirect legacy

`_redirects` alla radice del progetto fa da ponte con i vecchi short link `rsgmsfcfm.short.gy/<slug>` dell'export originale: ogni slug (`il-calendario`, `la-mappa`, ecc.) reindirizza con 301 alla route reale corrispondente. `la-bacheca` è 302 e punta temporaneamente a `/mondo-bianco/`, finché quella pagina non è migrata. Short.gy resta un servizio esterno: per usare questi alias bisogna aggiornare manualmente ogni short link perché punti a `https://<dominio>/<slug>` invece del vecchio URL Notion.

## Pagina 404

`404.html` alla radice del progetto viene servita automaticamente da Cloudflare Pages per qualunque URL non esistente, indipendentemente dalla profondità del percorso. Usa esclusivamente percorsi assoluti (`/assets/...`, `/mondo-bianco/`, `/suggerimenti/`) invece che relativi, perché la pagina può essere raggiunta da URL rotti a qualsiasi livello di annidamento. Non richiede autenticazione propria: il bottone di ritorno passa dal guard reale di `/mondo-bianco/`, che riporta l'utente già autenticato dentro l'hub o lo instrada dal Portone se la sessione non è valida.

## Pubblicazione

Collega il repository GitHub a un progetto Cloudflare Pages. Non è necessario un comando di build; la directory di output è la root del repository. Prima del primo utilizzo:

1. collega il database D1 al binding `DB`;
2. configura il secret `WORLD_KEY`;
3. applica le migrazioni al database remoto;
4. esegui un nuovo deployment.

GitHub Pages da solo non può eseguire l'autenticazione, le Pages Functions o D1.

## Analisi dell'export originale

L'export Notion resta immutato e viene analizzato senza dipendenze aggiuntive:

```bash
npm run analyze:export
npm run verify:links
```

I testi puliti delle pagine vengono salvati e versionati in `content/original/`, così restano disponibili su ogni computer. Inventario tecnico e verifica dei collegamenti vengono versionati in `reports/export/`. Il riepilogo leggibile è in `REPORT_VERIFICA_EXPORT.md`.

## File principali

- `data.json`: parole, definizioni, coordinate e ordine narrativo.
- `index.html`: Portone e interfaccia di autenticazione.
- `mondo-bianco/index.html`: home autenticata del Mondo Bianco.
- `assets/css/themes.css`: variabili e quattro temi condivisi dalla piattaforma.
- `assets/css/components/`: componenti condivisi, come shell e accesso.
- `assets/css/pages/`: stile specifico delle singole pagine e dei luoghi.
- `assets/js/world/main.js`: inizializzazione condivisa delle pagine del Mondo Bianco.
- `content/calendar.json`, `content/stories.json`, `content/map.json`, `content/music.json`: raccolte statiche ordinate direttamente dalla posizione nell'array.
- `scripts/build-music-content.mjs`: ricostruisce i nove brani e le citazioni delle Cuffiette dalla fonte originale congelata, senza correggerne il testo.
- `tavolo-da-gioco/cruciverba/index.html`: pagina del cruciverba.
- `assets/js/crossword/main.js`: entry point e interfaccia del cruciverba.
- `assets/js/shared/`: autenticazione, API, navigazione, visite e temi riutilizzabili.
- `auth-guard.js`: protezione riutilizzabile e ritorno alla pagina richiesta dopo l'accesso.
- `functions/api/auth/`: API di registrazione, login e sessione.
- `functions/api/crossword/`: API dello stato persistente del cruciverba.
- `functions/api/telemetry/`: eventi generali e cronologia dei tentativi.
- `functions/api/stories/`: ricezione autenticata delle proposte per nuove storie.
- `functions/api/suggestions.js`: ricezione autenticata dei suggerimenti liberi per il Mondo Bianco.
- `functions/api/letters.js`, `functions/api/letters/[id].js`: elenco/scrittura delle lettere e conferma di lettura.
- `functions/api/gdr/notes.js`: lettura/salvataggio del blocco appunti personale per le avventure del Gioco di Ruolo.
- `functions/api/gdr/character.js`: lettura/salvataggio della scheda personaggio compilabile.
- `functions/api/gdr/turns.js`: lettura/scrittura del thread di gioco condiviso (i turni del play-by-chat).
- `tavolo-da-gioco/gdr/il-prezzo-della-verita/`: hub dell'avventura, con le sotto-pagine `avventura/`, `la-tua-maga/`, `i-tuoi-appunti/`.
- `assets/js/gdr/`: logica delle pagine dell'avventura (scheda personaggio, thread di gioco).
- `functions/api/media/[[path]].js`: accesso autenticato ai media privati conservati in R2.
- `content/bacheca.json`: struttura della Bacheca dei Ricordi, con chiavi R2 di foto e miniature.
- `scripts/build-bacheca-content.mjs`, `scripts/upload-bacheca-media.mjs`, `scripts/build-bacheca-thumbnails.mjs`: ricostruzione della struttura, import degli originali e generazione miniature per la Bacheca.
- `scripts/optimize-world-images.mjs`: converte in WebP (qualità 82, tramite `sharp`) le immagini hero/decorative pubbliche (`assets/images/world/`, `assets/images/gdr/`), lasciando intatti gli originali PNG/JPG accanto al file ottimizzato. Idempotente: si può rilanciare in sicurezza dopo aver aggiunto nuove immagini in quelle cartelle.
- `404.html`: pagina non trovata, servita automaticamente da Cloudflare Pages con percorsi assoluti.
- `_redirects`: alias verso le nuove route per i vecchi short link controllabili.
- `migrations/`: schema D1 per utenti, sessioni, IP di accesso e telemetria.
- `wrangler.toml`: configurazione Cloudflare e binding D1.
- `final-message.json`: contenuto della schermata finale.
