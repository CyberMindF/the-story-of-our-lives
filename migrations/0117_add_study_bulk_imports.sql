-- Identifica un import per renderlo atomico e impedire doppi invii.
CREATE TABLE study_imports (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  idempotency_key TEXT NOT NULL,
  source_hash TEXT NOT NULL,
  summary_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  UNIQUE (user_id, idempotency_key)
);

-- Le posizioni collegano cartelle e argomenti creati nello stesso batch D1,
-- prima che il chiamante possa conoscerne gli ID autoincrementali.
ALTER TABLE study_folders ADD COLUMN source_import_id TEXT;
ALTER TABLE study_folders ADD COLUMN source_import_position INTEGER;
ALTER TABLE study_topics ADD COLUMN source_import_id TEXT;
ALTER TABLE study_topics ADD COLUMN source_import_position INTEGER;

CREATE UNIQUE INDEX idx_study_folders_import_position
  ON study_folders(source_import_id, source_import_position)
  WHERE source_import_id IS NOT NULL;

CREATE UNIQUE INDEX idx_study_topics_import_position
  ON study_topics(source_import_id, source_import_position)
  WHERE source_import_id IS NOT NULL;
