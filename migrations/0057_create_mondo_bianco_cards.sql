-- Fase 7 del CMS (planning editor contenuti.md, decisione #2 dell'inventario): nelle card del
-- Mondo Bianco solo nome e descrizione sono contenuto editoriale, emoji/rotta/disponibilità/
-- ordine restano nel codice. Per questo, a differenza delle altre raccolte, qui non c'è
-- POST/DELETE/riordino: l'insieme delle 13 card è fisso (cambiarlo è una modifica di codice),
-- l'unica azione ammessa è modificare nome e descrizione di una card esistente.
CREATE TABLE mondo_bianco_cards (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_by INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);
