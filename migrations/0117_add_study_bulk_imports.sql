-- Aula studio: importazioni atomiche, idempotenti e annullabili.
CREATE TABLE study_imports (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  idempotency_key TEXT NOT NULL,
  source_hash TEXT NOT NULL,
  conflict_policy TEXT NOT NULL CHECK (conflict_policy IN ('skip', 'append', 'replace')),
  summary_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  undone_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  UNIQUE (user_id, idempotency_key)
);

ALTER TABLE study_folders ADD COLUMN source_import_id TEXT;
ALTER TABLE study_folders ADD COLUMN source_import_position INTEGER;
ALTER TABLE study_topics ADD COLUMN source_import_id TEXT;
ALTER TABLE study_topics ADD COLUMN source_import_position INTEGER;
ALTER TABLE study_cards ADD COLUMN source_import_id TEXT;

CREATE TABLE study_import_folder_changes (
  import_id TEXT NOT NULL,
  folder_id INTEGER NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('created', 'reused')),
  depth INTEGER NOT NULL CHECK (depth >= 1),
  position INTEGER NOT NULL CHECK (position >= 0),
  PRIMARY KEY (import_id, position),
  FOREIGN KEY (import_id) REFERENCES study_imports(id) ON DELETE CASCADE,
  FOREIGN KEY (folder_id) REFERENCES study_folders(id) ON DELETE RESTRICT
);

CREATE TABLE study_import_topic_changes (
  import_id TEXT NOT NULL,
  topic_id INTEGER NOT NULL,
  previous_topic_id INTEGER,
  previous_updated_at TEXT,
  action TEXT NOT NULL CHECK (action IN ('created', 'skipped', 'appended', 'replaced')),
  cards_added INTEGER NOT NULL DEFAULT 0 CHECK (cards_added >= 0),
  position INTEGER NOT NULL CHECK (position >= 0),
  PRIMARY KEY (import_id, position),
  FOREIGN KEY (import_id) REFERENCES study_imports(id) ON DELETE CASCADE,
  FOREIGN KEY (topic_id) REFERENCES study_topics(id) ON DELETE RESTRICT,
  FOREIGN KEY (previous_topic_id) REFERENCES study_topics(id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX idx_study_folders_import_position
  ON study_folders(source_import_id, source_import_position)
  WHERE source_import_id IS NOT NULL;

CREATE UNIQUE INDEX idx_study_topics_import_position
  ON study_topics(source_import_id, source_import_position)
  WHERE source_import_id IS NOT NULL;

CREATE INDEX idx_study_cards_source_import
  ON study_cards(source_import_id, topic_id);

CREATE INDEX idx_study_imports_user_created
  ON study_imports(user_id, created_at DESC);

CREATE INDEX idx_study_import_folder_changes_import_depth
  ON study_import_folder_changes(import_id, depth DESC);

CREATE INDEX idx_study_import_topic_changes_import_action
  ON study_import_topic_changes(import_id, action);
