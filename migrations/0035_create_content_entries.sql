-- Fase 3 del CMS (documentazione/cms/planning-editor-contenuti.md): fondamenta generiche per i contenuti
-- editoriali. content_entries rappresenta il valore corrente di ogni testo; content_versions
-- serve soltanto ai contenuti con versioning_mode = 'history', dove il valore corrente va letto
-- da current_version_id invece che da un campo dedicato.
CREATE TABLE content_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_key TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('plain_text', 'paragraphs')),
    versioning_mode TEXT NOT NULL CHECK (versioning_mode IN ('replace', 'history')),
    body TEXT,
    current_version_id INTEGER,
    created_by INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (current_version_id) REFERENCES content_versions(id)
);

CREATE TABLE content_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_id INTEGER NOT NULL,
    body TEXT NOT NULL,
    author_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (entry_id) REFERENCES content_entries(id),
    FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE INDEX idx_content_versions_entry_id ON content_versions(entry_id, created_at);
