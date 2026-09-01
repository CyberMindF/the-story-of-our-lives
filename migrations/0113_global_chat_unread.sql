-- #e22: la Chat dei Ponti diventa la conversazione globale. L'account, non la label
-- narrativa lui/lei, e' la sorgente di verita' per mittente e stato di lettura.
ALTER TABLE ponti_chat_messages ADD COLUMN sender_user_id INTEGER REFERENCES users(id);

UPDATE ponti_chat_messages
SET sender_user_id = created_by
WHERE sender_user_id IS NULL;

CREATE INDEX idx_ponti_chat_messages_sender_user ON ponti_chat_messages(sender_user_id);

CREATE TABLE ponti_chat_reads (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  last_read_message_id INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Il rilascio non trasforma retroattivamente tutta la cronologia gia' vista in notifiche.
INSERT INTO ponti_chat_reads (user_id, last_read_message_id, updated_at)
SELECT id, (SELECT COALESCE(MAX(id), 0) FROM ponti_chat_messages), CURRENT_TIMESTAMP
FROM users;
