-- Mantiene la cronologia degli import bulk anche dopo un annullamento.
ALTER TABLE study_imports ADD COLUMN reverted_at TEXT;
ALTER TABLE study_imports ADD COLUMN reverted_by_user_id INTEGER
  REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX idx_study_imports_created_at
  ON study_imports(created_at DESC);
