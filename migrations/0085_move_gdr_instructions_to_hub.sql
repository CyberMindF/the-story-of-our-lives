-- La pagina di atterraggio "Il Prezzo della Verità" viene ritirata (conteneva solo questo
-- testo + un link, le regole erano già state spostate nel pannello): il testo si sposta
-- nella pagina hub del Gioco di Ruolo, riscritto in versione generica (valida per qualunque
-- avventura, non solo la prima) invece di crearne uno nuovo e lasciare quello vecchio
-- orfano. Stesso content_entries.id, stessa cronologia — solo chiave/etichetta/corpo
-- aggiornati (versioning_mode 'replace': il corpo vive direttamente sulla riga, non in
-- content_versions).
UPDATE content_entries
SET content_key = 'gdr.istruzioni',
    label = 'Gioco di Ruolo — come iniziare',
    body = 'Scegli un''avventura qui sotto, leggi la prima parte e fai la tua mossa. Dentro trovi anche la tua scheda e i tuoi appunti, nel pannello in basso.',
    updated_at = CURRENT_TIMESTAMP
WHERE content_key = 'gdr.prezzo-verita.conclusione-regole';
