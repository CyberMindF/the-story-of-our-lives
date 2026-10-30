-- Rende modificabili nell'Atlante le tre destinazioni aggiunte al registro condiviso.
INSERT OR IGNORE INTO mondo_bianco_cards (id, name, description, created_by)
SELECT 'trappole', 'Ti preparo una trappola',
       'Una sfida a due tra trappole, indizi e percorsi da scoprire.', id
FROM users ORDER BY id LIMIT 1;

INSERT OR IGNORE INTO mondo_bianco_cards (id, name, description, created_by)
SELECT 'frequenze', 'Sulla stessa frequenza',
       'Enigmi da risolvere insieme, ognuno con il proprio punto di vista.', id
FROM users ORDER BY id LIMIT 1;

INSERT OR IGNORE INTO mondo_bianco_cards (id, name, description, created_by)
SELECT 'animali', 'La casa degli animali',
       'Un uovo da schiudere e piccoli animali da accudire insieme.', id
FROM users ORDER BY id LIMIT 1;
