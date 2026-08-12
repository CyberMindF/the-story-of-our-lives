-- Fase 2 del CMS (planning editor contenuti.md): identità e ruolo sono informazioni distinte.
-- Default lei/member per chi si registra (oggi solo Rory esiste davvero, Desy non si è ancora
-- registrata): la promozione ad admin è esplicita, solo per l'email di Rory.
ALTER TABLE users ADD COLUMN identity TEXT NOT NULL DEFAULT 'lei';
ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'member';

UPDATE users SET identity = 'lui', role = 'admin' WHERE email = 'rory982011@gmail.com';
