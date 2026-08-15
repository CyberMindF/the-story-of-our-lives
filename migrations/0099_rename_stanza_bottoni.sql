-- Rinomina "La Stanza dei Bottoni" in "Il Centro di Controllo" (riorganizzazione home,
-- 15/08/2026). Guardia sul nome corrente per non sovrascrivere un'eventuale personalizzazione
-- già fatta da admin via CMS (editor delle card del Mondo Bianco).
UPDATE mondo_bianco_cards
SET name = 'Il Centro di Controllo', updated_at = CURRENT_TIMESTAMP
WHERE id = 'impostazioni-mondo' AND name = 'La Stanza dei Bottoni';
