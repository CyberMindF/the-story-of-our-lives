-- Interruttori condivisi per gli effetti decorativi del Mondo Bianco (lanterne, in futuro
-- altri): non uno per utente, uno solo per tutti e due — chi lo accende lo vede anche l'altro,
-- non è una preferenza personale come il tema (quello resta in localStorage per dispositivo).
CREATE TABLE world_settings (
    key TEXT PRIMARY KEY,
    enabled INTEGER NOT NULL DEFAULT 0,
    updated_by INTEGER,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Le lanterne erano già attive di default prima che diventassero disattivabili.
INSERT INTO world_settings (key, enabled) VALUES ('lanterns', 1);
