-- Le conchiglie (#b3-a) non sono piaciute a Rory: sostituite dalle onde del mare (#b3-b),
-- stesso schema (già attive di default). "shells" era comunque solo in locale, mai arrivata
-- sul D1 di produzione, quindi qui si può semplicemente sostituire la riga invece di doverla
-- migrare.
DELETE FROM world_settings WHERE key = 'shells';
INSERT INTO world_settings (key, enabled) VALUES ('waves', 1);
