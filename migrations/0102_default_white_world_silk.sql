-- Esperienza iniziale calma: White World con la sola Seta. Le impostazioni restano
-- modificabili normalmente dal Centro di Controllo dopo questo riallineamento iniziale.
INSERT INTO world_settings (key, enabled, value)
VALUES ('theme', 1, 'white-world')
ON CONFLICT(key) DO UPDATE SET enabled = 1, value = 'white-world';

UPDATE world_settings
SET enabled = CASE WHEN key = 'silk' THEN 1 ELSE 0 END
WHERE key IN (
  'lanterns', 'stars', 'shootingStars', 'moon', 'sparkles', 'leaves', 'waves',
  'petals', 'fish', 'bubbles', 'hearts', 'pearlShimmers', 'silk', 'stickers',
  'balloons', 'fireworks'
);

INSERT OR IGNORE INTO world_settings (key, enabled, value) VALUES ('silk', 1, NULL);
