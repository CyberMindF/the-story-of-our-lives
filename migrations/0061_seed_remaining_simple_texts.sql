-- CMS: chiusura dei testi semplici rimasti "Da migrare" (documentazione/cms/inventario-contenuti.md), in
-- ordine prima delle collezioni strutturate ancora aperte (Linguaggio Segreto, GDR, Bacheca).
-- portone.* e not-found.messaggio restano fuori: sono pagine raggiungibili prima del login,
-- e /api/content richiede sempre una sessione autenticata — migrarli richiederebbe un percorso
-- di lettura pubblico non ancora deciso, non una semplice riga di seed.
-- messaggio-criptato.istruzioni resta fuori: il testo contiene un link a un sito esterno
-- (AES Decryption) e la sintassi link di EditorialText supporta solo rotte interne — la
-- migrazione toglierebbe il collegamento cliccabile. Coerente anche con la decisione già presa
-- nell'inventario che il Messaggio Criptato non ha un editor CMS dedicato.

-- mondo-bianco.canzone.citazione (paragraphs/replace): i quattro versi restano un unico blocco
-- con a-capo singoli (EditorialText li rende come <br>, non come paragrafi separati), non una
-- riga vuota tra loro.
INSERT INTO content_entries (content_key, label, content_type, versioning_mode, body, created_by, created_at, updated_at)
SELECT 'mondo-bianco.canzone.citazione', 'Mondo Bianco — versi della canzone', 'paragraphs', 'replace', 'Non so da dove partirò
Ma ovunque sarò
Siamo un cerchio, che non ha inizio, né una fine
Perché da te io sempre tornerò', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO content_entries (content_key, label, content_type, versioning_mode, body, created_by, created_at, updated_at)
SELECT 'storie.suggerimento.eyebrow', 'Storie — eyebrow suggerimento', 'plain_text', 'replace', 'Una pagina ancora bianca', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO content_entries (content_key, label, content_type, versioning_mode, body, created_by, created_at, updated_at)
SELECT 'storie.suggerimento.titolo', 'Storie — titolo suggerimento', 'plain_text', 'replace', 'Lasciami una storia', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO content_entries (content_key, label, content_type, versioning_mode, body, created_by, created_at, updated_at)
SELECT 'linguaggio-segreto.messaggio-codice', 'Linguaggio Segreto — messaggio in codice', 'plain_text', 'replace', '. & ... <>', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO content_entries (content_key, label, content_type, versioning_mode, body, created_by, created_at, updated_at)
SELECT 'profilo.introduzione', 'Profilo — introduzione', 'plain_text', 'replace', 'Da qui puoi cambiare come ti chiami e la tua password.', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

-- bacheca.introduzione (paragraphs/history, come da decisione dell'inventario): testo
-- recuperato da bacheca.json, ancora l'unica fonte per questi due paragrafi finché non viene
-- archiviato.
INSERT INTO content_entries (content_key, label, content_type, versioning_mode, created_by, created_at, updated_at)
SELECT 'bacheca.introduzione', 'Bacheca — introduzione', 'paragraphs', 'history', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO content_versions (entry_id, body, author_id, created_at)
SELECT ce.id, 'Questo luogo in particolare è la spiegazione del perché ho creato tutto questo. Una volta ti avevo detto che avrei fatto in modo che tu potessi avere le nostre foto ed eccoci qui. Ovviamente non mi potevo non esagerare, come il mio solito ahaha

Anche se è difficile guardarle, volevo che fosse una piccola esperienza bella rivederle per te, come se le stessimo guardando insieme uno accanto all’altro in un mondo dove tutto è ok. Non sapendo quali fossero quelle che non hai più, le ho messe semplicemente tutte tranne quattro che non so se ti fa piacere vedere', ce.created_by, ce.created_at
FROM content_entries ce WHERE ce.content_key = 'bacheca.introduzione';

UPDATE content_entries
SET current_version_id = (SELECT id FROM content_versions WHERE entry_id = content_entries.id ORDER BY id DESC LIMIT 1)
WHERE content_key = 'bacheca.introduzione';
