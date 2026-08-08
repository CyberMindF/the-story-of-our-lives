-- Proposte private inviate dalla pagina Le Storie e revisionate prima della pubblicazione.
CREATE TABLE story_suggestions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT,
    story_text TEXT NOT NULL,
    music_notes TEXT,
    image_notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_story_suggestions_status_created_at
    ON story_suggestions(status, created_at);
CREATE INDEX idx_story_suggestions_user_created_at
    ON story_suggestions(user_id, created_at);
