# Il Mondo Bianco

Cruciverba personalizzato con frontend HTML/CSS/JavaScript e autenticazione tramite Cloudflare Pages Functions e D1.

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

Apri l'indirizzo mostrato da Wrangler, normalmente `http://localhost:8788`.

## Autenticazione

Gli endpoint sono organizzati in `functions/api/auth/`:

- `POST /api/auth/register`: registra un nuovo utente e crea una sessione.
- `POST /api/auth/login`: verifica email, password e chiave, poi crea una sessione.
- `GET /api/auth/session`: controlla se il token è ancora valido.
- `POST /api/auth/session`: con token valido, verifica nuovamente la chiave.

Il token originale viene inviato in un cookie `HttpOnly`; D1 conserva soltanto il suo hash. La sessione scade dopo 7 giorni e viene rinnovata per altri 7 giorni soltanto quando la chiave viene inviata correttamente. Il controllo automatico eseguito all'apertura non prolunga la sessione. La verifica della chiave vale solo per la scheda corrente tramite `sessionStorage`, quindi viene richiesta nuovamente dopo la chiusura della sessione browser.

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

## Pubblicazione

Collega il repository GitHub a un progetto Cloudflare Pages. Non è necessario un comando di build; la directory di output è la root del repository. Prima del primo utilizzo:

1. collega il database D1 al binding `DB`;
2. configura il secret `WORLD_KEY`;
3. applica le migrazioni al database remoto;
4. esegui un nuovo deployment.

GitHub Pages da solo non può eseguire l'autenticazione, le Pages Functions o D1.

## File principali

- `data.json`: parole, definizioni, coordinate e ordine narrativo.
- `style.css`: grafica, temi e layout responsive.
- `app.js`: cruciverba, interfaccia e client di autenticazione.
- `functions/api/auth/`: API di registrazione, login e sessione.
- `migrations/`: schema D1 per utenti, sessioni e IP di accesso.
- `wrangler.toml`: configurazione Cloudflare e binding D1.
- `final-message.json`: contenuto della schermata finale.
