-- Lettere scritte dagli utenti autenticati, lette dall'altra persona (sono solo in due,
-- quindi non serve un destinatario esplicito: chi non ha scritto la lettera è chi la riceve).
CREATE TABLE letters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_id INTEGER NOT NULL,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at TEXT,
    FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE INDEX idx_letters_created_at ON letters(created_at);
