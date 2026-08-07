-- Ricrea events senza vincolo verso sessions, mantenendo intatto lo storico esistente.
CREATE TABLE events_historical (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_id INTEGER,
    section TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_version INTEGER NOT NULL DEFAULT 1,
    metadata TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

INSERT INTO events_historical (
    id, user_id, session_id, section, event_type, event_version, metadata, created_at
)
SELECT id, user_id, session_id, section, event_type, event_version, metadata, created_at
FROM events;

DROP TABLE events;
ALTER TABLE events_historical RENAME TO events;

CREATE INDEX idx_events_user_created_at ON events(user_id, created_at);
CREATE INDEX idx_events_section_type_created_at ON events(section, event_type, created_at);
