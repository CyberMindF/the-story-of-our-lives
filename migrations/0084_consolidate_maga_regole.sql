-- Le regole di gioco di "Il Prezzo della Verità" (d8+statistica, tabella esiti, Punti Stress,
-- Magia) vivevano come markup fisso nella pagina di atterraggio (il-prezzo-della-verita.html),
-- separate dalle Abilità/Incantesimi (già in maga-regole, mostrate ne La Tua Maga). Con il
-- pannello unico non ha senso avere le regole sparse in due posti: tutto confluisce nel tab
-- Regole del pannello, come chiesto da Rory. La pagina di atterraggio perde la sezione
-- regole, resta solo introduzione + link all'avventura.
--
-- Riscritto l'intero documento maga-regole (le 4 righe esistenti, id 42-45, sono cancellate e
-- reinserite identiche in mezzo al nuovo contenuto, testo copiato parola per parola dalla
-- pagina precedente): non c'è modo di "inserire in mezzo" con position espliciti già occupati
-- senza toccare anche quelli esistenti.
DELETE FROM gdr_blocks WHERE document_key = 'maga-regole';

INSERT INTO gdr_blocks (document_key, type, data, position, created_by, created_at, updated_at)
SELECT 'maga-regole', 'heading', '{"level":2,"text":"Regole"}', 0, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO gdr_blocks (document_key, type, data, position, created_by, created_at, updated_at)
SELECT 'maga-regole', 'paragraph', '{"text":"Quando fai qualcosa di incerto tira un dado a otto facce (d8) e sommaci una statistica:"}', 1, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO gdr_blocks (document_key, type, data, position, created_by, created_at, updated_at)
SELECT 'maga-regole', 'table', '{"header":["Statistica","Serve per"],"rows":[["🧠 Mente","ragionare, ricordare, risolvere"],["❤️‍🔥 Cuore","persuadere, resistere emotivamente, connetterti"],["💪🏼 Corpo","muoverti, nasconderti, resistere fisicamente"],["✨ Magia","incantesimi e percezione magica"]]}', 2, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO gdr_blocks (document_key, type, data, position, created_by, created_at, updated_at)
SELECT 'maga-regole', 'table', '{"header":["Tiro totale","Risultato"],"rows":[["10+","Funziona come vuoi."],["6-9","Funziona, ma qualcosa complica le cose."],["5 o meno","Qualcosa va storto."]]}', 3, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO gdr_blocks (document_key, type, data, position, created_by, created_at, updated_at)
SELECT 'maga-regole', 'heading', '{"level":3,"text":"Cos''è una scena?"}', 4, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO gdr_blocks (document_key, type, data, position, created_by, created_at, updated_at)
SELECT 'maga-regole', 'paragraph', '{"text":"Tendenzialmente una scena è semplicemente una serie di azioni che si svolgono nel gioco in un unico arco temporale e di solito in un unico luogo."}', 5, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO gdr_blocks (document_key, type, data, position, created_by, created_at, updated_at)
SELECT 'maga-regole', 'heading', '{"level":3,"text":"Punti Stress"}', 6, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO gdr_blocks (document_key, type, data, position, created_by, created_at, updated_at)
SELECT 'maga-regole', 'paragraph', '{"text":"Hai 10 Punti Stress. Quando le cose vanno male ne perdi, quando ti riposi ne recuperi. Arrivare a 0 significa avere gravi conseguenze in base alla scena."}', 7, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO gdr_blocks (document_key, type, data, position, created_by, created_at, updated_at)
SELECT 'maga-regole', 'heading', '{"level":3,"text":"Magia"}', 8, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO gdr_blocks (document_key, type, data, position, created_by, created_at, updated_at)
SELECT 'maga-regole', 'paragraph', '{"text":"Puoi lanciare 3 incantesimi tramite gli slot disponibili, ogni scena. Oltre questi 3, ogni lancio aggiuntivo costerà 1 Punto Stress."}', 9, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO gdr_blocks (document_key, type, data, position, created_by, created_at, updated_at)
SELECT 'maga-regole', 'heading', '{"level":3,"text":"Abilità speciali"}', 10, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO gdr_blocks (document_key, type, data, position, created_by, created_at, updated_at)
SELECT 'maga-regole', 'paragraph', '{"text":"(una per scena, automatiche, nessun tiro necessario)"}', 11, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO gdr_blocks (document_key, type, data, position, created_by, created_at, updated_at)
SELECT 'maga-regole', 'list', '{"items":["Lettura dell''eco: tocchi un oggetto e percepisci un''emozione o un ricordo recente legato a esso","Luce senziente: evochi una piccola luce che puoi guidare con la mente","Senso della menzogna: una volta per scena, puoi chiedermi se quello che ti ha detto qualcuno è una bugia","Magia selvaggia: ogni volta che lanci un incantesimo, tira il D8 + Magia come sempre per vedere se riesce. Poi tira anche il D20 → se esce 1-5, la magia è andata fuori controllo: tira il D10 e consulta la tabella \"Effetti Selvaggi\". Puoi tirare tutti e tre i dadi insieme se vuoi per fare prima"]}', 12, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO gdr_blocks (document_key, type, data, position, created_by, created_at, updated_at)
SELECT 'maga-regole', 'table', '{"header":["Tabella Effetti Selvaggi → Tira un D10","Effetto"],"rows":[["1","L''incantesimo si ritorce: colpisce te invece del bersaglio. Perdi 2 Punti Stress."],["2","L''incantesimo esplode: in modo vistoso e rumoroso. Funziona, ma chiunque nelle vicinanze se ne accorge."],["3","Perdi il controllo per un momento: un oggetto vicino si rompe da solo in modo rumoroso. Perdi 1 Punto Stress."],["4","Sovraccarico: il prossimo tiro ha -2. Il tuo corpo ha bruciato troppo in una volta sola."],["5","Lasci un segno visibile: gli occhi brillano, le mani fumano leggermente, i capelli si muovono come se ci fosse vento. Dura una scena intera."],["6","Un''onda di calore esplode dal tuo corpo: tutto quello che ti circonda per un metro prende fuoco brevemente."],["7","L''incantesimo si duplica: colpisce due bersagli invece di uno, o ha effetto doppio sullo stesso."],["8","Una scarica di energia pura parte dalle tue mani: non è l''incantesimo che volevi lanciare, è qualcosa di grezzo e potentissimo. Risolve la situazione nel modo più diretto possibile."],["9","Una luce accecante esplode attorno a te per un istante: chiunque ti stia guardando è abbagliato per qualche secondo. Tu rimani al centro, illesa."],["10","La magia ti attraversa completamente: senti la trama stessa attraversarti e per un istante sei pura energia. Descrivi la magia che ne scaturisce, qualsiasi cosa, che ti porti a risolvere la situazione. Non consuma slot, e recuperi 2 Punti Stress."]]}', 13, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO gdr_blocks (document_key, type, data, position, created_by, created_at, updated_at)
SELECT 'maga-regole', 'heading', '{"level":3,"text":"Incantesimi"}', 14, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO gdr_blocks (document_key, type, data, position, created_by, created_at, updated_at)
SELECT 'maga-regole', 'list', '{"items":["Dardo magico: attacco base, silenzioso e affidabile","Scudo magico: blocca un colpo in arrivo","Individuazione del magico: percepisci la presenza di magia nelle vicinanze","Passo felpato: ti muovi in silenzio assoluto","Amicizia: predisponi positivamente qualcuno verso di te per breve tempo","Illusione minore: crei una piccola immagine o suono falso per distrarre","Individuazione dei pensieri: leggi la superficie della mente di qualcuno vicino"]}', 15, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
