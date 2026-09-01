# Il Mondo Bianco

Applicazione del Mondo Bianco con frontend Angular, autenticazione tramite Cloudflare Pages Functions e dati su D1. Il precedente frontend HTML/JavaScript è conservato in `legacy-archive/` soltanto per confronti e ripristini durante il cutover.

## Avvio locale

Installa le dipendenze, prepara la chiave locale e applica le migrazioni:

```bash
npm install
npm --prefix web install
cp .dev.vars.example .dev.vars
npx wrangler d1 migrations apply DB --local
```

Modifica `WORLD_KEY` dentro `.dev.vars`.

**Un solo comando** (consigliato): avvia backend e frontend insieme, build compresa:

```bash
npm run dev
```

**Oppure, due terminali separati** (utile per vedere i log dei due processi divisi): nel primo il backend —

```bash
npm run build
npm run dev:api
```

— nel secondo Angular:

```bash
npm start
```

Apri `http://localhost:4201`. Angular inoltra `/api/**` al backend locale su `http://localhost:8788` tramite `web/proxy.conf.json`; la porta 8788 non è il frontend di sviluppo.

### Porte fisse, per non ritrovarsi processi in conflitto

`4201` (frontend) e `8788` (backend) sono fissate in `web/angular.json` e negli script sopra:
non usare mai `ng serve` senza `--port`, altrimenti si torna alla porta di default (`4200`) e
si rischia di avviare una seconda istanza in conflitto con quella già aperta in un altro
terminale. Il backend resta uno solo condiviso su `8788` (non ha senso duplicarlo, è la stessa
app/DB). Una sessione di Claude Code che ha bisogno di una propria istanza del frontend per
verificare qualcosa (screenshot, test end-to-end) usa invece `4202`
(`ng serve --port 4202`, stesso `proxy.conf.json`, punta comunque a `8788`) — mai `4201`, per
non interferire con un server che l'utente potrebbe avere già aperto.

## Autenticazione

Gli endpoint sono organizzati in `functions/api/auth/`:

