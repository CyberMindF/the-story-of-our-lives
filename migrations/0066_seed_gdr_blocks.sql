-- Seed dei blocchi di avventura.html e la-tua-maga.html (sezioni Abilità/Effetti/
-- Incantesimi), importati fedelmente e in ordine tramite un parser HTML strutturale
-- (non ritrascritti a mano) per garantire la stessa fedeltà byte-per-byte delle altre
-- collezioni migrate in questa sessione.

INSERT INTO gdr_blocks (id, document_key, type, data, position, created_by, created_at, updated_at)
SELECT 1, 'avventura', 'heading', '{"level":2,"text":"Incipit"}', 0, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
INSERT INTO gdr_blocks (id, document_key, type, data, position, created_by, created_at, updated_at)
SELECT 2, 'avventura', 'paragraph', '{"text":"Un po'' di spiegazioni necessarie, per darti un po'' di contesto, visto che non sai niente del mondo o del tuo personaggio, perdona la lunghezza ahaha"}', 1, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
INSERT INTO gdr_blocks (id, document_key, type, data, position, created_by, created_at, updated_at)
SELECT 3, 'avventura', 'heading', '{"level":3,"text":"Il mondo"}', 2, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
INSERT INTO gdr_blocks (id, document_key, type, data, position, created_by, created_at, updated_at)
SELECT 4, 'avventura', 'paragraph', '{"text":"Il mondo in cui ci troviamo si chiama Geikosia. È un mondo medievale, fantasy e magico, con regni, foreste antiche e misteri ancestrali. Il tuo personaggio viene da Snofyxar il continente principale e centrale di questo mondo. In particolare da Ledrua, il regno degli umani."}', 3, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
INSERT INTO gdr_blocks (id, document_key, type, data, position, created_by, created_at, updated_at)
SELECT 5, 'avventura', 'paragraph', '{"text":"In questo mondo gli Dei sono reali, più volte sono intervenuti nel mondo dei mortali, anche se da un evento molto importante \"La Grande Guerra\" avvenuto più di 500 anni fa, nessuno ha più visto interventi divini di grande entità. Gli Dei più importanti sono Yron e Nasir, padre e madre di tutti gli dei. Qavutar (si legge kavutar) è il Dio della magia e delle illusioni, è stato lui a creare la \"trama\", una sorta di tessuto magico e invisibile che permea l''universo da cui i maghi attingono per avere accesso alla magia."}', 4, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
INSERT INTO gdr_blocks (id, document_key, type, data, position, created_by, created_at, updated_at)
SELECT 6, 'avventura', 'paragraph', '{"text":"La magia per secoli fu bandita e considerata pericolosa. Oggi è legale, ma regolamentata serve una licenza per praticarla, gli oggetti magici vanno registrati, e c''è ancora chi guarda i maghi con diffidenza, come un pregiudizio antico che nessuno ammette apertamente ma che si sente nell''aria. Il grande apporto dato dai maghi durante La Grande Guerra ha aiutato a portare di nuovo alla sua legalizzazione."}', 5, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
INSERT INTO gdr_blocks (id, document_key, type, data, position, created_by, created_at, updated_at)
SELECT 7, 'avventura', 'paragraph', '{"text":"La Scuola di Butiel Fajar è la prima e più importante scuola di magia legale di Geikoisa. Fondata da Valin Fajar, un elfo di 650 anni, ora arcimago, e intitolata a suo padre Butiel, caduto nella guerra. È un castello volante e molti dei suoi studenti ci vivono dentro. Compresa tu. È qui che inizia la tua storia."}', 6, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
INSERT INTO gdr_blocks (id, document_key, type, data, position, created_by, created_at, updated_at)
SELECT 8, 'avventura', 'heading', '{"level":3,"text":"Il tuo personaggio"}', 7, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
INSERT INTO gdr_blocks (id, document_key, type, data, position, created_by, created_at, updated_at)
SELECT 9, 'avventura', 'paragraph', '{"text":"Sei una giovane umana, cresciuta in una famiglia normale, la tua vita è stata tranquilla, niente di straodinario. Sei però sempre stata molto dotata nell''uso della magia. Come se facesse parte della tua natura. A 14 anni hai superato il tuo esame per diventare un apprendista maga, ricevendo la tua licenza. A 16 sei andata via di casa per andare a studiare nella scuola di magia di Butiel Fajar. Per te non è stata una scelta difficile, era l''unica cosa che avesse senso."}', 8, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
INSERT INTO gdr_blocks (id, document_key, type, data, position, created_by, created_at, updated_at)
SELECT 10, 'avventura', 'paragraph', '{"text":"Adesso hai 18 anni, sei in questa scuola da quasi 3 anni. Non sei la migliore della tua classe, ma di certo non sei la peggiore. Sei una ragazza che lavora sodo e che fa le cose per bene anche se a volte ti chiedi se sia abbastanza."}', 9, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
INSERT INTO gdr_blocks (id, document_key, type, data, position, created_by, created_at, updated_at)
SELECT 11, 'avventura', 'paragraph', '{"text":"Hai una gattina che è sempre con te. È l''unica \"cosa\" che hai portato da casa."}', 10, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
INSERT INTO gdr_blocks (id, document_key, type, data, position, created_by, created_at, updated_at)
SELECT 12, 'avventura', 'heading', '{"level":3,"text":"La Scuola di Magia di Butiel Fajar"}', 11, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
INSERT INTO gdr_blocks (id, document_key, type, data, position, created_by, created_at, updated_at)
SELECT 13, 'avventura', 'paragraph', '{"text":"Questa scuola è un castello che fluttua sopra le nuvole da prima che nascessi e l''unico modo per raggiungerla o andarsene è tramite volo o teletrasporto. È sorretta da una magia così antiche che a volte nemmeno Valin Fajar, il suo fondatore, preside e arcimago, ricorda con esattezza come ha fatto."}', 12, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
INSERT INTO gdr_blocks (id, document_key, type, data, position, created_by, created_at, updated_at)
SELECT 14, 'avventura', 'paragraph', '{"text":"Valin è un elfo di 650 anni, capelli bianchi e uno sguardo che sembra guardare oltre la tua stessa anima. Lo hai incontrato raramente, la sua presenza al castello è sporadica, quando c''è però si percepisce."}', 13, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
INSERT INTO gdr_blocks (id, document_key, type, data, position, created_by, created_at, updated_at)
SELECT 15, 'avventura', 'image', '{"src":"assets/images/gdr/il-prezzo-della-verita/valin-fajar.webp","alt":"Valin Fajar, l''arcimago fondatore della scuola","caption":"Valin Fajar"}', 14, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
INSERT INTO gdr_blocks (id, document_key, type, data, position, created_by, created_at, updated_at)
SELECT 16, 'avventura', 'paragraph', '{"text":"Ci vivi da tre anni e ormai lo conosci a memoria. Come conosci le sue regole. In questa scuola la magia si studia, si pratica e si registra. Maerath Solven, il professore di teoria, ripete sempre \"Il registro sa cosa è successo\". Ogni incantesimo lanciato viene registrato in un sistema magico che lui controlla personalmente. Non si gira la notte nel castello, se non con un permesso. E gli apprendisti non possono andare nelle aree proibite se non accompagnati da un superiore. Queste regole non si discutono."}', 15, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
INSERT INTO gdr_blocks (id, document_key, type, data, position, created_by, created_at, updated_at)
SELECT 17, 'avventura', 'image', '{"src":"assets/images/gdr/il-prezzo-della-verita/maerath-solven.webp","alt":"Maerath Solven, il professore di teoria","caption":"Maerath Solven"}', 16, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
INSERT INTO gdr_blocks (id, document_key, type, data, position, created_by, created_at, updated_at)
SELECT 18, 'avventura', 'paragraph', '{"text":"La tua giornata ha un ritmo preciso. Mattina teoria con Maerath Solven un uomo che parla come se ogni parola gli costasse qualcosa. Il pomeriggio pratica con Sorenne Caldri una bellissima Aasimar (una razza che discende dall''unione tra angeli e umani), che è l''unica professoressa che ricordi il tuo nome senza consultare un foglio e che a volte si ferma dopo le lezioni se vede che qualcosa non va."}', 17, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
INSERT INTO gdr_blocks (id, document_key, type, data, position, created_by, created_at, updated_at)
SELECT 19, 'avventura', 'image', '{"src":"assets/images/gdr/il-prezzo-della-verita/sorenne-caldri.webp","alt":"Sorenne Caldri, la professoressa di pratica","caption":"Sorenne Caldri"}', 18, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
INSERT INTO gdr_blocks (id, document_key, type, data, position, created_by, created_at, updated_at)
SELECT 20, 'avventura', 'heading', '{"level":3,"text":"Le tue conoscenze"}', 19, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
INSERT INTO gdr_blocks (id, document_key, type, data, position, created_by, created_at, updated_at)
SELECT 21, 'avventura', 'npc_grid', '{"entries":[{"image":"assets/images/gdr/il-prezzo-della-verita/shivay-lorenne.webp","alt":"Shivay Lorenne","name":"Shivay Lorenne","description":"La tua amica. Una mezzorca (razza che nasce dall''unione tra umani e orchi), capelli scuri sempre leggermente in disordine, e i classici canini inferiori sporgenti. Con una risata che si sente da due corridoi. La conosci dal primo giorno vi siete ritrovate nella stessa stanza per un errore di assegnazione che nessuno ha mai corretto, e da allora non vi siete più separate. Mangi con lei, studi con lei, parli troppo con lei fino a tardi."},{"image":"assets/images/gdr/il-prezzo-della-verita/lefira-marsan.webp","alt":"Lefira Marsan","name":"Lefira Marsan","description":"Di solito siede due file davanti a te nelle lezioni di Maerath. Elfa, capelli chiari, modi tranquilli. È una compagna di classe come tante nella media, poco appariscente, il tipo di persona che non spicca in nessuna direzione. Vi siete scambiate qualche parola nel tempo, niente di più."},{"image":"assets/images/gdr/il-prezzo-della-verita/pyron-feddott.webp","alt":"Pyron Feddott","name":"Pyron Feddott","description":"Lo conosci di vista. È umano come te, sempre un po'' in disparte, raramente in mezzo agli altri. Non hai mai capito bene se è timido o se semplicemente preferisce stare per conto suo. Lo hai incrociato qualche volta in giro per il castello, sempre da solo."},{"image":"assets/images/gdr/il-prezzo-della-verita/dravon-tassyr.webp","alt":"Dravon Tassyr","name":"Dravon Tassyr","description":"Un altro compagno di classe umano, sempre con quell''aria di chi sa di essere il più bravo nella stanza. Ci tiene particolarmente a vantarsi dei suoi buoni risultati. Non è che lo odi, ma non è nemmeno qualcuno con cui vai particolarmente d''accordo. Vi conoscete, vi sopportate, e lasciate che sia così."}]}', 20, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
INSERT INTO gdr_blocks (id, document_key, type, data, position, created_by, created_at, updated_at)
SELECT 22, 'avventura', 'heading', '{"level":3,"text":"Tre giorni fa"}', 21, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
INSERT INTO gdr_blocks (id, document_key, type, data, position, created_by, created_at, updated_at)
SELECT 23, 'avventura', 'paragraph', '{"text":"Stavi attreversando il lungo corridoio che porta verso la parte un po'' più remota del castello, vicino alla biblioteca proibita. Stavi cercando una scorciatoia per fare un po'' prima, per raggiungere il luogo verso cui stavi andando. E forse un po'' per distrazione ti sei ritrovata lì. Come tutti sai: non ci si avvicina alla zona della biblioteca proibita senza motivo."}', 22, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
INSERT INTO gdr_blocks (id, document_key, type, data, position, created_by, created_at, updated_at)
SELECT 24, 'avventura', 'paragraph', '{"text":"Noti per terra vicino a un muro un piccolo bagliore. Avvicinandoti e mettendola a fuoco noti che è una moneta."}', 23, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
INSERT INTO gdr_blocks (id, document_key, type, data, position, created_by, created_at, updated_at)
SELECT 25, 'avventura', 'paragraph', '{"text":"È strana, è pensate ripetto alle sue dimenzioni e c''è un simbolo che non riconosci. Sicuramente non è un conio attuale. Ti sembra un bel ninnolo da portare con te, magari un porta fortuna. Quindi lo metti in tasca e prosegui."}', 24, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
INSERT INTO gdr_blocks (id, document_key, type, data, position, created_by, created_at, updated_at)
SELECT 26, 'avventura', 'paragraph', '{"text":"Una piccola azione fatta per caso. A cui nel giro di poco, non pensi più."}', 25, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
INSERT INTO gdr_blocks (id, document_key, type, data, position, created_by, created_at, updated_at)
SELECT 27, 'avventura', 'heading', '{"level":3,"text":"Oggi"}', 26, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
INSERT INTO gdr_blocks (id, document_key, type, data, position, created_by, created_at, updated_at)
SELECT 28, 'avventura', 'paragraph', '{"text":"Durante la pausa pranzo torni in camera. E trovi sopra la tua scrivania una nota. La calligrafia la riconosci bene. È quella del professor Maerath Solven. È precisa e che non si perde in particolari ghirigori. Sembra quasi un macchina da scrivere."}', 27, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
INSERT INTO gdr_blocks (id, document_key, type, data, position, created_by, created_at, updated_at)
SELECT 29, 'avventura', 'paragraph', '{"text":"Sei convocata nel mio studio dopo cena. Da sola.","emphasis":true}', 28, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
INSERT INTO gdr_blocks (id, document_key, type, data, position, created_by, created_at, updated_at)
SELECT 30, 'avventura', 'paragraph', '{"text":"La voce un po'' rauca della tua amica Shivay ti arriva da sopra la tua spalla all''orecchio e dice"}', 29, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
INSERT INTO gdr_blocks (id, document_key, type, data, position, created_by, created_at, updated_at)
SELECT 31, 'avventura', 'paragraph', '{"text":"\"Quando fa così non ci sono mai buone notizie.\""}', 30, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
INSERT INTO gdr_blocks (id, document_key, type, data, position, created_by, created_at, updated_at)
SELECT 32, 'avventura', 'paragraph', '{"text":"Vi scambiate uno sguardo e lei storce un po'' la bocca."}', 31, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
INSERT INTO gdr_blocks (id, document_key, type, data, position, created_by, created_at, updated_at)
SELECT 33, 'avventura', 'heading', '{"level":3,"text":"Prima di iniziare"}', 32, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
INSERT INTO gdr_blocks (id, document_key, type, data, position, created_by, created_at, updated_at)
SELECT 34, 'avventura', 'paragraph', '{"text":"Bisogna che tu vada nella pagina [La Tua Maga](/tavolo-da-gioco/gdr/il-prezzo-della-verita/la-tua-maga) e faccia 2 cose."}', 33, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
INSERT INTO gdr_blocks (id, document_key, type, data, position, created_by, created_at, updated_at)
SELECT 35, 'avventura', 'paragraph', '{"text":"Mettere il tuo nome al tuo personaggio. Può essere il tuo o uno inventato che sia fantasy. E darne uno anche alla tua gatta"}', 34, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
INSERT INTO gdr_blocks (id, document_key, type, data, position, created_by, created_at, updated_at)
SELECT 36, 'avventura', 'paragraph', '{"text":"E distribuire le tue statistiche. Hai 12 punti a disposizione, non puoi lasciare statistiche a 0 punti e non puoi superare mai i 5 punti."}', 35, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
INSERT INTO gdr_blocks (id, document_key, type, data, position, created_by, created_at, updated_at)
SELECT 37, 'avventura', 'paragraph', '{"text":"Sappi che puoi usare la pagina [I Tuoi Appunti](/tavolo-da-gioco/gdr/il-prezzo-della-verita/i-tuoi-appunti), come vuoi, se hai bisogno di ricordare qualcosa o di segnarti qualcosa, scrivitelo lì. Se vuoi fare qualche speculazione e te lo vuoi segnare, fallo lì. Insomma è il tuo blocco degli appunti."}', 36, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
INSERT INTO gdr_blocks (id, document_key, type, data, position, created_by, created_at, updated_at)
SELECT 38, 'avventura', 'heading', '{"level":2,"text":"Atto I"}', 37, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
INSERT INTO gdr_blocks (id, document_key, type, data, position, created_by, created_at, updated_at)
SELECT 39, 'avventura', 'paragraph', '{"text":"Il castello è tranquillo a quest''ora. Il sole sta scendendo e dalla finestra del corridoio si vedono le nuvole colorarsi di arancione sotto di te. Tra qualche ora sarai nello studio del professor Solven anche se non ne sai ancora il motivo."}', 38, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
INSERT INTO gdr_blocks (id, document_key, type, data, position, created_by, created_at, updated_at)
SELECT 40, 'avventura', 'paragraph', '{"text":"Mancano ancora un paio d''ore alla cena. Cosa fai nel tempo che ti resta? Come ti fa sentire questa situazione e per quale motivo pensi che possa averti convocata?"}', 39, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
INSERT INTO gdr_blocks (id, document_key, type, data, position, created_by, created_at, updated_at)
SELECT 41, 'avventura', 'callout', '{"lead":"Come si gioca:","text":"quando scrivo qualcosa così, magari potrei scriverti dei suggerimenti, regole, approfondimenti o cose simili. Quello che devi fare adesso è semplicemente scrivere come se fossi il tuo personaggio che pensa e che fa le cose. Quindi anche in prima persona \"faccio questo, parlo con x, dico \"bla bla bla\", vado qui\". Questo sarebbe parlare IC \"In Character\", quindi nei panni del personaggio insomma. Se vuoi parlare proprio tu con me, magari per farmi una domanda, scrivi qualcosa tipo OOC: [OOC] (OOC), in modo da farlo capire. Significa Out Of Character. Che è appunto fuori dal personaggio."}', 40, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO gdr_blocks (id, document_key, type, data, position, created_by, created_at, updated_at)
SELECT 42, 'maga-regole', 'paragraph', '{"text":"(una per scena, automatiche, nessun tiro necessario)"}', 0, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
INSERT INTO gdr_blocks (id, document_key, type, data, position, created_by, created_at, updated_at)
SELECT 43, 'maga-regole', 'list', '{"items":["Lettura dell''eco: tocchi un oggetto e percepisci un''emozione o un ricordo recente legato a esso","Luce senziente: evochi una piccola luce che puoi guidare con la mente","Senso della menzogna: una volta per scena, puoi chiedermi se quello che ti ha detto qualcuno è una bugia","Magia selvaggia: ogni volta che lanci un incantesimo, tira il D8 + Magia come sempre per vedere se riesce. Poi tira anche il D20 → se esce 1-5, la magia è andata fuori controllo: tira il D10 e consulta la tabella \"Effetti Selvaggi\". Puoi tirare tutti e tre i dadi insieme se vuoi per fare prima"]}', 1, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
INSERT INTO gdr_blocks (id, document_key, type, data, position, created_by, created_at, updated_at)
SELECT 44, 'maga-regole', 'table', '{"header":["Tabella Effetti Selvaggi → Tira un D10","Effetto"],"rows":[["1","L''incantesimo si ritorce: colpisce te invece del bersaglio. Perdi 2 Punti Stress."],["2","L''incantesimo esplode: in modo vistoso e rumoroso. Funziona, ma chiunque nelle vicinanze se ne accorge."],["3","Perdi il controllo per un momento: un oggetto vicino si rompe da solo in modo rumoroso. Perdi 1 Punto Stress."],["4","Sovraccarico: il prossimo tiro ha -2. Il tuo corpo ha bruciato troppo in una volta sola."],["5","Lasci un segno visibile: gli occhi brillano, le mani fumano leggermente, i capelli si muovono come se ci fosse vento. Dura una scena intera."],["6","Un''onda di calore esplode dal tuo corpo: tutto quello che ti circonda per un metro prende fuoco brevemente."],["7","L''incantesimo si duplica: colpisce due bersagli invece di uno, o ha effetto doppio sullo stesso."],["8","Una scarica di energia pura parte dalle tue mani: non è l''incantesimo che volevi lanciare, è qualcosa di grezzo e potentissimo. Risolve la situazione nel modo più diretto possibile."],["9","Una luce accecante esplode attorno a te per un istante: chiunque ti stia guardando è abbagliato per qualche secondo. Tu rimani al centro, illesa."],["10","La magia ti attraversa completamente: senti la trama stessa attraversarti e per un istante sei pura energia. Descrivi la magia che ne scaturisce, qualsiasi cosa, che ti porti a risolvere la situazione. Non consuma slot, e recuperi 2 Punti Stress."]]}', 2, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
INSERT INTO gdr_blocks (id, document_key, type, data, position, created_by, created_at, updated_at)
SELECT 45, 'maga-regole', 'list', '{"items":["Dardo magico: attacco base, silenzioso e affidabile","Scudo magico: blocca un colpo in arrivo","Individuazione del magico: percepisci la presenza di magia nelle vicinanze","Passo felpato: ti muovi in silenzio assoluto","Amicizia: predisponi positivamente qualcuno verso di te per breve tempo","Illusione minore: crei una piccola immagine o suono falso per distrarre","Individuazione dei pensieri: leggi la superficie della mente di qualcuno vicino"]}', 3, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
