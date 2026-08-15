-- "Ricomincia da Capo" (#g1): non un gioco, un ricordo — ricrea la pagina Omegle dove i due si
-- sono conosciuti, collegamento secondario da "I Ponti" (stesso schema di ponti-chat: nessuna
-- voce propria in mondo_bianco_cards/atlante, si raggiunge solo dalla pagina Ponti).
-- sender_identity derivato dalla sessione lato server, stesso principio di ponti_chat_messages.
CREATE TABLE stranger_chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_identity TEXT NOT NULL CHECK (sender_identity IN ('lui', 'lei')),
  body TEXT NOT NULL,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL
);

CREATE INDEX idx_stranger_chat_messages_created_at ON stranger_chat_messages(created_at);

INSERT INTO content_entries (content_key, label, content_type, versioning_mode, body, created_by, created_at, updated_at)
SELECT 'ponti.stranger-chat.descrizione', 'Ponti — descrizione Ricomincia da Capo', 'plain_text', 'replace', 'La pagina dove ci siamo conosciuti, ricostruita — per ricominciare da capo ogni volta che vogliamo.', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.email = 'rory982011@gmail.com';
