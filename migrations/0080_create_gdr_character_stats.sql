-- Statistiche del personaggio in forma generica chiave/valore, per avventure GDR il cui
-- personaggio non ha la stessa scheda di "Il Prezzo della Verità" (gdr_characters, colonne
-- fisse Mente/Cuore/Corpo/Magia pensate per quell'avventura, un personaggio per account).
-- Qui invece c'è una sola protagonista: la scheda è condivisa tra i due account (chi la
-- guarda la vede identica, chi la modifica la cambia per entrambi) — stesso principio di
-- world_settings, non una riga per utente. `updated_by` serve solo da traccia di chi ha
-- toccato per ultimo, non fa parte della chiave.
CREATE TABLE gdr_character_stats (
    adventure TEXT NOT NULL,
    stat_key TEXT NOT NULL,
    value INTEGER NOT NULL,
    updated_by INTEGER NOT NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (adventure, stat_key),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);
