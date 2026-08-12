-- Fase 7 del CMS: importa le 100 definizioni esistenti da web/public/data.json in
-- crossword_words, stessa posizione e stesso id dell'array originale.

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 1, 'DESY', 'La "lei" del nostro "noi"', 18, 18, 'O', 0, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 2, 'RORY', 'Il "lui" del nostro "noi"', 15, 21, 'V', 1, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 3, 'CERCHIO', 'Il nostro simbolo segreto: lo porti al polso, forse un giorno diventerà un tatuaggio ed è una chiave che apre i mondi', 16, 15, 'O', 2, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 4, 'AMORE', 'Ce lo siamo promesso eterno e, in fondo, tutto sommato, stiamo ancora mantenendo quella promessa. Era anche il nostro nome', 13, 17, 'V', 3, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 5, 'LEGAME', 'Sentiamo che tra noi ce n’è uno profondo', 13, 14, 'O', 4, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 6, 'ETERNITY', 'In un regalo, mi hai chiamato così. To my…', 18, 19, 'V', 5, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 7, 'UNIVERSO', 'Nel messaggio d''amore più bello del mondo™ 😂, avevo scritto che come in ogni storia Romeo ha la sua Giulietta, mi piace pensare che Rory abbia la sua Desy in ogni...', 16, 43, 'V', 6, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 8, 'FAMIGLIA', 'Per dire quanto fossimo importanti, dicevamo di essere una...', 8, 14, 'V', 7, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 9, 'TELEGRAM', 'Il posto che per tanto tempo è stato "casa" nostra, anche se era soltanto una chat', 10, 7, 'O', 8, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 10, 'OMEGLE', 'Il "luogo" dove ci siamo conosciuti', 7, 11, 'V', 9, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 11, 'INSTAGRAM', 'Dove ci siamo innamorati', 7, 7, 'V', 10, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 12, 'DESTINO', 'Ho sempre detto che il modo in cui ci siamo conosciuti è stato troppo fortuito per essere solo un caso. Quindi deve essere stato il ... a farci incontrare', 24, -2, 'O', 11, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 13, 'FISSARCI', 'Lo facevamo per ore in videochiamata senza stancarci e ci scherzavamo su', 13, 2, 'O', 12, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 14, 'TESSA', 'Quando ci siamo conosciuti scherzavamo sul fatto che fossimo come dei personaggi di una saga di libri, tu eri...', 11, 5, 'V', 13, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 15, 'HARDIN', 'Quando ci siamo conosciuti scherzavamo sul fatto che fossimo come dei personaggi di una saga di libri, io ero...', 9, 3, 'V', 14, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 16, 'PICCOLINA', 'Il tuo soprannome', 7, 1, 'O', 15, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 17, 'VITAMIA', 'Il mio soprannome', 2, 2, 'V', 16, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 18, 'VOCE', 'Per qualche motivo ti ha sempre imbarazzata da morire che la sentissi, anche fino a "poco" tempo fa. La tua...', 2, 2, 'O', 17, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 19, 'LIBRO', 'Una volta ti ho detto che non sei un capitolo della mia vita, ma sei tutto il…', 12, 9, 'V', 18, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 20, 'BUONANOTTE', 'Era il rito serale più importante che nessuno voleva mai saltare', 4, 19, 'V', 19, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 21, 'NOI', 'L’etichetta che abbiamo creato che ci rappresenta meglio', 10, 18, 'O', 20, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 22, 'SQUADRA', 'Alla fine siamo sempre solo noi due contro il mondo, perché noi siamo una...', -1, 15, 'O', 21, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 23, 'TUO', 'Lo dicevo ogni sera "sono tutto... e solo..."', 6, 17, 'O', 22, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 24, 'TUA', 'Nella buonanotte non mancava mai "sono tutta... e solo..."', 8, 17, 'O', 23, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 25, 'BENISSIMO', 'Per non dire altro, ma "bene" era riduttivo. Ti voglio...', 4, 19, 'O', 24, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 26, 'ELASTICO', 'Il simbolo del nostro legame', 1, 23, 'V', 25, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 27, 'COCCOLE', 'Per tanto tempo le abbiamo sognate ogni sera dopo la buonanotte', 7, 23, 'O', 26, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 28, 'ABBRACCIO', 'Dopo settembre abbiamo aspettato tantissimo per darcene uno e in alcuni momenti avremmo pagato per darcelo', 18, -1, 'O', 27, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 29, 'CUORE', 'Ne hai trovato uno fatto di ovetti sopra il letto', 7, 26, 'V', 28, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 30, 'ROSSO', 'Il tuo preferito, il colore del vestito dei tuoi 18 e il filo che ci unisce', 17, 21, 'O', 29, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 31, 'SORRISO', 'Ti ho raccontato che grazie a lui ho capito che eri tu la persona che volevo', 17, 24, 'V', 30, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 32, 'NASO', 'Il tuo è morbidissimo e amo toccarlo (non pensare male, pervertita.)', 14, 25, 'V', 31, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 33, 'SETTEMBRE', 'Il tuo e il nostro mese', 22, 24, 'O', 32, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 34, 'VENTICINQUE', 'Il giorno del nostro primo incontro', 21, 28, 'V', 33, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 35, 'DICIASSETTE', 'Il nostro giorno', 15, 32, 'V', 34, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 36, 'TRE', 'Quanti baci ci siamo dati la prima volta?', 4, 2, 'O', 35, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 37, 'VICTORIA', 'Il negozio “segreto” che ti piace tanto', 17, 30, 'O', 36, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 38, 'VESTITI', 'Amo quando li indossi, lo sai', 13, 36, 'V', 37, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 39, 'MAGLIETTA', 'Uno dei miei indumenti ormai è meme ed è diventato il simbolo del pianto. La prima volta l''hai completamente sporcata con il trucco', 19, 47, 'V', 38, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 40, 'AMICI', 'Diciamo di esserlo, ma non ci convince', 19, 32, 'O', 39, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 41, 'VERDE', 'Il colore che mi piace, che posso trovare in te', 14, 35, 'O', 40, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 42, 'LETTERINE', 'Ne ho scritte tante per ogni momento importante', 24, 30, 'O', 41, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 43, 'PORTONE', 'Lo nomino sempre quando parlo della prima volta che ti ho vista, dove ci siamo dati il nostro primo bacio, e la prima foto che ti ho mandato appena sono arrivato', 18, 38, 'V', 42, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 44, 'PANCHINA', 'Abbiamo passato lì il nostro primo incontro, a parlare', 18, 38, 'O', 43, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 45, 'OSLO', 'La nostra canzone', 22, 38, 'O', 44, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 46, 'PERFECT', 'L’usata per il video di natale, che ti è piaciuto tanto. Perfetta per un lento', 19, 22, 'O', 45, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 47, 'THAILANDIA', 'È stato per un po'' il nostro viaggio da sogno, avevamo già immaginato i posti da visitare, dove alloggiare e cosa mangiare', 22, 26, 'V', 46, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 48, 'LANTERNE', 'Erano un po'' il simbolo del nostro viaggio da sogno, e sarebbe stato bello vederle per il nostro anniversario', -2, 21, 'V', 47, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 49, 'DESYLAND', 'La mia canzone che parlava di un "luogo" speciale', 25, 16, 'O', 48, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 50, 'DOCUMENTO', 'Dove ho scritto di tutto e dove abbiamo cercato rifugio in tempi brutti. "Se ti sentirai sola e avrai bisogno di me"', 25, 16, 'V', 49, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 51, 'BIANCO', 'Il colore del mondo che ho creato per te', 22, 16, 'O', 50, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 52, 'DISTANZA', 'Il nostro più grande difetto', 32, 13, 'O', 51, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 53, 'DOMANDE', 'Quando ci stavamo conoscendo mi ci riempivi. Ti dicevo che erano stupide, ma in realtà mi facevano ridere e le amavo', 29, 14, 'O', 52, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 54, 'FANFICTION', 'Ami leggerle, e io dico sempre che sono dei porno gay ahaha', 27, 11, 'O', 53, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 55, 'INFUOCATO', 'Il nostro cuore', 25, 11, 'V', 54, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 56, 'ROSA', 'Sopra la tua libreria è eterna, dentro invece è di carta', 31, 8, 'O', 55, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 57, 'FUOCHETTO', 'Il nome del nostro focoso figlio', 23, 9, 'V', 56, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 58, 'HARRYPOTTER', 'La tua saga preferita', 10, 24, 'O', 57, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 59, 'DEATHNOTE', 'Il tuo e il nostro primo anime', 2, 33, 'V', 58, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 60, 'ZOOTROPOLIS', 'Il nostro primo film insieme che abbiamo aspettato tanto', 8, 32, 'O', 59, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 61, 'WALLE', 'Il film d''animazione che adoro che dobbiamo ancora vedere insieme', 15, 24, 'O', 60, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 62, 'MAGGIO', 'Il mese in cui siamo ritrovati in segreto', 3, 37, 'V', 61, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 63, 'CHIAVI', 'Me le hai affidate a Maggio e ho apprezzato tanto la fiducia che mi hai dato', 27, 23, 'O', 62, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 64, 'SPIAGGIA', 'A maggio ti ho dato un regalo fingendo di essere in questo posto', 4, 30, 'O', 63, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 65, 'GIUGGIOLA', 'Il mio dolce soprannome', 5, 37, 'O', 64, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 66, 'CARAMELLE', 'Sono un po'' un nostro simbolo dolce, perché ne abbiamo preso quasi un kg', 2, 45, 'V', 65, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 67, 'OVETTO', 'Il tuo dolce soprannome', 7, 43, 'O', 66, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 68, 'FROLLA', 'La "pasta" al forno, di varie forme, ad esempio, una stella storta', 3, 40, 'O', 67, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 69, 'FRUTTA', 'Te ne ho comprata troppa, ma sono sicuro che ti ha fatto piacere che te l''ho sbucciata u.u', 4, 47, 'V', 68, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 70, 'RITROVATI', 'Alla fine del nostro secondo incontro ci siamo...', 5, 47, 'O', 69, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 71, 'PATATE', 'Ammettilo che sono bravissimo a tagliarle 😌', 4, 53, 'V', 70, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 72, 'PORTACHIAVI', 'Ce lo siamo regalati entrambi a forma di cuore, senza saperlo', 4, 51, 'V', 71, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 73, 'RIPETERE', 'Quando ti sentivi in ansia ti dicevo sempre di ... dopo di me qualcosa, per farti capire che sarebbe andato tutto bene', 11, 50, 'O', 72, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 74, 'ANGELO', 'A volte ti ho detto che quando ero con te pensavo di aver incontrato un ... in persona', 8, 55, 'V', 73, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 75, 'SGUARDI', 'Alla tua festa “parlavamo” scambiandoceli', 8, 42, 'V', 74, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 76, 'COMPLICI', 'Per tanto tempo siamo stati un segreto, e per tanto altro ne abbiamo avuti tanti e continuiamo ad averne di solo nostri. Ci capivamo e coprivamo a vicenda perché siamo sempre stati...', 23, 42, 'O', 75, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 77, 'PROFUMO', 'Ti dico sempre che amo quello dei tuoi capelli, e che ogni parte del tuo corpo ne fa uno diverso', 12, 41, 'O', 76, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 78, 'OCCHI', 'I tuoi mi incantano', 12, 47, 'V', 77, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 79, 'UNGHIE', 'Amavo vederle, ogni volta che le facevi nuove, a volte provavo a suggerirtele (non mi ascoltavi mai ahaha)', 16, 43, 'O', 78, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 80, 'ARTE', 'A volte, per spiegarti quanto fossi bella, ti ho paragonata a quadri e sculture. Ti dicevo che anche le tue imperfezioni erano pennellate in più che servivano a renderti unica. Questo perché, per me, tu sei...', 18, 3, 'V', 79, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 81, 'QUADRO', 'Una volta fantasticavamo che in futuro ne avremmo avuto uno di noi due che ci baciamo sopra il nostro letto', 2, 30, 'O', 80, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 82, 'STELLA', 'Ti dico spesso che porti luce, quindi sei la mia...', 2, 19, 'O', 81, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 83, 'LUGLIO', 'Il mese più caldo in cui ci siamo visti', 24, 30, 'V', 82, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 84, 'LENTO', 'Lo abbiamo ballato dopo mesi che ce lo siamo proposto', 27, 30, 'O', 83, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 85, 'YAHTZEE', 'Uno dei nostri giochi preferiti con i dadi', 10, 28, 'V', 84, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 86, 'THEMIND', 'Il gioco che ha dimostrato che la nostra intesa non si batte', 27, 33, 'V', 85, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 87, 'UNO', 'Il gioco dove sei più forte', 32, 32, 'O', 86, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 88, 'MONOPOLY', 'Il nostro primo gioco insieme', 30, 33, 'O', 87, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 89, 'COOKIES', 'Sono stati il nostro capolavoro in cucina', 28, 36, 'V', 88, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 90, 'CHEESECAKE', 'Abbiamo scoperto che entrambi le amiamo e sono state le protagoniste di una sera importante a settembre', 20, 40, 'O', 89, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 91, 'DADI', 'Dei portafortuna e una mia passione', 21, 36, 'V', 90, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 92, 'LUNA', 'Dovevamo guardala insieme, perché anche se lontani siamo sempre stati sotto lo stesso cielo', 22, 40, 'V', 91, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 93, 'TEMI', 'Una volta ne avevi fatto uno verde dedicato a me. Inizialmente li cambiavi spesso sul telefono e mi piaceva vedere cosa ti inventavi di nuovo, ti trovavo molto brava', 10, 32, 'V', 92, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 94, 'TIGRI', 'Tra tutti gli animali, sono le mie preferite, dovevi portarmi a vederle ahaha', 13, 28, 'O', 93, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 95, 'MENTE', 'C''era una cosa importante prima della nostra buonanotte, ti ricordi? "Posso avere il tuo cuore?" "Posso avere il tuo corpo?" "Posso avere la tua ...?"', 28, 5, 'O', 94, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 96, 'STORIELLE', 'Quando ci stavamo conoscendo io le scrivevo, e tu amavi leggerle', 20, 6, 'V', 95, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 97, 'MARGHERITA', 'Il fiore che ti rappresenta', 21, -2, 'O', 96, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 98, 'APPARTENENZA', 'Dovresti saperlo "mia" e "mio" per me era...', 18, -1, 'V', 97, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 99, 'RICORDI', 'Dico sempre che se li togli, togli tutto quello che siamo', 21, 4, 'V', 98, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO crossword_words (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
SELECT 100, 'NUMERI', 'Una volta per spiegarti quanto ti amo, ti ho detto che ti amo come tutti i ... dell''universo', 27, -1, 'O', 99, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
