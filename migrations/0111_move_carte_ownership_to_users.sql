-- La proprietà delle carte deve appartenere a un account, non al ruolo narrativo lui/lei.
-- Le righe legacy vengono assegnate all'account canonico più antico di ciascuna identità;
-- Rory è identificato esplicitamente per evitare che vecchi account locali di verifica
-- intercettino il patrimonio "lui". Se un'identità non ha ancora un account, i soli saldi
-- pre-seed vuoti/non utilizzati non vengono migrati e nasceranno al primo accesso.

ALTER TABLE users ADD COLUMN is_test INTEGER NOT NULL DEFAULT 0 CHECK (is_test IN (0, 1));

CREATE TABLE carte_possesso_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  carta_definizione_id INTEGER NOT NULL REFERENCES carte_definizioni(id),
  quantita INTEGER NOT NULL DEFAULT 0 CHECK (quantita >= 0),
  updated_at TEXT NOT NULL,
  UNIQUE(user_id, carta_definizione_id)
);

INSERT INTO carte_possesso_new (id, user_id, carta_definizione_id, quantita, updated_at)
SELECT cp.id,
       CASE cp.owner_identity
         WHEN 'lui' THEN (SELECT id FROM users WHERE email = 'rory982011@gmail.com' LIMIT 1)
         ELSE (SELECT id FROM users WHERE identity = cp.owner_identity AND is_test = 0 ORDER BY id LIMIT 1)
       END,
       cp.carta_definizione_id, cp.quantita, cp.updated_at
FROM carte_possesso cp
WHERE CASE cp.owner_identity
        WHEN 'lui' THEN (SELECT id FROM users WHERE email = 'rory982011@gmail.com' LIMIT 1)
        ELSE (SELECT id FROM users WHERE identity = cp.owner_identity AND is_test = 0 ORDER BY id LIMIT 1)
      END IS NOT NULL;

DROP TABLE carte_possesso;
ALTER TABLE carte_possesso_new RENAME TO carte_possesso;
CREATE INDEX idx_carte_possesso_user ON carte_possesso(user_id);

CREATE TABLE carte_bustine_new (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  quantita_disponibile INTEGER NOT NULL DEFAULT 0 CHECK (quantita_disponibile >= 0),
  minuti_residui INTEGER NOT NULL DEFAULT 0 CHECK (minuti_residui >= 0 AND minuti_residui < 10),
  updated_at TEXT NOT NULL
);

INSERT INTO carte_bustine_new (user_id, quantita_disponibile, minuti_residui, updated_at)
SELECT CASE cb.owner_identity
         WHEN 'lui' THEN (SELECT id FROM users WHERE email = 'rory982011@gmail.com' LIMIT 1)
         ELSE (SELECT id FROM users WHERE identity = cb.owner_identity AND is_test = 0 ORDER BY id LIMIT 1)
       END,
       cb.quantita_disponibile, cb.minuti_residui, cb.updated_at
FROM carte_bustine cb
WHERE CASE cb.owner_identity
        WHEN 'lui' THEN (SELECT id FROM users WHERE email = 'rory982011@gmail.com' LIMIT 1)
        ELSE (SELECT id FROM users WHERE identity = cb.owner_identity AND is_test = 0 ORDER BY id LIMIT 1)
      END IS NOT NULL;

DROP TABLE carte_bustine;
ALTER TABLE carte_bustine_new RENAME TO carte_bustine;

