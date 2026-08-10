-- Domande poste da un utente all'altro, con eventuale risposta. Come per le lettere, sono
-- solo in due: non serve un destinatario esplicito, chi non ha posto la domanda è chi
-- risponde. Le modifiche a domanda/risposta si registrano in events (vedi password_changed);
-- questa tabella conserva solo lo stato corrente più un indicatore "è stata modificata" via
-- *_edited_at, non lo storico completo delle revisioni.
CREATE TABLE questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asker_id INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    question_edited_at TEXT,
    answerer_id INTEGER,
    answer_text TEXT,
    answered_at TEXT,
    answer_edited_at TEXT,
    FOREIGN KEY (asker_id) REFERENCES users(id),
    FOREIGN KEY (answerer_id) REFERENCES users(id)
);

CREATE INDEX idx_questions_created_at ON questions(created_at);
