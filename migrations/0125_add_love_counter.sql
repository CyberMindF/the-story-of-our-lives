-- Utility personale: nessun dato condiviso fra amministratori.
CREATE TABLE love_counter_settings (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  initial_score INTEGER NOT NULL DEFAULT 20,
  created_at TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE love_counter_episodes (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  delta INTEGER NOT NULL CHECK (delta IN (-2, -1, 1, 2)),
  reason TEXT NOT NULL DEFAULT '' CHECK (length(reason) <= 2000),
  occurred_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT,
  PRIMARY KEY (user_id, id)
);
CREATE INDEX love_counter_timeline ON love_counter_episodes(user_id, occurred_at, created_at);
