-- Voce consultabile nelle Novità e mostrata nel riepilogo al prossimo accesso. Descrive
-- l'aggiornamento reale del sistema e del modello email senza modificare le preferenze di
-- nessun account e senza inviare alcuna email durante la migrazione.
INSERT INTO world_updates
  (kind, emoji, title, body, route, cta_label, published_at, active, announce, created_by, created_at, updated_at)
SELECT 'mondo', '✉️', 'Abbiamo rimesso in ordine le notifiche',
       'Abbiamo rivisto il sistema che prepara gli avvisi del Mondo Bianco e aggiornato il modello delle email.',
       '/novita', 'Guarda le novità', '2026-10-27T12:00:00.000Z', 1, 1,
       u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u
WHERE u.role = 'admin' AND u.is_test = 0
ORDER BY u.id
LIMIT 1;
