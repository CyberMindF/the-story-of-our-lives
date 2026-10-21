-- Il vecchio calcolo usava la distanza da updated_at e accreditava anche tutto il tempo in
-- cui il sito era chiuso. Da questa migrazione ogni minuto arriva da un heartbeat del browser
-- visibile; il timestamp dell'ultimo tick impedisce a piu schede di contare lo stesso minuto.
ALTER TABLE carte_bustine ADD COLUMN ultimo_minuto_attivo TEXT;

-- Copia recuperabile dei saldi precedenti alla rettifica, senza alterare gli album.
CREATE TABLE carte_bustine_backup_0122 AS
SELECT user_id, quantita_disponibile, minuti_residui, updated_at,
       CURRENT_TIMESTAMP AS backed_up_at
FROM carte_bustine;

-- I saldi esistenti sono stati contaminati dal tempo di calendario e non sono ricostruibili
-- con precisione. Azzera soltanto le bustine ancora da aprire: carte possedute, trade e streak
-- restano invariati.
UPDATE carte_bustine
SET quantita_disponibile = 0,
    minuti_residui = 0,
    ultimo_minuto_attivo = NULL,
    updated_at = CURRENT_TIMESTAMP;
