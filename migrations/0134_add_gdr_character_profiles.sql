-- Estende soltanto i personaggi del laboratorio, senza riscrivere le schede storiche.
ALTER TABLE gdr_workspace_characters ADD COLUMN profile_json TEXT NOT NULL DEFAULT '{}';
ALTER TABLE gdr_workspace_characters ADD COLUMN photo TEXT NOT NULL DEFAULT '';
