1. Implementare i temi in modo coerente anche nel resto del mondo bianco (grande)
    1. Il selettore c'è già su tutte le 17 pagine (09/08/2026) e cambia `--focus-color` e il tint del cielo stellato, ma i colori di ogni pagina (`assets/css/pages/*.css`) restano perlopiù hardcoded invece di usare le variabili di `themes.css` — quindi cambiando tema oggi si vede poco. È il refactoring pagina per pagina di cui sopra.
2. implementare una piccola pagina "profilo" dove poter cambiare il nick e password
    1. fare in modo che se c'è un cambio password, la precedente venga loggata per memoria
3. la bacheca dei ricordi è ancora totalmente da rivedere
4. rivedere la pagina di login stilisticamente parlando
5. capire se il mappamondo si può migliorare
6. i ponti allo stato attuale è una pagina un po' inutile, un po' "cimitero", potrebbe diventare leggermente più piccola o non mettere il focus su i ponti
7. rivedere la parte della traccia bonus nelle cuffiette, fa un po' schifo
8. rivedere il selettore dei temi, non mi piace molto in questo momento, non mostra il nome ne le icone dei temi
9. capire come centralizzare un po' di più le lettere
10. aggiungere la lettera finale alla fine del cruciverba
11. capire come ottimizzare le pagine dei gdr, perché attualmente sono tante pagine e ci si perde un po', per tornare indietro ci vuole una vita. Attualmente il percorso è il mondom bianco->tavolo da gioco->giochi di ruolo->il prezzo della verità->le 3 pagine dell'avventura. Veramente troppi passaggi
12. c'è ancora quel bug che il colore del bottone inizialmente è rosso, poi diventa verde
13. Tutto il sito non sembra avere uno stile unificato, come card, bottoni, stili, in generale. Ovvio non è che tutte le pagine devono essere uguali, ma almeno avere un design riconoscibile tra loro. 
Portati qui dalla vecchia `CHECKLIST_MIGRAZIONE_MONDO_BIANCO.md` (ora eliminata, cronologia completa nella storia di git):

16. Aggiungere la seconda avventura del Gioco di Ruolo. Rory ha già pronta una seconda storia giocabile, con un regolamento diverso da "Il Prezzo della Verità" (non condividono lo stesso sistema di regole). Struttura già pronta ad accoglierla: `tavolo-da-gioco/gdr/index.html` elenca le avventure in `.tavolo-games-grid-compact` (oggi solo IPDV), ognuna con pagina propria (`tavolo-da-gioco/gdr/<slug>/index.html`) sul modello di `tavolo-da-gioco/gdr/il-prezzo-della-verita/`. Non condividere il regolamento tra le due: ognuna tiene il proprio. Aspettare titolo, testo e regole da Rory prima di crearla.
17. Progettare la navigazione responsive: rendere raggiungibili luoghi e ritorno alla home su desktop e telefono mantenendo orientamento e accessibilità.
20. Sostituire l'embed SoundCloud delle Cuffiette con un player audio proprio del sito, quando i nove brani saranno ospitati direttamente (R2 o storage posseduto) invece che su SoundCloud.
21. Aggiungere anche il messaggio criptato ai giochi.
22. Aggiungere il nostro linguaggio segreto da qualche parte (magari introducendo qualcosa di speciale per i 5 cuori e per il cerchio).
23. Aggiungere una zona dei giochi da fare insieme, con didascalia sotto. Come se fosse la lista delle mie note sul telefono ma qui, condivisa, magari anche lei può suggerire giochi o cosa da fare (capire se solo giochi o cose da fare insieme o se farle entrambe in modo diviso). https://www.youtube.com/shorts/4jmIPLqo7Hc
24. Ricerca globale protetta: cercare per parola dentro titoli, date, storie, canzoni, mete e ricordi tutti insieme, invece di aprire ogni pagina a cercare a occhio. Deve restare autenticata (nessun contenuto indicizzabile o raggiungibile da chi non ha fatto login). Rimandata: più un'idea per quando il sito avrà più contenuto da cercare, che una necessità adesso.
25. La Mappa — aggiungere la Sicilia tra le mete (è la terra di Rory, tanti posti bellissimi). Posti già in mente: il fiume Amenano sotto l'ostello (a Catania), le Gole dell'Alcantara, i laghetti di Avola (probabilmente Cavagrande del Cassibile, le piscine naturali vicino Avola — da confermare). Isola Bella a Taormina. Da scrivere insieme quando Rory ha i testi pronti, stesso trattamento delle altre mete (non un posto "originale" preesistente, va segnato come aggiunta).
26. La Mappa — completare Roma: nel contenuto attuale (`content/map.json`) è ancora un segnaposto quasi vuoto ("roma roma", nessuna immagine) — fedele all'originale Notion, che la lasciava incompleta apposta. Serve il testo vero da Rory prima di poterla scrivere.