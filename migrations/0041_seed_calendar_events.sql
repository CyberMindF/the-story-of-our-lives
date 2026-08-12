-- Fase 7 del CMS: importa i 29 eventi esistenti da web/public/content/calendar.json in

-- calendar_events. Il JSON resta sul filesystem come riferimento fino a quando calendario.ts

-- non passa a leggere dall'API (prossimo commit) — dopo, va rimosso per non lasciare due

-- fonti di verità equivalenti (regola di zero duplicazione, CLAUDE.md).

INSERT INTO calendar_events (id, event_date, label, body, created_by, created_at, updated_at)
SELECT '2021-08-17', '2021-08-17', '17/08/2021', 'Il giorno che ci siamo conosciuti', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO calendar_events (id, event_date, label, body, created_by, created_at, updated_at)
SELECT '2021-09-17', '2021-09-17', '17/09/2021', 'Il giorno che ci siamo messi insieme', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO calendar_events (id, event_date, label, body, created_by, created_at, updated_at)
SELECT '2022-09-17', '2022-09-17', '17/09/2022', '1 anno insieme', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO calendar_events (id, event_date, label, body, created_by, created_at, updated_at)
SELECT '2023-09-17', '2023-09-17', '17/09/2023', '2 anni insieme', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO calendar_events (id, event_date, label, body, created_by, created_at, updated_at)
SELECT '2024-09-17', '2024-09-17', '17/09/2024', '3 anni insieme', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO calendar_events (id, event_date, label, body, created_by, created_at, updated_at)
SELECT '2024-06-10', '2024-06-10', '10/06/2024', 'Ti ho mandato gli uniposca', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO calendar_events (id, event_date, label, body, created_by, created_at, updated_at)
SELECT '2025-09-17', '2025-09-17', '17/09/2025', '4 anni "insieme" e il video dei 4 anni', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO calendar_events (id, event_date, label, body, created_by, created_at, updated_at)
SELECT '2025-09-25', '2025-09-25', '25/09/2025', 'Il nostro primo incontro, appuntamento, bacio, un sacco di prime cose ahaha e il giorno che ti ho dato i tuoi regali e la letterina', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO calendar_events (id, event_date, label, body, created_by, created_at, updated_at)
SELECT '2025-09-26', '2025-09-26', '26/09/2025', 'Il giorno del mc drive, delle canzoni in macchina, l’unica volta che sono riuscito a prenderti a scuola e ti ho fatto trovare la rosa in macchina e i kinder bueno', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO calendar_events (id, event_date, label, body, created_by, created_at, updated_at)
SELECT '2025-09-27', '2025-09-27', '27/09/2025', 'Il tuo stupendo e diciottesimo a cui finalmente ho potuto partecipare', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO calendar_events (id, event_date, label, body, created_by, created_at, updated_at)
SELECT '2025-09-28', '2025-09-28', '28/09/2025', 'La sera del vestito, del monopoly, del pianto, delle cheesecake e quello in cui ti ho dato quel bracciale con i cerchi', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO calendar_events (id, event_date, label, body, created_by, created_at, updated_at)
SELECT '2025-09-29', '2025-09-29', '29/09/2025', 'Il giorno delle caramelle, la prima volta che abbiamo dormito insieme e il giorno che con quel sorriso mi hai fatto pensare “è lei”', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO calendar_events (id, event_date, label, body, created_by, created_at, updated_at)
SELECT '2025-09-30', '2025-09-30', '30/09/2025', 'Il nostro ultimo giorno, ultimo bacio e tante ultime cose e quello in cui ci siamo scambiati gli elastici', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO calendar_events (id, event_date, label, body, created_by, created_at, updated_at)
SELECT '2025-10-03', '2025-10-03', '03/10/2025', 'Ti ho dedicato la nostra prima canzone scritta da me', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO calendar_events (id, event_date, label, body, created_by, created_at, updated_at)
SELECT '2025-10-27', '2025-10-27', '27/10/2025', 'Ti ho mandato il power bank', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO calendar_events (id, event_date, label, body, created_by, created_at, updated_at)
SELECT '2025-11-18', '2025-11-18', '18/11/2025', 'Ti ho mandato il calendario dell’avvento come regalo di Natale', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO calendar_events (id, event_date, label, body, created_by, created_at, updated_at)
SELECT '2025-12-17', '2025-12-17', '17/12/2025', 'Ti ho mandato i kinder bueno per il mesiversario', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO calendar_events (id, event_date, label, body, created_by, created_at, updated_at)
SELECT '2025-12-26', '2025-12-26', '26/12/2025', 'Il video per gli auguri di Natale', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO calendar_events (id, event_date, label, body, created_by, created_at, updated_at)
SELECT '2026-01-21', '2026-01-21', '21/01/2026', 'La nascita del mondo bianco', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO calendar_events (id, event_date, label, body, created_by, created_at, updated_at)
SELECT '2026-03-04', '2026-03-04', '04/03/2026', 'La creazione del mondo bianco', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO calendar_events (id, event_date, label, body, created_by, created_at, updated_at)
SELECT '2026-03-08', '2026-03-08', '08/03/2026', 'Il bigliettino di auguri per la giornata delle donne', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO calendar_events (id, event_date, label, body, created_by, created_at, updated_at)
SELECT '2026-03-17', '2026-03-17', '17/03/2026', 'Abbiamo ricominciato a parlarci sul documento', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO calendar_events (id, event_date, label, body, created_by, created_at, updated_at)
SELECT '2026-04-11', '2026-04-11', '11/04/2026', 'Abbiamo ricominciato a scriverci in chat', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO calendar_events (id, event_date, label, body, created_by, created_at, updated_at)
SELECT '2026-05-12', '2026-05-12', '12/05/2026', 'Il nostro secondo incontro, abbiamo cucinato insieme salsiccia e patate, ci siamo dati i regali e abbiamo fatto la scenetta al mare', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO calendar_events (id, event_date, label, body, created_by, created_at, updated_at)
SELECT '2026-05-13', '2026-05-13', '13/05/2026', 'Abbiamo finalmente visto zootropolis 2 insieme, la sorpresa del cuore di ovetti sul letto', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO calendar_events (id, event_date, label, body, created_by, created_at, updated_at)
SELECT '2026-05-14', '2026-05-14', '14/05/2026', 'Il giorno in cui ti ho accolta in casa tua con la luce soffusa il pollo al curry, abbiamo aperto il mondo bianco, ascoltato le canzoni, fatto i biscotti e ci siamo baciati di nuovo e abbiamo ricominciato a dirci che ci amiamo', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO calendar_events (id, event_date, label, body, created_by, created_at, updated_at)
SELECT '2026-05-20', '2026-05-20', '20/05/2026', 'La rinascita di Fuochetto', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO calendar_events (id, event_date, label, body, created_by, created_at, updated_at)
SELECT '2026-07-01', '2026-07-01', '01/07/2026', 'Il giorno del tuo esame di maturità, e il giorno in cui ti ho mandato il mazzo di rose con la lettera', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO calendar_events (id, event_date, label, body, created_by, created_at, updated_at)
SELECT '2026-07-27', '2026-07-27', '27/07/2026', 'Il nostro terzo e (probabilmente) ultimo incontro', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
