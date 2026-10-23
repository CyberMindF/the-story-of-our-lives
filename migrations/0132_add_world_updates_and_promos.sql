-- Novità consultabili e campagne scherzose sono sistemi distinti: le prime hanno uno stato
-- letto/non letto, le seconde una frequenza per utente che evita ripetizioni fastidiose.
CREATE TABLE world_updates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL CHECK (kind IN ('contenuto', 'mondo')),
  emoji TEXT NOT NULL DEFAULT '✨' CHECK (length(emoji) <= 24),
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 120),
  body TEXT NOT NULL DEFAULT '' CHECK (length(body) <= 1000),
  route TEXT,
  cta_label TEXT,
  published_at TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX world_updates_published ON world_updates(active, published_at DESC);

CREATE TABLE world_update_reads (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  update_id INTEGER NOT NULL REFERENCES world_updates(id) ON DELETE CASCADE,
  seen_at TEXT NOT NULL,
  PRIMARY KEY (user_id, update_id)
);

CREATE TABLE world_promos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL DEFAULT 'consiglia' CHECK (label IN ('commerciale', 'consiglia', 'sponsor', 'promozionale')),
  emoji TEXT NOT NULL DEFAULT '📣' CHECK (length(emoji) <= 24),
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 120),
  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 1200),
  route TEXT,
  cta_label TEXT,
  placement TEXT NOT NULL DEFAULT 'automatico' CHECK (placement IN ('automatico', 'lato', 'alto', 'basso')),
  target_identity TEXT NOT NULL DEFAULT 'tutti' CHECK (target_identity IN ('tutti', 'lui', 'lei')),
  cooldown_days INTEGER NOT NULL DEFAULT 7 CHECK (cooldown_days BETWEEN 1 AND 365),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE world_promo_views (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  promo_id INTEGER NOT NULL REFERENCES world_promos(id) ON DELETE CASCADE,
  last_seen_at TEXT NOT NULL,
  impression_count INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, promo_id)
);

CREATE INDEX world_promo_views_recent ON world_promo_views(user_id, last_seen_at DESC);

-- Prima dotazione: sono contenuti/funzioni già presenti, modificabili o eliminabili
-- dall'editor appena creato.
INSERT INTO world_updates (kind, emoji, title, body, route, cta_label, published_at, created_by, created_at, updated_at)
SELECT 'mondo', '🔮', 'Sono arrivate le evocazioni arcane',
       'Aprendo le bustine puoi trovare un’evocazione e scegliere un Tarocco da conservare.',
       '/tavolo-da-gioco/carte', 'Vai alle carte', CURRENT_TIMESTAMP, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.role = 'admin' ORDER BY u.id LIMIT 1;

INSERT INTO world_updates (kind, emoji, title, body, route, cta_label, published_at, created_by, created_at, updated_at)
SELECT 'mondo', '📝', 'I quiz sono entrati nell’Aula studio',
       'Ora puoi svolgere quiz completi, correggerli e ritrovare i tentativi precedenti.',
       '/aula-studio', 'Apri l’Aula studio', datetime('now', '-1 minute'), u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.role = 'admin' ORDER BY u.id LIMIT 1;

INSERT INTO world_updates (kind, emoji, title, body, route, cta_label, published_at, created_by, created_at, updated_at)
SELECT 'contenuto', '🐣', 'C’è qualcosa che aspetta di schiudersi',
       'Nel Tavolo da Gioco è comparso un uovo condiviso. Potete scegliere cosa nascerà e come chiamarlo.',
       '/tavolo-da-gioco/animali', 'Vai a controllare', datetime('now', '-2 minutes'), u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.role = 'admin' ORDER BY u.id LIMIT 1;

INSERT INTO world_promos (label, emoji, title, body, route, cta_label, placement, target_identity, cooldown_days, created_by, created_at, updated_at)
SELECT 'consiglia', '🎧', 'Le Cuffiette',
       'Musica selezionata con cura e assoluta mancanza di imparzialità.',
       '/cuffiette', 'Ascolta', 'automatico', 'tutti', 7, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.role = 'admin' ORDER BY u.id LIMIT 1;

INSERT INTO world_promos (label, emoji, title, body, route, cta_label, placement, target_identity, cooldown_days, created_by, created_at, updated_at)
SELECT 'sponsor', '🫙', 'Il Barattolo dei Pensieri',
       'Conserva i pensieri in un luogo sicuro, prima che decidano di tornare alle tre di notte.',
       '/barattolo-dei-pensieri', 'Apri il barattolo', 'automatico', 'tutti', 7, u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.role = 'admin' ORDER BY u.id LIMIT 1;

INSERT OR IGNORE INTO mondo_bianco_cards (id, name, description, created_by, created_at, updated_at)
SELECT 'novita', 'Le Novità', 'Quello che è comparso nel Mondo Bianco mentre non guardavi', u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u WHERE u.role = 'admin' ORDER BY u.id LIMIT 1;
