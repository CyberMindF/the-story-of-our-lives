-- L'archivio e il popup hanno scopi diversi: una voce può restare consultabile nella pagina
-- Novita senza essere proposta come non letta al prossimo accesso.
ALTER TABLE world_updates ADD COLUMN announce INTEGER NOT NULL DEFAULT 1 CHECK (announce IN (0, 1));

-- Le tre voci iniziali erano state create tutte il giorno del rilascio del changelog. Le
-- riportiamo invece al giorno in cui le funzioni sono entrate davvero nel Mondo Bianco.
UPDATE world_updates SET published_at = '2026-10-23T10:00:00.000Z'
WHERE title = 'Sono arrivate le evocazioni arcane';
UPDATE world_updates SET published_at = '2026-10-20T10:00:00.000Z'
WHERE title = 'I quiz sono entrati nell’Aula studio';
UPDATE world_updates SET published_at = '2026-10-21T10:00:00.000Z'
WHERE title = 'C’è qualcosa che aspetta di schiudersi';

-- Le tappe principali ricostruite dalla cronologia del repository. Sono archivio: raccontano
-- come è cresciuto il Mondo, ma non devono riempire il popup di chi entra oggi.
WITH history(kind, emoji, title, body, route, cta_label, published_at) AS (
  VALUES
    ('mondo', '🧩', 'Nasce il Cruciverba', 'Il primo gioco del Mondo Bianco prende forma, con cento parole e un messaggio finale.', '/tavolo-da-gioco/cruciverba', 'Apri il Cruciverba', '2026-08-04T10:00:00.000Z'),
    ('mondo', '⭕', 'Si apre il Mondo Bianco', 'Il Portone conduce finalmente nel luogo che raccoglie tutte le pagine.', '/', 'Torna all’inizio', '2026-08-08T08:00:00.000Z'),
    ('mondo', '📸', 'Apre la Bacheca dei Ricordi', 'Le fotografie e i giorni possono essere conservati in un album tutto nostro.', '/bacheca', 'Guarda la Bacheca', '2026-08-08T10:00:00.000Z'),
    ('mondo', '📫', 'Arriva la Cassetta delle Lettere', 'Da questo momento possiamo lasciarci lettere direttamente nel Mondo Bianco.', '/lettere', 'Apri la Cassetta', '2026-08-08T11:00:00.000Z'),
    ('mondo', '🐉', 'Cominciano le avventure GDR', 'Il Tavolo da Gioco apre la sua prima avventura da giocare e scrivere insieme.', '/tavolo-da-gioco/gdr', 'Vai alle avventure', '2026-08-09T10:00:00.000Z'),
    ('mondo', '⛲', 'Compare il Pozzo dei Dubbi', 'Un posto dove lasciare domande e ritrovare le risposte.', '/domande', 'Vai al Pozzo', '2026-08-10T09:00:00.000Z'),
    ('mondo', '🔣', 'Il Linguaggio Segreto entra nel Mondo', 'Simboli, significati ed esempi trovano finalmente un posto tutto loro.', '/linguaggio-segreto', 'Apri il Linguaggio', '2026-08-10T10:00:00.000Z'),
    ('mondo', '🗝️', 'Arriva il Messaggio Criptato', 'Nel Tavolo compare una nuova cosa da decifrare.', '/tavolo-da-gioco/messaggio-criptato', 'Prova a decifrarlo', '2026-08-10T11:00:00.000Z'),
    ('mondo', '🎧', 'Le Cuffiette hanno un nuovo player', 'Canzoni, copertine e testi possono essere ascoltati senza uscire dal Mondo Bianco.', '/cuffiette', 'Metti le Cuffiette', '2026-08-10T12:00:00.000Z'),
    ('mondo', '🌌', 'Il Cielo diventa visitabile', 'Luna, stelle ed effetti del Mondo possono essere osservati e regolati.', '/il-cielo', 'Guarda il Cielo', '2026-08-11T10:00:00.000Z'),
    ('mondo', '📔', 'Apre l’Agenda delle Idee', 'Le cose che vogliamo fare insieme hanno una casa e possono cambiare stato.', '/cose-da-fare-insieme', 'Apri l’Agenda', '2026-08-11T12:00:00.000Z'),
    ('mondo', '🧭', 'Arriva l’Atlante', 'Il Mappamondo raccoglie anche tutte le destinazioni secondarie per non perdersi niente.', '/mappamondo', 'Apri l’Atlante', '2026-08-13T09:00:00.000Z'),
    ('mondo', '👀', 'Prova a Dire No entra nel Tavolo', 'Un gioco fatto di bottoni che non hanno nessuna intenzione di collaborare.', '/tavolo-da-gioco/prova-a-dire-no', 'Prova a dire no', '2026-08-13T11:00:00.000Z'),
    ('mondo', '🫙', 'Compare il Barattolo dei Pensieri', 'Adesso si possono lasciare e pescare pensieri quando servono.', '/barattolo-dei-pensieri', 'Apri il Barattolo', '2026-08-14T09:00:00.000Z'),
    ('contenuto', '🐉', 'Una seconda avventura GDR', 'La casa che trattiene il respiro si aggiunge alle avventure del Tavolo.', '/tavolo-da-gioco/gdr', 'Vai alle avventure', '2026-08-14T10:00:00.000Z'),
    ('mondo', '🌈', 'Nei Ponti si può anche chattare', 'I Ponti diventano un altro modo per lasciarsi messaggi e allegati.', '/ponti', 'Vai ai Ponti', '2026-08-14T12:00:00.000Z'),
    ('mondo', '🃏', 'Nascono le Carte Collezionabili', 'Bustine, rarità, album e scambi arrivano nel Tavolo da Gioco.', '/tavolo-da-gioco/carte', 'Apri le Carte', '2026-08-15T08:00:00.000Z'),
    ('mondo', '⏳', 'Arriva la Capsula del Tempo', 'Si può spedire qualcosa nel futuro e aspettare che sia il momento giusto.', '/capsula-del-tempo', 'Apri la Capsula', '2026-08-15T09:00:00.000Z'),
    ('mondo', '💬', 'Possiamo ricominciare da capo', 'Nei Ponti compare una piccola chat che ricorda il posto in cui tutto è iniziato.', '/stranger-chat', 'Apri la chat', '2026-08-15T10:00:00.000Z'),
    ('mondo', '🖼️', 'Il Mondo ricorda cosa è successo oggi', 'La home può mostrare lettere, date e ricordi legati alla giornata.', '/', 'Guarda il Mondo', '2026-08-15T12:00:00.000Z'),
    ('mondo', '🎲', 'I dadi entrano nel GDR', 'Il pannello delle avventure permette di preparare e tirare i dadi.', '/tavolo-da-gioco/gdr', 'Vai al GDR', '2026-08-17T10:00:00.000Z'),
    ('mondo', '✉️', 'Le lettere hanno bozze e modifica', 'Quello che scrivi viene salvato e le lettere inviate possono essere corrette.', '/lettere', 'Apri le Lettere', '2026-08-31T10:00:00.000Z'),
    ('mondo', '💬', 'Arriva la chat del Mondo Bianco', 'Un palloncino permette di scriversi da qualunque pagina e segnala i nuovi messaggi.', '/', 'Torna nel Mondo', '2026-09-01T10:00:00.000Z'),
    ('mondo', '🏫', 'Apre l’Aula studio', 'Argomenti, cartelle e flashcard entrano nel Mondo Bianco.', '/aula-studio', 'Entra in Aula', '2026-09-14T10:00:00.000Z'),
    ('mondo', '📦', 'L’Aula accetta import completi', 'Flashcard e cartelle possono essere caricate insieme con un bulk strutturato.', '/aula-studio', 'Vai in Aula', '2026-09-15T10:00:00.000Z'),
    ('mondo', '🧪', 'I quiz diventano misti', 'Si possono estrarre domande da più unità e bilanciarle per difficoltà.', '/aula-studio', 'Prepara un quiz', '2026-10-21T11:00:00.000Z'),
    ('mondo', '↩️', 'Gli import dello studio si possono annullare', 'La cronologia degli import mostra cosa è entrato e permette di ripristinare la situazione precedente.', '/aula-studio', 'Controlla gli import', '2026-10-21T12:00:00.000Z'),
    ('mondo', '💣', 'Tre nuovi giochi sul Tavolo', 'Ti preparo una trappola, Sulla stessa frequenza e la Casa degli animali diventano giocabili.', '/tavolo-da-gioco', 'Vai al Tavolo', '2026-10-21T13:00:00.000Z'),
    ('mondo', '📦', 'Arriva il Marchingegno', 'Una scatola cooperativa da esplorare da dentro e da fuori si aggiunge alle prove a due.', '/tavolo-da-gioco/frequenze', 'Apri la scatola', '2026-10-22T10:00:00.000Z'),
    ('mondo', '🔮', 'Gli Arcani entrano nelle bustine', 'Evocazioni, mazzi di Tarocchi, Presagi e carte Full art ampliano la collezione.', '/tavolo-da-gioco/carte', 'Guarda gli Arcani', '2026-10-23T11:00:00.000Z')
)
INSERT INTO world_updates
  (kind, emoji, title, body, route, cta_label, published_at, active, announce, created_by, created_at, updated_at)
