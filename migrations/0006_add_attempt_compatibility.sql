-- Metriche separate permettono di distinguere una risposta plausibile da una risposta completa.
ALTER TABLE crossword_word_attempts ADD COLUMN compatibility_percent REAL NOT NULL DEFAULT 0;
ALTER TABLE crossword_word_attempts ADD COLUMN position_accuracy_percent REAL NOT NULL DEFAULT 0;
ALTER TABLE crossword_word_attempts ADD COLUMN edit_similarity_percent REAL NOT NULL DEFAULT 0;
ALTER TABLE crossword_word_attempts ADD COLUMN completion_percent REAL NOT NULL DEFAULT 0;
ALTER TABLE crossword_word_attempts ADD COLUMN is_correct_prefix INTEGER NOT NULL DEFAULT 0;
ALTER TABLE crossword_word_attempts ADD COLUMN is_exact INTEGER NOT NULL DEFAULT 0;

CREATE INDEX idx_crossword_attempts_compatibility
    ON crossword_word_attempts(compatibility_percent, completion_percent);
