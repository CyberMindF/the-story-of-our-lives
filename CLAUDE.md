# Il Mondo Bianco — convenzioni di progetto

## Zero codice duplicato

Regola fissata il 09/08/2026: la duplicazione di codice (HTML, CSS, JS) deve tendere il più possibile a zero. Se lo stesso markup, la stessa regola CSS o la stessa logica dovrebbero ripetersi identici su più pagine, vanno estratti in qualcosa di condiviso invece di essere copiati e incollati.

**Contesto**: il sito è HTML statico. Da 09/08/2026 le 16 pagine del Mondo Bianco (tutte tranne il cruciverba) sono generate da un template condiviso invece che copiate a mano — vedi `templates/world-page.html`, `templates/pages/*.content.html` e `scripts/build-world-pages.mjs` (dettagli nel README, sezione "Template delle pagine del Mondo Bianco"). Prima di questo sistema, aggiungere un'icona alla barra utente condivisa aveva richiesto modificare 15 file uno per uno — è il caso concreto che ha motivato la regola.

**Come applicarla**:
- CSS/JS condivisi: già esiste il pattern giusto in `assets/css/components/` e `assets/js/shared/` — usarlo prima di duplicare uno stile o una funzione in un file di pagina.
- HTML condiviso tra le pagine del Mondo Bianco: non copiare più header/userbar/footer a mano — aggiungere/modificare la pagina nel template (`templates/world-page.html` + un file in `templates/pages/`), aggiornare `scripts/world-pages.manifest.mjs`, poi rilanciare `node scripts/build-world-pages.mjs`. Il cruciverba resta l'unica eccezione voluta (shell diversa, pagina singola, nessuna duplicazione da eliminare lì).

Vedi `prossimi sviluppi.md` per le cose ancora aperte sul progetto.
