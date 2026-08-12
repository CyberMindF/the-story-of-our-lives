-- Fase 7 del CMS: importa le 77 attività attive (id 1-78, con un buco al 48 per la voce

-- rimossa in passato — l'id 48 non viene reinserito, gli id restano stabili) da

-- functions/api/together/_data.js in together_activities.

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 1, 'Poison Kiss: ognuno sceglie un posto su di sé che è velenoso, poi ci si dà bacini in giro e chi becca il punto velenoso perde', 'giochi', 'Si può fare anche in versione su tutto il corpo, non solo sul viso.', NULL, 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 2, 'Più foto e video', 'ricordi', NULL, NULL, 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 3, 'Un video tipo di una giornata che abbiamo passato insieme', 'ricordi', NULL, NULL, 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 4, 'Andare al mare', 'uscite', NULL, NULL, 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 5, 'Farci foto col bacio vestiti fighi e anche foto in generale', 'ricordi', NULL, NULL, 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 6, 'Cucinare qualcosina (le crêpes/pancake)', 'cibo', NULL, NULL, 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 7, NULL, 'intimita', 'La cosa col ghiaccio 👀', NULL, 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 8, NULL, 'intimita', 'Usare il v, magari anche fuori', NULL, 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 9, 'Fare un dolce, magari non le crêpes', 'cibo', NULL, NULL, 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 10, 'Comprarle un mazzo di fiori rossi o anche solo rose', 'gesti', NULL, NULL, 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 11, 'Giocare a Monopoly', 'giochi', 'Giocare a Monopoly in versione porno, oppure provare entrambe.', NULL, 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 12, 'Guardare un film insieme che piace a Desy', 'da-vedere', NULL, NULL, 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 13, 'Un secondo appuntamento', 'uscite', NULL, NULL, 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 14, 'Ballare con la musica', 'momenti', NULL, NULL, 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 15, NULL, 'intimita', 'Fare la doccia insieme', NULL, 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 16, 'Lavare i denti insieme', 'momenti', NULL, NULL, 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 17, 'Fare una foto mentre laviamo i denti insieme', 'ricordi', NULL, NULL, 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 18, 'Fare la spesa insieme', 'momenti', NULL, NULL, 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 19, NULL, 'intimita', 'Fare il nostro gioco porno, ma dal vivo', NULL, 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 20, 'Far chiudere gli occhi all''altro e fargli indovinare dove gli si mette il dito sul proprio corpo', 'giochi', NULL, NULL, 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 21, 'Provare a farle la colazione a letto', 'gesti', NULL, NULL, 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 22, 'Farle un massaggio', 'momenti', 'Farle un massaggio sexy (boh).', NULL, 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 23, NULL, 'intimita', 'Farci video e foto mentre lo facciamo', NULL, 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 24, 'Comprare un oggettino simbolico, per essere simbolo del nostro amore', 'gesti', NULL, NULL, 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 25, 'Ascoltare la nostra canzone insieme', 'momenti', NULL, NULL, 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 26, 'Vedere il video dei 4 anni insieme', 'ricordi', NULL, NULL, 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 27, 'Gioco dove uno scrive 8 parole e l''altro deve indovinarle tutte avendo a disposizione solo 20 inizi (parole) che può dare l''altro', 'giochi', NULL, NULL, 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 28, 'Vince chi toglie per primo un calzino all''altro (strano, ma l''ho trovato su internet)', 'giochi', NULL, NULL, 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 29, 'Guardare WALL·E', 'da-vedere', NULL, NULL, 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 30, 'Prenderle dei girasoli', 'gesti', NULL, NULL, 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 31, 'Farle vedere il mio mondo di Minecraft (potrebbe essere una cosa dolce)', 'giochi', NULL, NULL, 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 32, 'Comprare le patatine classiche e i Kinder Bueno', 'cibo', NULL, NULL, 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 33, 'Provare a fare una piccola “partita” a un gioco di ruolo, per farglielo provare e conoscere e condividere una cosa mia', 'giochi', NULL, NULL, 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 34, 'Metterle l''eyeliner', 'momenti', NULL, NULL, 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 35, NULL, 'intimita', 'Toglierle l''eyeliner (questo me lo hai detto tu di scriverlo ahaha)', NULL, 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 36, NULL, 'intimita', 'Farlo davanti allo specchio', NULL, 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 37, NULL, 'intimita', 'Una giornata in cui sta tutto il giorno nuda', NULL, 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 38, 'Il giochino di dire 2 parole insieme, fin quando non diciamo la stessa', 'giochi', NULL, 'https://www.instagram.com/reel/DQ7apFPjazG', 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 39, 'Wolverine Nails Trend', 'trend', NULL, 'https://www.instagram.com/reel/DOQs7n8EzU7', 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 40, 'Appuntamento a Castel Gandolfo', 'uscite', NULL, NULL, 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 41, 'Provare a farle guidare la macchina', 'momenti', NULL, NULL, 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 42, 'Fare una storia su Instagram insieme (se si può)', 'ricordi', NULL, NULL, 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 43, NULL, 'intimita', 'Scriverci addosso con l''UniPosca', NULL, 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 44, 'Disegnarci il cerchio dietro l''orecchio', 'gesti', NULL, NULL, 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 45, 'Fare delle foto di coppia', 'ricordi', NULL, NULL, 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 46, 'Fare una foto a un cuore fatto con le nostre mani', 'ricordi', NULL, NULL, 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 47, 'Whisper challenge', 'giochi', NULL, NULL, 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 49, 'Provare a giocare a Little Nightmares', 'giochi', NULL, NULL, 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 50, 'Preparare un jam heart toast', 'cibo', NULL, 'https://www.instagram.com/reel/DPgGK_UjaIw', 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 51, 'Andare su Uhmegle insieme (più o meno il posto dove ci siamo conosciuti)', 'momenti', NULL, NULL, 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 52, 'Leggere insieme i messaggi salvati', 'ricordi', NULL, NULL, 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 53, 'Stuck the cup (niente di che)', 'giochi', NULL, 'https://youtube.com/shorts/XMCuFlKrbC8?si=xpCg-1BQtrbMTLmn', 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 54, 'Ascoltare le canzoni insieme', 'momenti', NULL, NULL, 'OTT–DIC 2025', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 55, 'Andare in sala giochi', 'uscite', NULL, NULL, 'GEN–LUG 2026', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 56, 'Andare al bowling', 'uscite', NULL, NULL, 'GEN–LUG 2026', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 57, 'Andare a Roma', 'uscite', NULL, NULL, 'GEN–LUG 2026', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 58, 'Andare al mare', 'uscite', NULL, NULL, 'GEN–LUG 2026', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 59, 'Farle provare il selz limone e sale', 'cibo', NULL, NULL, 'GEN–LUG 2026', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 60, 'Provare latte e menta', 'cibo', NULL, NULL, 'GEN–LUG 2026', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 61, 'Carte francesi: nero/rosso, sopra/sotto, dentro/fuori, segno', 'giochi', NULL, 'https://vm.tiktok.com/ZNRcwVEKj/', 'GEN–LUG 2026', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 62, 'Guardare il video di maggio insieme', 'ricordi', NULL, NULL, 'GEN–LUG 2026', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 63, 'Leggere il messaggio d''amore più bello (e lungo) del mondo', 'ricordi', NULL, NULL, 'GEN–LUG 2026', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 64, 'Andare nel Mondo Bianco', 'momenti', NULL, NULL, 'GEN–LUG 2026', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 65, 'Vedere AoT insieme', 'da-vedere', NULL, NULL, 'GEN–LUG 2026', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 66, 'Vedere Death Note insieme', 'da-vedere', NULL, NULL, 'GEN–LUG 2026', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 67, 'Uno parla e l''altro è dietro e deve fare le mani dell''altro, magari preparando una cosa semplice', 'trend', NULL, 'https://www.instagram.com/reel/DaNQq1UiW-v', 'GEN–LUG 2026', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 68, 'Giocare a nomi, cose e città con categorie strane', 'giochi', NULL, NULL, 'GEN–LUG 2026', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 69, 'Festeggiare i nostri giorni di interazione su TikTok', 'momenti', NULL, NULL, 'GEN–LUG 2026', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 70, 'Sfidarla ad aprirmi il pugno mentre lo stringo con forza', 'giochi', NULL, NULL, 'GEN–LUG 2026', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 71, 'Tris facendo il bottle flip, con solo 3 segni alla volta in campo', 'giochi', NULL, 'https://vm.tiktok.com/ZN8J5jKtr/', 'GEN–LUG 2026', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 72, 'Il mimo al contrario: uno dice cosa fare e chi mima deve indovinare cosa sta mimando', 'giochi', NULL, 'https://youtu.be/vFTMIFRzP54?is=kgcXW2szKsDAX6zm', 'GEN–LUG 2026', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 73, 'Giocare a Keep Talking and Nobody Explodes', 'giochi', NULL, NULL, 'GEN–LUG 2026', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 74, 'Giocare a Spaceteam', 'giochi', NULL, NULL, 'GEN–LUG 2026', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 75, 'Provare Party In', 'giochi', NULL, NULL, 'GEN–LUG 2026', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 76, 'Mettere il profumo sugli elastici', 'gesti', NULL, NULL, 'GEN–LUG 2026', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 77, 'La classica cosa delle patatine in una griglia 3×3, scegliendo 3 punti “bomba”', 'giochi', NULL, 'https://vm.tiktok.com/ZN8Jghmud/', 'GEN–LUG 2026', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
SELECT 78, 'Giocare con la plastilina insieme', 'giochi', NULL, NULL, 'LUG 2026', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
