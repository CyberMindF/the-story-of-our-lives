-- Il tema diventa condiviso tra i due account (#a8): seed con il tema di default già in uso
-- (the-white-world), "enabled" non ha significato per questa chiave (nessun on/off, resta
-- sempre 1) — conta solo "value".
INSERT INTO world_settings (key, enabled, value) VALUES ('theme', 1, 'the-white-world');
