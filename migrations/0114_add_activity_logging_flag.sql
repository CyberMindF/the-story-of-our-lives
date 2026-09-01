-- Il logging non dipende piu' dalla label narrativa lui/lei: ogni account viene scelto
-- esplicitamente dall'admin. Manteniamo attivo l'eventuale account reale lei gia' esistente,
-- mentre account test e future registrazioni partono disattivati.
ALTER TABLE users ADD COLUMN activity_logging_enabled INTEGER NOT NULL DEFAULT 0
  CHECK (activity_logging_enabled IN (0, 1));

UPDATE users
SET activity_logging_enabled = 1
WHERE identity = 'lei' AND is_test = 0;
