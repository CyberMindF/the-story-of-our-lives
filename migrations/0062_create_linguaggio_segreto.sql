-- CMS: editor dedicato del Linguaggio Segreto (planning editor contenuti.md, Fase 7;
-- inventario contenuti CMS.md, "Decisioni da confermare" #4). Tre tabelle: le categorie sono
-- una lista piatta (id slug, come map_destinations), i simboli sono annidati sotto una
-- categoria (category_id + position scoped alla categoria: due simboli di categorie diverse
-- possono avere la stessa position), gli esempi restano una lista piatta indipendente.
CREATE TABLE linguaggio_segreto_categories (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    icon TEXT NOT NULL,
    note TEXT,
    position INTEGER NOT NULL,
    created_by INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_linguaggio_segreto_categories_position ON linguaggio_segreto_categories(position);

-- L'id resta un intero progressivo (come crossword_words): mai stato un identificativo
-- leggibile, solo una chiave interna.
CREATE TABLE linguaggio_segreto_symbols (
    id INTEGER PRIMARY KEY,
    category_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    meaning TEXT NOT NULL,
    explanation TEXT,
    position INTEGER NOT NULL,
    created_by INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES linguaggio_segreto_categories(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_linguaggio_segreto_symbols_category_position ON linguaggio_segreto_symbols(category_id, position);

CREATE TABLE linguaggio_segreto_examples (
    id INTEGER PRIMARY KEY,
    code TEXT NOT NULL,
    meaning TEXT NOT NULL,
    position INTEGER NOT NULL,
    created_by INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_linguaggio_segreto_examples_position ON linguaggio_segreto_examples(position);
