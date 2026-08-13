INSERT INTO content_entries (content_key, label, content_type, versioning_mode, body, created_by, created_at, updated_at)
SELECT 'prova-a-dire-no.introduzione', 'Prova a Dire No — introduzione', 'plain_text', 'replace', 'Di quei video di TikTok in cui uno fa domande così, con i bottoni che scappano o cambiano risposta, ogni tanto mettevi like o li ricondividevi — quindi te l''ho fatto anche qui, tutto nostro.', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
