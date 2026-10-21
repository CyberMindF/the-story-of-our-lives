-- Rettifica richiesta dopo l'azzeramento del conteggio offline: restituisce i bonus dei
-- giorni di accesso documentati, le 3 bustine iniziali e 10 bustine di compensazione.
-- I giorni intermedi di sessioni lunghe non sono deducibili da created_at/last_seen_at.
-- Conserviamo le componenti accreditate per rendere la rettifica verificabile.
CREATE TABLE carte_bustine_rettifica_0123 (
  user_id INTEGER PRIMARY KEY REFERENCES users(id),
  giorni_documentati INTEGER NOT NULL,
  bonus_login INTEGER NOT NULL,
  iniziali INTEGER NOT NULL,
  compensazione INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO carte_bustine_rettifica_0123
  (user_id, giorni_documentati, bonus_login, iniziali, compensazione)
WITH RECURSIVE streak_days(user_id, giorno, remaining) AS (
  SELECT user_id, ultimo_giorno, streak_corrente FROM carte_streak
  WHERE user_id IN (1, 2) AND streak_corrente > 0
  UNION ALL
  SELECT user_id, date(giorno, '-1 day'), remaining - 1 FROM streak_days
  WHERE remaining > 1
), days AS (
  SELECT user_id, date(created_at) AS giorno FROM sessions WHERE user_id IN (1, 2)
  UNION SELECT user_id, date(last_seen_at) FROM sessions WHERE user_id IN (1, 2)
  UNION SELECT user_id, date(created_at) FROM events WHERE user_id IN (1, 2)
  UNION SELECT user_id, giorno FROM streak_days
), numbered AS (
  SELECT user_id, giorno,
    julianday(giorno) - ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY giorno) AS gruppo
  FROM days WHERE giorno BETWEEN '2026-08-15' AND '2026-10-21'
), runs AS (
  SELECT user_id, ROW_NUMBER() OVER (PARTITION BY user_id, gruppo ORDER BY giorno) AS streak_day
  FROM numbered
)
SELECT user_id, COUNT(*), SUM(CAST((streak_day - 1) / 3 AS INTEGER) + 1), 3, 10
FROM runs GROUP BY user_id;

UPDATE carte_bustine
SET quantita_disponibile = quantita_disponibile + (
      SELECT bonus_login + iniziali + compensazione FROM carte_bustine_rettifica_0123 r
      WHERE r.user_id = carte_bustine.user_id
    ), updated_at = CURRENT_TIMESTAMP
WHERE user_id IN (SELECT user_id FROM carte_bustine_rettifica_0123);
