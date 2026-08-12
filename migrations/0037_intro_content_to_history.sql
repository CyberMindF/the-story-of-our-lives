-- Fase 4 del CMS (planning editor contenuti.md): l'inventario in "inventario contenuti CMS.md"
-- raccomanda 'history' per i messaggi personali legati a un momento preciso — la migrazione
-- 0036 li aveva seedati come 'replace' per assunzione, non per una scelta esplicita. Converte
-- le 4 chiavi già migrate: crea la prima versione a partire dal body attuale e libera
-- content_entries.body, che per i contenuti 'history' non è la fonte del valore corrente
-- (lo è content_versions via current_version_id, vedi functions/api/content/[key].js).
INSERT INTO content_versions (entry_id, body, author_id, created_at)
SELECT id, body, created_by, created_at
FROM content_entries
WHERE content_key IN (
  'mondo-bianco.benvenuta',
  'calendario.introduzione',
  'lettere.introduzione',
  'cose-insieme.introduzione'
);

UPDATE content_entries
SET
  versioning_mode = 'history',
  current_version_id = (
    SELECT id FROM content_versions WHERE entry_id = content_entries.id ORDER BY id DESC LIMIT 1
  ),
  body = NULL
WHERE content_key IN (
  'mondo-bianco.benvenuta',
  'calendario.introduzione',
  'lettere.introduzione',
  'cose-insieme.introduzione'
);
