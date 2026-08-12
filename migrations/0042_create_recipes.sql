-- Fase 7 del CMS (planning editor contenuti.md): secondo editor dedicato, il Ricettario.
-- Ingredienti e passaggi sono liste ordinate di stringhe senza bisogno di un ID proprio per
-- riga (a differenza delle ricette stesse): restano un array JSON in una colonna di testo
-- invece di due tabelle figlie, coerente con "editor semplice" del piano (niente drag and
-- drop, textarea multi-riga). 'position' invece serve davvero qui, a differenza del
-- Calendario: l'ordine delle ricette non è deducibile da nessun altro campo.
CREATE TABLE recipes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('Fatta insieme', 'Da provare')),
    note TEXT,
    placeholder INTEGER NOT NULL DEFAULT 0,
    source_label TEXT,
    source_href TEXT,
    ingredients TEXT NOT NULL,
    steps TEXT NOT NULL,
    position INTEGER NOT NULL,
    created_by INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_recipes_position ON recipes(position);
