-- Generalizza la scheda del personaggio GDR: da "gdr_character_stats" (solo numeri, una
-- avventura sola) a un modello che copre anche "Il Prezzo della Verità" (che ha campi testo:
-- nome, descrizione, inventario) e che diventa condivisa anche lì, non più privata per
-- account (decisione di Rory: un solo personaggio, non due copie separate).
--
-- Due tabelle:
-- - gdr_character_schema: la STRUTTURA della scheda per avventura (quali campi, testo o
--   numero, etichette, min/max) come JSON grezzo modificabile dall'admin — stesso principio
--   "editor senza fronzoli" già usato per i blocchi GDR, qui applicato alla definizione dei
--   campi invece che al loro contenuto.
-- - gdr_character_fields: i VALORI condivisi (uno per chiave, testo o numero indifferentemente
--   come TEXT — l'interpretazione del tipo la fa il client in base allo schema).
--
-- gdr_character_stats (0080) non è mai stata usata in produzione (solo locale), viene
-- sostituita direttamente senza migrazione di dati.
DROP TABLE IF EXISTS gdr_character_stats;

CREATE TABLE gdr_character_schema (
    adventure TEXT PRIMARY KEY,
    fields_json TEXT NOT NULL,
    updated_by INTEGER NOT NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

CREATE TABLE gdr_character_fields (
    adventure TEXT NOT NULL,
    field_key TEXT NOT NULL,
    value TEXT NOT NULL,
    updated_by INTEGER NOT NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (adventure, field_key),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Documenti a blocchi opzionali per il tab Personaggio (ritratto, descrizione narrativa,
-- immagini) — stesso sistema già usato per l'incipit e le regole, riusato qui invece di
-- inventare un altro formato di contenuto.
PRAGMA foreign_keys=off;

CREATE TABLE gdr_blocks_new (
    id INTEGER PRIMARY KEY,
    document_key TEXT NOT NULL CHECK (document_key IN ('avventura', 'maga-regole', 'casa-avventura', 'casa-regole', 'casa-personaggio', 'maga-personaggio')),
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

-- Schema di partenza per le due avventure esistenti.
INSERT INTO gdr_character_schema (adventure, fields_json, updated_by, updated_at)
SELECT 'la-casa-che-trattiene-il-respiro',
  '[{"key":"lucidita","label":"Lucidità","type":"number","min":0,"max":3,"default":3}]',
  u.id, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

-- "Età 18, razza Umana" erano righe fisse (non un campo) nel vecchio form de La Tua Maga:
-- diventano un blocco di contenuto invece di sparire, dato che il nuovo schema ha solo
-- campi modificabili.
INSERT INTO gdr_blocks (document_key, type, data, position, created_by, created_at, updated_at)
SELECT 'maga-personaggio', 'paragraph', '{"text":"Età: 18. Razza: Umana."}', 0, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO gdr_character_schema (adventure, fields_json, updated_by, updated_at)
SELECT 'il-prezzo-della-verita',
  '[{"key":"name","label":"Nome","type":"text","default":""},{"key":"catName","label":"Nome del gatto","type":"text","default":""},{"key":"description","label":"Descrizione","type":"text","long":true,"default":""},{"key":"statMente","label":"Mente","type":"number","min":1,"max":5,"default":1},{"key":"statCuore","label":"Cuore","type":"number","min":1,"max":5,"default":1},{"key":"statCorpo","label":"Corpo","type":"number","min":1,"max":5,"default":1},{"key":"statMagia","label":"Magia","type":"number","min":1,"max":5,"default":1},{"key":"stressCurrent","label":"Stress","type":"number","min":0,"max":10,"default":10},{"key":"spellSlotsCurrent","label":"Spell slot","type":"number","min":0,"max":3,"default":3},{"key":"inventory","label":"Inventario","type":"text","long":true,"default":"Mantello da apprendista\nBacchetta magica (registrata)\nAttestato da apprendista mago\nMoneta portafortuna\nTaccuino personale"}]',
  u.id, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
