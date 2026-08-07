-- La posizione nell'array è già l'identificatore progressivo della parola: non serve un campo order separato.
ALTER TABLE crossword_word_attempts RENAME COLUMN word_order TO word_id;
