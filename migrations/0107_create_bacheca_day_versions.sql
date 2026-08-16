-- Storico automatico della Bacheca: prima di ogni modifica o eliminazione viene conservata
-- una copia completa del giorno. day_id non ha una FK intenzionalmente, così lo storico
-- sopravvive anche se il giorno originale viene eliminato.
CREATE TABLE IF NOT EXISTS bacheca_day_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  day_id INTEGER NOT NULL,
  period_id TEXT NOT NULL,
  slug TEXT NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  memory_date TEXT,
  action TEXT NOT NULL CHECK (action IN ('update', 'delete')),
  saved_by INTEGER,
  created_at TEXT NOT NULL,
  FOREIGN KEY (saved_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_bacheca_day_versions_day_created
  ON bacheca_day_versions(day_id, created_at DESC);
