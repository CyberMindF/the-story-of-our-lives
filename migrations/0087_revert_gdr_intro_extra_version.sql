-- Rory non voleva una nuova versione ("Versione 2") con il testo aggiunto in coda: voleva la
-- versione 1 modificata in loco. Annullata la modifica: la versione nuova viene eliminata e
-- l'entry torna a puntare alla versione originale, l'unica rimasta. (Ripensarci come modifica
-- in-place della versione 1, se richiesto, sarà una migrazione separata quando Rory deciderà
-- il testo esatto.)
UPDATE content_entries
SET current_version_id = (
      SELECT id FROM content_versions
      WHERE entry_id = content_entries.id
      ORDER BY id ASC LIMIT 1
    ),
    updated_at = CURRENT_TIMESTAMP
WHERE content_key = 'gdr.introduzione';

DELETE FROM content_versions
WHERE entry_id = (SELECT id FROM content_entries WHERE content_key = 'gdr.introduzione')
  AND id NOT IN (SELECT current_version_id FROM content_entries WHERE content_key = 'gdr.introduzione');
