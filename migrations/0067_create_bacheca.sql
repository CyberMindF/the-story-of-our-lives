-- CMS: editor "ibrido" della Bacheca dei Ricordi (planning editor contenuti.md, Fase 7;
-- concordato con Rory il 12/08/2026 come opzione D — editor visuale per giorno con
-- salvataggio JSON, non un CRUD granulare a 5 livelli). Due tabelle: i periodi sono una
-- lista piatta (come le categorie del Linguaggio Segreto), i giorni sono annidati sotto un
-- periodo (period_id + position scoped al periodo) e portano l'intero layout del giorno
-- (righe → colonne → blocchi) come un unico blob JSON in `content`, validato rigorosamente
-- lato server a ogni scrittura (vedi functions/api/bacheca-days/_shared.js) così un JSON
-- malformato non può mai raggiungere la pagina pubblica.
CREATE TABLE bacheca_periods (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    position INTEGER NOT NULL,
    created_by INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_bacheca_periods_position ON bacheca_periods(position);

CREATE TABLE bacheca_days (
    id INTEGER PRIMARY KEY,
    period_id TEXT NOT NULL,
    slug TEXT NOT NULL,
    title TEXT,
    content TEXT NOT NULL,
    position INTEGER NOT NULL,
    created_by INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (period_id) REFERENCES bacheca_periods(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_bacheca_days_period_position ON bacheca_days(period_id, position);
