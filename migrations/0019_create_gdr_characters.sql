-- Scheda personaggio compilabile per le avventure del Gioco di Ruolo: una per utente per
-- avventura. Le parti fisse del regolamento (abilità, incantesimi disponibili, tabella
-- magia selvaggia) restano testo statico nella pagina, qui salviamo solo ciò che cambia.
CREATE TABLE gdr_characters (
    user_id INTEGER NOT NULL,
    adventure TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    cat_name TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    stat_mente INTEGER NOT NULL DEFAULT 1,
    stat_cuore INTEGER NOT NULL DEFAULT 1,
    stat_corpo INTEGER NOT NULL DEFAULT 1,
    stat_magia INTEGER NOT NULL DEFAULT 1,
    stress_current INTEGER NOT NULL DEFAULT 10,
    spell_slots_current INTEGER NOT NULL DEFAULT 3,
    inventory TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, adventure),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
