-- Fase 4 del CMS: mappa.introduzione, migrata insieme alla raccolta per lo stesso motivo di
-- storie.introduzione (0046) — viveva nello stesso JSON. 'history' come raccomandato
-- dall'inventario, 'paragraphs' perché sono due paragrafi distinti.
INSERT INTO content_entries (content_key, label, content_type, versioning_mode, created_by, created_at, updated_at)
SELECT 'mappa.introduzione', 'Mappa — introduzione', 'paragraphs', 'history', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO content_versions (entry_id, body, author_id, created_at)
SELECT ce.id, 'Ti ricordi? Per un po’ abbiamo sognato il mondo a portata di mano, quando sentivamo che avremmo potuto collezionare mille esperienze insieme e girare ogni angolo del mondo solo io e te, come se fosse la nostra piccola o grande avventura di vita e ora che abbiamo un mondo tutto nostro possiamo mettere qui tutte quelle mete che un giorno andremo a vedere. Ma fino ad allora lasciamo che quei sogni possano viene qui, in questo posto che di sogni è composto

E come ti ho detto una volta sarebbe stato bellissimo avere un album dei ricordi, da tenere sotto il letto e da aprire ogni volta che stavamo insieme, per riguardare quelle vecchie, i viaggi, ma anche i momenti belli che avevamo immortalato. E aggiornarlo man mano con ogni foto del bacio sotto il monumento di turno o davanti a qualcosa di bello che avremmo trovato in quella nuova città ahaha. E pian piano magari ce ne sarebbe servito un nuovo dopo un po’', ce.created_by, ce.created_at
FROM content_entries ce WHERE ce.content_key = 'mappa.introduzione';

UPDATE content_entries
SET current_version_id = (SELECT id FROM content_versions WHERE entry_id = content_entries.id ORDER BY id DESC LIMIT 1)
WHERE content_key = 'mappa.introduzione';
