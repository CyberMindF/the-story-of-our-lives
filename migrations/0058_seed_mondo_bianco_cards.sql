-- Fase 7 del CMS: importa i nomi attuali delle 13 card da mondo-bianco.html. Nessuna

-- descrizione preesistente (il markup originale non ne aveva una): resta NULL finché Rory

-- non ne scrive una dall'editor.

INSERT INTO mondo_bianco_cards (id, name, description, created_by, created_at, updated_at)
SELECT 'bacheca', 'La Bacheca dei Ricordi', NULL, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO mondo_bianco_cards (id, name, description, created_by, created_at, updated_at)
SELECT 'mappamondo', 'Il Mappamondo', NULL, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO mondo_bianco_cards (id, name, description, created_by, created_at, updated_at)
SELECT 'ponti', 'I Ponti', NULL, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO mondo_bianco_cards (id, name, description, created_by, created_at, updated_at)
SELECT 'storie', 'Le Storie', NULL, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO mondo_bianco_cards (id, name, description, created_by, created_at, updated_at)
SELECT 'calendario', 'Il Calendario', NULL, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO mondo_bianco_cards (id, name, description, created_by, created_at, updated_at)
SELECT 'cuffiette', 'Le Cuffiette', NULL, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO mondo_bianco_cards (id, name, description, created_by, created_at, updated_at)
SELECT 'tavolo-da-gioco', 'Il Tavolo da Gioco', NULL, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO mondo_bianco_cards (id, name, description, created_by, created_at, updated_at)
SELECT 'mappa', 'La Mappa', NULL, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO mondo_bianco_cards (id, name, description, created_by, created_at, updated_at)
SELECT 'lettere', 'La Cassetta delle Lettere', NULL, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO mondo_bianco_cards (id, name, description, created_by, created_at, updated_at)
SELECT 'domande', 'Il Pozzo dei Dubbi', NULL, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO mondo_bianco_cards (id, name, description, created_by, created_at, updated_at)
SELECT 'cose-da-fare-insieme', 'L''Agenda delle Idee', NULL, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO mondo_bianco_cards (id, name, description, created_by, created_at, updated_at)
SELECT 'ricettario', 'Il Ricettario', NULL, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO mondo_bianco_cards (id, name, description, created_by, created_at, updated_at)
SELECT 'impostazioni-mondo', 'La Stanza dei Bottoni', NULL, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO mondo_bianco_cards (id, name, description, created_by, created_at, updated_at)
SELECT 'il-cielo', 'Il Cielo', NULL, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
