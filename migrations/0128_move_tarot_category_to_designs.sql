-- Un set di tipo "tarocchi" rappresenta ora un mazzo completo (es. Tarocchi Goth).
-- La sezione e l'eventuale numero appartengono invece alla singola carta.
ALTER TABLE carte_designs ADD COLUMN categoria_tarocco TEXT
  CHECK (categoria_tarocco IS NULL OR categoria_tarocco IN ('maggiori', 'bastoni', 'coppe', 'spade', 'denari', 'speciali'));
ALTER TABLE carte_designs ADD COLUMN numero_tarocco TEXT;

-- Conserva la classificazione di eventuali Tarocchi creati col modello precedente.
UPDATE carte_designs
SET categoria_tarocco = COALESCE(
  (SELECT s.categoria_tarocco FROM carte_sets s WHERE s.id = carte_designs.set_id),
  'speciali'
)
WHERE set_id IN (SELECT id FROM carte_sets WHERE COALESCE(tipo, 'normale') = 'tarocchi');

-- La vecchia categoria sul set non viene piu usata: il set e il mazzo.
UPDATE carte_sets SET categoria_tarocco = NULL WHERE COALESCE(tipo, 'normale') = 'tarocchi';
