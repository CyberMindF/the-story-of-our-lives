-- Aula studio: cartelle annidate condivise per organizzare gli argomenti.
CREATE TABLE study_folders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  parent_id INTEGER,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 120),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  -- Le cartelle sono condivise: se sparisce il creatore, il contenuto resta disponibile.
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (parent_id) REFERENCES study_folders(id) ON DELETE RESTRICT
);

ALTER TABLE study_topics ADD COLUMN folder_id INTEGER
  REFERENCES study_folders(id) ON DELETE RESTRICT;

ALTER TABLE study_topics ADD COLUMN deleted_at TEXT;

CREATE INDEX idx_study_folders_parent_name
  ON study_folders(parent_id, name COLLATE NOCASE);

CREATE INDEX idx_study_topics_folder_updated
  ON study_topics(folder_id, updated_at DESC);

CREATE INDEX idx_study_topics_deleted_at
  ON study_topics(deleted_at);

CREATE INDEX idx_study_folders_deleted_at
  ON study_folders(deleted_at);
