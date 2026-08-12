-- Fase 7 del CMS (planning editor contenuti.md): editor dedicato dell'Agenda delle Idee. La più
-- delicata delle raccolte migrate finora — alcune voci hanno un testo privato (`private_text`)
-- visibile solo dopo la risposta corretta alla domanda segreta in cose-insieme.html, un
-- meccanismo distinto dal permesso content.read e che l'API deve continuare a rispettare: la
-- lista pubblica (GET /api/together) non deve MAI restituire private_text, solo
-- GET /api/together/activities (content.edit, per l'editor) e POST /api/together/unlock (dopo
-- risposta corretta) possono farlo.
--
-- Niente 'position': l'ordine è sempre quello dell'id, come nell'array fisso originale — un
-- riordino non avrebbe lo stesso significato che ha per Ricettario/Storie/Cuffiette/Mappa, dato
-- che together_activity_status referenzia già activity_id come identità stabile.
CREATE TABLE together_activities (
    id INTEGER PRIMARY KEY,
    text TEXT,
    category TEXT NOT NULL,
    private_text TEXT,
    link TEXT,
    approximate_date TEXT NOT NULL,
    created_by INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- together_activity_status aveva un CHECK fisso (1-78) pensato per l'array statico: con un
-- editor che può aggiungere voci, quel limite andrebbe rotto alla prima attività aggiunta oltre
-- il 78 (stesso tipo di bug già corretto nel Calendario). Sostituito con una vera FOREIGN KEY
-- verso together_activities(id), che si adatta da sola.
CREATE TABLE together_activity_status_new (
    activity_id INTEGER PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'done', 'repeat', 'unavailable')),
    updated_by INTEGER NOT NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id),
    FOREIGN KEY (activity_id) REFERENCES together_activities(id)
);

INSERT INTO together_activity_status_new (activity_id, status, updated_by, updated_at)
SELECT activity_id, status, updated_by, updated_at FROM together_activity_status;

DROP TABLE together_activity_status;
ALTER TABLE together_activity_status_new RENAME TO together_activity_status;
