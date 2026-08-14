-- Seed dei blocchi pubblici della seconda avventura GDR "La casa che trattiene il respiro"
-- (#16): solo l'incipit fisso fino al primo bivio (da lì in poi è un vero play-by-chat, il
-- turno lo scrive la giocatrice) e le regole trasparenti (dado, Lucidità, "come si gioca").
-- Il resto dello script (segreti della casa, stanze, finali) resta fuori da questa tabella
-- pubblica: è materiale per il Master, non contenuto CMS da mostrare in pagina.
--
-- La nota "come si gioca" vive nel documento delle regole (casa-regole), non nel corpo della
-- storia: qui esiste un tab Regole dedicato nel pannello di gioco apposta per questo tipo di
-- contenuto meta, a differenza della prima avventura (dove il pannello non esisteva ancora e
-- la nota era per forza infilata nel testo narrativo).

INSERT INTO gdr_blocks (document_key, type, data, position, created_by, created_at, updated_at)
SELECT 'casa-avventura', 'heading', '{"level":2,"text":"Incipit"}', 0, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO gdr_blocks (document_key, type, data, position, created_by, created_at, updated_at)
SELECT 'casa-avventura', 'heading', '{"level":3,"text":"L''atmosfera"}', 1, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO gdr_blocks (document_key, type, data, position, created_by, created_at, updated_at)
SELECT 'casa-avventura', 'paragraph', '{"text":"Mini mistero horror psicologico, pensato per una sola serata: 30–45 minuti, un po'' di pioggia, una casa che sembra vuota e non lo è del tutto. Non aspettarti salti sulla sedia — qui la paura è lenta, fatta di dettagli che non tornano e di cose che ricordi diverse da come le hai lasciate."}', 2, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO gdr_blocks (document_key, type, data, position, created_by, created_at, updated_at)
SELECT 'casa-avventura', 'heading', '{"level":3,"text":"Il tuo personaggio"}', 3, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO gdr_blocks (document_key, type, data, position, created_by, created_at, updated_at)
SELECT 'casa-avventura', 'paragraph', '{"text":"Non hai una scheda con razza e classe stavolta: sei semplicemente tu, o comunque qualcuna che sta tornando a casa sotto la pioggia, senza sapere ancora cosa sta per raccogliere da terra. Il resto lo scrivi tu, turno dopo turno."}', 4, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO gdr_blocks (document_key, type, data, position, created_by, created_at, updated_at)
SELECT 'casa-avventura', 'heading', '{"level":3,"text":"L''inizio"}', 5, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

-- Ogni "battuta" del copione è un paragraph block a sé (non righe unite con \n dentro un
-- unico blocco): solo così il margine tra paragrafi (gdr-blocks.css, 1.15rem) resta un segnale
-- affidabile di stacco di paragrafo, distinto dall'a-capo naturale dentro un paragrafo lungo —
-- con tutto in un blocco solo le due cose erano visivamente indistinguibili (segnalato da Rory).
INSERT INTO gdr_blocks (document_key, type, data, position, created_by, created_at, updated_at)
SELECT 'casa-avventura', 'paragraph', '{"text":"Sta piovendo da abbastanza tempo perché ormai tu abbia smesso di cercare di evitare le pozzanghere. La strada verso casa è quasi deserta."}', 6, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO gdr_blocks (document_key, type, data, position, created_by, created_at, updated_at)
SELECT 'casa-avventura', 'paragraph', '{"text":"Mentre cammini, qualcosa sul bordo del marciapiede riflette per un momento la luce di un lampione."}', 7, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO gdr_blocks (document_key, type, data, position, created_by, created_at, updated_at)
SELECT 'casa-avventura', 'paragraph', '{"text":"Un mazzo di vecchie chiavi. Sono annerite dal tempo."}', 8, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO gdr_blocks (document_key, type, data, position, created_by, created_at, updated_at)
SELECT 'casa-avventura', 'paragraph', '{"text":"Attaccato all''anello c''è un piccolo portachiavi a forma di stella, scolorito e graffiato."}', 9, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO gdr_blocks (document_key, type, data, position, created_by, created_at, updated_at)
SELECT 'casa-regole', 'heading', '{"level":2,"text":"Regole"}', 0, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO gdr_blocks (document_key, type, data, position, created_by, created_at, updated_at)
SELECT 'casa-regole', 'callout', '{"lead":"Come si gioca:","text":"come sempre a turni. Leggi l''inizio nella pagina dell''avventura, poi scrivi cosa fa e pensa il tuo personaggio — il resto lo scopriamo insieme, un pezzo alla volta, in base a quello che deciderai."}', 1, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO gdr_blocks (document_key, type, data, position, created_by, created_at, updated_at)
SELECT 'casa-regole', 'paragraph', '{"text":"Serve solo un d6. Te lo tiro io quando fai qualcosa di davvero rischioso — per i normali indizi non serve mai tirare, quelli li trovi sempre: il dado decide solo a che prezzo."}', 2, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO gdr_blocks (document_key, type, data, position, created_by, created_at, updated_at)
SELECT 'casa-regole', 'table', '{"header":["Tiro","Risultato"],"rows":[["1–2","Fallisce, o riesce nel modo peggiore possibile. Il pericolo aumenta."],["3–4","Riesce, ma con una complicazione o qualcosa di inquietante."],["5–6","Riesce pienamente."]]}', 3, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO gdr_blocks (document_key, type, data, position, created_by, created_at, updated_at)
SELECT 'casa-regole', 'heading', '{"level":3,"text":"Lucidità"}', 4, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO gdr_blocks (document_key, type, data, position, created_by, created_at, updated_at)
SELECT 'casa-regole', 'paragraph', '{"text":"Parti con 3 punti di Lucidità. Puoi perderne uno davanti a qualcosa di particolarmente sconvolgente — te lo dirò io quando succede. Trovi il contatore nella scheda qui sotto: più scende, meno puoi fidarti di quello che stai vedendo."}', 5, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
