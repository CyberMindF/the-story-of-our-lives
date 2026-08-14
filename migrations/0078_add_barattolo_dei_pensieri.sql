-- Il Barattolo dei Pensieri (#e12): due barattoli di biglietti, uno per identità ('lui'/'lei').
-- Ognuno scrive solo per il barattolo dell'altro (controllo lato server, non qui) e pesca solo
-- dal proprio. position è scoped a jar_identity, come category_id in linguaggio_segreto_symbols.
CREATE TABLE pensieri_biglietti (
    id INTEGER PRIMARY KEY,
    jar_identity TEXT NOT NULL CHECK (jar_identity IN ('lui', 'lei')),
    text TEXT NOT NULL,
    title TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    position INTEGER NOT NULL,
    draw_count INTEGER NOT NULL DEFAULT 0,
    created_by INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_pensieri_biglietti_jar_position ON pensieri_biglietti(jar_identity, position);

-- Storico delle pesche: alimenta la coda mobile di esclusione (ultime 10 per barattolo) e il
-- draw_count usato per la casualità pesata. Mai il testo del biglietto, solo l'id.
CREATE TABLE pensieri_estrazioni (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jar_identity TEXT NOT NULL CHECK (jar_identity IN ('lui', 'lei')),
    biglietto_id INTEGER NOT NULL,
    drawn_by INTEGER NOT NULL,
    drawn_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (biglietto_id) REFERENCES pensieri_biglietti(id),
    FOREIGN KEY (drawn_by) REFERENCES users(id)
);

CREATE INDEX idx_pensieri_estrazioni_jar ON pensieri_estrazioni(jar_identity, id);

-- Registra la pagina come card del Mondo Bianco (come 0076 per prova-a-dire-no): senza questa
-- riga l'editor "Modifica" della home fallirebbe con 404, non essendoci nulla da aggiornare.
INSERT OR IGNORE INTO mondo_bianco_cards (id, name, description, created_by)
SELECT 'barattolo-dei-pensieri', 'Il Barattolo dei Pensieri', 'Piccoli biglietti da pescare, scritti l''uno per l''altra.', id FROM users ORDER BY id LIMIT 1;
