-- Interruttore generale delle pubblicita interne. Lo stato delle singole campagne resta
-- indipendente: spegnere questa voce sospende soltanto la loro visualizzazione nel sito.
INSERT OR IGNORE INTO world_settings (key, enabled, value)
VALUES ('promos', 1, NULL);
