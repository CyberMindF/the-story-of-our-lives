-- Aggiunge i document_key della seconda avventura GDR ("La casa che trattiene il respiro",
-- #16) alla tabella gdr_blocks. SQLite non permette di alterare un CHECK esistente: si
-- ricostruisce la tabella (stesso schema, CHECK con l'elenco esteso), si copiano i dati, si
-- sostituisce. 'casa-avventura' è il solo incipit fisso pubblico (il resto dell'avventura è
-- uno script per il Master, non un documento pubblico); 'casa-regole' porta solo le regole
-- di gioco trasparenti (il dado, la Lucidità) — non la Tensione della casa, che resta un
-- contatore segreto del Master.
PRAGMA foreign_keys=off;

CREATE TABLE gdr_blocks_new (
    id INTEGER PRIMARY KEY,
    document_key TEXT NOT NULL CHECK (document_key IN ('avventura', 'maga-regole', 'casa-avventura', 'casa-regole')),
    type TEXT NOT NULL CHECK (type IN ('heading', 'paragraph', 'callout', 'image', 'npc_grid', 'list', 'table')),
    data TEXT NOT NULL,
    position INTEGER NOT NULL,
    created_by INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

INSERT INTO gdr_blocks_new SELECT * FROM gdr_blocks;

DROP TABLE gdr_blocks;
ALTER TABLE gdr_blocks_new RENAME TO gdr_blocks;

CREATE INDEX idx_gdr_blocks_document_position ON gdr_blocks(document_key, position);

PRAGMA foreign_keys=on;
