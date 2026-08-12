-- Fase 4 del CMS: ultimi tre testi delle Cuffiette, rimasti in music.json fino a oggi

-- perché songsIntroduction usava una notazione a mano ('[ 🌈 I Ponti ]', gestita in

-- cuffiette.ts con un sanitizzatore dedicato) per il link verso /ponti. Convertita nella

-- nuova sintassi controllata [etichetta](/rotta) supportata da EditorialText (decisione #6

-- dell'inventario) prima di migrarla.

INSERT INTO content_entries (content_key, label, content_type, versioning_mode, created_by, created_at, updated_at)
SELECT 'cuffiette.playlist.introduzione', 'Cuffiette — introduzione alla playlist', 'plain_text', 'history', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO content_versions (entry_id, body, author_id, created_at)
SELECT ce.id, 'Qui dentro come già sai ci sono tutte le canzoni che almeno una volta mi hanno fatto pensare a te, a noi, o alla nostra situazione, passata e presente. Qui ci sono frasi che forse sentivo che non sarei mai riuscito a dire così bene allora in qualche modo ho voluto “dedicartele” mettendole qui', ce.created_by, ce.created_at
FROM content_entries ce WHERE ce.content_key = 'cuffiette.playlist.introduzione';

UPDATE content_entries
SET current_version_id = (SELECT id FROM content_versions WHERE entry_id = content_entries.id ORDER BY id DESC LIMIT 1)
WHERE content_key = 'cuffiette.playlist.introduzione';

INSERT INTO content_entries (content_key, label, content_type, versioning_mode, created_by, created_at, updated_at)
SELECT 'cuffiette.canzoni.introduzione', 'Cuffiette — introduzione alle canzoni', 'plain_text', 'history', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO content_versions (entry_id, body, author_id, created_at)
SELECT ce.id, 'Se non è troppo vorrei farti una richiesta. Ho immaginato per tanto tempo di farti sentire queste canzoni potendoti guardare negli occhi, vedendo se avresti sorriso, avresti pianto, ti saresti sorpresa o se boh, magari ti saresti buttata su di me per stringermi forte ahaha. Visto che purtroppo non è possibile ti volevo chiedere se ti andasse di registrare la tua reazione quando le senti per la prima volta (magari fai video diversi così poi non è un casino con un video enorme ahaha). Lo so forse è tanto da chiedere e penso che mi farà un certo effetto vederti dopo tutto questo tempo, magari sei cambiata tanto o per niente, chissà. Se lo fai, grazie, sono tanto contento. Se non hai ancora visto vai a [🌈 I Ponti](/ponti) per capire cosa fare poi con i video ahaha. Beh insomma, tutto qui, grazie ancora e a questo punto buon ascolto', ce.created_by, ce.created_at
FROM content_entries ce WHERE ce.content_key = 'cuffiette.canzoni.introduzione';

UPDATE content_entries
SET current_version_id = (SELECT id FROM content_versions WHERE entry_id = content_entries.id ORDER BY id DESC LIMIT 1)
WHERE content_key = 'cuffiette.canzoni.introduzione';

INSERT INTO content_entries (content_key, label, content_type, versioning_mode, body, created_by, created_at, updated_at)
SELECT 'cuffiette.parole-rubate.introduzione', 'Cuffiette — introduzione alle Parole Rubate', 'plain_text', 'replace', 'Qui scriverò ogni tanto le frasi delle canzoni che mi hanno fatto pensare a te, a noi, alla situazione, un po’ tutto, magari le più importanti', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