SELECT h.kind, h.emoji, h.title, h.body, h.route, h.cta_label, h.published_at, 1, 0,
       admin.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM history h
CROSS JOIN (SELECT id FROM users WHERE role = 'admin' AND is_test = 0 ORDER BY id LIMIT 1) admin;

-- Anche i contenuti gia presenti diventano consultabili nello storico. Non riportiamo il
-- testo privato: titolo e descrizione dicono soltanto che il contenuto esiste.
INSERT INTO world_updates
  (kind, emoji, title, body, route, cta_label, published_at, active, announce, created_by, created_at, updated_at)
SELECT 'contenuto', '📫', 'Una lettera da ' || u.nickname,
       'Una lettera è stata lasciata nella Cassetta.', '/lettere', 'Apri le Lettere',
       l.created_at, 1, 0, l.author_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM letters l JOIN users u ON u.id = l.author_id;

INSERT INTO world_updates
  (kind, emoji, title, body, route, cta_label, published_at, active, announce, created_by, created_at, updated_at)
SELECT 'contenuto', '📖', substr('Una nuova storia: ' || title, 1, 120),
       'Una storia si è aggiunta alla raccolta.', '/storie', 'Leggi la storia',
       created_at, 1, 0, created_by, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM stories;

INSERT INTO world_updates
  (kind, emoji, title, body, route, cta_label, published_at, active, announce, created_by, created_at, updated_at)
