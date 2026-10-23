-- I Tarocchi sono una famiglia separata dalle carte normali, non una nuova finitura.
-- Un set puo quindi appartenere al mazzo normale oppure a una delle cinque sezioni del
-- mazzo dei Tarocchi; le otto finiture esistenti continuano ad applicarsi a entrambe.
ALTER TABLE carte_sets ADD COLUMN tipo TEXT NOT NULL DEFAULT 'normale'
  CHECK (tipo IN ('normale', 'tarocchi'));
ALTER TABLE carte_sets ADD COLUMN categoria_tarocco TEXT
  CHECK (categoria_tarocco IS NULL OR categoria_tarocco IN ('maggiori', 'bastoni', 'coppe', 'spade', 'denari'));

-- Le evocazioni si trovano aprendo bustine normali. bustine_senza_evocazione alimenta la
-- protezione dalla sfortuna: con sette aperture consecutive a vuoto, l'ottava e garantita.
ALTER TABLE carte_bustine ADD COLUMN evocazioni_disponibili INTEGER NOT NULL DEFAULT 0
  CHECK (evocazioni_disponibili >= 0);
ALTER TABLE carte_bustine ADD COLUMN bustine_senza_evocazione INTEGER NOT NULL DEFAULT 0
  CHECK (bustine_senza_evocazione >= 0);

-- Un'evocazione propone fino a tre Tarocchi e ne lascia scegliere esattamente uno. L'offerta
-- resta nel database se la finestra viene chiusa o la pagina viene ricaricata, per non
-- consumare mai un'evocazione senza consegnare la carta.
CREATE TABLE carte_evocazioni_offerte (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stato TEXT NOT NULL DEFAULT 'aperta' CHECK (stato IN ('aperta', 'scelta')),
  created_at TEXT NOT NULL
);

CREATE UNIQUE INDEX idx_carte_evocazioni_offerta_aperta
  ON carte_evocazioni_offerte(user_id) WHERE stato = 'aperta';

CREATE TABLE carte_evocazioni_candidati (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  offerta_id TEXT NOT NULL REFERENCES carte_evocazioni_offerte(id) ON DELETE CASCADE,
  design_id INTEGER NOT NULL REFERENCES carte_designs(id) ON DELETE CASCADE,
  finitura TEXT NOT NULL CHECK (finitura IN ('flat', 'argento', 'oro', 'onice', 'smeraldo', 'rubino', 'zaffiro', 'diamante')),
  position INTEGER NOT NULL CHECK (position BETWEEN 0 AND 2),
  UNIQUE(offerta_id, design_id),
  UNIQUE(offerta_id, position)
);

CREATE INDEX idx_carte_evocazioni_candidati_offerta
  ON carte_evocazioni_candidati(offerta_id, position);
