-- Fase 7 del CMS (documentazione/cms/planning-editor-contenuti.md): editor dedicato del Mappamondo (decisione #3
-- dell'inventario: deve diventare modificabile tramite un editor strutturato). Ogni scena è una
-- lista di righe (`lines`, JSON), ognuna a sua volta una lista di segmenti {speaker, text}: la
-- maggior parte delle righe ha un solo segmento (narrazione pura o battuta pura), ma almeno una
-- (scena "Dentro") ha narrazione e battuta nello stesso paragrafo — un formato a paragrafi
-- semplici avrebbe perso quella distinzione, qui resta esplicita e ricostruibile.
CREATE TABLE mappamondo_scenes (
    id TEXT PRIMARY KEY,
    scene_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    lines TEXT NOT NULL,
    is_wide INTEGER NOT NULL DEFAULT 0,
    is_finale INTEGER NOT NULL DEFAULT 0,
    position INTEGER NOT NULL,
    created_by INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_mappamondo_scenes_position ON mappamondo_scenes(position);
