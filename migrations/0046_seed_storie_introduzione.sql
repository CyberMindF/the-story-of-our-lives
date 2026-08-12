-- Fase 4 del CMS: storie.introduzione, rimasta in JSON fino a oggi perché migrarla da sola
-- senza la raccolta avrebbe creato confusione (regola di zero duplicazione, CLAUDE.md) — ora che
-- la raccolta ha il suo editor (0044/0045), la migro insieme. 'history' come raccomandato
-- dall'inventario per i messaggi personali datati.
INSERT INTO content_entries (content_key, label, content_type, versioning_mode, created_by, created_at, updated_at)
SELECT 'storie.introduzione', 'Storie — introduzione', 'plain_text', 'history', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO content_versions (entry_id, body, author_id, created_at)
SELECT ce.id, 'Spero che pian piano questa pagina si possa riempire delle nostre storie, speranze, sogni, anche quelli a occhi aperti. Spero tanto che qualche altra storia potremmo ancora scriverla insieme. Ovviamente sono solo storie, quindi suppongo che si possa sognare', ce.created_by, ce.created_at
FROM content_entries ce WHERE ce.content_key = 'storie.introduzione';

UPDATE content_entries
SET current_version_id = (SELECT id FROM content_versions WHERE entry_id = content_entries.id ORDER BY id DESC LIMIT 1)
WHERE content_key = 'storie.introduzione';
