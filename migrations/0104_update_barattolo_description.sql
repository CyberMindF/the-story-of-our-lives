-- Mantiene allineata la descrizione del Barattolo salvata nel CMS con quella mostrata
-- come fallback dal frontend.
UPDATE mondo_bianco_cards
SET description = 'Per quando hai bisogno di una piccola frase da parte mia, qui puoi pescarne una a caso e tentare la fortuna: potrebbe essere un pensiero, un ricordo o una cosa che amo di te',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 'barattolo-dei-pensieri';
