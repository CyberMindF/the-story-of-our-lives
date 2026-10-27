-- Voce consultabile nelle Novità e mostrata nel riepilogo al prossimo accesso.
-- La migrazione inserisce soltanto il testo dell'annuncio.
INSERT INTO world_updates
  (kind, emoji, title, body, route, cta_label, published_at, active, announce, created_by, created_at, updated_at)
SELECT 'mondo', '✉️', 'Lettere e capsule del tempo: qualche ritocco',
       'Ho aggiornato le lettere e le capsule del tempo, insieme alle email che ne accompagnano la consegna. Possiamo continuare a lasciarci qualcosa da leggere adesso o da ritrovare più avanti.',
       '/novita', 'Guarda le novità', '2026-10-27T12:00:00.000Z', 1, 1,
       u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u
WHERE u.role = 'admin' AND u.is_test = 0
ORDER BY u.id
LIMIT 1;
