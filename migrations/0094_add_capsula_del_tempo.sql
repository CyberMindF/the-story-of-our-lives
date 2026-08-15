-- Capsula del tempo (#e15): messaggio (+ foto o video opzionali) scritto oggi ma visibile
-- a entrambi solo a partire da una data futura scelta da chi scrive. A differenza del
-- Barattolo dei Pensieri (mirato, casuale) qui non c'è destinatario: alla data di sblocco
-- il contenuto è automaticamente visibile a entrambe le identità, non solo all'altra.
-- author_identity è sempre derivato dalla sessione lato server (stesso principio di
-- jar_identity/sender_identity), mai dal client. Nessun limite al numero di capsule aperte
-- o in attesa: nessuna colonna di stato "attiva", il gate è solo unlock_date confrontata
-- lato server. A differenza di Ponti Chat, nessuna scadenza sul media: una capsula può
-- restare sigillata mesi, il file deve sopravvivere fino allo sblocco e oltre.
CREATE TABLE capsule_tempo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  text TEXT NOT NULL,
  media_key TEXT,
  media_type TEXT CHECK (media_type IN ('photo', 'video') OR media_type IS NULL),
  unlock_date TEXT NOT NULL,
  author_identity TEXT NOT NULL CHECK (author_identity IN ('lui', 'lei')),
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL
);

CREATE INDEX idx_capsule_tempo_unlock_date ON capsule_tempo(unlock_date);

-- Registra la pagina come card del Mondo Bianco (come 0076/0078): senza questa riga
-- l'editor "Modifica" della home fallirebbe con 404, non essendoci nulla da aggiornare.
INSERT OR IGNORE INTO mondo_bianco_cards (id, name, description, created_by)
SELECT 'capsula-del-tempo', 'La Capsula del Tempo', 'Un messaggio scritto oggi, che si apre solo a partire da una data futura.', id FROM users ORDER BY id LIMIT 1;
