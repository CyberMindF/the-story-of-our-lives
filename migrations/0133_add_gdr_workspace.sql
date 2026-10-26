-- Laboratorio isolato: nessuna modifica a gdr_blocks, gdr_turns o schede esistenti.
CREATE TABLE gdr_workspace_adventures (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT '',
  legacy INTEGER NOT NULL DEFAULT 0 CHECK (legacy IN (0,1)),
  published INTEGER NOT NULL DEFAULT 0 CHECK (published IN (0,1)),
  revision INTEGER NOT NULL DEFAULT 1,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL
);
INSERT INTO gdr_workspace_adventures (id,title,legacy,published,created_at) VALUES
 ('il-prezzo-della-verita','Il Prezzo della Verità',1,1,strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 ('la-casa-che-trattiene-il-respiro','La casa che trattiene il respiro',1,1,strftime('%Y-%m-%dT%H:%M:%fZ','now'));
CREATE TABLE gdr_workspace_characters (
  id TEXT PRIMARY KEY,
  adventure_id TEXT NOT NULL REFERENCES gdr_workspace_adventures(id),
  kind TEXT NOT NULL CHECK (kind IN ('pg','png')),
  name TEXT NOT NULL,
  portrait TEXT NOT NULL DEFAULT '',
  sheet TEXT NOT NULL DEFAULT '',
  inventory_json TEXT NOT NULL DEFAULT '[]',
  archived INTEGER NOT NULL DEFAULT 0 CHECK (archived IN (0,1)),
  revision INTEGER NOT NULL DEFAULT 1,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL
);
CREATE INDEX gdr_workspace_characters_adventure ON gdr_workspace_characters(adventure_id);
CREATE TABLE gdr_workspace_grants (
  character_id TEXT NOT NULL REFERENCES gdr_workspace_characters(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  can_speak INTEGER NOT NULL DEFAULT 1 CHECK (can_speak IN (0,1)),
  can_edit_sheet INTEGER NOT NULL DEFAULT 0 CHECK (can_edit_sheet IN (0,1)),
  can_inventory INTEGER NOT NULL DEFAULT 0 CHECK (can_inventory IN (0,1)),
  PRIMARY KEY (character_id,user_id)
);
-- Una variazione dei permessi invalida anche gli editor già aperti.
CREATE TRIGGER gdr_workspace_grant_insert AFTER INSERT ON gdr_workspace_grants BEGIN
 UPDATE gdr_workspace_characters SET revision=revision+1 WHERE id=NEW.character_id;
END;
CREATE TRIGGER gdr_workspace_grant_update AFTER UPDATE ON gdr_workspace_grants BEGIN
 UPDATE gdr_workspace_characters SET revision=revision+1 WHERE id=NEW.character_id;
END;
