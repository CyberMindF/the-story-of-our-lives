ALTER TABLE letters ADD COLUMN updated_at TEXT;

CREATE TABLE letter_drafts (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL
);
