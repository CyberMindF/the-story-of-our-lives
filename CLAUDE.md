# Il Mondo Bianco — convenzioni di progetto

## Zero codice duplicato

Regola fissata il 09/08/2026: la duplicazione di codice (HTML, CSS, JS) deve tendere il più possibile a zero. Se lo stesso markup, la stessa regola CSS o la stessa logica dovrebbero ripetersi identici su più pagine, vanno estratti in qualcosa di condiviso invece di essere copiati e incollati.

**Contesto**: il sito è HTML statico senza alcun sistema di template — ogni pagina contiene l'header/footer copiato per intero. Questo ha già causato lavoro ripetitivo concreto (es. aggiungere un'icona alla barra utente condivisa ha richiesto modificare 15 file uno per uno).

**Come applicarla**:
- CSS/JS condivisi: già esiste il pattern giusto in `assets/css/components/` e `assets/js/shared/` — usarlo prima di duplicare uno stile o una funzione in un file di pagina.
- HTML condiviso (header, footer, pattern ripetuti tra pagine): se non esiste ancora un sistema di include/template, valutarne l'introduzione prima di copiare di nuovo la stessa struttura su una nuova pagina — vedi la voce aperta in `CHECKLIST_MIGRAZIONE_MONDO_BIANCO.md`.

Vedi `CHECKLIST_MIGRAZIONE_MONDO_BIANCO.md` per lo stato attuale del progetto e le cose ancora aperte.
