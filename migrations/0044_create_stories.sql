-- Fase 7 del CMS (planning editor contenuti.md): terzo editor dedicato, le Storie. 'position'
-- esplicito come nel Ricettario (l'ordine non è deducibile dalla data: le storie non sono per
-- forza in ordine cronologico). Media (audio_key/image) restano campi di testo che puntano a
-- una risorsa già esistente (R2 o assets statici) — nessun upload qui, coerente con l'editor
-- "semplice" del piano; caricare nuovi file è un problema distinto rimandato a un giro futuro.
CREATE TABLE stories (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    story_date TEXT NOT NULL,
    body TEXT NOT NULL,
    video_url TEXT,
    audio_key TEXT,
    audio_label TEXT,
    image TEXT,
    image_alt TEXT,
    position INTEGER NOT NULL,
    created_by INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_stories_position ON stories(position);
