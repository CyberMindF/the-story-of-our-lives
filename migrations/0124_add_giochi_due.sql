-- Stato separato per coppia e attività. La versione protegge le azioni simultanee.
CREATE TABLE IF NOT EXISTS giochi_due (
  pair_key TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('trappole', 'frequenze', 'nuvola')),
  version INTEGER NOT NULL DEFAULT 0,
  state_json TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (pair_key, kind)
);
