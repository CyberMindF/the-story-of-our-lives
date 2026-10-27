-- Corregge le voci gia inserite dalla ricostruzione dello storico. Usiamo confronti esatti
-- per non modificare eventuali testi liberi creati dall'admin.
UPDATE world_updates SET title = 'Nei Ponti si può anche chattare'
WHERE title = 'Nei Ponti si puo anche chattare';
UPDATE world_updates SET title = 'Il Mondo ricorda cosa è successo oggi'
WHERE title = 'Il Mondo ricorda cosa e successo oggi';
UPDATE world_updates SET title = 'La Casa degli animali si è allargata'
WHERE title = 'La Casa degli animali si e allargata';

UPDATE world_updates SET body = 'Bustine, rarità, album e scambi arrivano nel Tavolo da Gioco.'
WHERE body = 'Bustine, rarita, album e scambi arrivano nel Tavolo da Gioco.';
UPDATE world_updates SET body = 'Si può spedire qualcosa nel futuro e aspettare che sia il momento giusto.'
WHERE body = 'Si puo spedire qualcosa nel futuro e aspettare che sia il momento giusto.';
UPDATE world_updates SET body = 'Nei Ponti compare una piccola chat che ricorda il posto in cui tutto è iniziato.'
WHERE body = 'Nei Ponti compare una piccola chat che ricorda il posto in cui tutto e iniziato.';
UPDATE world_updates SET body = 'La home può mostrare lettere, date e ricordi legati alla giornata.'
WHERE body = 'La home puo mostrare lettere, date e ricordi legati alla giornata.';
UPDATE world_updates SET body = 'Si possono estrarre domande da più unità e bilanciarle per difficoltà.'
WHERE body = 'Si possono estrarre domande da piu unita e bilanciarle per difficolta.';
UPDATE world_updates SET body = 'La cronologia degli import mostra cosa è entrato e permette di ripristinare la situazione precedente.'
WHERE body = 'La cronologia degli import mostra cosa e entrato e permette di ripristinare la situazione precedente.';
UPDATE world_updates SET body = 'Una lettera è stata lasciata nella Cassetta.'
WHERE body = 'Una lettera e stata lasciata nella Cassetta.';
UPDATE world_updates SET body = 'Una storia si è aggiunta alla raccolta.'
WHERE body = 'Una storia si e aggiunta alla raccolta.';
UPDATE world_updates SET body = 'Una canzone si è aggiunta alle Cuffiette.'
WHERE body = 'Una canzone si e aggiunta alle Cuffiette.';
UPDATE world_updates SET body = 'Un nuovo giorno è stato aggiunto alla Bacheca dei Ricordi.'
WHERE body = 'Un nuovo giorno e stato aggiunto alla Bacheca dei Ricordi.';
UPDATE world_updates SET body = 'Una nuova data è stata aggiunta al Calendario.'
WHERE body = 'Una nuova data e stata aggiunta al Calendario.';
UPDATE world_updates SET body = 'Una ricetta si è aggiunta al Ricettario.'
WHERE body = 'Una ricetta si e aggiunta al Ricettario.';
UPDATE world_updates SET body = 'Una scena si è aggiunta al Mappamondo.'
WHERE body = 'Una scena si e aggiunta al Mappamondo.';
UPDATE world_updates SET body = 'Un posto si è aggiunto alla Mappa.'
WHERE body = 'Un posto si e aggiunto alla Mappa.';
