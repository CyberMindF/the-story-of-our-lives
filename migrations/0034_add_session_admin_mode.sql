-- Fase 2 del CMS: la Modalità admin dura per la sessione (non è un permesso, è una scelta di
-- visualizzazione) — vive su sessions, non su users, così si disattiva da sola a un nuovo login.
ALTER TABLE sessions ADD COLUMN admin_mode_enabled INTEGER NOT NULL DEFAULT 0;
