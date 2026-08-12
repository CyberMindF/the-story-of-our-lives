-- Fase 7 del CMS: importa le 13 ricette esistenti da web/public/content/recipes.json in

-- recipes, con la stessa posizione dell'array originale. Il JSON resta sul filesystem come

-- riferimento fino a quando ricettario.ts non passa a leggere dall'API (prossimo commit).

INSERT INTO recipes (id, title, kind, note, placeholder, source_label, source_href, ingredients, steps, position, created_by, created_at, updated_at)
SELECT 'pizza-pane', 'Pizza e pane — mezza dose', 'Fatta insieme', 'Un solo impasto da dividere tra una pizza e un pane o una focaccia piccola.', 0, NULL, NULL, '["375 g di farina 00/0", "125 g di semola rimacinata o grano duro", "300 ml di acqua", "7–8 g di lievito fresco", "10 g di sale", "10 g di olio"]', '["Impastare farina, acqua e lievito.", "Aggiungere sale e olio.", "Far lievitare per 2 ore.", "Dividere l’impasto: 550–600 g per la pizza e 200–250 g per il pane o la focaccia.", "Far lievitare i panetti per altre 2 ore.", "Cuocere la pizza a 240–250 °C, possibilmente su una teglia preriscaldata, per circa 10–15 minuti.", "Cuocere il pane o la focaccia a 180–200 °C per circa 20–30 minuti, controllando la doratura."]', 0, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO recipes (id, title, kind, note, placeholder, source_label, source_href, ingredients, steps, position, created_by, created_at, updated_at)
SELECT 'pasta-uovo', 'Pasta all’uovo per due', 'Fatta insieme', NULL, 0, NULL, NULL, '["200 g di farina 00", "2 uova", "1 pizzico di sale"]', '["Impastare farina, uova e sale.", "Far riposare il panetto per 30 minuti.", "Stendere l’impasto.", "Tagliarlo al coltello per ottenere tagliatelle o pappardelle rustiche.", "Cuocere in acqua salata per 2–4 minuti."]', 1, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO recipes (id, title, kind, note, placeholder, source_label, source_href, ingredients, steps, position, created_by, created_at, updated_at)
SELECT 'ragu-bianco', 'Ragù bianco semplice', 'Fatta insieme', NULL, 0, NULL, NULL, '["200–250 g di macinato misto, oppure salsiccia e macinato", "Soffritto pronto oppure mezza cipolla", "Olio", "Sale e pepe", "Vino bianco", "Rosmarino o salvia, facoltativi", "Latte o panna, facoltativi", "Parmigiano"]', '["Scaldare l’olio con il soffritto o la cipolla.", "Aggiungere la carne e rosolarla bene.", "Sfumare con il vino bianco.", "Aggiungere sale, pepe e, se volete, rosmarino o salvia.", "Cuocere lentamente per 30–40 minuti.", "Alla fine aggiungere un goccio di latte o panna, se serve.", "Mantecare la pasta con ragù, acqua di cottura e parmigiano."]', 2, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO recipes (id, title, kind, note, placeholder, source_label, source_href, ingredients, steps, position, created_by, created_at, updated_at)
SELECT 'cookies', 'Cookies — circa 12', 'Fatta insieme', NULL, 0, NULL, NULL, '["190 g di farina 00", "115 g di burro morbido", "150 g di gocce di cioccolato fondente", "1 uovo medio", "65 g di zucchero di canna", "65 g di zucchero bianco", "4 g di lievito per dolci", "Vaniglia o vanillina", "1 pizzico di sale"]', '["Mescolare il burro morbido con i due zuccheri.", "Aggiungere l’uovo.", "Unire farina, lievito e sale.", "Aggiungere le gocce di cioccolato.", "Lasciare l’impasto in frigo per 30 minuti.", "Formare circa 12 palline senza schiacciarle troppo.", "Cuocere in forno statico a 165 °C per 18–22 minuti. Devono uscire ancora leggermente morbidi al centro: si rassoderanno raffreddandosi."]', 3, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO recipes (id, title, kind, note, placeholder, source_label, source_href, ingredients, steps, position, created_by, created_at, updated_at)
SELECT 'patate-schiacciate', 'Patate schiacciate croccanti', 'Da provare', NULL, 0, NULL, NULL, '["Patate piccole o medie", "Olio", "Sale e pepe", "Rosmarino o paprika", "Parmigiano, facoltativo", "Salsa yogurt, maionese o ketchup, facoltativi"]', '["Bollire le patate finché diventano morbide.", "Disporle sulla carta forno.", "Schiacciarle con un bicchiere.", "Condire con olio, sale, pepe e rosmarino o paprika.", "Cuocere a 220 °C finché diventano croccanti."]', 4, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO recipes (id, title, kind, note, placeholder, source_label, source_href, ingredients, steps, position, created_by, created_at, updated_at)
SELECT 'crepes', 'Crêpes', 'Da provare', NULL, 0, NULL, NULL, '["3 uova medie", "250 g di farina 00", "500 g di latte intero", "40 g di burro"]', '["Mescolare uova e latte.", "Aggiungere la farina poco alla volta.", "Unire il burro fuso.", "Far riposare la pastella, se possibile.", "Cuocere in una padella calda leggermente imburrata."]', 5, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO recipes (id, title, kind, note, placeholder, source_label, source_href, ingredients, steps, position, created_by, created_at, updated_at)
SELECT 'pollo-curry', 'Pollo al curry', 'Fatta insieme', 'Ricetta provvisoria da modificare con la nostra versione. Senza riso.', 1, 'Ricetta di riferimento — La Cucina Italiana', 'https://www.lacucinaitaliana.it/ricetta/pollo-curry/', '["800 g di petto di pollo", "250 g di latte di cocco cremoso", "2 carote", "2 cipolle", "2 gambi di sedano", "2 mele", "Farina", "Brodo vegetale", "Curry", "Vino bianco", "Olio extravergine di oliva", "Sale e pepe"]', '["Tritare sedano, carote e cipolle; tagliare le mele a dadini.", "Tagliare il pollo a bocconcini e infarinarlo.", "Rosolare il trito con poco olio e metterlo da parte.", "Nella stessa casseruola rosolare il pollo senza sovrapporre i bocconcini.", "Sfumare con poco vino bianco, aggiungere il trito e brodo fino a tre quarti dell’altezza del pollo.", "Coprire e cuocere lentamente per 15 minuti.", "Aggiungere latte di cocco e curry, regolare di sale e pepe e cuocere altri 15 minuti.", "Alzare infine la fiamma per far addensare la salsa e servire senza riso."]', 6, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO recipes (id, title, kind, note, placeholder, source_label, source_href, ingredients, steps, position, created_by, created_at, updated_at)
SELECT 'biscotti-pasta-frolla', 'Biscotti di pasta frolla', 'Fatta insieme', 'Li abbiamo fatti insieme; manca soltanto da ricostruire la nostra ricetta precisa.', 1, NULL, NULL, '["Ingredienti da ricordare insieme"]', '["Procedimento da ricordare insieme"]', 7, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO recipes (id, title, kind, note, placeholder, source_label, source_href, ingredients, steps, position, created_by, created_at, updated_at)
SELECT 'latte-menta', 'Latte e menta', 'Da provare', NULL, 0, NULL, NULL, '["Latte freddo", "Sciroppo alla menta"]', '["Versare il latte in un bicchiere.", "Aggiungere poco sciroppo alla menta alla volta.", "Mescolare e fermarsi quando il sapore ci piace."]', 8, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO recipes (id, title, kind, note, placeholder, source_label, source_href, ingredients, steps, position, created_by, created_at, updated_at)
SELECT 'selz-limone-sale', 'Selz, limone e sale', 'Da provare', NULL, 0, NULL, NULL, '["Acqua di selz molto fredda", "Succo di limone", "Un pizzico di sale", "Ghiaccio, facoltativo"]', '["Versare il succo di limone nel bicchiere.", "Aggiungere un pizzico di sale e mescolare.", "Completare lentamente con il selz freddo.", "Aggiungere ghiaccio se lo vogliamo e bere subito."]', 9, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO recipes (id, title, kind, note, placeholder, source_label, source_href, ingredients, steps, position, created_by, created_at, updated_at)
SELECT 'salsiccia-patate', 'Salsiccia e patate', 'Fatta insieme', 'La nostra prima ricetta fatta insieme.', 0, NULL, NULL, '["Salsiccia", "Patate", "Olio", "Sale e pepe", "Rosmarino"]', '["Tagliare le patate a pezzi simili e condirle con olio, sale, pepe e rosmarino.", "Infornarle a 200 °C.", "Dopo circa 20 minuti aggiungere la salsiccia a pezzi.", "Proseguire la cottura finché le patate sono dorate e la salsiccia è ben cotta, girando tutto a metà cottura."]', 10, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO recipes (id, title, kind, note, placeholder, source_label, source_href, ingredients, steps, position, created_by, created_at, updated_at)
SELECT 'trofie-pesto', 'Trofie col pesto del barattolo', 'Fatta insieme', 'Ricetta volutamente molto sofisticata.', 0, NULL, NULL, '["Trofie", "Pesto del barattolo", "Sale", "Acqua di cottura", "Parmigiano, se ci va"]', '["Cuocere le trofie in acqua salata.", "Stemparare il pesto con poca acqua di cottura, senza cuocerlo.", "Scolare la pasta e mescolarla col pesto.", "Aggiungere parmigiano se ci va."]', 11, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO recipes (id, title, kind, note, placeholder, source_label, source_href, ingredients, steps, position, created_by, created_at, updated_at)
SELECT 'pasta-passata-pizza', 'Pasta con la passata rimasta dalla pizza', 'Fatta insieme', 'La ricetta ufficiale del non buttare niente, soprattutto se può diventare un meme.', 0, NULL, NULL, '["Pasta", "La passata avanzata dalla pizza", "Olio", "Sale", "Aglio o cipolla, se disponibili", "Parmigiano, facoltativo"]', '["Scaldare poco olio con aglio o cipolla, se ci sono.", "Aggiungere la passata avanzata e farla restringere mentre cuoce la pasta.", "Regolare di sale.", "Scolare la pasta e saltarla nel sugo.", "Mangiarla ricordando solennemente che prima era una pizza."]', 12, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
