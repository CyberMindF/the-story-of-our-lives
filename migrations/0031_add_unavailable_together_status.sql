-- SQLite non permette di estendere un CHECK esistente: ricreiamo la piccola tabella
-- conservando tutti gli stati già scelti.
CREATE TABLE together_activity_status_new (
    activity_id INTEGER PRIMARY KEY CHECK (activity_id BETWEEN 1 AND 77),
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'done', 'repeat', 'unavailable')),
    updated_by INTEGER NOT NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

INSERT INTO together_activity_status_new (activity_id, status, updated_by, updated_at)
SELECT activity_id, status, updated_by, updated_at FROM together_activity_status;

DROP TABLE together_activity_status;
ALTER TABLE together_activity_status_new RENAME TO together_activity_status;

