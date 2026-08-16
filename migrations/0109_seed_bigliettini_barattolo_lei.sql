-- Bigliettini scritti da lui per il barattolo di lei.
-- title contiene solo il completamento di "Per quando...", come richiesto dalla UI.
WITH entries(ord, text, title) AS (
  VALUES
    (1, 'Sei stupenda', 'hai bisogno di sentirti amata'),
    (2, 'Ti voglio un bene dell''anima ❤️‍🔥', 'hai bisogno di sentirti amata'),
    (3, 'Per me sarai sempre unica', 'hai bisogno di sentirti amata'),
    (4, 'Hai lasciato tantissimo di te dentro di me', 'hai bisogno di sentirti amata'),
    (5, 'Ti voglio benissimo, piccolina mia ❤️‍🔥', 'hai bisogno di sentirti amata'),
    (6, 'Sei bellissima', 'hai bisogno di sentirti amata'),
    (7, 'Ti amo ❤️‍🔥', 'hai bisogno di sentirti amata'),
    (8, 'Tu per me sei arte', 'hai bisogno di sentirti amata'),
    (9, 'La tua risata è una delle mie cose preferite', 'hai bisogno di sentirti amata'),
    (10, 'Quel sorriso davanti alla porta mi rimarrà sempre in testa', 'hai bisogno di sentirti amata'),
    (11, 'Sei la mia piccolina ❤️‍🔥', 'hai bisogno di sentirti amata'),
    (12, 'Sei la mia vita ❤️‍🔥', 'hai bisogno di sentirti amata'),
    (13, 'Sei l''amore mio ❤️‍🔥', 'hai bisogno di sentirti amata'),
    (14, 'Sei la mia casa ❤️‍🔥', 'hai bisogno di sentirti amata'),
    (15, 'Sei la mia famiglia ❤️‍🔥', 'hai bisogno di sentirti amata'),
    (16, 'Sei il mio tutto ❤️‍🔥', 'hai bisogno di sentirti amata'),
    (17, '❤️‍🔥❤️‍🔥❤️‍🔥❤️‍🔥❤️‍🔥', 'hai bisogno di sentirti amata'),
    (18, 'Lo sai che sono davvero orgoglioso di te?', 'hai bisogno di credere in te'),
    (19, 'Sei molto più forte di quanto pensi', 'hai bisogno di credere in te'),
    (20, 'Puoi affrontare tutto quello che vuoi', 'hai bisogno di credere in te'),
    (21, 'Io credo in te', 'hai bisogno di credere in te'),
    (22, 'Voglio attaccarti altri stickers sulla faccia', 'hai bisogno di sorridere'),
    (23, 'Continuo a pensare che quel latte non era troppo e comunque colpa tua se non lo abbiamo bevuto.', 'hai bisogno di sorridere'),
    (24, 'Fai sempre troppa cacca.', 'hai bisogno di sorridere'),
    (25, 'Ancora mi ricordo di tutti i tuoi rutti eh.', 'hai bisogno di sorridere'),
    (26, 'La tua voce per me è ancora casa', 'pensi a noi'),
    (27, 'Rifarei mille volte quel primo incontro', 'pensi a noi'),
    (28, 'Ti ricordi il cuore fatto di ovetti?', 'pensi a noi'),
    (29, 'Ti ricordi quando eravamo solo noi due il MC e le canzoni in macchina?', 'pensi a noi'),
    (30, 'Te le ricordi le nuggeST?', 'pensi a noi'),
    (31, 'Ma quanto sono venuti bene i nostri cookies?', 'pensi a noi'),
    (32, 'Quanto eravamo belli vestiti bene in quelle foto?', 'pensi a noi'),
    (33, 'Anche oggi meriti qualcosa di bello', 'ti senti giù'),
    (34, 'Non devi dimostrare il tuo valore a nessuno', 'ti senti giù'),
    (35, 'Ripeti insieme a me: ci riuscirò', 'ti senti giù'),
    (36, 'Tu meriti sempre la felicità', 'ti senti giù'),
    (37, 'Buonanotte piccolina mia, dormi bene e sogni d''oro, ti voglio benissimo ❤️‍🔥', 'vuoi la buonanotte'),
    (38, 'Buonanotte vita mia ❤️‍🔥', 'vuoi la buonanotte'),
    (39, 'Buonanotte amore mio, dormi bene e sogni d''oro, sei tutta mia e solo mia e io sono tutto tuo e solo tuo, ti amissimo ❤️‍🔥 a domani ❤️‍🔥', 'vuoi la buonanotte')
),
bases AS (
  SELECT
    COALESCE((SELECT MAX(id) FROM pensieri_biglietti), 0) AS max_id,
    COALESCE((SELECT MAX(position) FROM pensieri_biglietti WHERE jar_identity = 'lei'), -1) AS max_position,
    (SELECT id
       FROM users
      WHERE identity = 'lui'
      ORDER BY CASE WHEN role = 'admin' THEN 0 ELSE 1 END, id
      LIMIT 1) AS author_id
)
INSERT INTO pensieri_biglietti
  (id, jar_identity, text, title, is_active, position, draw_count, created_by, created_at, updated_at)
SELECT
  bases.max_id + entries.ord,
  'lei',
  entries.text,
  entries.title,
  1,
  bases.max_position + entries.ord,
  0,
  bases.author_id,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM entries
CROSS JOIN bases
WHERE bases.author_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
      FROM pensieri_biglietti existing
     WHERE existing.jar_identity = 'lei'
       AND existing.text = entries.text
  );
