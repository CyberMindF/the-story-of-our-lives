# Piano di lavoro

Scaletta concordata il 09/08/2026, dopo il porting Angular e la componentizzazione. Ordine
pensato per fare le cose una volta sola: prima le fondamenta visive (temi/stile), poi i
redesign di pagina che le useranno, poi le feature nuove. Gli item bloccati su contenuti di
Rory o troppo vaghi per partire senza uno scoping veloce restano in fondo, così non bloccano
il resto.

## Bug chiusi

- [x] Scroll che restava fermo cambiando pagina — mancava `withInMemoryScrolling` nel router
  (`web/src/app/app.config.ts`).
- [x] Card del calendario senza colore mese — `--calendar-green`/`--calendar-red` erano su
  `.calendar-page` (pensato per il `<body>`), ma il CSS di pagina è scoped al componente da
  quando è uno `styleUrl`; spostate su `:host` (`web/src/styles/pages/calendar.css`).
- [x] La conferma della Chiave (`isAccessUnlocked`) non scadeva quasi mai: viveva in
  `sessionStorage`, valido finché la scheda del browser resta aperta — ma su mobile (o
  riscrivendo sempre l'indirizzo nella stessa scheda) la scheda non si "chiude" mai davvero, e
  la Chiave non veniva più richiesta anche a distanza di giorni. Ora scade dopo un'ora di
  inattività reale, non da quando è stata data: si rinnova navigando (`authGuard`) e
  interagendo con la pagina (`App`), così non chiede mai la Chiave a metà di un uso attivo.

## Extra (fuori scaletta, chiesti durante la Fase B)

- [x] #31 — occhiolino "mostra password" nel Portone: un solo campo condiviso da login e
  registrazione, quindi un solo toggle copre entrambi.

## Fase A — Quick win (COMPLETATA)

- [x] #12 — bug bottone rosso poi verde al caricamento: il tema salvato veniva applicato solo
  in `Portone.ngOnInit`, dopo il primo paint di Angular — su ogni altra pagina (o refresh
  diretto) restava sempre il tema di default finché il JS non girava. Aggiunto uno script
  inline in `web/src/index.html` che applica il tema da `localStorage` prima del primo paint,
  e centralizzata la chiamata a `ThemeService.applySavedTheme()` in `App` (non più solo nel
  Portone).
- [x] #10 — lettera finale alla fine del cruciverba: non è più il dialog generico "Cruciverba
  completato", ora è un vero fogliettino di carta (stessa superficie `.card--handwritten`
  condivisa con Lettere) al posto del messaggio. Testo invariato (già esistente), solo la
  presentazione è cambiata — vedi `crossword-modals.html`.
- [x] #8 — selettore temi: ogni pallino ha ora un'icona (🌙🌊💜❤️💚) sempre visibile e il nome
  del tema come piccola etichetta a comparsa su hover/focus (non più solo il `title` nativo,
  lento/inconsistente e assente su touch).
- [x] #29 — calendario: aggiunto il 20 maggio 2026, "La rinascita di Fuochetto"
  (`web/public/content/calendar.json`, ora 28 date).

## Fase B — Fondamenta visive (COMPLETATA)

