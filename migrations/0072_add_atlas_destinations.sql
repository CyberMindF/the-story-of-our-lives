-- Le destinazioni secondarie dell'atlante condividono lo stesso editor di nome/descrizione
-- delle card della home. Rotta, icona e gerarchia restano nel codice.
INSERT OR IGNORE INTO mondo_bianco_cards (id, name, description, created_by)
SELECT 'suggerimenti', 'I Suggerimenti', 'Il posto in cui proporre qualcosa di nuovo per qualunque angolo del sito.', id FROM users ORDER BY id LIMIT 1;
INSERT OR IGNORE INTO mondo_bianco_cards (id, name, description, created_by)
SELECT 'cruciverba', 'Il Cruciverba', 'Cento definizioni che raccontano qualcosa di noi.', id FROM users ORDER BY id LIMIT 1;
INSERT OR IGNORE INTO mondo_bianco_cards (id, name, description, created_by)
SELECT 'messaggio-criptato', 'Il Messaggio Criptato', 'Un messaggio da ricostruire un indizio alla volta.', id FROM users ORDER BY id LIMIT 1;
INSERT OR IGNORE INTO mondo_bianco_cards (id, name, description, created_by)
SELECT 'gdr', 'I Giochi di Ruolo', 'Qui trovi Il Prezzo della Verità; La casa che trattiene il respiro arriverà presto.', id FROM users ORDER BY id LIMIT 1;
INSERT OR IGNORE INTO mondo_bianco_cards (id, name, description, created_by)
SELECT 'linguaggio-segreto', 'Il Linguaggio Segreto', 'I simboli e le parole che capiamo soltanto noi.', id FROM users ORDER BY id LIMIT 1;
INSERT OR IGNORE INTO mondo_bianco_cards (id, name, description, created_by)
SELECT 'profilo', 'Il Profilo', 'Le impostazioni personali e gli accessi alle aree riservate.', id FROM users ORDER BY id LIMIT 1;
