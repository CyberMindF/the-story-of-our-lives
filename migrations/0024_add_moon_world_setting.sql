-- Stesso schema di migrations/0022/0023: la luna è nuova, quindi di default attiva (a
-- differenza di lanterne/stelle non stava già sempre in pagina prima, ma nasce già accesa).
INSERT INTO world_settings (key, enabled) VALUES ('moon', 1);
