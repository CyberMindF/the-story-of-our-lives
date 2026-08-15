-- Backfill delle date reali dei giorni della Bacheca, fornite da Rory il 15/08/2026
-- per la feature #e14 "Ecco qualcosa che è successo oggi". Date-per-giorno per i giorni
-- "normali" (un giorno = una data), date-per-blocco per il giorno "I video" (id 16), che
-- raccoglie video girati in momenti diversi. "Due fotine bonus" (id 7), "Screenshots"
-- (id 11) e le collezioni "Altre cose"/"Giochi"/"Fuochetto" (id 17-19) restano senza data
-- su richiesta esplicita di Rory ("il resto lo puoi ignorare").

-- Settembre 2025: dal 25 al 30
UPDATE bacheca_days SET memory_date = '2025-09-25' WHERE id = 1;  -- Il primo giorno
UPDATE bacheca_days SET memory_date = '2025-09-26' WHERE id = 2;  -- Il secondo giorno
UPDATE bacheca_days SET memory_date = '2025-09-27' WHERE id = 3;  -- Il terzo giorno
UPDATE bacheca_days SET memory_date = '2025-09-28' WHERE id = 4;  -- Il quarto giorno
UPDATE bacheca_days SET memory_date = '2025-09-29' WHERE id = 5;  -- Il quinto giorno
UPDATE bacheca_days SET memory_date = '2025-09-30' WHERE id = 6;  -- L'ultimo giorno

-- Maggio 2026: dal 12 al 14
UPDATE bacheca_days SET memory_date = '2026-05-12' WHERE id = 8;  -- Il primo giorno
UPDATE bacheca_days SET memory_date = '2026-05-13' WHERE id = 9;  -- Il secondo giorno
UPDATE bacheca_days SET memory_date = '2026-05-14' WHERE id = 10; -- Il terzo giorno

-- Luglio 2026: dal 27 al 30
UPDATE bacheca_days SET memory_date = '2026-07-27' WHERE id = 12; -- Primo giorno
UPDATE bacheca_days SET memory_date = '2026-07-28' WHERE id = 13; -- Secondo giorno
UPDATE bacheca_days SET memory_date = '2026-07-29' WHERE id = 14; -- Terzo giorno
UPDATE bacheca_days SET memory_date = '2026-07-30' WHERE id = 15; -- Quarto giorno (ultimo)

-- "I video" (id 16): tre date diverse su tre blocchi diversi dello stesso giorno.
UPDATE bacheca_days
SET content = json_set(
  content,
  '$.rows[0].columns[0].blocks[0].memoryDate', '2025-09-17', -- Il video per i 4 anni
  '$.rows[0].columns[1].blocks[0].memoryDate', '2025-12-25', -- Gli auguri di Natale
  '$.rows[1].columns[0].blocks[0].memoryDate', '2026-05-14'  -- Un pezzo della nostra storia
)
WHERE id = 16;
