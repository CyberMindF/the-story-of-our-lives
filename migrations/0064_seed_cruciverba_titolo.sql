-- CMS: gli ultimi due testi rimasti del Cruciverba (planning editor contenuti.md), spostati
-- come costanti in crossword.service.ts quando data.json è stato eliminato (12/08/2026) — ora
-- diventano content_entries come tutto il resto.
INSERT INTO content_entries (content_key, label, content_type, versioning_mode, body, created_by, created_at, updated_at)
SELECT 'cruciverba.titolo', 'Cruciverba — titolo', 'plain_text', 'replace', 'The Story of Our Lives', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO content_entries (content_key, label, content_type, versioning_mode, body, created_by, created_at, updated_at)
SELECT 'cruciverba.sottotitolo', 'Cruciverba — sottotitolo', 'plain_text', 'replace', 'I nostri ricordi racchiusi in qualcosa di altrettanto nostro, un gioco', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
