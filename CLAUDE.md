# Il Mondo Bianco — convenzioni di progetto

## Zero codice duplicato

Regola fissata il 09/08/2026: la duplicazione di codice (HTML, CSS, JS) deve tendere il più possibile a zero. Se lo stesso markup, la stessa regola CSS o la stessa logica dovrebbero ripetersi identici su più pagine, vanno estratti in qualcosa di condiviso invece di essere copiati e incollati.

**Contesto**: il frontend attivo è la SPA Angular in `web/`. Il precedente sito HTML/JavaScript è conservato solo come riferimento reversibile in `legacy-archive/` e non deve essere importato o pubblicato. Prima della migrazione, aggiungere un'icona alla barra utente aveva richiesto modificare 15 file: è il caso concreto che ha motivato questa regola. In Angular la shell comune vive in `web/src/app/shell/`, la logica condivisa in `web/src/app/core/` e `web/src/app/shared/`, le pagine in `web/src/app/pages/`.

**Come applicarla**:
- CSS condiviso: usare prima `assets/css/components/`; bottoni e card hanno già le classi comuni in `buttons.css` e `cards.css`. I CSS di pagina in `assets/css/pages/` sono ancora sorgenti attivi caricati dai componenti Angular.
- UI e logica condivise: usare `AppShell`, i componenti in `web/src/app/shared/` e i servizi in `web/src/app/core/`; non copiare header, userbar, autenticazione, temi o telemetria nei componenti pagina.
- `legacy-archive/` è sola documentazione storica: non correggere il nuovo frontend importando codice da lì. Se serve recuperare un comportamento, portarlo esplicitamente in TypeScript e verificarlo.

Vedi `prossimi sviluppi.md` per le cose ancora aperte sul progetto.
