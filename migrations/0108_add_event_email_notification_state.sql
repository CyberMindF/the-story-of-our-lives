-- Un solo avviso email ogni due ore per gli eventi registrati di lei.
-- La riga singleton permette a richieste contemporanee di contendersi il cooldown
-- con un unico UPDATE atomico.
CREATE TABLE event_email_notification_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  last_sent_at TEXT
);

INSERT INTO event_email_notification_state (id, last_sent_at)
VALUES (1, NULL);
