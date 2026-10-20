-- Aula studio: quiz condivisi e tentativi personali versionati.
CREATE TABLE study_quizzes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  folder_id INTEGER,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 120),
  correction_mode TEXT NOT NULL DEFAULT 'final' CHECK (correction_mode IN ('immediate', 'final')),
  shuffle_questions INTEGER NOT NULL DEFAULT 1 CHECK (shuffle_questions IN (0, 1)),
  shuffle_options INTEGER NOT NULL DEFAULT 0 CHECK (shuffle_options IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  source_import_id TEXT,
  source_import_position INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (folder_id) REFERENCES study_folders(id) ON DELETE RESTRICT
);

CREATE TABLE study_quiz_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quiz_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('single', 'multiple', 'open')),
  prompt TEXT NOT NULL CHECK (length(prompt) BETWEEN 1 AND 4000),
  image_url TEXT CHECK (image_url IS NULL OR length(image_url) <= 2000),
  image_alt TEXT CHECK (image_alt IS NULL OR length(image_alt) <= 500),
  reference_answer TEXT CHECK (reference_answer IS NULL OR length(reference_answer) <= 4000),
  position INTEGER NOT NULL CHECK (position >= 0),
  FOREIGN KEY (quiz_id) REFERENCES study_quizzes(id) ON DELETE CASCADE,
  UNIQUE (quiz_id, position)
);

CREATE TABLE study_quiz_options (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER NOT NULL,
  text TEXT NOT NULL CHECK (length(text) BETWEEN 1 AND 2000),
  is_correct INTEGER NOT NULL CHECK (is_correct IN (0, 1)),
  position INTEGER NOT NULL CHECK (position >= 0),
  FOREIGN KEY (question_id) REFERENCES study_quiz_questions(id) ON DELETE CASCADE,
  UNIQUE (question_id, position)
);

-- snapshot_json congela quiz, risposte corrette e ordine del tentativo. answers_json viene
-- aggiornato automaticamente durante la compilazione e rende riprendibili le bozze.
CREATE TABLE study_quiz_attempts (
  id TEXT PRIMARY KEY,
  quiz_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  snapshot_json TEXT NOT NULL,
  answers_json TEXT NOT NULL DEFAULT '{}',
  correct_count INTEGER NOT NULL DEFAULT 0,
  assessed_count INTEGER NOT NULL DEFAULT 0,
  started_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT,
  FOREIGN KEY (quiz_id) REFERENCES study_quizzes(id) ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_study_quizzes_import_position
  ON study_quizzes(source_import_id, source_import_position)
  WHERE source_import_id IS NOT NULL;
CREATE INDEX idx_study_quizzes_folder_updated ON study_quizzes(folder_id, updated_at DESC);
CREATE INDEX idx_study_quizzes_deleted_at ON study_quizzes(deleted_at);
CREATE UNIQUE INDEX idx_study_quiz_attempts_active
  ON study_quiz_attempts(quiz_id, user_id) WHERE status = 'in_progress';
CREATE INDEX idx_study_quiz_attempts_user_updated
  ON study_quiz_attempts(user_id, updated_at DESC);
