# Migrazione Angular — stato di avanzamento (aggiornato ad ogni passo, non a fine lavoro)

> Il porting funzionale e' concluso. Il refactoring successivo e' tracciato separatamente in
> `ANGULAR_COMPONENTIZATION_PROGRESS.md`.
> Durante quel refactoring `asset-root` e i symlink pubblici sono stati rimossi: i riferimenti
> alle vecchie posizioni nelle fasi sottostanti descrivono soltanto la storia della migrazione.

> Se stai riprendendo questo lavoro (Claude, Codex o chiunque altro): leggi questo file per primo.
> È pensato per essere autosufficiente — non presuppone accesso alla cronologia della chat né a
> `~/.claude/plans/` (fuori dal repo, potrebbe non essere visibile al tuo tool). Dopo aver letto
> questo file, esegui `git status` e `git log --oneline -10` per confermare lo stato reale su
> disco prima di continuare, poi riprendi dal primo checkbox non spuntato.

## Piano di riferimento

Piano completo approvato dall'utente, con contesto/decisioni architetturali/rischi/tabella
riuso-riscrittura-eliminazione: `~/.claude/plans/sorted-leaping-heron.md` (se non accessibile,
il riassunto qui sotto e le sezioni "Decisioni fissate" bastano per continuare in sicurezza).

**Obiettivo**: migrare il frontend statico HTML/CSS/JS a una SPA Angular, backend Cloudflare
(Functions + D1 + R2) invariato al 100%. Niente server Node in produzione: build Angular
statica in `dist/`, pubblicata da Cloudflare Pages.

## Decisioni fissate (non rimetterle in discussione senza un buon motivo)

- Angular **standalone**, niente NgModules, niente SSR/SSG (`ng new` con SSR disattivato esplicitamente).
- Stato: `signal`/`computed` nei servizi, niente NgRx/Akita.
- **CSS semplice, non SCSS** — deciso esplicitamente con l'utente (il sistema di temi usa già CSS custom properties, SCSS darebbe solo leggibilità non funzionalità mancante). I file `assets/css/**` si spostano quasi invariati.
- Routing Angular con gli stessi path di oggi (`/mondo-bianco`, `/ponti`, ecc.), lazy-loaded.
- `authGuard` funzionale al posto del trucco CSS di `auth-guard.js`.
- Proxy dev (`proxy.conf.json`) verso `wrangler pages dev` (porta 8788) per `/api/*`, `/data.json`, `/content/*` — necessario per i cookie `SameSite=Strict`.
- Cruciverba (`assets/js/crossword/main.js`, 1564 righe): **porting fedele**, non riscrittura idiomatica da zero. Migrato per ultimo, da solo.
- Password in chiaro lato server: notato, **confermato accettabile dall'utente**, backend fuori perimetro — nessuna azione.
- Lavoro su branch dedicato `feat/angular-migration`, `main` resta il sito statico attuale fino al cutover finale (merge).

## Ordine delle fasi (dal piano)

1. Scaffold Angular + build pipeline (nessuna pagina reale) — **IN CORSO, vedi checklist sotto**
2. Servizi core + shell (`AppShellComponent`, `ThemeService`, porting di `assets/js/shared/*`)
3. Autenticazione (`AuthService`, `authGuard`, `PortoneComponent`) — verificare a fondo contro il backend reale prima di andare oltre
4. Routing + pagine semplici (mondo-bianco, ponti, suggerimenti, calendario, cuffiette, gdr hub/avventura/maga)
5. Pagine medie (storie, mappa, bacheca, lettere, i-tuoi-appunti)
6. Cruciverba (da solo, sessione dedicata)
7. Pulizia finale (rimuovere `templates/`, `scripts/build-world-pages.mjs`, `scripts/world-pages.manifest.mjs`, vecchie pagine statiche)
8. Cutover: merge su `main`

## Checklist Fase 1 — Scaffold — **COMPLETATA**

- [x] Verificato prerequisito Node: locale era v24.14.1, sotto il minimo Angular CLI (richiede 24.15.0+/22.22.3+)
- [x] Installata Node v24.19.0 via `nvm install 24.19.0` (nvm già presente sulla macchina). **Non toccato l'alias `default` globale di nvm** — resta v24.14.1 per il resto del sistema; questo progetto deve usare 24.19.0 esplicitamente (`nvm use 24.19.0`, automatico se il tuo nvm ha `nvm use` che legge `.nvmrc`, altrimenti farlo a mano prima di ogni comando `npx ng ...`).
- [x] Creato branch `feat/angular-migration` da `main` (`git checkout -b`). Le modifiche non committate (refactoring bottoni/card di una sessione precedente) sono passate col working tree, nessuna perdita di lavoro; non è stato fatto nessun commit non richiesto — restano non committate anche su questo branch.
- [x] `.nvmrc` creato a livello repo (root), contenuto `24.19.0`.
- [x] Scaffold Angular creato in `web/`: `npx @angular/cli@latest new web --routing --style=css --ssr=false --skip-git --defaults` (CLI 22.1.3). `--skip-git` per non annidare un secondo repo git dentro `web/`. Standard "2025 file naming style guide": file si chiamano `app.ts`/`app.html`/`app.config.ts`/`app.routes.ts` (non `app.component.ts` ecc.) — è il default della versione installata, non una scelta nostra.
- [x] `web/angular.json`: asset passthrough configurato — **dettaglio tecnico importante da ricordare**: Angular CLI **rifiuta** path `input` con `../` (errore: "asset path must be within the workspace root"). Soluzione usata: symlink dentro `web/`, non path relativi verso l'alto nel config:
  - `web/public/content -> ../../content` (simlink di directory, dentro `public/`, preso dal glob di default `**/*`)
  - `web/public/assets/images -> ../../../assets/images` (idem, dentro `public/assets/`)
  - `web/asset-root -> ..` (symlink alla **root del repo**, ma messo FUORI da `public/`, a livello di `web/`, apposta — se fosse dentro `public/` il glob `**/*` di default ci ricadrebbe dentro e troverebbe `web/` di nuovo dentro se stesso, loop) — usato con due entry dedicate e a glob stretto (`"glob": "data.json"`, `"glob": "favicon.svg"`, entrambe `"input": "asset-root", "output": "/"`) per `data.json` e `favicon.svg` (file sciolti nella root del repo, non dentro una cartella dedicata).
  - **Perché non ho semplicemente symlinkato `data.json`/`favicon.svg` come file singoli dentro `public/`**: testato, non funziona in modo affidabile — un symlink che è ESSO STESSO l'entry finale del glob (non una directory attraversata) finisce nel build output ancora come symlink con un **path assoluto della macchina locale** (es. `/Users/rory.cannata/Desktop/cruciverba/data.json`), che si romperebbe su qualunque altra macchina/ambiente di build (Cloudflare Pages). Invece un symlink di **directory** che il glob attraversa per arrivare a file reali dentro, viene dereferenziato correttamente e i file reali vengono copiati per davvero. Da qui la scelta di avvolgere `data.json`/`favicon.svg` dentro la directory-symlink `asset-root` invece di symlinkarli direttamente.
  - Verificato con build reale: `web/dist/web/browser/data.json` e `.../favicon.svg` sono file reali (stessa dimensione dei sorgenti), non symlink; `content/*.json` e `assets/images/**` idem.
  - **Nota per il deploy reale**: questi sono symlink Git-tracciati (git li salva come blob mode 120000, non li deferenzia) — dovrebbero risolvere correttamente anche dopo un checkout fresco su Cloudflare Pages, ma **non ancora verificato su una build Cloudflare Pages reale** (serve un push del branch + una build in preview per confermarlo). Rischio aperto, vedi sezione Rischi/prossimi passi.
