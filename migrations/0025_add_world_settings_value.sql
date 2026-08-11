-- Serve per la luna: oltre ad accendere/spegnere (enabled), ora si può anche scegliere la
-- fase manualmente invece di quella reale calcolata. "value" è generico (testo libero,
-- interpretato per chiave) così altre impostazioni future non booleane non richiederanno
-- un'altra migrazione di schema.
ALTER TABLE world_settings ADD COLUMN value TEXT;
