-- Seed delle 6 categorie, dei loro simboli e dei 12 esempi, importati fedelmente da
-- web/src/app/pages/linguaggio-segreto/linguaggio-segreto.ts.

INSERT INTO linguaggio_segreto_categories (id, title, icon, note, position, created_by, created_at, updated_at)
SELECT 'sentimenti', 'Sentimenti', '❤️', 'I puntini sono una scala: più ce ne metti, più cresce l’intensità. Il primo puntino da solo però è un caso a parte — è il gesto veloce che ci siamo sempre fatti, e a seconda del momento può voler dire anche “sono arrabbiato” o “via libera”, non solo “ti penso”.', 0, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO linguaggio_segreto_categories (id, title, icon, note, position, created_by, created_at, updated_at)
SELECT 'urgenza', 'Urgenza', '❗', NULL, 1, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO linguaggio_segreto_categories (id, title, icon, note, position, created_by, created_at, updated_at)
SELECT 'tempo', 'Tempo', '⏱️', NULL, 2, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO linguaggio_segreto_categories (id, title, icon, note, position, created_by, created_at, updated_at)
SELECT 'logistica', 'Logistica', '📍', NULL, 3, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO linguaggio_segreto_categories (id, title, icon, note, position, created_by, created_at, updated_at)
SELECT 'sintassi', 'Sintassi', '🔤', NULL, 4, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO linguaggio_segreto_categories (id, title, icon, note, position, created_by, created_at, updated_at)
SELECT 'soggetti', 'Soggetti', '👥', NULL, 5, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO linguaggio_segreto_symbols (id, category_id, symbol, meaning, explanation, position, created_by, created_at, updated_at)
SELECT 1, 'sentimenti', '.', 'Ti penso', NULL, 0, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO linguaggio_segreto_symbols (id, category_id, symbol, meaning, explanation, position, created_by, created_at, updated_at)
SELECT 2, 'sentimenti', '..', 'Messaggio ricevuto', NULL, 1, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO linguaggio_segreto_symbols (id, category_id, symbol, meaning, explanation, position, created_by, created_at, updated_at)
SELECT 3, 'sentimenti', '...', 'Mi manchi', NULL, 2, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO linguaggio_segreto_symbols (id, category_id, symbol, meaning, explanation, position, created_by, created_at, updated_at)
SELECT 4, 'sentimenti', '....', 'Ti voglio benissimo', NULL, 3, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO linguaggio_segreto_symbols (id, category_id, symbol, meaning, explanation, position, created_by, created_at, updated_at)
SELECT 5, 'sentimenti', '.....', 'Ti amo', 'Tempo fa il numero cinque ha rappresentato questo, era un po’ un linguaggio segreto ❤️❤️❤️❤️❤️', 4, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO linguaggio_segreto_symbols (id, category_id, symbol, meaning, explanation, position, created_by, created_at, updated_at)
SELECT 6, 'sentimenti', '- oppure +', 'Sto male / Sto bene', '“-” rappresenta la negatività, quindi sto male; “+” il contrario', 5, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO linguaggio_segreto_symbols (id, category_id, symbol, meaning, explanation, position, created_by, created_at, updated_at)
SELECT 7, 'sentimenti', '*', 'Bacino', 'Il bacino della classica faccina “:*”', 6, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO linguaggio_segreto_symbols (id, category_id, symbol, meaning, explanation, position, created_by, created_at, updated_at)
SELECT 8, 'sentimenti', '<>', 'Abbraccio', 'Sembrano le braccia chiuse dell’abbraccio', 7, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO linguaggio_segreto_symbols (id, category_id, symbol, meaning, explanation, position, created_by, created_at, updated_at)
SELECT 9, 'sentimenti', 'Z oppure Y', 'Buonanotte / Buongiorno', '“Z” è il diminutivo di “ZZZZ”, dormire; “Y” è un omino che si stiracchia', 8, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO linguaggio_segreto_symbols (id, category_id, symbol, meaning, explanation, position, created_by, created_at, updated_at)
SELECT 10, 'urgenza', '!', 'C’è un problema piccolo', 'Pericolo, urgenza, il classico punto esclamativo', 0, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO linguaggio_segreto_symbols (id, category_id, symbol, meaning, explanation, position, created_by, created_at, updated_at)
SELECT 11, 'urgenza', '!!', 'C’è un problema grosso', 'Ancora più pericolo del singolo — in teoria potremmo mettercene quanti vogliamo, tipo dodici “!” sarebbe “super mega iper pericolo” ahaha', 1, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO linguaggio_segreto_symbols (id, category_id, symbol, meaning, explanation, position, created_by, created_at, updated_at)
SELECT 12, 'tempo', '|', 'Oggi / Adesso', 'Come un paletto piantato al centro, o una freccia verso il basso: “ora”', 0, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO linguaggio_segreto_symbols (id, category_id, symbol, meaning, explanation, position, created_by, created_at, updated_at)
SELECT 13, 'tempo', '> oppure <', 'Tra poco / Poco fa', 'Come nei tasti avanti/indietro di telecomandi o youtube “>” punta avanti nel tempo, tra poco; “<” punta indietro, poco fa', 1, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO linguaggio_segreto_symbols (id, category_id, symbol, meaning, explanation, position, created_by, created_at, updated_at)
SELECT 14, 'tempo', '>> oppure <<', 'Stasera / Stamattina', 'Doppio simbolo, un po’ più in là ma sempre nella giornata di oggi', 2, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO linguaggio_segreto_symbols (id, category_id, symbol, meaning, explanation, position, created_by, created_at, updated_at)
SELECT 15, 'tempo', '>>> oppure <<<', 'Domani / Ieri', 'Triplo simbolo, un giorno più in là', 3, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO linguaggio_segreto_symbols (id, category_id, symbol, meaning, explanation, position, created_by, created_at, updated_at)
SELECT 16, 'logistica', '#', 'Sono a casa', 'Somiglia a una struttura, una porta, o appunto un cancelletto', 0, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO linguaggio_segreto_symbols (id, category_id, symbol, meaning, explanation, position, created_by, created_at, updated_at)
SELECT 17, 'logistica', '@', 'Sono fuori / Luogo generico', 'Usata nel mondo informatico per “mandare le cose”, quindi “sono fuori”, rappresenta l’esterno', 1, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO linguaggio_segreto_symbols (id, category_id, symbol, meaning, explanation, position, created_by, created_at, updated_at)
SELECT 18, 'logistica', '0', 'Sono sul documento / Ti ho scritto', NULL, 2, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO linguaggio_segreto_symbols (id, category_id, symbol, meaning, explanation, position, created_by, created_at, updated_at)
SELECT 19, 'logistica', 'X', 'Sono impegnato/a', 'Come per dire negativo, non ci sono', 3, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO linguaggio_segreto_symbols (id, category_id, symbol, meaning, explanation, position, created_by, created_at, updated_at)
SELECT 20, 'sintassi', '?', 'Domanda', 'Il classico punto di domanda, vuol dire esattamente questo', 0, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO linguaggio_segreto_symbols (id, category_id, symbol, meaning, explanation, position, created_by, created_at, updated_at)
SELECT 21, 'sintassi', '/', 'No / Negazione', 'Come barrare una cosa e negarla', 1, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO linguaggio_segreto_symbols (id, category_id, symbol, meaning, explanation, position, created_by, created_at, updated_at)
SELECT 22, 'sintassi', 'V', 'Sì / Affermazione', 'Come se fosse una spunta, è un sì', 2, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO linguaggio_segreto_symbols (id, category_id, symbol, meaning, explanation, position, created_by, created_at, updated_at)
SELECT 23, 'sintassi', '&', 'Congiunzione', 'La “e commerciale”, che usiamo per non scrivere “E” ma è comunque una congiunzione', 3, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO linguaggio_segreto_symbols (id, category_id, symbol, meaning, explanation, position, created_by, created_at, updated_at)
SELECT 24, 'soggetti', '^', 'Un’altra persona', 'È come una freccia che indica da un’altra parte, quindi “qualcun altro”', 0, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO linguaggio_segreto_symbols (id, category_id, symbol, meaning, explanation, position, created_by, created_at, updated_at)
SELECT 25, 'soggetti', '^^', 'Altre persone', 'Il plurale di “^”', 1, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO linguaggio_segreto_examples (id, code, meaning, position, created_by, created_at, updated_at)
SELECT 1, '>>', 'a stasera', 0, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO linguaggio_segreto_examples (id, code, meaning, position, created_by, created_at, updated_at)
SELECT 2, '/ >>', 'stasera non posso o non ci sono', 1, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO linguaggio_segreto_examples (id, code, meaning, position, created_by, created_at, updated_at)
SELECT 3, '/#', 'non sono a casa', 2, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO linguaggio_segreto_examples (id, code, meaning, position, created_by, created_at, updated_at)
SELECT 4, '@?', 'dove sei?', 3, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO linguaggio_segreto_examples (id, code, meaning, position, created_by, created_at, updated_at)
SELECT 5, '#^', 'a casa sua', 4, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO linguaggio_segreto_examples (id, code, meaning, position, created_by, created_at, updated_at)
SELECT 6, '>>>?', 'domani ci sei?', 5, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO linguaggio_segreto_examples (id, code, meaning, position, created_by, created_at, updated_at)
SELECT 7, 'V', 'sì', 6, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO linguaggio_segreto_examples (id, code, meaning, position, created_by, created_at, updated_at)
SELECT 8, '| /#', 'oggi non sono a casa', 7, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO linguaggio_segreto_examples (id, code, meaning, position, created_by, created_at, updated_at)
SELECT 9, '..', 'ok', 8, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO linguaggio_segreto_examples (id, code, meaning, position, created_by, created_at, updated_at)
SELECT 10, '... <> & *', 'mi manchi, ti mando un abbraccio e un bacino', 9, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO linguaggio_segreto_examples (id, code, meaning, position, created_by, created_at, updated_at)
SELECT 11, '0?', 'vieni sul documento?', 10, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO linguaggio_segreto_examples (id, code, meaning, position, created_by, created_at, updated_at)
SELECT 12, '>>> 0', 'domani vengo sul documento', 11, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
