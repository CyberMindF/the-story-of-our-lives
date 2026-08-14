-- Chat asincrona nei Ponti (#e5): sostituisce il vecchio documento Google Docs linkato dalla
-- card "Chat" (resta comunque raggiungibile altrove nel dubbio, non è stato eliminato nulla).
-- sender_identity è sempre derivato dalla sessione lato server (stesso principio di
-- pensieri_biglietti/jar_identity): non arriva mai dal client, quindi non richiede validazione.
-- I media (foto/video) hanno una scadenza: media_expires_at viene impostata alla creazione del
-- messaggio e un ciclo di pulizia pigro (dentro GET /api/ponti-chat) cancella da R2 e azzera i
-- campi media dei messaggi scaduti — prima feature del sito con vera cancellazione R2.
CREATE TABLE ponti_chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_identity TEXT NOT NULL CHECK (sender_identity IN ('lui', 'lei')),
  body TEXT,
  media_key TEXT,
  media_type TEXT CHECK (media_type IN ('photo', 'video') OR media_type IS NULL),
  media_expires_at TEXT,
  read_at TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL
);

CREATE INDEX idx_ponti_chat_messages_created_at ON ponti_chat_messages(created_at);
CREATE INDEX idx_ponti_chat_messages_media_expiry ON ponti_chat_messages(media_expires_at) WHERE media_expires_at IS NOT NULL;
