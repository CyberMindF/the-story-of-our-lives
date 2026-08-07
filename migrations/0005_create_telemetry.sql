-- Eventi significativi e riutilizzabili di tutte le sezioni del Mondo Bianco.
CREATE TABLE events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_id INTEGER NOT NULL,
    section TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_version INTEGER NOT NULL DEFAULT 1,
    metadata TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);

CREATE INDEX idx_events_user_created_at ON events(user_id, created_at);
CREATE INDEX idx_events_section_type_created_at ON events(section, event_type, created_at);

-- Storico append-only dei tentativi consolidati dopo una pausa di digitazione.
CREATE TABLE crossword_word_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_id INTEGER NOT NULL,
    word_order INTEGER NOT NULL,
    attempt TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);

CREATE INDEX idx_crossword_attempts_user_word_created_at
    ON crossword_word_attempts(user_id, word_order, created_at);
