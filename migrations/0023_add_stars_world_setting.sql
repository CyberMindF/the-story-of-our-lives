-- Le stelle erano già sempre attive prima di diventare disattivabili (vedi migrations/0022
-- per lo stesso schema, già usato per le lanterne).
INSERT INTO world_settings (key, enabled) VALUES ('stars', 1);
