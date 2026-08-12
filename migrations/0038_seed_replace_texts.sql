-- Fase 4 del CMS (planning editor contenuti.md): secondo lotto, limitato ai testi

-- 'chiaramente replace' individuati da "inventario contenuti CMS.md" — esclusi i testi

-- marcati 'history' (in sospeso, non ancora confermati), quelli con link o interruzioni di

-- riga interne (persi da un editor plain_text/paragraphs), il codice del puzzle cifrato, e

-- le pagine raggiungibili senza sessione (portone, not-found: l'API /api/content richiede

-- sempre un utente autenticato). Un INSERT per chiave (non UNION ALL): D1/SQLite limita i

-- termini di una SELECT composta, superato con 17 chiavi in un'unica query.

INSERT INTO content_entries (content_key, label, content_type, versioning_mode, body, created_by, created_at, updated_at)
SELECT 'ponti.bifrost.descrizione', 'Ponti — descrizione Bifrost', 'plain_text', 'replace', 'Se un giorno ci dovesse servire un altro posto possiamo usare questo', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO content_entries (content_key, label, content_type, versioning_mode, body, created_by, created_at, updated_at)
SELECT 'ponti.linguaggio.descrizione', 'Ponti — descrizione Linguaggio Segreto', 'plain_text', 'replace', 'Un altro modo di parlarci, tutto nostro, mai davvero usato finora.', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO content_entries (content_key, label, content_type, versioning_mode, body, created_by, created_at, updated_at)
SELECT 'ponti.chat.descrizione', 'Ponti — descrizione Chat', 'plain_text', 'replace', 'Se per caso prima o poi ti dovesse andare di parlare con me davvero potremmo provare a usare questo che magari viene bene', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO content_entries (content_key, label, content_type, versioning_mode, body, created_by, created_at, updated_at)
SELECT 'storie.suggerimento.introduzione', 'Storie — introduzione al modulo suggerimento', 'plain_text', 'replace', 'Lascia qui una tua storia o l''idea per farne una e poi verrò qui e la aggiungerò alla raccolta.', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO content_entries (content_key, label, content_type, versioning_mode, body, created_by, created_at, updated_at)
SELECT 'cose-insieme.sblocco.introduzione', 'Agenda delle Idee — introduzione allo sblocco NSFW', 'plain_text', 'replace', 'Se vuoi davvero conoscere queste idee, la chiave dovresti già conoscerla.', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO content_entries (content_key, label, content_type, versioning_mode, body, created_by, created_at, updated_at)
SELECT 'ricettario.eyebrow', 'Ricettario — eyebrow', 'plain_text', 'replace', 'Il nostro personalissimo libro di ricette', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO content_entries (content_key, label, content_type, versioning_mode, body, created_by, created_at, updated_at)
SELECT 'il-cielo.citazione', 'Il Cielo — citazione', 'plain_text', 'replace', 'Sotto lo stesso cielo.', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO content_entries (content_key, label, content_type, versioning_mode, body, created_by, created_at, updated_at)
SELECT 'impostazioni-mondo.introduzione', 'Impostazioni del Mondo — introduzione', 'plain_text', 'replace', 'Quello che cambi qui appare nel mondo di entrambi.', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO content_entries (content_key, label, content_type, versioning_mode, body, created_by, created_at, updated_at)
SELECT 'impostazioni-mondo.temi.introduzione', 'Impostazioni del Mondo — introduzione ai temi', 'plain_text', 'replace', 'Scegli come vuoi che sia il cielo.', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO content_entries (content_key, label, content_type, versioning_mode, body, created_by, created_at, updated_at)
SELECT 'impostazioni-mondo.effetti.introduzione', 'Impostazioni del Mondo — introduzione agli effetti', 'plain_text', 'replace', 'Ogni cielo parte dai suoi effetti consigliati, ma puoi mescolarli come vuoi.', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO content_entries (content_key, label, content_type, versioning_mode, body, created_by, created_at, updated_at)
SELECT 'suggerimenti.introduzione', 'Suggerimenti — introduzione', 'plain_text', 'replace', 'Se hai un''idea per una nuova pagina, un ricordo da aggiungere o qualcosa che vorresti vedere in questo mondo, scrivila qui. Quando potrò la leggerò e la aggiungerò.', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO content_entries (content_key, label, content_type, versioning_mode, body, created_by, created_at, updated_at)
SELECT 'linguaggio-segreto.ntfy-istruzioni', 'Linguaggio Segreto — istruzioni ntfy', 'plain_text', 'replace', 'Avevo trovato un''app per mandarci notifiche veloci quando il documento era troppo lento, si chiama ntfy. Dopo che la scarichi, fare il "+" in basso a destra e come "nome dell''argomento" scrivere "update-daemon-v17x9" (senza virgolette). L''ho chiamato così perché sembra il nome di una notifica di sistema, e 17x9 è il nostro anniversario, così non entra gente a caso. Io comunque quell''app non l''ho mai disinstallata.', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO content_entries (content_key, label, content_type, versioning_mode, body, created_by, created_at, updated_at)
SELECT 'linguaggio-segreto.esempi-introduzione', 'Linguaggio Segreto — introduzione agli esempi', 'plain_text', 'replace', 'Qui ci sono alcuni esempi per prendere confidenza con i codici, potrebbe essere praticamente una conversazione:', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO content_entries (content_key, label, content_type, versioning_mode, body, created_by, created_at, updated_at)
SELECT 'linguaggio-segreto.messaggio-indizio', 'Linguaggio Segreto — indizio del messaggio finale', 'plain_text', 'replace', 'Prova a decifrarlo, la chiave è qui sopra', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO content_entries (content_key, label, content_type, versioning_mode, body, created_by, created_at, updated_at)
SELECT 'gdr.prezzo-verita.conclusione-regole', 'Il Prezzo della Verità — invito a iniziare', 'plain_text', 'replace', 'Bene adesso che sai tutto direi che è tutto pronto! Quindi beh non ti resta che andare a leggere la prima parte della storia che si chiama "Il Prezzo della Verità" e fare la tua mossa ahaha. Quando apri, parti da "L''Avventura" e poi ti lasci guidare. Beh speriamo buon divertimento allora! (dai ormai ho fatto tutto 👀)', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO content_entries (content_key, label, content_type, versioning_mode, body, created_by, created_at, updated_at)
SELECT 'gdr.prezzo-verita.maga.introduzione', 'La Tua Maga — introduzione alla scheda', 'plain_text', 'replace', 'Questa è la scheda del tuo personaggio e della tua gatta. Aggiornala man mano che andiamo avanti, quando ti dico magari "perdi questo" "guadagni quello" — si salva da sola.', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';

INSERT INTO content_entries (content_key, label, content_type, versioning_mode, body, created_by, created_at, updated_at)
SELECT 'gdr.prezzo-verita.appunti.introduzione', 'I Tuoi Appunti — introduzione', 'plain_text', 'replace', 'Qui puoi scrivere i tuoi appunti sull''avventura, magari cose che ti vuoi segnare, nomi, idee, intuizioni, un po'' quello che vuoi.', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
