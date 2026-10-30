-- Novità verificate relative ai GDR e alla Casa degli animali, ora disponibili in safe mode.
UPDATE world_updates SET safe = 1
WHERE safe = 0 AND (route, title, body) IN (
  ('/tavolo-da-gioco/animali', 'C’è qualcosa che aspetta di schiudersi', 'Nel Tavolo da Gioco è comparso un uovo condiviso. Potete scegliere cosa nascerà e come chiamarlo.'),
  ('/tavolo-da-gioco/gdr', 'Cominciano le avventure GDR', 'Il Tavolo da Gioco apre la sua prima avventura da giocare e scrivere insieme.'),
  ('/tavolo-da-gioco/gdr', 'Una seconda avventura GDR', 'La casa che trattiene il respiro si aggiunge alle avventure del Tavolo.'),
  ('/tavolo-da-gioco/gdr', 'I dadi entrano nel GDR', 'Il pannello delle avventure permette di preparare e tirare i dadi.'),
  ('/tavolo-da-gioco', 'Tre nuovi giochi sul Tavolo', 'Ti preparo una trappola, Sulla stessa frequenza e la Casa degli animali diventano giocabili.'),
  ('/tavolo-da-gioco/animali', 'La Casa degli animali si è allargata', 'Oltre agli animali sono arrivati Fuochetto, Funghetto, Sassolino e Goccia.')
);
