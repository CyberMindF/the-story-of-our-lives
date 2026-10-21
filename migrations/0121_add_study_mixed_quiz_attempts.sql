-- Tentativi personali generati mescolando i quiz di una cartella e delle sue discendenti.
CREATE TABLE study_mixed_quiz_attempts (
  id TEXT PRIMARY KEY,
  folder_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  selection_mode TEXT NOT NULL CHECK (selection_mode IN ('total', 'per_unit')),
  requested_count INTEGER NOT NULL CHECK (requested_count BETWEEN 1 AND 100),
  include_open INTEGER NOT NULL DEFAULT 1 CHECK (include_open IN (0, 1)),
  shuffle_questions INTEGER NOT NULL DEFAULT 1 CHECK (shuffle_questions IN (0, 1)),
  correction_mode TEXT NOT NULL DEFAULT 'final' CHECK (correction_mode IN ('immediate', 'final')),
  question_count INTEGER NOT NULL CHECK (question_count BETWEEN 1 AND 500),
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  snapshot_json TEXT NOT NULL,
  answers_json TEXT NOT NULL DEFAULT '{}',
  correct_count INTEGER NOT NULL DEFAULT 0,
  assessed_count INTEGER NOT NULL DEFAULT 0,
  started_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT,
  FOREIGN KEY (folder_id) REFERENCES study_folders(id) ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_study_mixed_quiz_attempts_active
  ON study_mixed_quiz_attempts(folder_id, user_id) WHERE status = 'in_progress';
CREATE INDEX idx_study_mixed_quiz_attempts_user_updated
  ON study_mixed_quiz_attempts(user_id, updated_at DESC);
CREATE INDEX idx_study_mixed_quiz_attempts_folder_updated
  ON study_mixed_quiz_attempts(folder_id, updated_at DESC);
