-- Gioco di carte collezionabili (#e4), design concordato con Rory il 14/08/2026 dopo una
-- sessione dedicata di domande — vedi e4-carte-collezionabili.md per il documento completo
-- (modello, drop rate, flusso trade, piano di lavoro a blocchi).
--
-- Modello a tre livelli: set (contenitore tematico esplicito, es. "Settembre 2026") > design
-- (un soggetto concreto: foto/sticker/emoji) > definizione (design × finitura, la carta
-- concreta pescabile/scambiabile). Le 5 finiture sono fisse e determinano la rarità; non
-- esiste un livello "edizione/ristampa" separato — un soggetto che ricompare nel tempo è
-- semplicemente un nuovo design indipendente (deciso esplicitamente da Rory).
--
-- Come in pensieri_biglietti/ponti_chat_messages, le identità utente sono sempre 'lui'/'lei'
-- derivate dalla sessione lato server, mai dal client.

CREATE TABLE carte_sets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  descrizione TEXT,
  position INTEGER NOT NULL,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL
);

CREATE INDEX idx_carte_sets_position ON carte_sets(position);

CREATE TABLE carte_designs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  set_id INTEGER NOT NULL REFERENCES carte_sets(id),
  nome TEXT NOT NULL,
  immagine_key TEXT,
  position INTEGER NOT NULL,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL
);

CREATE INDEX idx_carte_designs_set ON carte_designs(set_id, position);

-- Una definizione = una carta concreta pescabile/scambiabile (design + finitura).
-- immagine_key è opzionale e sovrascrive quella del design solo se le 5 finiture richiedono
-- artwork distinti invece di un overlay applicato alla stessa immagine base (decisione non
-- ancora presa con Rory, vedi "Cosa NON è ancora deciso" nel documento di design).
CREATE TABLE carte_definizioni (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  design_id INTEGER NOT NULL REFERENCES carte_designs(id),
  finitura TEXT NOT NULL CHECK (finitura IN ('flat', 'oro', 'smeraldo', 'rubino', 'diamante')),
  immagine_key TEXT,
  UNIQUE(design_id, finitura)
);

CREATE INDEX idx_carte_definizioni_design ON carte_definizioni(design_id);

CREATE TABLE carte_possesso (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_identity TEXT NOT NULL CHECK (owner_identity IN ('lui', 'lei')),
  carta_definizione_id INTEGER NOT NULL REFERENCES carte_definizioni(id),
  quantita INTEGER NOT NULL DEFAULT 0 CHECK (quantita >= 0),
  updated_at TEXT NOT NULL,
  UNIQUE(owner_identity, carta_definizione_id)
);

CREATE INDEX idx_carte_possesso_owner ON carte_possesso(owner_identity);

-- Una riga per identità: quantita_disponibile cresce col tempo trascorso sul sito (accumulo
-- continuo, nessun tetto massimo, deciso esplicitamente da Rory), scala di 1 ad ogni apertura.
CREATE TABLE carte_bustine (
  owner_identity TEXT PRIMARY KEY CHECK (owner_identity IN ('lui', 'lei')),
  quantita_disponibile INTEGER NOT NULL DEFAULT 0 CHECK (quantita_disponibile >= 0),
  minuti_residui INTEGER NOT NULL DEFAULT 0 CHECK (minuti_residui >= 0 AND minuti_residui < 10),
  updated_at TEXT NOT NULL
);

-- trade_precedente_id incatena le controproposte per ricostruire lo storico di uno scambio.
CREATE TABLE carte_trade (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proponente_identity TEXT NOT NULL CHECK (proponente_identity IN ('lui', 'lei')),
  destinatario_identity TEXT NOT NULL CHECK (destinatario_identity IN ('lui', 'lei')),
  stato TEXT NOT NULL CHECK (stato IN ('proposto', 'accettato', 'rifiutato', 'controproposto')),
  messaggio TEXT,
  trade_precedente_id INTEGER REFERENCES carte_trade(id),
  created_at TEXT NOT NULL,
  risolto_at TEXT
);

CREATE INDEX idx_carte_trade_destinatario ON carte_trade(destinatario_identity, stato);
CREATE INDEX idx_carte_trade_proponente ON carte_trade(proponente_identity, stato);

CREATE TABLE carte_trade_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trade_id INTEGER NOT NULL REFERENCES carte_trade(id),
  lato TEXT NOT NULL CHECK (lato IN ('offerta', 'richiesta')),
  carta_definizione_id INTEGER NOT NULL REFERENCES carte_definizioni(id),
  quantita INTEGER NOT NULL CHECK (quantita > 0)
);

CREATE INDEX idx_carte_trade_items_trade ON carte_trade_items(trade_id);

INSERT INTO carte_bustine (owner_identity, quantita_disponibile, minuti_residui, updated_at)
VALUES ('lui', 3, 0, CURRENT_TIMESTAMP), ('lei', 3, 0, CURRENT_TIMESTAMP);
