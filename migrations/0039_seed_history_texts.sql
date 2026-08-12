-- Fase 4 del CMS (documentazione/cms/planning-editor-contenuti.md): terzo lotto, i testi 'history' ancora

-- hardcoded nei template tra quelli raccomandati history dall'inventario. Ogni chiave crea

-- direttamente entry + prima versione, senza passare da un intermedio 'replace' (a

-- differenza delle 4 del primo lotto, qui la modalità è corretta fin dall'inizio). Restano

-- fuori i testi delle raccolte in JSON (cuffiette, storie, mappa, bacheca) e

-- mappamondo.introduzione, bloccato dalla decisione #3 ancora aperta sull'inventario.

INSERT INTO content_entries (content_key, label, content_type, versioning_mode, created_by, created_at, updated_at)
SELECT 'ponti.introduzione', 'Ponti — introduzione', 'plain_text', 'history', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO content_versions (entry_id, body, author_id, created_at)
SELECT ce.id, 'Sai perché ho scelto proprio un arcobaleno per questa pagina? Si dice nella mitologia norrena (quella di Odino, Loki e Thor per intenderci) esistesse un ponte che unisce la terra degli umani e il regno degli Dei. Si chiama Bifrost il "Ponte Arcobaleno". Ho pensato che fosse un bel modo di rappresentare il nostro passaggio pieno di colori, che come per loro, collega i nostri due mondi e ci può fare incontrare in uno costruito apposta per noi, dove le regole del mondo, non valgono più', ce.created_by, ce.created_at
FROM content_entries ce WHERE ce.content_key = 'ponti.introduzione';

UPDATE content_entries
SET current_version_id = (SELECT id FROM content_versions WHERE entry_id = content_entries.id ORDER BY id DESC LIMIT 1)
WHERE content_key = 'ponti.introduzione';

INSERT INTO content_entries (content_key, label, content_type, versioning_mode, created_by, created_at, updated_at)
SELECT 'domande.introduzione', 'Il Pozzo dei Dubbi — introduzione', 'plain_text', 'history', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO content_versions (entry_id, body, author_id, created_at)
SELECT ce.id, 'Questa pagina nasce dai tanti dubbi che mi vengono, quindi ho pensato che sarebbe stato carino raccoglierli qui e tu puoi venire a toglierne qualcuno quando ti va. Ovviamente anche tu puoi lasciarne di tuoi, se ne hai.', ce.created_by, ce.created_at
FROM content_entries ce WHERE ce.content_key = 'domande.introduzione';

UPDATE content_entries
SET current_version_id = (SELECT id FROM content_versions WHERE entry_id = content_entries.id ORDER BY id DESC LIMIT 1)
WHERE content_key = 'domande.introduzione';

INSERT INTO content_entries (content_key, label, content_type, versioning_mode, created_by, created_at, updated_at)
SELECT 'tavolo.introduzione', 'Il Tavolo da Gioco — introduzione', 'plain_text', 'history', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO content_versions (entry_id, body, author_id, created_at)
SELECT ce.id, 'Questo piccolo angolo di questo mondo è nato per la necessità di costruire qualcosa di nuovo insieme a te. Qualcosa che ci potesse lasciare dei bei momenti insieme, dei ricordi, delle risate, o perché no anche qualche momento più triste, qualche scelta difficile ma che potesse magari lasciare quel pensiero "wow una bella esperienza". È nato in un tempo in cui era difficile parlare, un tempo dove eravamo divisi e sembrava impossibile poterci unire di nuovo. Poi lo sai, da allora le cose sono state diverse, alla fine i giochi sono diventati un po'' una parte di noi, il monopoly, scarabeo, plato, the mind, quello della bomba e chi più ne ha più ne metta. Quando giochiamo sembriamo sempre tornare un po'' quelli che siamo sempre stati, un po'' più piccoli, un po'' più noi, un po'' più legati e forse a volte un po'' più innamorati. Spero che questa parte del mondo potrà essere utilizzata molto un giorno, e che diventerà ancora il nostro piccolo rifugio, anche in questi momenti dove ormai si sta un po'' spegnendo tutto', ce.created_by, ce.created_at
FROM content_entries ce WHERE ce.content_key = 'tavolo.introduzione';

UPDATE content_entries
SET current_version_id = (SELECT id FROM content_versions WHERE entry_id = content_entries.id ORDER BY id DESC LIMIT 1)
WHERE content_key = 'tavolo.introduzione';

INSERT INTO content_entries (content_key, label, content_type, versioning_mode, created_by, created_at, updated_at)
SELECT 'gdr.introduzione', 'Gioco di Ruolo — introduzione', 'paragraphs', 'history', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO content_versions (entry_id, body, author_id, created_at)
SELECT ce.id, 'Giusto per fartelo sapere, questa è la cosa che ho aggiunto dopo. Lo sai che ho sempre pensato che mi piacerebbe farti provare i giochi di ruolo no? Perché beh trovo quasi assurdo il fatto che proprio tu non sia mai entrata per niente a far parte di una della mie passioni più grandi. Quindi ho pensato che volevo trovare un modo per fartelo provare e allo stesso tempo un modo per giocare un pochino insieme, visto che non possiamo più farlo in nessun modo. E questo è l''unico modo carino che mi è venuto in mente ahaha. Quindi beh spero che ti piaccia l''idea e che ti divertirai

Beh come funziona? Ho creato un piccolo sistema super semplificato, super semplice, super veloce e super un sacco di cose ahaha. Così non devi imparare una marea di regole e puoi provare solo la parte bella di giocare e possiamo giocare insieme. Io ti faccio da master e ho già creato una storia per te, dove tu ovviamente sei la protagonista e ricordati che puoi fare tutto quello che vuoi, il personaggio è tuo e lo vuoi come vuoi. Ovviamente puoi chiedermi delucidazioni se hai dei dubbi

Dopo ti metto le regole del gioco, che sono tipo 5. Mentre invece come facciamo a giocare? Anche questo è molto semplice. Mi sono ispirato a una cosa che alcuni fanno nei forum, che io non ho mai fatto quindi la proviamo insieme ahaha. Ovvero una cosa che si chiama "play-by-chat", appunto si gioca tramite la chat. Cioè che io scrivo qualcosa sul come prosegue la tua avventura e poi aspetto la tua risposta. Tendenzialmente cercherò sempre di lasciarti sempre con una domanda o delle scelte e tu descriverai cosa fa/dice il tuo personaggio e poi io ti rispondo, e si va avanti così fino alla fine della storia. Beh questo è tutto, molto semplice. Obiettivo in generale non è "vincere" qualcosa, ma solo raccontare una storia insieme e divertirci giocando', ce.created_by, ce.created_at
FROM content_entries ce WHERE ce.content_key = 'gdr.introduzione';

UPDATE content_entries
SET current_version_id = (SELECT id FROM content_versions WHERE entry_id = content_entries.id ORDER BY id DESC LIMIT 1)
WHERE content_key = 'gdr.introduzione';

INSERT INTO content_entries (content_key, label, content_type, versioning_mode, created_by, created_at, updated_at)
SELECT 'linguaggio-segreto.introduzione', 'Il Nostro Linguaggio — introduzione', 'paragraphs', 'history', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO content_versions (entry_id, body, author_id, created_at)
SELECT ce.id, 'Una volta in tempi decisamente peggiori ti avevo proposto di usare un linguaggio tutto nostro, per quando avevamo bisogno di parlarci, senza che nessuno potesse saperlo. Tu visto che sei pigra non hai mai voluto impararlo ahaha, però ho sempre pensato che sarebbe stato bello avere una cosa del genere solo nostra. Un modo di parlare che nessuno avrebbe mai potuto comprendere se non noi due. L’ho sempre trovato un po’ romantico e in qualche modo divertente.

Quindi beh anche se non lo usaremo mai, se un giorno avremo bisogno di dirci qualcosa in codice, qui possiamo ancora vedere cosa vogliono dire le cose. E se avrai bisogno di dirmi in segreto che sei felice e mi vuoi bene potrai sempre dire + & .... no?', ce.created_by, ce.created_at
FROM content_entries ce WHERE ce.content_key = 'linguaggio-segreto.introduzione';

UPDATE content_entries
SET current_version_id = (SELECT id FROM content_versions WHERE entry_id = content_entries.id ORDER BY id DESC LIMIT 1)
WHERE content_key = 'linguaggio-segreto.introduzione';
