INSERT OR IGNORE INTO mondo_bianco_cards (id, name, description, created_by)
SELECT 'prova-a-dire-no', 'Prova a Dire No', 'Domande a cui non riuscirai a rispondere "no".', id FROM users ORDER BY id LIMIT 1;
