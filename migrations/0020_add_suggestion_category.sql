-- Categoria del suggerimento: dove nel Mondo Bianco si vorrebbe vedere applicata la modifica.
ALTER TABLE world_suggestions ADD COLUMN category TEXT NOT NULL DEFAULT 'altro';
