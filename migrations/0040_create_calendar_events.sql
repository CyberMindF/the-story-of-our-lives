-- Fase 7 del CMS (planning editor contenuti.md): primo editor dedicato a una raccolta
-- strutturata, scelto per primo perché piccola e regolare (29 elementi, ID già stabile — la
-- data stessa). Nessun campo 'position': l'ordine è sempre quello cronologico delle date, un
-- riordino manuale non avrebbe senso qui (a differenza di raccolte come la Bacheca).
CREATE TABLE calendar_events (
    id TEXT PRIMARY KEY,
    event_date TEXT NOT NULL,
    label TEXT NOT NULL,
    body TEXT NOT NULL,
    created_by INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_calendar_events_date ON calendar_events(event_date);
