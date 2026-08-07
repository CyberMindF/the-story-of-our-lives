-- Stato corrente delle parole, separato dalla definizione statica contenuta in data.json.
CREATE TABLE crossword_answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    word_id TEXT NOT NULL,
    current_answer TEXT NOT NULL DEFAULT '',
    is_completed INTEGER NOT NULL DEFAULT 0,
    completed_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE (user_id, word_id)
);

CREATE INDEX idx_crossword_answers_user_updated_at
    ON crossword_answers(user_id, updated_at);
