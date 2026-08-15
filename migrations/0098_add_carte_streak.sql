-- #e4 (streak "giorni di fila", proposta il 14/08/2026, dettagliata il 15/08/2026): premia le
-- visite consecutive alla pagina Carte con bustine bonus a soglie fisse (3/7/14/30 giorni).
-- "Giorno" = visita alla pagina Carte in giornate di calendario diverse (UTC), non tempo passivo.
-- ultima_soglia_raggiunta evita di ripetere il bonus per la stessa soglia entro la stessa serie
-- consecutiva; si azzera quando la streak si rompe, così una nuova serie può riguadagnarla.
CREATE TABLE carte_streak (
  owner_identity TEXT PRIMARY KEY CHECK (owner_identity IN ('lui', 'lei')),
  streak_corrente INTEGER NOT NULL DEFAULT 0 CHECK (streak_corrente >= 0),
  streak_migliore INTEGER NOT NULL DEFAULT 0 CHECK (streak_migliore >= 0),
  ultimo_giorno TEXT,
  ultima_soglia_raggiunta INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

INSERT INTO carte_streak (owner_identity, streak_corrente, streak_migliore, ultimo_giorno, ultima_soglia_raggiunta, updated_at)
VALUES ('lui', 0, 0, NULL, 0, CURRENT_TIMESTAMP), ('lei', 0, 0, NULL, 0, CURRENT_TIMESTAMP);
