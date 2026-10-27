-- Aggiorna l'annuncio anche nei database che hanno già applicato la migrazione 0139.
-- Mantiene lo stato di lettura e non invia email.
UPDATE world_updates
SET title = 'Lettere e capsule del tempo: qualche ritocco',
    body = 'Ho aggiornato le lettere e le capsule del tempo, insieme alle email che ne accompagnano la consegna. Possiamo continuare a lasciarci qualcosa da leggere adesso o da ritrovare più avanti.',
    updated_at = CURRENT_TIMESTAMP
WHERE title = 'Abbiamo rimesso in ordine le notifiche'
  AND published_at = '2026-10-27T12:00:00.000Z';
