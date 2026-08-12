-- Fase 7 del CMS (documentazione/cms/planning-editor-contenuti.md): sesto editor dedicato, il Cruciverba. Le 100
-- definizioni vivono qui con le loro coordinate (grid_row/grid_col + direction), stesso schema
-- "posizione esplicita + riordino su/giù" di Mappa/Storie/Ricettario/Cuffiette. L'id resta un
-- intero stabile (1..100 nell'origine, coerente con "ID stabile" dell'inventario contenuti):
-- non è uno slug testuale come nelle altre collezioni perché non ha mai avuto un significato
-- leggibile, solo un numero progressivo mostrato nella griglia.
CREATE TABLE crossword_words (
    id INTEGER PRIMARY KEY,
    solution TEXT NOT NULL,
    clue TEXT NOT NULL,
    grid_row INTEGER NOT NULL,
    grid_col INTEGER NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('O', 'V')),
    position INTEGER NOT NULL,
    created_by INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_crossword_words_position ON crossword_words(position);