CREATE TABLE carte_streak_new (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  streak_corrente INTEGER NOT NULL DEFAULT 0 CHECK (streak_corrente >= 0),
  streak_migliore INTEGER NOT NULL DEFAULT 0 CHECK (streak_migliore >= 0),
  ultimo_giorno TEXT,
  ultima_soglia_raggiunta INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

INSERT INTO carte_streak_new
  (user_id, streak_corrente, streak_migliore, ultimo_giorno, ultima_soglia_raggiunta, updated_at)
SELECT CASE cs.owner_identity
         WHEN 'lui' THEN (SELECT id FROM users WHERE email = 'rory982011@gmail.com' LIMIT 1)
         ELSE (SELECT id FROM users WHERE identity = cs.owner_identity AND is_test = 0 ORDER BY id LIMIT 1)
       END,
       cs.streak_corrente, cs.streak_migliore, cs.ultimo_giorno,
       cs.ultima_soglia_raggiunta, cs.updated_at
FROM carte_streak cs
WHERE CASE cs.owner_identity
        WHEN 'lui' THEN (SELECT id FROM users WHERE email = 'rory982011@gmail.com' LIMIT 1)
        ELSE (SELECT id FROM users WHERE identity = cs.owner_identity AND is_test = 0 ORDER BY id LIMIT 1)
      END IS NOT NULL;

DROP TABLE carte_streak;
ALTER TABLE carte_streak_new RENAME TO carte_streak;

-- carte_trade_items referenzia carte_trade: ricostruiamo insieme l'intera catena, come nelle
-- migrazioni 0092/0101 già usate per allargare i vincoli delle finiture.
CREATE TABLE carte_trade_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proponente_user_id INTEGER NOT NULL REFERENCES users(id),
  destinatario_user_id INTEGER NOT NULL REFERENCES users(id),
  stato TEXT NOT NULL CHECK (stato IN ('proposto', 'accettato', 'rifiutato', 'controproposto')),
  messaggio TEXT,
  trade_precedente_id INTEGER REFERENCES carte_trade_new(id),
  created_at TEXT NOT NULL,
  risolto_at TEXT
);

INSERT INTO carte_trade_new
  (id, proponente_user_id, destinatario_user_id, stato, messaggio, trade_precedente_id, created_at, risolto_at)
SELECT ct.id,
       CASE ct.proponente_identity
         WHEN 'lui' THEN (SELECT id FROM users WHERE email = 'rory982011@gmail.com' LIMIT 1)
         ELSE (SELECT id FROM users WHERE identity = ct.proponente_identity AND is_test = 0 ORDER BY id LIMIT 1)
       END,
       CASE ct.destinatario_identity
         WHEN 'lui' THEN (SELECT id FROM users WHERE email = 'rory982011@gmail.com' LIMIT 1)
         ELSE (SELECT id FROM users WHERE identity = ct.destinatario_identity AND is_test = 0 ORDER BY id LIMIT 1)
       END,
       ct.stato, ct.messaggio, ct.trade_precedente_id, ct.created_at, ct.risolto_at
FROM carte_trade ct
WHERE CASE ct.proponente_identity
        WHEN 'lui' THEN (SELECT id FROM users WHERE email = 'rory982011@gmail.com' LIMIT 1)
        ELSE (SELECT id FROM users WHERE identity = ct.proponente_identity AND is_test = 0 ORDER BY id LIMIT 1)
      END IS NOT NULL
  AND CASE ct.destinatario_identity
        WHEN 'lui' THEN (SELECT id FROM users WHERE email = 'rory982011@gmail.com' LIMIT 1)
        ELSE (SELECT id FROM users WHERE identity = ct.destinatario_identity AND is_test = 0 ORDER BY id LIMIT 1)
      END IS NOT NULL;

CREATE TABLE carte_trade_items_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trade_id INTEGER NOT NULL REFERENCES carte_trade_new(id),
  lato TEXT NOT NULL CHECK (lato IN ('offerta', 'richiesta')),
  carta_definizione_id INTEGER NOT NULL REFERENCES carte_definizioni(id),
  quantita INTEGER NOT NULL CHECK (quantita > 0)
);

INSERT INTO carte_trade_items_new (id, trade_id, lato, carta_definizione_id, quantita)
SELECT cti.id, cti.trade_id, cti.lato, cti.carta_definizione_id, cti.quantita
FROM carte_trade_items cti
JOIN carte_trade_new ct ON ct.id = cti.trade_id;

DROP TABLE carte_trade_items;
DROP TABLE carte_trade;
ALTER TABLE carte_trade_new RENAME TO carte_trade;
ALTER TABLE carte_trade_items_new RENAME TO carte_trade_items;

CREATE INDEX idx_carte_trade_destinatario ON carte_trade(destinatario_user_id, stato);
CREATE INDEX idx_carte_trade_proponente ON carte_trade(proponente_user_id, stato);
CREATE INDEX idx_carte_trade_items_trade ON carte_trade_items(trade_id);
