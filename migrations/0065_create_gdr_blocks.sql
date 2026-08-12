-- CMS: editor dedicato del GDR "Il Prezzo della Verità" (planning editor contenuti.md,
-- Fase 7; inventario contenuti CMS.md, decisione #4 — "deve poter essere ampliato dal sito...
-- capace di gestire almeno testo, immagini e blocchi/ordine"). Un'unica tabella per entrambi
-- i documenti (avventura, maga-regole): ogni riga è un blocco tipizzato con `data` come JSON
-- grezzo (stesso principio "editor senza fronzoli" già usato per le immagini di
-- map_destinations), ordinato per `position` scoped al documento — stesso schema di
-- category_id/position dei simboli del Linguaggio Segreto, qui con document_key al posto
-- della categoria. La scheda del personaggio (nome, statistiche, inventario) resta dati
-- utente dinamici altrove, non tocca questa tabella.
CREATE TABLE gdr_blocks (
    id INTEGER PRIMARY KEY,
    document_key TEXT NOT NULL CHECK (document_key IN ('avventura', 'maga-regole')),
    type TEXT NOT NULL CHECK (type IN ('heading', 'paragraph', 'callout', 'image', 'npc_grid', 'list', 'table')),
    data TEXT NOT NULL,
    position INTEGER NOT NULL,
    created_by INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_gdr_blocks_document_position ON gdr_blocks(document_key, position);
