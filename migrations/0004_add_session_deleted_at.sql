-- Il logout revoca logicamente la sessione senza cancellarne lo storico.
ALTER TABLE sessions ADD COLUMN deleted_at TEXT;

-- Agevola eventuali consultazioni amministrative delle sessioni revocate.
CREATE INDEX idx_sessions_deleted_at ON sessions(deleted_at);
