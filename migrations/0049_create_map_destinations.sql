-- Fase 7 del CMS (planning editor contenuti.md): quinto editor dedicato, la Mappa. Paragrafi e
-- immagini restano JSON in colonna di testo: le immagini sono legate a un indice di paragrafo
-- specifico (beforeParagraph) e a una posizione (before/after), una relazione troppo fine per
-- una lista "semplice" — l'editor le tratta come un blocco JSON unico invece di un repeater
-- nidificato, coerente con l'editor "senza fronzoli" richiesto dal piano per le raccolte.
CREATE TABLE map_destinations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    is_open INTEGER NOT NULL DEFAULT 0,
    latitude REAL,
    longitude REAL,
    paragraphs TEXT NOT NULL,
    images TEXT NOT NULL,
    position INTEGER NOT NULL,
    created_by INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_map_destinations_position ON map_destinations(position);