SELECT 'contenuto', '🎧', substr('Una nuova canzone: ' || title, 1, 120),
       'Una canzone si è aggiunta alle Cuffiette.', '/cuffiette', 'Ascolta',
       created_at, 1, 0, created_by, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM cuffiette_songs;

INSERT INTO world_updates
  (kind, emoji, title, body, route, cta_label, published_at, active, announce, created_by, created_at, updated_at)
SELECT 'contenuto', '📸', substr('Un ricordo in Bacheca: ' || COALESCE(NULLIF(title, ''), slug), 1, 120),
       'Un nuovo giorno è stato aggiunto alla Bacheca dei Ricordi.', '/bacheca', 'Guarda il ricordo',
       created_at, 1, 0, created_by, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM bacheca_days;

INSERT INTO world_updates
  (kind, emoji, title, body, route, cta_label, published_at, active, announce, created_by, created_at, updated_at)
SELECT 'contenuto', '📅', substr('Una data nel Calendario: ' || label, 1, 120),
       'Una nuova data è stata aggiunta al Calendario.', '/calendario', 'Apri il Calendario',
       created_at, 1, 0, created_by, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM calendar_events;

INSERT INTO world_updates
  (kind, emoji, title, body, route, cta_label, published_at, active, announce, created_by, created_at, updated_at)
SELECT 'contenuto', '🍳', substr('Una nuova ricetta: ' || title, 1, 120),
       'Una ricetta si è aggiunta al Ricettario.', '/ricettario', 'Apri la ricetta',
       created_at, 1, 0, created_by, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM recipes WHERE placeholder = 0;

INSERT INTO world_updates
  (kind, emoji, title, body, route, cta_label, published_at, active, announce, created_by, created_at, updated_at)
SELECT 'contenuto', '🌍', substr('Una nuova scena: ' || title, 1, 120),
       'Una scena si è aggiunta al Mappamondo.', '/mappamondo', 'Apri il Mappamondo',
       created_at, 1, 0, created_by, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM mappamondo_scenes;

INSERT INTO world_updates
  (kind, emoji, title, body, route, cta_label, published_at, active, announce, created_by, created_at, updated_at)
SELECT 'contenuto', '🗺️', substr('Un nuovo posto sulla Mappa: ' || name, 1, 120),
       'Un posto si è aggiunto alla Mappa.', '/mappa', 'Guarda la Mappa',
       created_at, 1, 0, created_by, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM map_destinations WHERE is_open = 1;

-- Questa è davvero recente e utile anche nel popup: non viene marcata come archivio.
INSERT INTO world_updates
  (kind, emoji, title, body, route, cta_label, published_at, active, announce, created_by, created_at, updated_at)
SELECT 'mondo', '🐣', 'La Casa degli animali si è allargata',
       'Oltre agli animali sono arrivati Fuochetto, Funghetto, Sassolino e Goccina.',
       '/tavolo-da-gioco/animali', 'Vai alla Casa', '2026-10-25T10:00:00.000Z', 1, 1,
       u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.role = 'admin' AND u.is_test = 0 ORDER BY u.id LIMIT 1;