- `POST /api/auth/register`: registra il secondo e ultimo account principale e crea una sessione. Il nickname è scelto liberamente in fase di registrazione (facoltativo: se vuoto, resta la parte dell'email prima della chiocciola). La preferenza `notify_email_updates` è impostabile solo qui, non al login, perché prima dell'autenticazione non si conosce ancora l'utente per pre-spuntarla correttamente; salva solo la preferenza, l'invio delle email non è implementato.
- `POST /api/auth/login`: verifica email, password e chiave, poi crea una sessione.
- `GET /api/auth/session`: controlla se il token è ancora valido.
- `POST /api/auth/session`: con token valido, verifica nuovamente la chiave.

Il token originale viene inviato in un cookie `HttpOnly`; D1 conserva soltanto il suo hash. La sessione scade dopo 7 giorni e viene rinnovata per altri 7 giorni soltanto quando la chiave viene inviata correttamente. Il controllo automatico eseguito all'apertura non prolunga la sessione. La verifica della chiave vale solo per la scheda corrente tramite `sessionStorage`, quindi viene richiesta nuovamente dopo la chiusura della sessione browser.

### Account di prova e rollback

`identity` (`lui`/`lei`) è soltanto una label narrativa. Proprietà e autorizzazioni usano sempre
`users.id`; anche carte, bustine, streak e scambi appartengono quindi all'account preciso.

Con Modalità admin attiva, `POST /api/auth/test-account` crea un account marcato `is_test=1` e
`GET /api/auth/test-account` li elenca. Un account test può scrivere soltanto dati personali o
additivi esplicitamente annullabili: chat e relativi allegati, lettere, turni e appunti GDR,
cruciverba, suggerimenti e bustine. Scambi, contenuti editoriali e impostazioni condivise sono
bloccati. `POST /api/auth/test-account/:id/reset` elimina sessioni, telemetria, ricevute di lettura,
dati personali e oggetti R2 della chat, conservando account e credenziali; `DELETE
/api/auth/test-account/:id` esegue la stessa pulizia e poi elimina definitivamente l'account.
Entrambe le operazioni sono disponibili nel Profilo con Modalità admin attiva.

### Pagine protette e ritorno dopo l'accesso

Le route protette sono raccolte sotto `authGuard` in `web/src/app/app.routes.ts`. Se sessione o Chiave della scheda non sono valide, il Router conserva la destinazione richiesta e torna al Portone; dopo login, registrazione o conferma della Chiave riprende la navigazione originale. Sono accettate soltanto destinazioni dello stesso dominio e mai URL sotto `/api/`.

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

Periodi e giorni vivono in D1 (`bacheca_periods` e `bacheca_days`). Ogni giorno conserva il
proprio layout validato come JSON, mentre l'interfaccia amministrativa espone soltanto un editor
visuale per righe, colonne e blocchi. Foto, video e audio vengono caricati direttamente nel
bucket R2 privato tramite uno stream autenticato; le miniature fotografiche sono generate nel
browser. La pagina mantiene il lightbox accessibile con tastiera e swipe.

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

Il frontend usa `TelemetryService` in `web/src/app/core/telemetry.service.ts`:

- `world_page_opened` parte dalla shell condivisa per le pagine del mondo: sezione derivata dal primo segmento del percorso e path completo nei metadata.
- Cuffiette: `song_played` al click che carica il player SoundCloud (è un iframe di terze parti, non possiamo leggere play/pausa/fine reali — il click è il segnale più vicino disponibile); la traccia bonus, essendo audio nativo, usa invece `play`/`ended` veri per `song_played`/`song_completed`; `playlist_link_clicked` sul link alla playlist esterna.
- Lettere, GDR, Suggerimenti: `letter_sent`, `gdr_turn_submitted`, `gdr_character_saved`, `suggestion_sent` sono registrati lato server subito dopo il salvataggio riuscito, con metadata minimi (es. lunghezza del testo o nome dell'avventura) — mai il testo scritto. Gli appunti GDR restano esclusi apposta: si autosalvano a ogni pausa di scrittura, tracciarli sarebbe rumoroso quanto tracciare i tasti.

I tentativi sono separati in `crossword_word_attempts`. Ogni parola usa come `word_id` il proprio ID nella tabella `crossword_words`. Le celle interne ancora vuote sono rappresentate da `_`; le celle vuote finali vengono omesse. Il frontend evita richieste duplicate e il backend impedisce comunque inserimenti consecutivi identici per utente e parola.

Il backend legge la soluzione da `crossword_words` e calcola accuratezza posizionale, similarità di modifica, completezza e compatibilità complessiva. Un prefisso corretto può quindi avere compatibilità 100% ma completezza inferiore: per esempio `AFFET` rispetto ad `AFFETTO` ha compatibilità 100% ma completezza 71,43%.

La tabella `sessions` resta la fonte ufficiale per autenticazione, scadenza e logout. La cronologia permanente registra invece in `events` le azioni `register`, `login_success`, `world_unlocked` e `logout`; `session_id` viene conservato come riferimento storico senza vincolo esterno, quindi gli eventi sopravvivono anche a una futura rimozione delle sessioni. I metadata auth contengono IP, user agent e, quando applicabile, i 7 giorni di validità.

Prima dell'autenticazione, `POST /api/visits` crea una visita anonima identificata dal cookie casuale `noi_visit`. Nel database viene conservato soltanto l'hash del token, insieme a IP, user agent e contesto Cloudflare. Se successivamente avviene login, registrazione o sblocco, `visit_session_links` collega la visita a utente e sessione; in caso contrario il record anonimo resta comunque disponibile.

## Aspetto del cruciverba

Il cruciverba (`/tavolo-da-gioco/cruciverba`) usa `AppShell`, lo stesso cielo stellato e gli stessi temi delle altre pagine. La UI specifica è suddivisa nei componenti sotto `web/src/app/pages/cruciverba/`; logica, persistenza, sincronizzazione e telemetria vivono nel `CrosswordService`. Il CSS specifico resta `web/src/styles/pages/crossword.css`, caricato direttamente dal componente Angular.

## Struttura delle pagine Angular

Le route lazy sono dichiarate in `web/src/app/app.routes.ts`. Ogni pagina usa `AppShell` per header, userbar, temi e logout; i contenuti vivono in `web/src/app/pages/`, mentre servizi e componenti trasversali sono in `web/src/app/core/` e `web/src/app/shared/`. Il vecchio sistema di template e gli HTML generati sono congelati in `legacy-archive/` e non fanno parte della build.

Bottoni e card hanno classi condivise in `web/src/styles/components/buttons.css` (`.btn`, con i modifier `.btn-accent` per il colore oro ricorrente e `.btn-submit` per i bottoni di invio nei form) e `web/src/styles/components/cards.css` (`.card` per il pannello "frost" scuro, `.card--compact` per le righe di lista, `.card--paper` per l'inserto a foglio chiaro usato in Calendario e Mappamondo, `.card--dialog` per le finestre modali).

Il selettore tema (Night Sky/Ocean/Velvet/Red of You/Green of Me) vive in Impostazioni del Mondo ed è gestito da `ThemeService`. La scelta è condivisa tramite `world_settings`; `localStorage` conserva l'ultimo valore noto per applicarlo prima del primo paint. Cambia subito `--focus-color` e il tint del cielo stellato.

## Progresso persistente

Ogni parola vive in `crossword_words` con ID, soluzione, definizione, coordinate, direzione e posizione. Lo stato del singolo utente resta separato in `crossword_answers`.

- `GET /api/crossword/answers`: recupera tutte le risposte dell'utente autenticato.
- `PUT /api/crossword/answers/:wordId`: aggiorna una singola risposta tramite UPSERT.

Il backend legge la soluzione da `crossword_words` e calcola autonomamente `is_completed` e `completed_at`. Il frontend sincronizza dopo un secondo di pausa, evita valori duplicati e mantiene `localStorage` come fallback. Se il database è ancora vuoto, il progresso locale esistente viene trasferito automaticamente al primo caricamento.

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

- `avventura/` — l'incipit completo (mondo, scuola, backstory, i 5 NPC con ritratto) fino all'apertura di Atto I, seguito da un vero thread di gioco: chi legge e il master scrivono i turni in ordine cronologico, salvati in D1 (`gdr_turns`, uno per avventura, condiviso tra i due account) tramite `GET`/`POST /api/gdr/turns`. I ritratti sono immagini pubbliche statiche in `web/public/assets/images/gdr/il-prezzo-della-verita/` (arte decorativa generata, non media personale, quindi niente `/api/media/`).
- `la-tua-maga/` — la scheda personaggio, compilabile: nome, gatta, descrizione, statistiche (Mente/Cuore/Corpo/Magia), Punti Stress, slot magia e inventario si salvano in D1 (`gdr_characters`, uno per utente per avventura) tramite `GET`/`POST /api/gdr/character`. Le parti fisse del regolamento (abilità speciali, elenco incantesimi, tabella "Effetti Selvaggi") restano testo di riferimento.
- `i-tuoi-appunti/` — un blocco note reale, salvato in D1 (`gdr_notes`, uno per utente per avventura) tramite `GET`/`POST /api/gdr/notes`, non in localStorage.

Le tre pagine sono collegate da una barra di pillole in cima (`.ipdv-nav`, stesso pattern dell'indice della Bacheca) invece che solo da link in mezzo al testo o da una sidebar fissa.

## Redirect legacy

`web/public/_redirects` fa da ponte con i vecchi short link `rsgmsfcfm.short.gy/<slug>` dell'export originale: ogni slug (`il-calendario`, `la-mappa`, `la-bacheca`, ecc.) reindirizza con 301 alla route Angular corrispondente. Short.gy resta un servizio esterno: per usare questi alias bisogna aggiornare manualmente ogni short link perché punti a `https://<dominio>/<slug>` invece del vecchio URL Notion.

## Pagina 404

Le route sconosciute sono gestite dalla route wildcard Angular, che mostra la pagina 404 interna e mantiene i collegamenti al Mondo Bianco e ai suggerimenti. Il fallback SPA di Cloudflare Pages serve `index.html` anche sugli URL sconosciuti; la vecchia `404.html` resta in `legacy-archive/` soltanto come riferimento reversibile.

## Pubblicazione

Collega il repository GitHub a Cloudflare Pages usando `npm run build` come comando di build e `web/dist/web/browser` come directory di output. Prima del primo utilizzo:

1. collega il database D1 al binding `DB`;
2. configura il secret `WORLD_KEY`;
3. applica le migrazioni al database remoto;
4. esegui un nuovo deployment.

### Avviso di nuova versione in diretta

La build aggiunge `CF_PAGES_COMMIT_SHA` all'HTML e a `/build-version.json`. Dopo ogni push su
`main`, il workflow `.github/workflows/notify-deployment.yml` aspetta che quel commit sia davvero
servito da `https://il-mondo-bianco.com`, quindi chiama `POST /api/deploy-notify`: la Function
verifica a sua volta che il commit coincida con `/build-version.json`, pubblica
`site-version:changed` sul canale realtime e i client della vecchia build mostrano subito “Ho
aggiornato il Mondo Bianco”. L'endpoint non richiede secret perché può annunciare soltanto una
versione realmente online; eventi ripetuti vengono ignorati dal client. Il controllo HTTP ogni
cinque minuti e al ritorno sulla scheda resta attivo come fallback.

GitHub Pages da solo non può eseguire l'autenticazione, le Pages Functions o D1.

## Realtime passivo

L'infrastruttura WebSocket è predisposta e collegata ai flussi selezionati, ma rimane passiva
finché Worker e binding non vengono pubblicati.
Il Worker separato `the-white-world-realtime` ospita il Durable Object SQLite-backed
`RealtimeRoom`; Pages espone `/api/realtime`, autenticato con la sessione esistente, e Angular
dispone di `RealtimeService`. L'app lo avvia solo se l'endpoint conferma che il binding è attivo.

Le API REST e D1 restano la fonte ufficiale. Quando un flusso verrà abilitato, la relativa
Function potrà chiamare `notifyRealtime()` soltanto dopo il salvataggio riuscito e il browser
ricevente usera' l'evento come segnale per ricaricare i dati tramite il normale endpoint GET.

Sono già collegati al canale, ma restano inattivi finché manca il binding: Ponti Chat (nuovi
messaggi, eliminazioni e letture), Stranger Chat, i turni delle due avventure GDR, Lettere
(invio e lettura), proposte/risposte agli scambi di carte e Impostazioni del Mondo condivise.
L'evento contiene l'utente che ha originato la modifica, così la sua stessa scheda non esegue
un secondo caricamento ridondante.

Per validare e pubblicare il Worker:

```bash
npm run check:realtime
npm run deploy:realtime
```

Il binding Pages è configurato sia per l'ambiente principale sia per `env.production`:

```toml
[[durable_objects.bindings]]
name = "REALTIME"
class_name = "RealtimeRoom"
script_name = "the-white-world-realtime"
```

Se il binding non è disponibile, `/api/realtime` risponde intenzionalmente con `503` e il resto
del sito non è coinvolto. Lo sviluppo locale completo richiede due terminali:
`npm run dev:realtime` e, dopo la build, `npm run dev:api:realtime`; Angular continua a usare
il normale `npm start`.

## Analisi dell'export originale

L'export Notion resta immutato e viene analizzato senza dipendenze aggiuntive:

```bash
npm run analyze:export
npm run verify:links
```

I testi puliti delle pagine vengono salvati e versionati in `sources/notion-original/`, così restano disponibili senza essere pubblicati insieme all'app. Inventario tecnico, verifica dei collegamenti e riepilogo leggibile sono conservati in `sources/migration-reports/`; il manifest operativo della Bacheca si trova in `sources/manifests/`.

## File principali

- `functions/api/crossword-words/`: gestione amministrativa di parole, definizioni, coordinate e ordine del Cruciverba.
- `web/src/app/portone/`: Portone e interfaccia di autenticazione.
- `web/src/app/pages/`: pagine lazy del Mondo Bianco.
- `web/src/styles/themes.css`: variabili e temi condivisi dalla piattaforma.
- `web/src/styles/components/`: primitive CSS condivise, come shell, accesso, bottoni e form.
- `web/src/styles/pages/`: stile specifico delle singole pagine e dei luoghi.
- `web/public/content/`: raccolte statiche pubbliche ordinate direttamente dalla posizione nell'array.
- `sources/`: fonti originali, immagini sostituite, report di migrazione e manifest non pubblicati.
- `scripts/build-music-content.mjs`: ricostruisce i nove brani e le citazioni delle Cuffiette dalla fonte originale congelata, senza correggerne il testo.
- `web/src/app/pages/cruciverba/`: componenti e servizio del cruciverba.
- `web/src/app/core/`, `web/src/app/shared/`: autenticazione, API, navigazione, visite, temi e UI condivisa.
- `functions/api/auth/`: API di registrazione, login e sessione.
- `functions/api/crossword/`: API dello stato persistente del cruciverba.
- `functions/api/telemetry/`: eventi generali e cronologia dei tentativi.
- `functions/api/stories/`: ricezione autenticata delle proposte per nuove storie.
- `functions/api/suggestions.js`: ricezione autenticata dei suggerimenti liberi per il Mondo Bianco.
- `functions/api/letters.js`, `functions/api/letters/[id].js`: elenco/scrittura delle lettere e conferma di lettura.
- `functions/api/gdr/notes.js`: lettura/salvataggio del blocco appunti personale per le avventure del Gioco di Ruolo.
- `functions/api/gdr/character.js`: lettura/salvataggio della scheda personaggio compilabile.
- `functions/api/gdr/turns.js`: lettura/scrittura del thread di gioco condiviso (i turni del play-by-chat).
- `web/src/app/pages/{gdr,il-prezzo-della-verita,avventura,la-tua-maga,i-tuoi-appunti}/`: hub e pagine dell'avventura.
- `functions/api/media/[[path]].js`: accesso autenticato ai media privati conservati in R2.
- `functions/api/bacheca-periods/`, `functions/api/bacheca-days/`, `functions/api/bacheca-media/`: contenuti modificabili e upload R2 della Bacheca.
- `scripts/optimize-world-images.mjs`: converte in WebP (qualità 82, tramite `sharp`) le immagini hero/decorative pubbliche (`web/public/assets/images/world/`, `web/public/assets/images/gdr/`), lasciando intatti gli originali PNG/JPG accanto al file ottimizzato. Idempotente: si può rilanciare in sicurezza dopo aver aggiunto nuove immagini in quelle cartelle.
- `legacy-archive/`: frontend vanilla congelato e non pubblicato, mantenuto temporaneamente per confronti e rollback.
- `web/public/_redirects`: alias verso le nuove route per i vecchi short link controllabili.
- `migrations/`: schema D1 per utenti, sessioni, IP di accesso e telemetria.
- `wrangler.toml`: configurazione Cloudflare e binding D1.
- `final-message.json`: contenuto della schermata finale.
