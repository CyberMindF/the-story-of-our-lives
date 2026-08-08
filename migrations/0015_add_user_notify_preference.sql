-- Preferenza espressa alla registrazione: avvisare via email quando ci sono aggiornamenti.
-- Conserva solo la preferenza; l'invio effettivo delle email non è ancora implementato.
ALTER TABLE users ADD COLUMN notify_email_updates INTEGER NOT NULL DEFAULT 0;
