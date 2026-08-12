-- Fase 7 del CMS (planning editor contenuti.md): quarto editor dedicato, le canzoni delle
-- Cuffiette. Chiamata 'cuffiette_songs' (non 'songs') per restare inequivocabile: playlist,
-- bonus e parole rubate restano per ora in web/public/content/music.json, non sono ancora
-- migrati (songsIntroduction ha un rendering HTML speciale — link inline verso /ponti — che
-- l'editor di testo semplice del CMS generico non supporta, va affrontato a parte).
CREATE TABLE cuffiette_songs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    introduction TEXT NOT NULL,
    lyrics TEXT NOT NULL,
    media_key TEXT NOT NULL,
    position INTEGER NOT NULL,
    created_by INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_cuffiette_songs_position ON cuffiette_songs(position);
