-- Aggiorna le descrizioni scelte da Rory per l'Atlante del Mappamondo (15/08/2026). A
-- differenza delle card "primary" della home (mai personalizzate via CMS, description sempre
-- NULL in mondo_bianco_cards), queste 8 voci non-primary/figlie avevano già una description
-- salvata nel DB (probabilmente da un editing precedente nell'Atlante), che altrimenti avrebbe
-- continuato a vincere sul nuovo fallbackDescription in world-places.ts. Guardia sul testo
-- corrente per non sovrascrivere un'eventuale personalizzazione più recente e diversa.
UPDATE mondo_bianco_cards SET description = 'Questo mondo è tanto mio quanto tuo, se vuoi creare qualcosa proponilo qui', updated_at = CURRENT_TIMESTAMP
WHERE id = 'suggerimenti' AND description = 'Il posto in cui proporre qualcosa di nuovo per qualunque angolo del sito.';

UPDATE mondo_bianco_cards SET description = 'Un cruciverba con tanti dei nostri ricordi', updated_at = CURRENT_TIMESTAMP
WHERE id = 'cruciverba' AND description = 'Cento definizioni che raccontano qualcosa di noi.';

UPDATE mondo_bianco_cards SET description = 'Una sfida a tradurre un messaggio criptato, puoi farcela', updated_at = CURRENT_TIMESTAMP
WHERE id = 'messaggio-criptato' AND description = 'Un messaggio da ricostruire un indizio alla volta.';

UPDATE mondo_bianco_cards SET description = 'Lo sai, la mia passione più grande e vorrei condividerla con te, chissà magari alla fine faremo qualcosa di più grande insieme ahaha', updated_at = CURRENT_TIMESTAMP
WHERE id = 'gdr' AND description = 'Qui trovi Il Prezzo della Verità; La casa che trattiene il respiro arriverà presto.';

UPDATE mondo_bianco_cards SET description = 'Le classiche cose a cui non si riesce a dire di no 👀', updated_at = CURRENT_TIMESTAMP
WHERE id = 'prova-a-dire-no' AND description = 'Domande a cui non riuscirai a rispondere "no".';

UPDATE mondo_bianco_cards SET description = 'Un’idea che mi è venuta per avere la nostra collezione personale', updated_at = CURRENT_TIMESTAMP
WHERE id = 'carte' AND description = 'Bustine, rarità e scambi con carte che siamo noi.';

UPDATE mondo_bianco_cards SET description = 'Il nostro linguaggio segreto, se ogni tanto abbiamo bisogno di dirci qualcosa che possiamo capire solo noi', updated_at = CURRENT_TIMESTAMP
WHERE id = 'linguaggio-segreto' AND description = 'I simboli e le parole che capiamo soltanto noi.';

UPDATE mondo_bianco_cards SET description = 'Se vuoi cambiare password o il tuo nome', updated_at = CURRENT_TIMESTAMP
WHERE id = 'profilo' AND description = 'Le impostazioni personali e gli accessi alle aree riservate.';