- [x] #1 — temi coerenti: i colori di testo hardcoded (`#f4f7fb`, `#d1dde6`, `#b8cad9`, ripetuti
  identici su tutte le pagine) sono ora `var(--text-color)`/`var(--muted-color)`, quindi
  cambiano davvero con il tema — verificato che il colore effettivo cambi passando a
  "red-of-you".
  - **Seguito (segnalato dall'utente dopo la prima passata)**: erano rimaste ~25 sfumature di
    blu-grigio quasi identiche ma non esattamente uguali (`aebfcd`, `d8e2eb`, `c3d1dc`, ecc.),
    scritte a mano leggermente diverse pagina per pagina nel tempo — stesso ruolo di testo
    secondario, mai toccate dal cambio tema. Mappate anche queste su `var(--muted-color)`/
    `var(--text-color)`. Lasciati fuori di proposito: oro degli accent (`.btn-accent` e affini,
    già annotato come fuori perimetro in `buttons.css`), testo su carta chiara (card del
    calendario, `card--paper` del mappamondo, la lettera finale del cruciverba — lì il
    muted-color chiaro sarebbe illeggibile), e i verdi semantici di successo nei GDR.
  - Restano fuori (intenzionalmente) anche i bordi/sfondi `rgba(255,255,255,.XX)` sparsi: non
    variano per tema oggi, un giro dedicato in un secondo momento se serve davvero.
- [x] #13 — stile unificato bottoni/card: già in buona parte fatto durante la componentizzazione
  (`.btn`, `.card`, `.card--*` condivisi, usati in 9 pagine su 16); non ho trovato duplicazioni
  vistose da normalizzare oltre a quello.
- [x] Cielo/atmosfera per tema (chiesto il 09/08/2026): le stelle in realtà c'erano già su
  tutti i temi (150 ovunque, mai limitate a "the-white-world"), ma il cielo restava sempre lo
  stesso blu notte — `themes.css` aveva già un gradiente diverso per ogni tema ma non si è mai
  visto: `body.world-atmosphere` (in `world-atmosphere.css`) ha la stessa specificità e carica
  dopo, quindi vinceva sempre lui. Spostati i 4 gradienti (velvet/sea/red-of-you/green-of-me)
  dentro `world-atmosphere.css`, dove ora sono davvero applicati — verificato con screenshot
  che ogni tema ha un cielo genuinamente diverso (viola scuro, verde bosco, verdemare chiaro
  di giorno, vinaccia). Sea è chiaro invece che notturno: stelle scurite per restare visibili.
  "The-white-world" invariato (è il cielo storico del sito). Altri effetti (oltre al cielo)
  rimandati, come richiesto.

## Fase C — Redesign di pagina (dopo la Fase B, per non rifarle due volte)

- [ ] #3 — bacheca dei ricordi
- [ ] #6 — i ponti (alleggerire o spostare il focus sulle lettere)
- [ ] #7 — cuffiette: traccia bonus
- [ ] #9 — centralizzare di più le lettere
- [ ] #11 + #17 — accorciare la navigazione dei GDR / navigazione responsive
- [ ] #5 — capire se il mappamondo si può migliorare

## Fase D — Feature nuova (tocca anche il backend)

- [ ] #2 — pagina profilo (cambio nick/password, log della password precedente)

## Fase E — Bloccati su contenuti di Rory (non bloccano il resto)

- #16 — seconda avventura GDR: aspetta titolo/testo/regole
- #25 — Mappa: Sicilia, aspetta i testi
- #26 — Mappa: completare Roma, aspetta il testo vero
- #27 — rendere più personali le scritte ancora generiche: aspetta l'elenco dei testi da
  rivedere

## Fase F — Troppo vaghi per partire, serve scoping veloce insieme

- #21 — messaggio criptato nei giochi
- #22 — linguaggio segreto
- #23 — zona giochi/cose da fare insieme
- #24 — ricerca globale protetta (già segnata come rimandata)
- #20 — player audio proprio (dipende dallo spostare i 9 brani su R2)

---

## Backlog dettagliato

1. Implementare i temi in modo coerente anche nel resto del mondo bianco (grande)
    1. Il selettore c'è già su tutte le 17 pagine (09/08/2026) e cambia `--focus-color` e il tint del cielo stellato, ma i colori di ogni pagina (`web/src/styles/pages/*.css`) restano perlopiù hardcoded invece di usare le variabili di `themes.css` — quindi cambiando tema oggi si vede poco. È il refactoring pagina per pagina di cui sopra.
2. implementare una piccola pagina "profilo" dove poter cambiare il nick e password
    1. fare in modo che se c'è un cambio password, la precedente venga loggata per memoria
3. la bacheca dei ricordi è ancora totalmente da rivedere
5. capire se il mappamondo si può migliorare
6. i ponti allo stato attuale è una pagina un po' inutile, un po' "cimitero", potrebbe diventare leggermente più piccola o non mettere il focus su i ponti ma sulle lettere
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
26. La Mappa — completare Roma: nel contenuto attuale (`web/public/content/map.json`) è ancora un segnaposto quasi vuoto ("roma roma", nessuna immagine) — fedele all'originale Notion, che la lasciava incompleta apposta. Serve il testo vero da Rory prima di poterla scrivere.

27. Rendere le scritte più personali/romantiche, alla fine il sito "sono io" mentre l'utilizzatrice è lei. Quidni il sito bene o male è tutto "parlato" come se parlassi a lei, mentre per alcuni testi è stato scelto di renderli generici. Individuali e renderli personali

28. Una pagina per le mie domande, a cui vorrei che rispondesse, quindi deve essere tipo "domanda" e tipo text box dove lei potrebbe rispondere alle domande. Ovviamente richiede un salvataggio in DB

29. Aggiungere al calendario 20 maggio, la rinascia di fuochetto

30. Rivedere la favicon

31. Aggiungere un occhiolino "mostra password" nei campi password del Portone, sia nel login che nella registrazione.

32. Aggiungere l'1 luglio, il giorno del suo esame di maturità, e il giorno che le ho mandato il mazzo di rosa con la lettera

BUG
1. Anche quando il token/la sessione risultano validi, non si arriva mai al passaggio "inserisci solo la Chiave" (modalità `key` del Portone, per chi ha già una sessione valida ma deve solo riconfermare la Chiave) — da investigare.
