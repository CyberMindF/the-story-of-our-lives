-- #e14 ("Ecco qualcosa che è successo oggi"): la Bacheca dei Ricordi non ha oggi nessun
-- campo data (né sul giorno né sul periodo). Aggiungiamo una colonna opzionale sul giorno
-- così può partecipare al confronto giorno+mese con Calendario e Lettere. Nullable: un
-- giorno senza data resta semplicemente escluso dal banner, nessun obbligo di backfill
-- immediato su tutti i giorni esistenti.
ALTER TABLE bacheca_days ADD COLUMN memory_date TEXT;
