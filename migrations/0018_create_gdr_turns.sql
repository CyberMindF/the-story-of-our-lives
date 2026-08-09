-- Il thread di gioco per un'avventura: chi scrive può essere sia chi gioca sia il master,
-- l'ordine cronologico li mischia entrambi come in una vera chat di play-by-chat.
CREATE TABLE gdr_turns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_id INTEGER NOT NULL,
    adventure TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE INDEX idx_gdr_turns_adventure_created ON gdr_turns(adventure, created_at);
