-- Rory ha corretto la posizione: il "come iniziare" (scegli un'avventura, parti da
-- "L'Avventura", trovi scheda/appunti nel pannello) va nel testo introduttivo in cima alla
-- pagina, non in un blocco separato sotto le card — è lì che lo spiegava già nella vecchia
-- pagina di atterraggio, solo più elaborato del riassunto secco della migrazione precedente.
-- Aggiunto come nuovo paragrafo finale di gdr.introduzione (versioning_mode 'history': nuova
-- versione, non sovrascrive la precedente). L'entry gdr.istruzioni (nata dalla migrazione
-- 0085) non serve più: il testo confluisce qui, quindi viene rimossa invece di restare
-- un'entry orfana e inutilizzata.
INSERT INTO content_versions (entry_id, body, author_id, created_at)
SELECT ce.id,
  cv.body || char(10) || char(10) || 'Bene adesso che sai tutto, direi che è tutto pronto! Non ti resta che scegliere un''avventura qui sotto, leggere la prima parte — parti sempre da "L''Avventura" — e fare la tua mossa. Trovi anche la tua scheda e i tuoi appunti nel pannello in basso, dentro l''avventura. Buon divertimento allora! (dai ormai ho fatto tutto 👀)',
  u.id, CURRENT_TIMESTAMP
FROM content_entries ce
JOIN content_versions cv ON cv.id = ce.current_version_id
JOIN users u ON u.email = 'rory982011@gmail.com'
WHERE ce.content_key = 'gdr.introduzione';

UPDATE content_entries
SET current_version_id = (SELECT id FROM content_versions WHERE entry_id = content_entries.id ORDER BY id DESC LIMIT 1),
    updated_at = CURRENT_TIMESTAMP
WHERE content_key = 'gdr.introduzione';

DELETE FROM content_entries WHERE content_key = 'gdr.istruzioni';
