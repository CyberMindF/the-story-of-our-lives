-- Il bulk storico maggio/luglio caricava soltanto gli originali. Aggiunge il thumbKey a ogni
-- foto importata con la struttura /original/ dopo che le relative miniature sono state
-- generate e caricate in R2. La ricerca avviene sulla chiave, non sulla posizione del blocco:
-- eventuali riordinamenti fatti dall'editor restano quindi intatti.
UPDATE bacheca_days AS target
SET content = (
  WITH RECURSIVE patched(content, remaining) AS (
    SELECT target.content, 150
    UNION ALL
    SELECT json_set(
      content,
      (
        SELECT j.fullkey || '.thumbKey'
        FROM json_tree(content) AS j
        WHERE j.type = 'object'
          AND json_extract(j.value, '$.type') = 'photo'
          AND json_extract(j.value, '$.thumbKey') IS NULL
          AND json_extract(j.value, '$.key') LIKE 'bacheca/%/original/%'
        LIMIT 1
      ),
      replace((
        SELECT json_extract(j.value, '$.key')
        FROM json_tree(content) AS j
        WHERE j.type = 'object'
          AND json_extract(j.value, '$.type') = 'photo'
          AND json_extract(j.value, '$.thumbKey') IS NULL
          AND json_extract(j.value, '$.key') LIKE 'bacheca/%/original/%'
        LIMIT 1
      ), '/original/', '/thumb/')
    ), remaining - 1
    FROM patched
    WHERE remaining > 0
      AND EXISTS (
        SELECT 1
        FROM json_tree(content) AS j
        WHERE j.type = 'object'
          AND json_extract(j.value, '$.type') = 'photo'
          AND json_extract(j.value, '$.thumbKey') IS NULL
          AND json_extract(j.value, '$.key') LIKE 'bacheca/%/original/%'
      )
  )
  SELECT content FROM patched ORDER BY remaining ASC LIMIT 1
)
WHERE EXISTS (
  SELECT 1
  FROM json_tree(target.content) AS j
  WHERE j.type = 'object'
    AND json_extract(j.value, '$.type') = 'photo'
    AND json_extract(j.value, '$.thumbKey') IS NULL
    AND json_extract(j.value, '$.key') LIKE 'bacheca/%/original/%'
);
