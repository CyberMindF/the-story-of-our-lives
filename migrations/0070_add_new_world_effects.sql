-- Effetti aggiunti dopo la prima serie di impostazioni. INSERT OR IGNORE preserva qualunque
-- valore già creato tramite l'upsert dell'API durante lo sviluppo locale.
INSERT OR IGNORE INTO world_settings (key, enabled, value) VALUES ('bubbles', 1, NULL);
INSERT OR IGNORE INTO world_settings (key, enabled, value) VALUES ('hearts', 1, 'mix');
INSERT OR IGNORE INTO world_settings (key, enabled, value) VALUES ('pearlShimmers', 1, 'green');
INSERT OR IGNORE INTO world_settings (key, enabled, value) VALUES ('silk', 1, NULL);

-- La vecchia variante bianca dell'aurora è diventata l'effetto Seta separato.
UPDATE world_settings SET value = 'green' WHERE key = 'pearlShimmers' AND value = 'white';
