-- Aggiunge le finiture "argento" (metallo, come oro) e "zaffiro" (gemma, come smeraldo/
-- rubino/diamante) a #e4. SQLite non supporta ALTER TABLE per modificare un CHECK esistente:
-- si ricrea la tabella con il vincolo allargato. carte_possesso e carte_trade_items
-- referenziano carte_definizioni(id) e D1 applica i vincoli FK anche dentro l'esecuzione di un
-- intero file di migrazione (sia PRAGMA foreign_keys=OFF sia defer_foreign_keys=ON provati,
-- nessuno dei due ha avuto effetto) — quindi si ricostruisce l'intera catena con backup
-- espliciti invece di fare affidamento su un pragma.

CREATE TABLE carte_definizioni_backup AS SELECT * FROM carte_definizioni;
CREATE TABLE carte_possesso_backup AS SELECT * FROM carte_possesso;
CREATE TABLE carte_trade_items_backup AS SELECT * FROM carte_trade_items;

DROP TABLE carte_possesso;
DROP TABLE carte_trade_items;
DROP TABLE carte_definizioni;

CREATE TABLE carte_definizioni (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  design_id INTEGER NOT NULL REFERENCES carte_designs(id),
  finitura TEXT NOT NULL CHECK (finitura IN ('flat', 'argento', 'oro', 'smeraldo', 'rubino', 'zaffiro', 'diamante')),
  immagine_key TEXT,
  UNIQUE(design_id, finitura)
);
CREATE INDEX idx_carte_definizioni_design ON carte_definizioni(design_id);
INSERT INTO carte_definizioni (id, design_id, finitura, immagine_key)
SELECT id, design_id, finitura, immagine_key FROM carte_definizioni_backup;

CREATE TABLE carte_possesso (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_identity TEXT NOT NULL CHECK (owner_identity IN ('lui', 'lei')),
  carta_definizione_id INTEGER NOT NULL REFERENCES carte_definizioni(id),
  quantita INTEGER NOT NULL DEFAULT 0 CHECK (quantita >= 0),
  updated_at TEXT NOT NULL,
  UNIQUE(owner_identity, carta_definizione_id)
);
CREATE INDEX idx_carte_possesso_owner ON carte_possesso(owner_identity);
INSERT INTO carte_possesso (id, owner_identity, carta_definizione_id, quantita, updated_at)
SELECT id, owner_identity, carta_definizione_id, quantita, updated_at FROM carte_possesso_backup;

CREATE TABLE carte_trade_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trade_id INTEGER NOT NULL REFERENCES carte_trade(id),
  lato TEXT NOT NULL CHECK (lato IN ('offerta', 'richiesta')),
  carta_definizione_id INTEGER NOT NULL REFERENCES carte_definizioni(id),
  quantita INTEGER NOT NULL CHECK (quantita > 0)
);
CREATE INDEX idx_carte_trade_items_trade ON carte_trade_items(trade_id);
INSERT INTO carte_trade_items (id, trade_id, lato, carta_definizione_id, quantita)
SELECT id, trade_id, lato, carta_definizione_id, quantita FROM carte_trade_items_backup;

DROP TABLE carte_definizioni_backup;
DROP TABLE carte_possesso_backup;
DROP TABLE carte_trade_items_backup;
