-- Override amministrativo separato dalla preferenza personale, disattivato per tutti.
ALTER TABLE users ADD COLUMN admin_email_updates INTEGER NOT NULL DEFAULT 0 CHECK (admin_email_updates IN (0, 1));
