-- Suggerimenti liberi inviati dagli utenti autenticati per proporre aggiunte al Mondo Bianco.
CREATE TABLE world_suggestions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_world_suggestions_status_created_at
    ON world_suggestions(status, created_at);
CREATE INDEX idx_world_suggestions_user_created_at
    ON world_suggestions(user_id, created_at);
