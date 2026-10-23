-- Ricrea la tabella per rimuovere il CHECK da 2.000 caratteri senza perdere i commenti già salvati.
CREATE TABLE love_counter_episodes_expanded (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  delta INTEGER NOT NULL CHECK (delta IN (-2, -1, 1, 2)),
  reason TEXT NOT NULL DEFAULT '' CHECK (length(reason) <= 2000),
  occurred_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT,
  psychologist_comment TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (user_id, id)
);

INSERT INTO love_counter_episodes_expanded
  (user_id, id, delta, reason, occurred_at, created_at, revision, deleted_at, psychologist_comment)
SELECT user_id, id, delta, reason, occurred_at, created_at, revision, deleted_at, psychologist_comment
FROM love_counter_episodes;

DROP TABLE love_counter_episodes;
ALTER TABLE love_counter_episodes_expanded RENAME TO love_counter_episodes;
CREATE INDEX love_counter_timeline ON love_counter_episodes(user_id, occurred_at, created_at);
