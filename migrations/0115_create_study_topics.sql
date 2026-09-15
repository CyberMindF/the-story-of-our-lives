-- Aula studio: raccolte di flash card condivise tra tutti gli utenti autenticati. user_id
-- conserva chi ha creato l'argomento; eliminare un account rimuove gli argomenti che aveva creato.
CREATE TABLE study_topics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 120),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE study_cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id INTEGER NOT NULL,
  question TEXT NOT NULL CHECK (length(question) BETWEEN 1 AND 2000),
  answer TEXT NOT NULL CHECK (length(answer) BETWEEN 1 AND 2000),
  position INTEGER NOT NULL CHECK (position >= 0),
  created_at TEXT NOT NULL,
  FOREIGN KEY (topic_id) REFERENCES study_topics(id) ON DELETE CASCADE,
  UNIQUE (topic_id, position)
);

CREATE INDEX idx_study_topics_user_updated
  ON study_topics(user_id, updated_at DESC);

CREATE INDEX idx_study_cards_topic_position
  ON study_cards(topic_id, position);
