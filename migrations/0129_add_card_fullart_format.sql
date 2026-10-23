ALTER TABLE carte_designs ADD COLUMN formato TEXT NOT NULL DEFAULT 'classica'
  CHECK (formato IN ('classica', 'fullart'));

UPDATE carte_designs
SET formato = 'fullart'
WHERE set_id IN (
  SELECT id FROM carte_sets WHERE COALESCE(tipo, 'normale') = 'tarocchi'
);
