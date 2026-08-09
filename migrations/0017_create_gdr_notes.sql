-- Blocco appunti personale per le avventure del Gioco di Ruolo: un blocco per utente per
-- avventura (in previsione di una seconda avventura con il proprio blocco separato).
CREATE TABLE gdr_notes (
    user_id INTEGER NOT NULL,
    adventure TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, adventure),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
