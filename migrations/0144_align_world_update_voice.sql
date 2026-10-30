-- Corregge la voce della novità dei pet senza ripubblicarla né azzerare lo stato letto.
UPDATE world_updates
SET body = 'Nel Tavolo da Gioco è comparso un uovo condiviso. Possiamo scegliere cosa nascerà e come chiamarlo.',
    updated_at = CURRENT_TIMESTAMP
WHERE route = '/tavolo-da-gioco/animali'
  AND title = 'C’è qualcosa che aspetta di schiudersi'
  AND body = 'Nel Tavolo da Gioco è comparso un uovo condiviso. Potete scegliere cosa nascerà e come chiamarlo.';