- [x] `web/proxy.conf.json` creato: **solo** `/api` → `http://localhost:8788` (non `/data.json`/`/content`: questi li serve già direttamente `ng serve` dagli stessi symlink in `public/`, esattamente come farà poi la build di produzione — nessun bisogno di proxy per quelli, a differenza di quanto ipotizzato nel piano originale). Collegato in `web/angular.json` → `architect.serve.options.proxyConfig`.
- [x] `wrangler.toml`: `pages_build_output_dir` aggiornato a `"web/dist/web/browser"` (path confermato da una build reale). **Nota**: questo valore governa `wrangler pages dev`/`wrangler pages deploy` da CLI quando non si passa una directory esplicita — **non cambia da solo il comportamento del deploy di produzione oggi**, che è guidato dalle impostazioni della dashboard Cloudflare Pages (build command/output directory), non toccate da qui e non toccabili da questa sessione (serve accesso alla dashboard dell'utente). Il sito statico attuale in produzione **non è stato toccato**.
- [x] Verifica end-to-end fatta: `ng build` (produzione, config di default) completa in ~1s, 39MB di output (soprattutto immagini). Avviato un secondo `wrangler pages dev web/dist/web/browser --port 8789` (porta diversa da 8788 per non toccare il dev server dell'utente già in esecuzione su 8788) puntato alla dist generata: `/` (200, shell Angular), `/data.json` (200), `/content/bacheca.json` (200), `/assets/images/world` (200), `/favicon.svg` (200), `/api/auth/session` (**401 JSON `{"authenticated":false}`, come atteso da utente non loggato — conferma che le Functions esistenti rispondono invariate contro lo stesso binding D1**). Processo di verifica poi terminato (non lasciato in background).

## File/cartelle nuovi creati finora

- `.nvmrc` (root repo)
- `web/` — intero scaffold Angular (CLI 22.1.3), incluso `web/angular.json`, `web/proxy.conf.json`, `web/src/**`, `web/public/**` (con i symlink sopra descritti), `web/asset-root` (symlink)
- `wrangler.toml` — modificata solo la riga `pages_build_output_dir`

## Rischi aperti / verifiche non ancora fatte

- **Symlink su build Cloudflare Pages reale**: non testato oltre la macchina locale. Prima di fidarsi ciecamente in Fase 2+, va fatto un push del branch e controllata la preview build di Cloudflare Pages (o quantomeno chiesto conferma esplicita all'utente prima di eseguire `git push`, che è un'azione visibile/condivisa — non ancora fatta in questa sessione).
- Non ancora toccato `web/src/index.html` (titolo "Web" di default, favicon.ico invece di favicon.svg, `lang="en"`) — rimandato apposta alla Fase 2 (shell), insieme al resto della UI condivisa.
- Cartelle vuote `assets/js/hub/` e `assets/js/mappamondo/` (segnalate nella ricognizione) — ancora da verificare puntualmente cosa gira davvero su quelle pagine prima della Fase 4/5.

## Checklist Fase 2 — Servizi core + shell — **COMPLETATA**

- [x] `web/src/app/core/api.service.ts` — porting fedele di `assets/js/shared/api.js` (`readApiResponse`, `sendAuthenticatedJson`). **Decisione presa qui, diversa dal piano originale**: il piano ipotizzava `HttpClient` con un interceptor per centralizzare `credentials`. Ho tenuto `fetch()` diretto come nell'originale invece — più fedele, meno rischio, e alcune opzioni usate oggi (`keepalive: true` su `sendAuthenticatedJson`) non hanno un equivalente diretto/pulito in `HttpClient`. Nessun `provideHttpClient` aggiunto in `app.config.ts` per ora: non serve finché tutti i servizi restano fetch-based. Se in una fase successiva servisse davvero `HttpClient` (es. per interceptor più sofisticati), si aggiunge allora, non prima.
- [x] `web/src/app/core/theme.service.ts` — porting di `assets/js/shared/theme.js`: stessi 5 temi, stessa `storageKey` (`noi-crossword-theme-v15`, **condivisa con le pagine vanilla ancora live** così il tema scelto resta coerente durante tutta la migrazione), stessa applicazione (`document.body.dataset.theme`). Stato esposto come `signal<string>` invece che riletto dal DOM dei bottoni.
- [x] `web/src/app/core/navigation.service.ts` — porting fedele di `assets/js/shared/navigation.js` (return-target post-login, `getSafeReturnTarget` con gli stessi controlli di sicurezza). **Nota lasciata nel file**: `returnToRequestedDestination()` usa ancora `window.location.replace` (reload pieno) come l'originale — da sostituire con `router.navigateByUrl` nella Fase 3, quando il router guida davvero la navigazione.
- [x] `web/src/app/core/telemetry.service.ts` — porting fedele di `telemetry.js` (dipende da `ApiService`).
- [x] `web/src/app/core/visits.service.ts` — porting fedele di `visits.js`.
- [x] `web/src/app/shared/world-stars.ts` (componente `<app-world-stars>`) — porting di `world-atmosphere.js`: stesse 150 stelle, stesse custom property CSS (`--star-x/--star-y/--star-size/--star-opacity`), generate una volta alla creazione del componente. Montato nel componente root (`app.html`), non nella shell — replica il comportamento originale dove le stelle comparivano su ogni pagina `world-atmosphere` **incluso il Portone**, non solo le pagine protette.
- [x] `web/src/app/shared/theme-switcher.ts` (componente `<app-theme-switcher>`) — porting della parte visuale di `theme.js` (pallini colorati, stato `is-selected`/`aria-pressed`). **Deviazione nota**: manca il toast mobile ("Tema X" per 2.2s sotto i 640px) — funzione secondaria, rimandata, il cambio tema funziona comunque in pieno.
- [x] CSS globali: `web/angular.json` → `architect.build.options.styles` ora punta a (nell'ordine) `asset-root/assets/css/{themes.css, components/shell.css, components/world-atmosphere.css, components/world-shell.css, components/buttons.css, components/cards.css, components/typography.css}` + `src/styles.css` — stesso ordine di `<link>` di `templates/world-page.html` oggi, via lo stesso trucco del symlink `asset-root` già usato in Fase 1 (nessun file CSS duplicato, singola fonte di verità condivisa col sito vanilla ancora live).
- [x] `web/src/app/shell/app-shell.ts` (componente `<app-shell>`) — sostituisce `templates/world-page.html`: stessa struttura `place-header`/`place-userbar`/`main`, stesse classi CSS. Espone per ora solo gli `@Input` essenziali (`homeHref`, `homeAria`, `homeLabel`, `showSuggestLink`) — gli altri campi del vecchio manifest usati solo da 1-2 pagine (`headerExtraClass`, `homeLinkExtraClass`, `userbarExtraClass`, `shellClass` — servono a mondo-bianco hub e mappamondo) **non ancora aggiunti apposta**: si aggiungono quando quelle pagine specifiche vengono davvero migrate (Fase 4/5), per non indovinare un'interfaccia adesso. Saluto utente e logout sono **segnaposto** (metodo `onLogoutClick()` vuoto con TODO, `userName()` restituisce sempre `null`) — si collegano ad `AuthService` nella Fase 3, non ancora costruito.
- [x] `web/src/app/shell/home-placeholder.ts` — pagina segnaposto **temporanea**, solo per avere qualcosa da vedere nel `<router-outlet>` della shell prima che esistano pagine vere; va rimossa quando la Fase 4 introduce la prima pagina reale.
- [x] `web/src/index.html` — `lang="it"`, titolo "Il Mondo Bianco", favicon → `favicon.svg` (rimosso il `favicon.ico` di default Angular, ora inutile, cancellato da `web/public/`).
- [x] `web/src/app/app.ts`/`app.html` — puliti dal contenuto demo di Angular (il template placeholder "Hello, {{title}}" ecc.), ora solo `<app-world-stars /><router-outlet />`. `web/src/app/app.routes.ts`: una route radice con `AppShell` come componente e `HomePlaceholder` come unico figlio.
- [x] Verifica: `ng build` pulito (1s, nessun warning, type-check strict passato — un typo in un binding di template avrebbe fatto fallire la build). Servito con un terzo `wrangler pages dev ... --port 8790` (poi fermato): `/` risponde con la shell Angular corretta (`<app-root>`, CSS/JS bundle 200), il CSS compilato contiene davvero `.theme-chip`/`.place-shell` con le regole attese, `/api/auth/session` risponde ancora `{"authenticated":false}` invariato. **Non verificato in un vero browser** (niente chromium-cli/playwright disponibile in questo ambiente) — il cambio tema/persistenza localStorage non è stato cliccato a mano, ma la logica è un porting diretto di codice già funzionante, e la build strict di Angular avrebbe segnalato errori di binding.

## File/cartelle nuovi creati in Fase 2

- `web/src/app/core/{api,theme,navigation,telemetry,visits}.service.ts`
- `web/src/app/shared/{world-stars,theme-switcher}.ts`
- `web/src/app/shell/{app-shell,home-placeholder}.ts`
- Modificati: `web/angular.json` (styles), `web/src/index.html`, `web/src/app/{app.ts,app.html,app.routes.ts}`

## Rischi aperti / verifiche non ancora fatte (aggiornato)

- **Symlink su build Cloudflare Pages reale**: ancora non testato oltre la macchina locale (vedi Fase 1) — vale anche per i nuovi symlink CSS in `styles`, stesso meccanismo.
- **Nessuna verifica in browser reale**: tutto il porting Fase 2 è verificato per compilazione/struttura, non cliccato a mano. Da fare non appena possibile (serve un browser reale o l'utente stesso in locale con `ng serve` + `wrangler pages dev` in parallelo secondo `proxy.conf.json`).
- Cartelle vuote `assets/js/hub/` e `assets/js/mappamondo/` — ancora da verificare puntualmente prima della Fase 4/5 (invariato da Fase 1).
- Toast mobile del selettore tema non ancora portato (vedi sopra) — cosmetico, basso rischio.

## Checklist Fase 3 — Autenticazione — **COMPLETATA e verificata contro il backend reale**

- [x] `web/src/app/core/auth.service.ts` — porting fedele di `assets/js/shared/auth.js`, con `currentUser` come `signal<AuthUser|null>` in più (usato da `AppShell` per il saluto e da `authGuard`). Tipo `AuthUser = {id, email, nickname}` confermato **byte per byte contro la risposta reale del backend** (vedi verifica sotto), non indovinato.
- [x] `web/src/app/core/auth.guard.ts` (`authGuard`, `CanActivateFn`) — sostituisce il trucco CSS di `auth-guard.js` (che nascondeva `<html>` finché `window.mondoBiancoAuthReady` non risolveva): qui il Router non attiva la rotta finché la guardia non risolve, stesso risultato senza il workaround. Stessa doppia verifica dell'originale (sessione valida col backend E Chiave confermata in questa scheda via sessionStorage). Su fallimento: `navigationService.rememberCurrentDestination()` + redirect a `/` con `?returnTo=` — stesso meccanismo di prima, via `router.createUrlTree` invece che un reload.
- [x] `web/src/app/core/navigation.service.ts` — aggiunto `consumeRequestedDestination()`: stessa logica di `returnToRequestedDestination()` ma senza il `window.location.replace` finale, per permettere ai chiamanti Angular (Portone) di usare il Router invece di un reload pieno. Il vecchio metodo fedele resta anch'esso nel file (non rimosso, solo non più usato dal flusso Portone).
- [x] `web/src/app/portone/{portone.ts,portone.html}` — porting di `assets/js/shared/access-gate.js` (`createAccessGate`) + `assets/js/portone/main.js`: stessa logica (`initialize`/`submit`/`setMode`), stessi campi form (email/password/nickname/chiave/notifica), stessi messaggi (titolo/testo/etichetta bottone per modalità), stesso comportamento di errore (chiave sbagliata in modalità "key" → torna a "login"). Stato con signal invece di `getAccessElements()` che rileggeva ~20 id dal DOM. CSS invariato: `access-gate.css` + `pages/portone.css` come `styleUrls` del componente (via lo stesso symlink `asset-root`).
  - **Semplificazione intenzionale rispetto all'originale**: sparito tutto il meccanismo `body.access-locked` / `#app-shell[inert]` — nell'originale serviva perché login e contenuto protetto convivevano nello stesso documento HTML nascosto/mostrato a vista; con il Router Angular, il Portone è semplicemente l'unico componente montato finché non si passa a un'altra rotta, quindi quel meccanismo non serve più. Coerente col mandato del piano ("semplificare, non trasporre 1:1").
  - **Deviazione intenzionale**: dopo login/registrazione riuscititi, invece di un reload (`window.location.replace`) si naviga con `Router.navigateByUrl` — niente reload, che è l'intero scopo della migrazione. Stesso fallback dell'originale se non c'è un `returnTo` valido: va a `/mondo-bianco` (**non** a `/`, che è il Portone stesso — bug potenziale corretto durante lo sviluppo, vedi sotto).
  - **Immagine del Portone**: `legacy-export/.../daea9434-....png` (l'immagine narrativa originale) copiata tramite un quarto entry in `web/angular.json` → `assets`, con lo stesso trucco symlink, ma con `output: "legacy/portone"` per evitare di dover gestire l'emoji nel nome cartella (`🌹Il Portone`) lato Angular. **Nota importante, non causata da questa migrazione**: quella cartella (`ExportBlock-fbd237dd-...-Part-1/`) è nel `.gitignore` del repo — non è tracciata da git. Questo vuol dire che anche oggi, su un checkout pulito (es. una build Cloudflare Pages da zero), quell'immagine probabilmente **non esiste già** e il Portone in produzione potrebbe avere l'immagine rotta. Non l'ho toccato (non è nel perimetro della migrazione, è un problema di contenuto pre-esistente) — da segnalare all'utente, non da "risolvere" di nascosto.
- [x] `web/src/app/shell/app-shell.ts` — completata la parte lasciata in sospeso in Fase 2: `userName()` ora legge davvero `authService.currentUser()?.nickname`, `onLogoutClick()` fa il logout vero (porting di `assets/js/world/main.js#logout`: revoca sessione, pulisce sblocco locale e destinazione richiesta, poi torna al Portone — via Router, non reload). Aggiunto anche l'evento di telemetria `world_page_opened` in `ngOnInit` (era in `world/main.js`, mancava dalla Fase 2).
- [x] `web/src/app/app.routes.ts` — `/` → `Portone` (con `pathMatch: 'full'`, **essenziale**: senza, essendo una route senza figli con path vuoto, in matching "prefix" di default avrebbe potuto interferire con il matching delle route sotto `AppShell`); `/mondo-bianco` (dentro `AppShell`, protetta da `authGuard`) → `HomePlaceholder` (ancora segnaposto, diventerà la vera pagina hub in Fase 4).
- [x] **Verifica end-to-end contro il backend reale** (non solo compilazione): avviato `wrangler pages dev` sulla dist Angular (porta 8791, poi fermato), testato via `curl` con cookie jar l'intero flusso reale contro D1 **locale di sviluppo** (non produzione, dati isolati a questa macchina):
  1. `GET /api/auth/session` senza cookie → `{"authenticated":false}` ✓
  2. `POST /api/auth/register` (email di test, chiave `cerchio` da `.dev.vars`) → `{"user":{"id":131,"email":...,"nickname":"TestAngular"},"expiresAt":...}`, cookie impostato ✓ — **forma della risposta confermata identica a quella assunta dal codice TypeScript** (nessun campo `authenticated` nella risposta di register/login, il codice infatti controlla solo `result.user`, non `result.authenticated` — verificato che non ci fosse una dipendenza sbagliata da un campo assente)
  3. `GET /api/auth/session` con cookie → `{"authenticated":true,"user":{...}}` ✓
  4. `POST /api/auth/session` (conferma Chiave) → rinnova, stessa forma ✓
  5. `DELETE /api/auth/session` (logout) → `{"authenticated":false}`, poi verificato che la sessione risulti davvero revocata ✓
  6. `POST /api/auth/login` con password sbagliata → `{"error":"Email o password non corretti."}` ✓ (stesso campo `error` che il codice TypeScript legge)
  7. `POST /api/auth/login` con Chiave sbagliata → `{"error":"Chiave del Mondo non valida."}` ✓
  - **Nota**: questo test ha creato un utente reale di prova (`angular-migration-test@example.com`) nel database D1 **locale** di sviluppo (non in produzione) — dato di test isolato a questa macchina, non ripulito automaticamente, innocuo ma segnalato per trasparenza.
- [ ] **Non ancora verificato**: il flusso completo cliccato a mano in un vero browser (form/bottoni/redirect visti con gli occhi) — stessa limitazione delle fasi precedenti, nessun browser automatizzabile disponibile in questo ambiente. La logica e il contratto col backend sono verificati nel modo più solido possibile senza un browser reale.

## File/cartelle nuovi creati in Fase 3

- `web/src/app/core/{auth.service,auth.guard}.ts`
- `web/src/app/portone/{portone.ts,portone.html}`
- Modificati: `web/src/app/core/navigation.service.ts` (nuovo metodo), `web/src/app/shell/app-shell.ts` (logout/saluto reali), `web/src/app/app.routes.ts`, `web/angular.json` (asset immagine Portone)

## Rischi aperti / verifiche non ancora fatte (aggiornato)

- **Symlink su build Cloudflare Pages reale**: ancora non testato oltre la macchina locale (invariato dalle fasi precedenti).
- **Immagine del Portone probabilmente già rotta in produzione oggi** (cartella Notion export gitignorata) — scoperto durante questa fase, non causato da essa, da segnalare all'utente.
- **Nessuna verifica in browser reale** (invariato) — tutto verificato per compilazione + contratto reale col backend via curl, non cliccato a mano.
- Cartelle vuote `assets/js/hub/` e `assets/js/mappamondo/` — ancora da verificare puntualmente prima della Fase 4/5 (invariato).
- Toast mobile del selettore tema non ancora portato — cosmetico, basso rischio (invariato).
- Utente di test `angular-migration-test@example.com` creato nel D1 locale di sviluppo durante la verifica — innocuo, isolato alla macchina locale, non ripulito.

## Fase 4 — Routing completo + pagine semplici — **IN CORSO** (1 di ~11 pagine fatta)

- [x] **Verificato**: `assets/js/hub/` e `assets/js/mappamondo/` sono cartelle vuote e non referenziate da nessuna voce del manifest (`grep` mirato, zero risultati) — confermato che l'hub del Mondo Bianco e (presumibilmente) il Mappamondo non hanno JS dedicato, girano solo sulla logica condivisa (oggi in `AppShell`). Non c'è altro da investigare qui.
- [x] **Correzione architetturale importante fatta in questa fase**: la bozza di `AppShell` di Fase 2/3 era una route-parent con un unico `<router-outlet>` condiviso — ma nell'originale OGNI pagina genera la propria shell completa con varianti proprie (es. l'hub ha `homeHref="./"`, icona ⭕ invece della freccia "←", classi extra `world-header`/`world-mark`, niente collasso mobile sull'etichetta). Un `<router-outlet>` condiviso non può esprimere questo — **rifatto `AppShell` come componente wrapper riusabile** (`<ng-content>` invece di `<router-outlet>`), con nuovi `@Input`: `homeIcon`, `homeLabelCollapsible`, `shellClass`, `headerExtraClass`, `homeLinkExtraClass` (i campi del vecchio manifest lasciati apposta fuori in Fase 2/3, "da aggiungere quando servono davvero" — è successo ora). Le route ora NON hanno più `AppShell` come componente-route: hanno solo `canActivate: [authGuard]` a livello di gruppo, e ogni pagina include `<app-shell [input...]>...contenuto...</app-shell>` internamente. `HomePlaceholder` rimosso (era temporaneo, sostituito dalla pagina vera).
- [x] `web/src/app/pages/mondo-bianco/{mondo-bianco.ts,mondo-bianco.html}` — porting fedele di `templates/pages/mondo-bianco.content.html` (interamente statico, nessun JS di pagina). Card dei luoghi ora con `routerLink` invece di `href` — **nota**: puntano a path (`/bacheca`, `/ponti`, ecc.) che non esistono ancora come route Angular: 404 finché quella fase non è fatta, comportamento atteso di una migrazione incrementale, non un bug.
- [x] `web/src/app/app.routes.ts` — `/` → `Portone` (`pathMatch: 'full'`); gruppo protetto (`canActivate: [authGuard]`, nessun componente proprio) → `/mondo-bianco` → `MondoBianco`.
- [x] **Bug reale trovato e corretto durante la verifica**: `_redirects` (le regole di alias tipo `/i-ponti → /ponti/`) **non veniva copiato nella cartella di output Angular** (`web/dist/web/browser/`) — Cloudflare Pages (e `wrangler pages dev`) leggono `_redirects` dalla cartella pubblicata, non dalla root del repo dove si lancia il comando. Senza questo, **ogni** richiesta (comprese le regole di alias esistenti) cadeva silenziosamente nel fallback 200-su-tutto di default di Cloudflare Pages, mascherando il problema (sembrava "funzionare" perché tutto tornava 200, ma le regole specifiche non scattavano affatto — verificato: `/i-ponti` tornava 200 invece del 301 atteso). Corretto aggiungendo un quinto entry assets in `web/angular.json` (`glob: "_redirects", input: "asset-root", output: "/"`, stesso trucco symlink). **Verificato dopo la correzione**: `/i-ponti` → 301 a `/ponti/` (regola specifica, corretta), `/mondo-bianco` e `/` → 200 (fallback SPA, corretto), `/api/auth/session` → invariato.
  - In questa stessa correzione ho anche **anticipato dalla Fase 7** l'aggiunta della regola catch-all `/*  /index.html  200` in `_redirects` (root del repo) — necessaria da subito per poter verificare qualunque route oltre alla radice, non solo a fine migrazione. Le regole di alias esistenti restano prioritarie (valutate in ordine, prima corrispondenza vince).
- [x] Verifica end-to-end ripetuta dopo le correzioni: build pulita, server locale (`wrangler pages dev`, porta 8793, poi fermato) con tutte le regole `_redirects` attive e corrette, `/mondo-bianco` risponde con lo shell Angular, API invariata.
- [ ] **Non ancora fatto**: le altre ~10 pagine (Ponti, Suggerimenti, Calendario, Cuffiette, Storie, Mappa, Bacheca, Lettere, Mappamondo, Gioco di Ruolo × 4) e la verifica in un vero browser (invariato dalle fasi precedenti — nessun browser automatizzabile disponibile qui).

## File/cartelle nuovi/modificati in Fase 4 (finora)

- `web/src/app/pages/mondo-bianco/{mondo-bianco.ts,mondo-bianco.html}` (nuovi)
- `web/src/app/shell/app-shell.ts` (riscritto: `<ng-content>` invece di `<router-outlet>`, nuovi `@Input`)
- `web/src/app/app.routes.ts` (riscritto: niente più `AppShell` come componente-route)
- Rimosso: `web/src/app/shell/home-placeholder.ts`
- `web/angular.json` (nuovo entry assets per `_redirects`)
- `_redirects` (root repo — nuova regola catch-all SPA, anticipata dalla Fase 7)

## Fase 4 — **COMPLETATA** (tutte le pagine "semplici" del piano)

Pagine aggiunte in questo blocco, tutte con lo stesso pattern (`<app-shell [input...]>...</app-shell>`, CSS di pagina come `styleUrls` via `asset-root`, `routerLink` al posto di `href` per la navigazione interna):

- **Ponti** (`pages/ponti/`) — interamente statica.
- **Suggerimenti** (`pages/suggerimenti/`) — porting di `assets/js/suggestions/main.js`: invio come `FormData` (non JSON, a differenza degli endpoint auth), `[showSuggestLink]="false"` sulla shell (la pagina non deve linkare se stessa, come nell'originale `hideSuggestLink: true`).
- **Calendario** (`pages/calendario/`) — porting di `assets/js/calendar/main.js`: fetch `content/calendar.json`, stessa validazione (27 date esatte, id univoci, formato data), stesso raggruppamento per anno. La costruzione del DOM cella-per-cella dell'originale (`createElement` a mano) diventa un `@for` dichiarativo nel template — semplificazione naturale, nessuna perdita di comportamento.
- **Cuffiette** (`pages/cuffiette/`) — porting di `assets/js/music/main.js`: player SoundCloud caricato solo al click (mai autoplay), audio bonus sempre da `/api/media/<key>` (mai statico). **Due binding richiedono `DomSanitizer`** (novità rispetto alle pagine precedenti): `[innerHTML]` per il testo con il link "I Ponti" incorporato (`bypassSecurityTrustHtml`) e `[src]` sull'iframe SoundCloud (`bypassSecurityTrustResourceUrl` — `iframe[src]` è "RESOURCE_URL context" per Angular, un binding diretto verrebbe bloccato del tutto, non solo ripulito). L'URL resta comunque costruito da codice nostro, non da input utente diretto.
- **Tavolo da Gioco hub + GDR hub** (`pages/tavolo-da-gioco/`, `pages/gdr/`) — entrambe statiche. GDR hub è il primo caso reale che usa `homeHref`/`homeAria`/`homeLabel` non di default (torna a "Il Tavolo da Gioco", non a "Il Mondo Bianco").
- **Il Prezzo della Verità hub** (`pages/il-prezzo-della-verita/`) — statica (regolamento in un `<details>`).
- **Avventura** (`pages/avventura/`) — porting di `assets/js/gdr/avventura.js` (il thread dei turni, `/api/gdr/turns`) + tutto il testo narrativo statico. Prima pagina con la nav `ipdv-nav` a 3 voci (`routerLinkActive="is-current"` al posto della classe scritta a mano per pagina).
- **La Tua Maga** (`pages/la-tua-maga/`) — porting di `assets/js/gdr/maga.js` (scheda personaggio, `/api/gdr/character`): campi con `[(ngModel)]` invece di riletti dal DOM, totale statistiche come `computed`. **Bug del porting iniziale corretto durante la stesura**: avevo riusato lo stesso signal `fieldsDisabled` sia per il caricamento iniziale sia per il salvataggio, ma l'originale disabilita *tutti* i campi solo al caricamento e *solo il bottone* durante il salvataggio — creato un secondo signal `saving` dedicato per rispettare la differenza.
- **I Tuoi Appunti** (`pages/i-tuoi-appunti/`) — porting dell'unico blocco di logica che nell'originale viveva come script inline dentro `scripts/world-pages.manifest.mjs` invece che in un file `.js` vero (autosave con debounce di 800ms verso `/api/gdr/notes`) — ora finalmente un componente vero.

**Cambio architetturale fatto in blocco a fine fase**: tutte le route sono passate da `component:` (eager) a `loadComponent:` (lazy, `import().then(...)`) — con il bundle iniziale sceso sopra i 500kB (soglia di warning di Angular) man mano che si aggiungevano pagine, e con ancora ~6 pagine e il cruciverba (il pezzo più grande) da aggiungere, il lazy loading era necessario, non solo "meglio averlo". Bundle iniziale sceso da 500.34kB a 321.54kB, ogni pagina il proprio chunk caricato solo alla navigazione.

**Aggiustamento minore**: alzata la soglia di warning "anyComponentStyle" in `web/angular.json` da 4kB a 16kB (errore da 8kB a 32kB) — i CSS di pagina riusati as-is (es. `music.css` 6.1kB, `tavolo.css` 13.7kB) superano di norma la soglia pensata per piccoli stili di componente tipici di un'app Angular scritta da zero; non è un problema reale nel nostro caso (riuso intenzionale di CSS legacy già esistente), solo un falso positivo del budget di default.

**Verifica end-to-end ripetuta contro il backend reale** (non solo compilazione): login con l'utente di test creato in Fase 3, conferma Chiave, poi `GET /api/gdr/character`, `GET /api/gdr/turns` (con dati reali già presenti nel D1 locale da test precedenti dell'utente stesso — "Desy", "Rory", ecc., non creati da me), `GET /api/gdr/notes`, `POST /api/suggestions` (FormData) — **tutte le forme di risposta confermate identiche a quanto assunto dalle interfacce TypeScript**, nessuna sorpresa.

## Fase 5 — pagine "medie" — **COMPLETATA**

Con questa fase **tutte le 16 pagine del Mondo Bianco tranne il cruciverba sono migrate** (Portone + 15 pagine protette, tutte verificate con build pulita e route che rispondono 200). Resta solo la Fase 6 (cruciverba).

- **Storie** (`pages/storie/`) — porting di `assets/js/stories/main.js`: fetch `content/stories.json` (validazione: esattamente 4 storie), apertura di una storia specifica via hash URL (`#story-<id>`) con scroll+focus — lasciata **imperativa** (accesso diretto a `document.getElementById`/`.scrollIntoView`/`.focus()` sull'elemento `<details>` nativo dopo il render, dentro `requestAnimationFrame` come l'originale): non esiste un modo dichiarativo pulito per "apri e porta a vista un elemento nativo del browser dopo che si è appena creato". Video degli accompagnamenti (`videoUrl`) in un iframe con `[src]` — richiede `bypassSecurityTrustResourceUrl` (stesso motivo di Cuffiette).
- **Mappa** (`pages/mappa/`) — porting di `assets/js/map/main.js`: la funzione di proiezione **Equal Earth** (`projectCoordinates`) copiata carattere per carattere, è pura e non aveva bisogno di modifiche. Puntine, anteprima e diario di viaggio completo, tutti derivati con `computed`/mappature una tantum invece della costruzione DOM manuale dell'originale (`createPin`/`createDestination`/`createGallery`/`createNarrative`) — stesso raggruppamento immagini-per-paragrafo, stessa logica "racconto lungo → layout verticale" (`is-long` quando `text.length > 900`).
- **Mappamondo** (`pages/mappamondo/`) — statica (confermato: `assets/js/mappamondo/` è vuota). Testo narrativo lungo (7 scene) riportato **parola per parola** leggendo il sorgente via `sed` invece che fidarsi della memoria della conversazione, proprio perché è un contenuto personale/sentimentale dove un errore di trascrizione sarebbe stato un problema reale, non solo un dettaglio tecnico. Prima pagina a usare `userbarExtraClass` (aggiunto ora come `@Input` su `AppShell`, non c'era ancora) oltre a `headerExtraClass`/`homeLinkExtraClass`/`homeLabelCollapsible`.
- **Bacheca** (`pages/bacheca/`) — porting di `assets/js/bacheca/main.js`: stessa logica di raggruppamento foto/testo adiacenti in "unit" (in entrambi gli ordini), lightbox nativo `<dialog>` con navigazione da tastiera (frecce) e swipe touch, tutte le foto sempre da `/api/media/<key>`. Usato `ngTemplateOutlet` per riusare il template della griglia foto sia standalone sia dentro una "unit", invece di duplicare il blocco `@for` due volte.
- **Lettere** (`pages/lettere/`) — la pagina più delicata di questa fase: porta **l'intera animazione FLIP busta→lettera** (First-Last-Invert-Play, calcolo diretto di `getBoundingClientRect()` e manipolazione di `style.transform`/`transition`/`opacity`) esattamente come nell'originale, senza provare a farla passare per `@angular/animations` — deviazione dal suggerimento originario del piano, decisa perché l'API di Angular Animations è pensata per transizioni enter/leave basate su stato, non per "anima da un elemento reale a un altro sullo schermo"; forzarcela dentro sarebbe stato più lavoro e più rischio della logica già funzionante portata così com'è. Verificato che il D1 locale avesse già molte lettere di test reali scritte a mano dall'utente stesso (test di scroll, rotazione, focus, hover) — buon segno che la funzionalità originale sia già stata testata a fondo, motivo in più per portarla fedele.

**Verifica end-to-end ripetuta contro il backend reale**: build pulita (17 chunk lazy, uno per pagina, nessun warning), tutte le route (`mappa`, `bacheca`, `lettere`, `storie`, `mappamondo`) rispondono 200 tramite il fallback SPA, `GET /api/letters` risponde con dati reali preesistenti nel D1 locale (lettere di test scritte manualmente dall'utente in sessioni precedenti — non create da questa sessione), `POST /api/stories/suggestions` funziona, `content/map.json` e `content/stories.json` raggiungibili con la forma attesa.

## Fase 6 — Cruciverba — **IN CORSO ma già integrato nella SPA**

Stato reale al **9 agosto 2026** dopo questa sessione:

- [x] Aggiunta la route lazy `/tavolo-da-gioco/cruciverba` in `web/src/app/app.routes.ts`.
- [x] Completata la pagina Angular `pages/cruciverba/` attorno al `CrosswordService` già iniziato:
  - `cruciverba.ts` / `cruciverba.html`
  - componenti separati `crossword-grid`, `crossword-clues`, `crossword-toolbar`, `crossword-modals`
- [x] Il `CrosswordService` già presente nel working tree è ora **davvero usato** dalla UI Angular: registra input/scroller/lista definizioni, gestisce selezione parole/celle, autosave localStorage, sync remoto, telemetria, modali, foglio mobile.
- [x] Portata anche la parte globale che nel JS originale non stava “dentro” la griglia ma nel bootstrap della pagina:
  - tracking `crossword_closed` su `pagehide`
  - hook `beforeLogout` passato a `AppShell` per registrare la chiusura anche sul logout
  - gestione viewport mobile/tastiera (`--app-viewport-height`, `--keyboard-offset`, classi `keyboard-open` / `access-keyboard-open`)
  - calcolo dell'altezza peek del drawer definizioni mobile (`--mobile-sheet-peek-height`)
- [x] **Verifica tecnica riuscita**: `source ~/.nvm/nvm.sh && nvm use 24.19.0 && CI=1 NG_FORCE_TTY=0 npx ng build` completa con successo. Il bundle lazy `cruciverba` viene generato (`chunk-DO9twbt1.js`, ~46.8kB raw) e l'output resta in `web/dist/web/browser/`.
- [x] **Verifica browser reale completata in locale** con `wrangler pages dev` + Chrome headless, usando un account creato solo nel D1 locale: caricati titolo, 585 celle e 100 definizioni; inserite tre lettere, ritrovate identiche dopo il refresh; `GET /api/auth/session` 200 autenticato e `GET /api/crossword/answers` 200 con le due risposte parziali realmente persistite dal frontend; modale “Controllare le risposte?” aperta correttamente; nessuna richiesta browser verso `assets/js/**`.
- [x] **Responsive verificato a 390×844**: griglia scrollabile contenuta nel pannello, drawer definizioni visibile e apribile, prima definizione selezionata. La verifica visuale ha trovato e corretto tre bug che la build non poteva rilevare: CSS di pagina non propagato ai sottocomponenti (`ViewEncapsulation.None`), host Angular che interrompevano il layout storico (`display: contents`), bootstrap del focus iniziale anticipato rispetto a dati/vista pronti. Corretto anche il selettore mobile storico `.app-shell` → `.crossword-shell` e reso `<main>` un contenitore flex su mobile; queste ultime correzioni migliorano anche la pagina vanilla finché resta disponibile.
- [x] **Atmosfera globale corretta dopo confronto visivo su Angular `localhost:4200`**: `web/src/index.html` non riportava le classi del `<body>` presenti in ogni pagina vanilla, quindi `world-atmosphere` e le classi specifiche (`world-page`, `tavolo-page`, `music-page`, ecc.) non si attivavano. `App` ora mantiene `world-atmosphere` e applica centralmente le classi dichiarate nei `data` delle route a ogni `NavigationEnd`. Verificato con screenshot reale del Portone: gradiente del cielo e 150 stelle nuovamente visibili; build produzione ancora pulita.
- [ ] Restano da provare su un dispositivo touch reale: apertura della tastiera virtuale e relativo ridimensionamento `visualViewport`; inoltre non sono stati distruttivamente confermati “Cancella tutto” e completamento/rivelazione dell'intera griglia.

## Prossimo passo concreto

Il porting applicativo e il confronto locale sono conclusi. Il prossimo passo condiviso e' la **Fase 8**: merge/push del branch e verifica della preview Cloudflare Pages. Resta consigliata, ma non bloccante per il porting, una passata su un dispositivo touch reale per tastiera virtuale e `visualViewport`.

## Fase 7 — Archivio reversibile del frontend vanilla — **COMPLETATA**

Su scelta dell'utente, la pulizia non cancella subito i sorgenti sostituiti: li sposta in `legacy-archive/`, mantenendo la struttura originale per confronti e rollback. Dal punto di vista dei riferimenti runtime i vecchi percorsi sono assenti, ma i file restano recuperabili fino a dopo il cutover.

- [x] Archiviati root vanilla (`index.html`, `404.html`, `auth-guard.js`), tutte le cartelle delle pagine statiche, `templates/`, `scripts/build-world-pages.mjs`, `scripts/world-pages.manifest.mjs` e l'intero `assets/js/`.
- [x] La vecchia `404.html` resta archiviata; il suo stile e contenuto sono stati portati in una route wildcard Angular pubblica. Tutti i CSS di pagina e componente attivi sono caricati da `styleUrls` o da `web/angular.json`.
- [x] Aggiunto `legacy-archive/README.md`; aggiornati `README.md`, `CLAUDE.md` e gli script root per descrivere Angular come frontend corrente (`npm start`, `npm run build`, `npm run dev:api`).
- [x] Build dalla root riuscita dopo lo spostamento. Verificato che `web/dist/web/browser/` non contenga `legacy-archive`, `assets/js`, `auth-guard.js` o `404.html`.
- [x] Verifica production-like con Wrangler sulla dist: 8 redirect validi e nessuna regola ignorata; `/`, `/mondo-bianco` e `/tavolo-da-gioco/cruciverba` rispondono 200; `/la-bacheca` risponde 301 verso `/bacheca/`; `/api/auth/session` risponde 401 JSON da utente anonimo. I vecchi URL di file restituiscono la shell SPA (`text/html`, hash identico a `/`), non i contenuti archiviati.
- [x] Rimosso il catch-all manuale ciclico `/* /index.html 200`: la documentazione Cloudflare corrente conferma che Pages riconosce automaticamente una SPA dalla presenza di `index.html` e assenza di `404.html` nella directory pubblicata.
- [x] Confronto browser sistematico contro l'archivio: legacy `34/34` e Angular `36/36` (17 pagine protette + 404, desktop/mobile), senza errori console/rete, immagini rotte o overflow orizzontale. Gli screenshot campionati risultano visualmente equivalenti; sfondo e 150 stelle sono presenti.
- [x] Build produzione con Node 24.19.0 e verifica Wrangler della dist: 8 redirect validi, route/fallback 200, alias 301, API anonima 401 JSON e zero file legacy nell'output.
- [x] Controllo link esterni con `scripts/verify-external-links.mjs`: `36/36` raggiungibili con risposta 200; report in `reports/export/external-links-verification.json`.
- [ ] Test su dispositivo touch reale del cruciverba (tastiera virtuale e `visualViewport`); resta una verifica hardware consigliata, non un pezzo di frontend ancora da portare.

Dopo questa fase: **Fase 8** (cutover: merge su `main` e preview/deploy Cloudflare). L'eventuale eliminazione definitiva di `legacy-archive/` avverra' solo in un commit successivo e separato.

**Promemoria per chi riprende**: nessun `git push` è stato fatto in questa sessione (resta tutto locale sul branch `feat/angular-migration`) — la verifica su una build Cloudflare Pages reale (non solo locale) resta da fare, e richiede un push esplicito che non ho fatto autonomamente essendo un'azione visibile/condivisa.
