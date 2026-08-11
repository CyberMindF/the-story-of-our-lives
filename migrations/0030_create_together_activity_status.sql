-- Stato condiviso delle voci fisse della pagina “Cose da fare insieme”. I contenuti restano
-- nel codice: in D1 salviamo soltanto ciò che cambia durante l'uso.
CREATE TABLE together_activity_status (
    activity_id INTEGER PRIMARY KEY CHECK (activity_id BETWEEN 1 AND 77),
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'done', 'repeat')),
    updated_by INTEGER NOT NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

