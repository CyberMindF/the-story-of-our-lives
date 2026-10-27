-- Compatibilita anche con client/API gia aperti durante il rilascio: le voci di solo archivio
-- risultano lette per gli account esistenti e non possono apparire nel popup storico.
INSERT OR IGNORE INTO world_update_reads (user_id, update_id, seen_at)
SELECT u.id, wu.id, CURRENT_TIMESTAMP
FROM users u
CROSS JOIN world_updates wu
WHERE wu.announce = 0;
