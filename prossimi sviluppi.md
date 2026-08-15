# Piano di lavoro

Scaletta concordata il 09/08/2026, dopo il porting Angular e la componentizzazione. Le cose
ancora aperte (da fare, in corso, o bloccate su contenuti di Rory) stanno in cima, così si
vedono subito senza scorrere; tutto quello già completato è più sotto, in ordine di fase.

## Da fare / in corso

- #e4 (idee proposte il 15/08/2026, non ancora fatte) — grafica delle carte: (a) un **retro
  della carta** vero (oggi le carte non ancora rivelate/nell'album non hanno un fronte
  "coperto" disegnato); (b) una **texture per la bustina** stessa (oggi solo un'emoji 🧧 nel
  bottone "Apri una bustina" e nel contatore, nessuna illustrazione). Segnate su richiesta di
  Rory, da progettare quando ci sarà tempo — nessun dettaglio deciso su stile o formato.
- #e4 (continua) — il Blocco 5 del piano in `e4-carte-collezionabili.md` (notifiche email dei
  trade) è **implementato il 15/08/2026** insieme a #f5, agganciato a
  proponi/accetta/rifiuta/controproponi in `functions/api/carte-trade/` (vedi voce #f5 più sotto
  per i dettagli). **Non ancora verificabile end-to-end**: c'è un solo account registrato
  (Rory), e `notifyOtherIdentity` cerca sempre un secondo utente diverso dall'attore — finché
  Desy non si registra (e attiva `notify_email_updates`) non parte nessuna email reale di
  trade, anche se il codice è pronto e testato nella parte di invio (vedi test diretto in #f5).

  La streak "giorni di fila" proposta il 14/08/2026 è **implementata e chiusa il 15/08/2026**,
  dopo diversi giri di correzione con Rory nello stesso pomeriggio. Versione finale: **ogni**
  giorno di visita alla pagina Carte in giorni di calendario consecutivi dà bustine bonus,
  importo crescente ogni 3 giorni (`streakDayBonus(day) = floor((day-1)/3) + 1`, senza tetto),
  non solo alcune soglie fisse come nella primissima versione. Tabella `carte_streak`
  (migrazione `0098_add_carte_streak.sql`), logica in `checkStreak()` agganciata a
  `GET /api/carte-bustine`. UI: badge "🔥 N" sopra la fascia bustine (riapribile in ogni
  momento), calendario premi di 30 caselle nel modale (stile login giornaliero dei giochi
  mobile, emoji 🧧 su ogni casella). In più, lucido plastica sulle carte standard (`flat`):
  `.carta-tilt-gloss` in `carta-tilt.css`, stesse posizioni di banda di `.metal-surface`
  (metallic-foil.css) ma con `rgba()` invece di colore opaco — un tentativo di riuso diretto del
  componente `MetallicFoil` è stato scartato per un limite reale del CSS (`isolation:isolate`
  sull'host impedisce al suo `mix-blend-mode` di blendare fuori dal componente). Corretto anche
  un bug scoperto durante il lavoro: `onPointerLeave` in `carta-tilt.ts` non resettava
  `--mx`/`--my`, quindi il riflesso (sia sulle standard che sulle gemme) restava bloccato
  all'ultima posizione del mouse invece di tornare al centro quando il puntatore usciva dalla
  carta. Dettagli e percorso completo (comprese le versioni scartate) in
  `e4-carte-collezionabili.md`. Il resto della feature è concluso e rifinito, vedi voce completa
  più sotto nel Fatto.
- #e16 (idea, ripescata) — Playlist Spotify condivisa nelle Cuffiette: era già stata proposta come #e1 e scartata il 13/08/2026 perché non chiaro il senso. Rory ha chiarito il 14/08/2026: non un editoriale scritto, ma un vero embed di una playlist Spotify che lui cura nel tempo, aggiungendo canzoni man mano — più semplice da fare di una pagina editoriale (nessun CMS, nessun testo da scrivere, solo un iframe verso la playlist).
- #e6 - Test generalee fix finali mobile
- [x] #f5 — Infrastruttura email (Resend) implementata il 15/08/2026, dominio `il-mondo-bianco.com`
  verificato su Resend, API key salvata come secret Cloudflare (`RESEND_API_KEY`, mai nel repo).
  Libreria condivisa `functions/api/_shared/email.js` (`sendEmail`, `notifyOtherIdentity`, quest'ultima
  rispetta sempre `users.notify_email_updates`). Due canali attivi per ora: **notifica manuale**
  (inizialmente un bottone nella userbar condivisa, spostato lo stesso giorno nella pagina
  **Profilo** — sotto "Strumenti riservati" — con una casella di testo per personalizzare il
  messaggio prima di inviarlo, `web/src/app/pages/profilo/`, chiama `functions/api/notify-update.js`)
  e **notifiche automatiche di scambio carte** (#e4, Blocco 5: proponi/accetta/rifiuta/controproponi
  in `functions/api/carte-trade/`). Deciso con Rory di non agganciare automaticamente tutte le
  altre 20 sezioni con contenuto pubblicabile (Ricettario, Lettere, Bacheca, ecc.): troppo
  rumoroso da fare a tappeto ora; si aggiungeranno singolarmente in futuro se richiesto, o si
  valuterà una newsletter settimanale riassuntiva invece di email puntuali. Invio reale testato
  end-to-end il 15/08/2026 (email di prova consegnata con successo a rory982011@gmail.com),
  endpoint di test temporaneo rimosso subito dopo. Controllando la nuova card nel Profilo è
  emerso un bug preesistente e indipendente: `--input-bg` (sfondo dei campi di testo) era
  definito solo nel tema scuro di default e mai ridefinito negli altri 7 temi in `themes.css` —
  con qualunque tema chiaro attivo tutti i campi di testo del sito restavano scuri. Risolto
  ridefinendo `--input-bg` in ciascun tema, verificato con screenshot Playwright prima/dopo.
- #f6 - Animazione di apertura/chiusura del biglietto nel Barattolo dei Pensieri (#e12): voluta come un vero foglietto piegato in 4 (due pieghe, orizzontale e verticale) che si spiega — tentativi fatti e scartati: scale()/clip-path (sembrava una copia in miniatura, non una piega), 4 pannelli reali con cerniere 3D rotateX/rotateY (geometricamente corretto ma troppo macchinoso/fragile da rifinire). Per ora il biglietto compare e scompare di scatto, senza animazione.
- #e18 (pulizia interna, non urgente) — Duplicazione trovata il 14/08/2026 durante un'audit richiesta da Rory: (a) il metodo "sposta su/giù" è identico in 9 pagine (Bacheca, Barattolo dei Pensieri, Linguaggio Segreto, Cuffiette, Mappamondo, Mappa, Storie, Cruciverba, Ricettario) — stesso corpo di 3 righe, cambia solo endpoint e nome del metodo di reload; estrarlo in un helper condiviso è lavoro piccolo (~1h, basso rischio). (b) il pattern completo "Sposta…" (spostare un elemento in un altro contenitore/categoria: stessi signal `startMove*`/`cancelMove*`/`confirmMove*`, stesso blocco HTML con due select e bottoni Annulla/Sposta, stesso cluster di bottoni ⬆️⬇️↔️✏️🗑️) è ripetuto in 3 pagine (Bacheca, Barattolo dei Pensieri, Linguaggio Segreto) con nomi di campo diversi invece di essere un componente condiviso — lavoro medio (~mezza giornata: progettazione componente generico + migrazione delle 3 pagine + verifica Playwright). Nessuna delle due è urgente: non è un bug, non cambia nulla nell'uso del sito, solo manutenzione interna coerente con la regola "zero duplicazione" (CLAUDE.md). Rimandato per ora su richiesta di Rory (poco tempo disponibile).
---

## Da non fare

- [x] #24 — ricerca globale protetta: scartata. Le aree del sito sono poche e riconoscibili; indicizzare contenuti protetti e formati diversi aggiungerebbe complessità senza risolvere un bisogno emerso nell'uso reale. Da rivalutare solo se in futuro diventerà concretamente difficile ritrovare i contenuti.
- [x] #e17 — Modalità di lettura pulita: implementata il 15/08/2026 (query param `?clean=1` più un interruttore admin nella Stanza dei Bottoni) e rimossa lo stesso giorno su richiesta di Rory. `CleanModeService`, i getter dedicati in `AppShell`, il wrapper nel form delle Lettere e il toggle in Impostazioni Mondo sono stati tolti di nuovo. Da rivalutare se in futuro torna l'idea.
- [x] #e1 — playlist Spotify condivisa nelle Cuffiette: accantonata il 13/08/2026, Rory non era convinto avesse senso. Da rivalutare se in futuro torna l'idea.

---

## Fatto

### Extra (fuori scaletta, chiesto il 15/08/2026)

- [x] Palloncini e fuochi d'artificio (#f2/#f3) spostati dal gruppo "Festa" (eliminato, era l'ultimo della griglia) dentro "Consigliato per Night Sky" nella Stanza dei Bottoni, su richiesta di Rory. Nello stesso giro, sistemato lo spazio vuoto notato da Rory tra i gruppi di effetti: `.settings-effects-grid` era una `grid` a 2 colonne con `align-items:start`, che affianca gruppi di altezza diversa nella stessa riga lasciando un vuoto sotto quello più corto prima della riga successiva (non è masonry). Sostituita con `columns:2` (colonne CSS native, nessun JS): ogni gruppo (`break-inside:avoid`) scorre nella colonna più corta in quel momento, comportamento masonry senza libreria.
- [x] #e12 — **Il Barattolo dei Pensieri** (`/barattolo-dei-pensieri`, card e voce nell'Atlante del Mappamondo incluse, gruppo "ricordi"). Due barattoli (uno per "lui", uno per "lei"): ognuno vede il proprio con solo il bottone "Pesca", quello dell'altro con solo la form "Scrivi per…" — mai entrambe le azioni sullo stesso barattolo. Numeri sopra ciascun barattolo con il conteggio dei biglietti attivi. Rispetto alla descrizione iniziale, due semplificazioni concordate con Rory: **niente categorie/stati d'animo** (pesca sempre "a caso" su tutto il barattolo attivo) e **aggiunta diretta per entrambi** (chiunque abbia sessione valida può scrivere per il barattolo dell'altro — il vincolo "mai per il proprio" è strutturale lato server: `jarIdentity` è sempre derivato dall'identità opposta a quella della sessione, non arriva mai dal client, quindi non richiede validazione). Niente più canale via Suggerimenti, reso ridondante dall'aggiunta diretta. Coda mobile di esclusione delle ultime `min(10, attivi-1)` pesche per barattolo (si riduce da sola se il barattolo ha meno di 11 biglietti attivi) e casualità pesata verso i meno pescati (peso `1/√(draw_count+1)`), in `functions/api/pensieri-biglietti/pesca.js`. Dopo l'apertura solo `Rimetti nel barattolo` / `Pesca ancora`, nessun archivio. Telemetria solo con l'ID del biglietto, mai il testo (`barattolo_biglietto_pescato`). Il biglietto pescato appare in un modale con lo stesso stile "carta scritta a mano" delle Lettere (`card--handwritten` + `handwritten-text`, font Caveat) e la stessa leggera rotazione pseudo-casuale-ma-fissa per id (ora condivisa: `seededRotation()` in `web/src/app/shared/random.ts`, riusata anche da Lettere al posto della sua vecchia copia privata). **Niente animazione di apertura/chiusura**: dopo diversi tentativi (scale/clip-path, poi un vero foglio a 4 pannelli con cerniere 3D rotateX/rotateY) nessuno rendeva bene l'effetto "foglietto piegato in 4 che si spiega" voluto da Rory — il biglietto compare e scompare di scatto, vedi #f6 più sopra per riprenderla in un secondo momento. Editor di gestione (modifica testo/titolo, attivo/non attivo, frecce + comando "Sposta…", cancellazione) **non** su una route admin separata come inizialmente pianificato, ma inline nella stessa pagina dietro `canEdit()` — scoperto durante l'implementazione che è il pattern dominante nel resto del sito (Linguaggio Segreto, card del Mondo Bianco), non la route dedicata usata invece per il playground di Prova a Dire No (quello è un sandbox per provare effetti, non un editor di contenuti). Tabelle `pensieri_biglietti` e `pensieri_estrazioni`, migrazione `0078_add_barattolo_dei_pensieri.sql`.
- [x] #34 — Ricettario completato: sostituita la ricetta placeholder del pollo al curry con la
  versione definitiva di Rory (ingredienti e procedimento) e ricostruiti ingredienti/procedimento
  dei biscotti di pasta frolla. Modifiche fatte in locale e sincronizzate in produzione con la
  migrazione `0095_sync_contenuti_locale_15082026.sql`.
- [x] #e14 — **"Ecco qualcosa che è successo oggi"** (banner in home, Mondo Bianco). Ridefinita
  il 15/08/2026 rispetto all'idea originale (pesca a caso da Bacheca/Mappa, bloccata per
  mancanza di date precise): ora pesca eventi Calendario, Lettere e giorni/blocchi Bacheca la
  cui data (giorno+mese, ignorando l'anno) coincide con oggi — un vero "on this day", fisso
  per tutto il giorno, nessuno stato server, filtro client-side su dati già esposti dagli
  endpoint esistenti (`/api/calendar-events`, `/api/letters`, `/api/bacheca-days`). Se non c'è
  nessuna corrispondenza il banner non appare (deciso con Rory). Per includere la Bacheca
  (che non aveva alcun campo data) aggiunta `memory_date` opzionale sia a livello di giorno
  sia di singolo blocco (`migrations/0096_add_bacheca_memory_date.sql`), con editor esteso di
  conseguenza; backfill delle date reali fornite da Rory per i giorni esistenti
  (`migrations/0097_backfill_bacheca_memory_dates.sql`) — "Due fotine bonus", "Screenshots" e
  le collezioni "Altre cose"/"Giochi"/"Fuochetto" restano senza data su sua richiesta esplicita
  ("il resto lo puoi ignorare"). Se un giorno ha più blocchi datati sulla stessa data (es. 30
  foto scattate lo stesso giorno), il banner mostra **una sola card** per quel giorno con una
  foto scelta a caso — non le mostra tutte, per non affollare il banner (decisione di Rory dopo
  aver visto la prima versione, che ne creava una per blocco). Card con miniatura per i blocchi
  foto. Deep-link (`?evento=`, `?lettera=`, `?giorno=&blocco=`) per aprire il dettaglio dalla
  card: durante il test è emerso un bug reale nello scroll verso un blocco lontano nella pagina
  Bacheca (le foto `loading="lazy"` senza dimensioni riservate spostavano continuamente il
  layout mentre la pagina scrollava, portando il target molto lontano dal punto giusto) — corretto
  rendendo lo scroll auto-correggente (ripete finché la posizione non si stabilizza, max 4s).
  Rimossa nello stesso giro anche `CleanModeService`, rimasta senza alcun utilizzo nel codice.
- [x] #e15 — **La Capsula del Tempo** (`/capsula-del-tempo`, card e voce nell'Atlante del
  Mappamondo incluse, gruppo "ricordi"). Idea rimasta aperta dal 14/08/2026 in attesa di essere
  progettata meglio; definita e implementata il 15/08/2026. A differenza del Barattolo dei
  Pensieri (mirato a un destinatario, pescata a caso, subito leggibile), qui il messaggio (+
  foto o video opzionali) è scritto oggi ma sigillato fino a una data futura scelta da chi
  scrive, poi visibile a **entrambi automaticamente** — nessun destinatario, nessuna scelta di
  chi la apre. Decisioni prese con Rory: nessun limite al numero di capsule aperte o in attesa
  contemporaneamente; una capsula non ancora sbloccata **si vede** come card "in arrivo" con
  lucchetto e sola data, senza contenuto; **niente notifica email** (Rory l'avrebbe voluta, ma
  dipende da #f5 non ancora deciso — si aggancia più avanti, stesso schema già usato per il
  Blocco 5 di #e4). Il gate non è mai lato client: `toCapsulaView` in
  `functions/api/capsule-tempo/_shared.js` omette titolo/testo/media dal payload JSON stesso
  per le capsule non ancora sbloccate, confrontando `unlock_date` con la data odierna lato
  server — anche ispezionando la risposta di rete non si legge il contenuto prima del tempo.
  `author_identity` sempre derivato dalla sessione (mai dal client), stesso principio di
  `jarIdentity`/`sender_identity` nel Barattolo e nei Ponti. Upload foto/video su R2 con lo
  stesso schema stream-binario di `ponti-chat/media.js` (niente multipart, limiti separati per
  tipo: 15MB foto, 200MB video). **A differenza di Ponti Chat, nessuna scadenza sul media**:
  richiesto esplicitamente da Rory (una capsula può restare sigillata mesi, il file caricato
  oggi deve sopravvivere fino allo sblocco e oltre), quindi niente `media_expires_at` né pulizia
  pigra su R2. Nessun endpoint di modifica dopo la creazione: la capsula è "sigillata" per
  costruzione, solo l'autore può eliminarla (prima o dopo lo sblocco). Tabella `capsule_tempo`,
  migrazione `0094_add_capsula_del_tempo.sql`. Verificato end-to-end (API via curl con due
  identità di prova, poi Playwright sul frontend, account e dati ripuliti da D1 locale):
  creazione, mascheramento del contenuto prima dello sblocco, comparsa automatica del contenuto
  dopo lo sblocco per entrambe le identità (foto e video), permesso di eliminazione limitato al
  proprio autore.

- [x] #g1 — "Ricomincia da Capo": nuova pagina `/stranger-chat`. **Corretto in corsa dopo due feedback di Rory**: (1) non è un gioco — spostata dal Tavolo da Gioco a collegamento secondario dentro "I Ponti" (stesso schema di ponti-chat: nessuna voce propria in Atlante/mondo_bianco_cards, si raggiunge solo dalla pagina Ponti); (2) "deve sembrare identico a Omegle, la pagina in cui ci siamo conosciuti" — la prima versione (nero/monospace/verde) era lo stile sbagliato, un'estetica da terminale mai stata di Omegle. Rifatta com'era davvero la pagina reale: sfondo bianco, Helvetica/Arial, logo "omegle" rosso con "Talk to strangers!" sotto, riga di sistema "You're now chatting with a random stranger. Say hi!" in grigio corsivo, log bordato con "You:" in blu e "Stranger:" in rosso, input semplice in basso. Bug di architettura trovato risolvendolo: passare una classe a `AppShell` via `shellClass` per colorare lo sfondo non funzionava — l'incapsulamento CSS di Angular applica gli attributi di scoping solo agli elementi generati dal template del COMPONENTE proprietario di quel foglio di stile, e `.place-shell`/l'header sono generati dal template di `AppShell`, non da quello della pagina, quindi nessuna regola scritta nel CSS della pagina poteva raggiungerli. Risolto con un backdrop `position: fixed; inset: 0` reso direttamente nel template della pagina (quindi soggetto alle sue regole) che copre l'intero viewport dietro all'header condiviso, senza duplicare header/userbar. Schermata d'ingresso con la domanda "ti va se ricominciamo tutto da capo?" e bottone "Nuova chat" prima di entrare, come richiesto. Non è la stessa chat dei Ponti (#e5, con media e scadenza 30gg): qui solo testo, il minimo che serve a un layout Omegle. Nuova tabella `stranger_chat_messages` (migrazione `0093_add_stranger_chat.sql`), `sender_identity` derivato dalla sessione lato server come in tutte le altre chat/collezioni del sito, mai dal client. Endpoint `GET/POST /api/stranger-chat` e `DELETE /api/stranger-chat/:id` (solo messaggi propri), stessa struttura di `functions/api/ponti-chat/` ma senza upload media. Verificato con Playwright su account di prova (poi ripuliti da D1 locale): schermata d'ingresso, invio messaggio, comparsa come "You" in blu, eliminazione del proprio messaggio con conferma, card visibile solo in Ponti e assente dal Tavolo da Gioco.
  **Terzo giro** (Rory: "quella che hai fatto tu è veramente orrenda", con screenshot reale della pagina Omegle allegato): la ricostruzione a memoria non era abbastanza fedele nella struttura, solo nei colori. Rifatta guardando lo screenshot vero: header con logo (icona doppio fumetto blu/arancio + testo "omegle" arancio) e tagline "Talk to strangers!" in grassetto nero sulla stessa riga; un solo box bordato sempre presente (non più due schermate separate) che mostra la domanda + bottone "New chat" prima di iniziare, poi la riga di sistema "You're now chatting with a random stranger. Say hi!" e i messaggi dopo; barra inferiore sempre visibile con bottone "New" (etichetta piccola "Esc" sotto), casella di testo, bottone "Send" (etichetta piccola "Enter" sotto, grigio se disabilitato/vuoto, blu quando c'è testo) — esattamente la disposizione a tre colonne dello screenshot. Il bottone "New" della barra ora riporta alla domanda iniziale (`stop()`) invece di terminare la conversazione, coerente col fatto che qui non ci sono sconosciuti da cambiare.
  **Quarto giro** (Rory: mancava la riga Facebook/Twitter/Select Language, il numero online doveva essere grande e blu scuro con "+", la bombatura dei bottoni non era quella giusta, e niente pulsante di eliminazione perché Omegle non ce l'ha): aggiunta la riga con badge Facebook "Share" e Twitter "Tweet" (colori originali dei due social) e "Select Language" con icona; "2+ online now" spostato su riga propria, numero grande (1.6rem) blu più scuro. Bottoni rifatti con un gradiente a doppia fermata ravvicinata a metà altezza (49%/51%) invece di un gradiente lineare semplice, per la "cucitura" vetrosa tipica dei bottoni glossy di inizio anni 2010 — prima non era la stessa bombatura. Rimosso interamente il pulsante di eliminazione messaggio (Omegle non ne ha uno): tolti markup, signal, metodi e endpoint `DELETE /api/stranger-chat/:id` diventati inutilizzati, oltre al dialogo di conferma condiviso non più referenziato in questa pagina.
  **Quinto giro**: Rory ha fornito il logo Omegle originale (SVG); sostituito l'icona+testo disegnati a mano con l'asset vero, salvato in `web/public/assets/images/world/omegle-logo.svg` (coerente con la regola del progetto che gli asset pubblici vivono sotto `web/public/`, mai fuori).
  **Sesto giro** (Rory ha chiesto di andare a leggere direttamente la pagina vera invece di continuare ad andare a memoria/impressione): recuperato l'HTML e il CSS originali dalla snapshot Wayback Machine del 28/07/2023 (`web.archive.org/web/20230728160030/https://www.omegle.com/`), più gli asset reali (tagline "Talk to strangers!" — è un'immagine scritta a mano inclinata, non testo ruotato via CSS — e i bottoni Facebook/Twitter), salvati in `web/public/assets/images/world/`. Tutti i dettagli prima approssimati a occhio ora sono i valori esatti letti dal sorgente: sfondo pagina `#fff7ee` (il beige richiesto, non indovinato), box `border-radius:.5em` con `box-shadow: inset 0 0 .5em #bbb`, header con `box-shadow: 0 .25em .75em #ccc`, gradiente dei bottoni attivi esattamente `linear-gradient(#80c0ff, #017ffe)` su bordo grigio neutro (niente bevel/inset inventato: nel CSS reale il "pop" è solo il gradiente saturo, non un'ombra glossy — la bombatura dei giri precedenti era una mia invenzione), riga di sistema "You're now chatting..." in grassetto grigio `#555` (non corsivo), messaggi `You:`/`Stranger:` nei colori letterali `blue`/`red` del CSS originale, contatore online `#9cf`/`#6cb5ff`. Verificato di nuovo con Playwright: risultato visivamente sovrapponibile allo screenshot fornito da Rory.
  **Settimo giro** (Rory: dimensioni non rispettate, angoli smussati solo in alcuni punti non ovunque, header troppo alto, box "piccola finestrella" invece di piena pagina, header del sito da integrare o sostituire con solo "←"): aggiunto un nuovo `@Input() showHeader` a `AppShell` (`web/src/app/shell/app-shell.ts`/`.html`, `false` di default cambia nulla altrove) per nascondere del tutto l'header/userbar condiviso su questa pagina — resta solo il "← Il Mondo Bianco" di `app-back-link` già esistente in fondo, nessun altro elemento del sito, coerente con l'idea che questa è l'unica pagina che deve sembrare "un altro sito". Header dell'imitazione Omegle riportato a una sola riga (logo/tagline/share sulla stessa riga, contatore online affiancato invece che su una riga propria) con lo stesso padding sottile dell'originale (`.4em .5em`, non i rem generosi di prima). Angoli: solo il box in alto (`.5em .5em 0 0`) e i due bottoni della barra sotto sul rispettivo angolo esterno (`New` in basso a sinistra, `Send` in basso a destra) sono smussati, il resto ad angolo vivo, dove i pezzi si toccano — replica il fatto che nel CSS reale `.logwrapper`/`.disconnectbtnwrapper`/`.sendbtnwrapper` hanno ciascuno solo gli angoli propri arrotondati, non un radius uniforme su tutto. Pagina passata da un contenitore centrato con margini larghi a un layout flex a piena altezza/larghezza con margini minimi di `.5em` su tutti i lati (lo stesso valore usato ovunque nel CSS originale), il box riempie tutto lo spazio verticale disponibile tra header e barra di composizione invece di avere un'altezza fissa arbitraria. Bug trovato durante la verifica: `flex-direction:column` sul box aveva steso il bottone "New chat" a piena larghezza per via di `align-items:stretch` di default sui figli flex — corretto con `align-items:flex-start` sul box e `align-self:stretch` solo sull'area messaggi, che deve restare a piena larghezza.
  **Ottavo giro** (Rory: ancora troppo spazio ai lati, niente spacing tra gli elementi, header non incollato al bordo, ombre dentro il box che l'originale non ha, pagina che scorre, bottone "Torna al Mondo Bianco" da spostare nell'header, bottoni troppo piccoli, e la domanda "ti va se ricominciamo tutto da capo?" da togliere perché è cosa della pagina precedente): trovata la causa reale dello spazio ai lati/in alto/in basso — `.place-shell` (`world-shell.css`, markup generato da `AppShell`, irraggiungibile dal CSS della pagina per lo stesso motivo di incapsulamento già incontrato) ha un padding proprio molto generoso (fino a `3rem` ai lati, `7rem` in basso). Annullato con margini negativi calcolati sugli stessi valori (`calc(-1 * clamp(...))`) sul contenitore della pagina, che ora tocca davvero i bordi. Aggiunto un secondo `@Input` ad `AppShell`, `showBackLink` era già presente ma non bastava da solo: impostati sia `[showHeader]="false"` sia `[showBackLink]="false"`, e il ritorno al Mondo Bianco è ora un piccolo "←" dentro l'header stesso della pagina (routerLink, non più il pannello condiviso in fondo). Tolta la `box-shadow: inset` dal box: era presa per errore dal box statico della homepage di Omegle (`#intro`) invece che da quello della chat live (`.logwrapper`), che nel CSS originale non ha nessuna ombra. Pagina non più scorribile: `height:100vh` + `overflow:hidden` sul contenitore, solo l'area messaggi scorre internamente. Box e barra sotto separati da un piccolo distacco (`.5em`, la stessa unità usata ovunque nell'originale) invece di stare incollati. Bottoni ingranditi (padding e font-size aumentati). Rimossa la frase "ti va se ricominciamo tutto da capo?" dal box: apparteneva a un concetto di pagina precedente/interstitial, il box ora mostra solo "New chat" come l'originale.
  **Nono giro**: al posto della frase tolta, aggiunta una riga in stile Omegle vero ("Click the button below and talk to strangers!"), stesso stile grassetto/grigio della riga di sistema "You're now chatting...".
  **Decimo giro** (Rory: ancora troppo spazio ai lati — "non capisco che c'è di così complesso" —, niente spazio tra "You:"/"Stranger:" e il testo, niente spazio tra i bottoni della barra e il campo di scrittura): la vera causa dello spazio ai lati non era solo il padding di `.place-shell` (già annullato nel giro precedente) ma anche il suo **tetto massimo di larghezza** (76rem, centrato) — sui monitor larghi è quello a dominare, non compensabile con margini negativi legati al solo padding. Risolto con la tecnica "full-bleed" standard (`width:100vw` + margini calcolati su `50vw` invece che sul genitore), verificata esplicitamente anche a 1920px di viewport. Aggiunto `margin-right` dopo "You:"/"Stranger:" e un piccolo `gap` nella barra di composizione (i bottoni avevano i bordi adiacenti volutamente uniti, tolto il trucco "flush" lì dove non serviva).
  **Undicesimo giro** (Rory: il fondo del box doveva restare spigoloso — solo i 4 angoli esterni dell'intero blocco box+barra vanno smussati, non ogni pezzo per conto suo —, e l'header doveva essere leggermente più spesso): box passato a `border-radius: .5em .5em 0 0` (solo l'alto), il resto degli angoli smussati resta solo sui due angoli esterni bassi dei bottoni New/Send nella barra sotto. Padding e dimensioni di logo/tagline nell'header aumentati leggermente.
  **Dodicesimo giro**: tagline "Talk to strangers!" ingrandita rispetto al logo "omegle" e staccata con un margine, emoji 🔴 aggiunta sotto la freccia "←" per renderla più riconoscibile. Rory ha anche chiesto conferma esplicita che gli stili di questa pagina siano scorrelati dal resto del sito (essendo l'unica pagina pensata per sembrare "un altro sito"): verificato concretamente, non solo a parole — `stranger-chat.css` non compare nell'elenco degli stili globali di `angular.json` (è caricato solo via `styleUrls` del componente), non usa `::ng-deep` né `ViewEncapsulation.None` (incapsulamento Emulated di default, quindi le regole non escono mai dal componente), e nessuna classe `omegle-*` coincide con nomi già usati nei CSS condivisi (`styles/components/`, `styles.css`, `themes.css`).
  **Tredicesimo giro** (rifiniture): emoji sotto la freccia cambiata da 🔴 a ⭕️ su richiesta, poi scambiata di posizione (⭕️ grande sopra, freccia più piccola sotto) e spazio aumentato tra logo e tagline. Barra inferiore (New/testo/Send) resa più alta aumentando l'altezza minima del campo di testo (i bottoni si adattano da soli per via dello `stretch` di default del flex, non serviva toccare il loro padding verticale) e i due bottoni allargati in orizzontale. Bottone "New chat" dentro il box reso più basso e più largo. Tolto "Select Language" (widget Google Translate mai realmente integrato, solo decorativo) e i badge Facebook/Twitter spostati sopra "2+ online now" invece che sulla stessa riga, in una colonna a destra.

- [x] Routing: `/` (root) è ora l'hub del Mondo Bianco invece del Portone, che si è spostato su `/login` — richiesto da Rory dopo aver comprato il dominio `il-mondo-bianco.com`, così la home vera del sito coincide con la root del dominio invece di essere dietro un passaggio in più. `authGuard` reindirizza a `/login` (prima `/`), il logout riporta a `/login`, `adminGuard` e il post-login del Portone puntano a `/` (prima `/mondo-bianco`), tutti gli `homeHref`/link "torna al Mondo Bianco" sparsi nella shell aggiornati allo stesso modo. Aggiunto un redirect `mondo-bianco` → `''` per non rompere eventuali vecchi link/bookmark salvati. Verificato con Playwright: root da sloggato porta a `/login`, login porta a `/` con l'hub visibile, `/mondo-bianco` reindirizza a `/`, logout riporta a `/login`.

### Extra (fuori scaletta, chiesto il 14/08/2026)

- [x] #e4 — Gioco di carte collezionabili, rifinitura finale (Blocchi 1-4 del piano in
  `e4-carte-collezionabili.md` chiusi e verificati end-to-end, più un lungo giro di feedback
  visivo che ha riscritto l'effetto delle carte da zero più volte). Schema DB, bustine con
  accumulo/drop pesato, album, editor admin set/carte, scambi proponi/accetta/rifiuta con
  badge — vedi impostazione generale già descritta in precedenza. Qui la cronaca della
  rifinitura:

  **Effetto foil, due componenti distinti** (non uno unico parametrizzato: Rory ha
  chiesto esplicitamente due linguaggi visivi diversi per metalli e gemme, dopo aver
  bocciato più tentativi di farli con lo stesso meccanismo).
  - `MetallicFoil` (`shared/metallic-foil/`, riusabile fuori dal contesto carte) per oro e
    argento: superficie di metallo continua, bande di colore strette e contrastate che si
    spostano **tutte insieme** (non un riflesso indipendente sopra una texture ferma — la
    prima versione a due strati separati sembrava "una riga di luce che scivola su una foto
    ferma", bocciata). Palette derivabile da un solo colore hex (`metalPaletteFromColor`) oltre
    ai 4 preset pronti (gold/silver/bronze/copper). Aggiornamento della posizione SENZA
    transizione CSS durante il trascinamento attivo (un piccolo bug proprio: usare `transition`
    anche mentre il mouse si muove, con eventi più frequenti della durata della transizione,
    produceva un effetto "a scatti, sembra si aggiorni solo quando ti fermi").
  - Mosaico olografico "crushed ice" (dentro `CartaTilt` stesso, `holo-mosaic.ts`) per
    smeraldo/rubino/zaffiro/diamante: porting di un prototipo fornito da Rory con
    triangolazione Delaunay reale (libreria `delaunator`) su una griglia di punti disturbata,
    ogni triangolo con una "normale" ottica finta fissa — il colore di ogni frammento dipende
    dal prodotto scalare tra la sua normale e la direzione del mouse, quindi muovendo il
    cursore si accendono frammenti diversi invece che l'intera trama in blocco o un riflesso
    che insegue il cursore. Geometria calcolata una sola volta e condivisa (cache di modulo)
    tra tutte le carte della stessa sessione, per non ripetere una triangolazione di ~600
    poligoni per ogni carta della griglia.
  - Aggiunte le finiture **argento** (metallo) e **zaffiro** (gemma): richiesta la
    migrazione `0092_add_argento_zaffiro_finiture.sql` per allargare il CHECK su
    `carte_definizioni.finitura` — SQLite non permette di modificarlo con ALTER TABLE, e su D1
    né `PRAGMA foreign_keys=OFF` né `defer_foreign_keys=ON` hanno avuto effetto tra le
    istruzioni dello stesso file di migrazione (diverso dal comportamento di sqlite3 CLI puro),
    quindi la migrazione ricostruisce l'intera catena (`carte_possesso`/`carte_trade_items`
    dipendono da `carte_definizioni`) con backup/drop/ricrea espliciti invece di affidarsi ai
    pragma. Drop rate esteso a 7 livelli (piramide ripida, pesi di argento/zaffiro non
    concordati nel dettaglio con Rory, aggiustabili).

  **Bug reali trovati durante le verifiche** (non solo rifiniture estetiche):
  - `isFoil`/`palette` scritti come campi di classe invece che getter: i campi si valutano nel
    costruttore, PRIMA che Angular assegni il valore reale degli `@Input` — risultato, il
    mosaico non veniva mai costruito. Sempre usare getter per logica che dipende da `@Input`.
  - Con due `@for` che iterano sulle stesse carte in punti diversi del template (album "mio" e
    "dell'altro"), le istanze di `CartaTilt` del secondo blocco non ricevevano mai la chiamata
    a `ngAfterViewInit` (causa esatta lato Angular non individuata) — mosaico mai costruito per
    quelle carte. Sostituito con `ngAfterViewChecked` (gira ad ogni ciclo di change detection,
    non solo una volta) con guardia per costruire una sola volta.
  - Cambiando tab tra due finiture gemma sulla stessa carta (es. rubino → smeraldo), Angular
    riusa la stessa istanza e lo stesso `<svg>` per lo stesso design invece di ricrearli — la
    guardia "costruito sì/no" del fix precedente lasciava i colori della finitura vecchia sui
    poligoni già esistenti ("carta con un po' di rubino dentro l'album smeraldo"). Corretto
    distinguendo "SVG vuoto → costruisci" da "SVG pieno ma per un'altra finitura → ricolora
    senza ricreare la geometria" (i triangoli sono identici per ogni gemma, cambia solo la
    palette).
  - La query dell'album (`carte-collezione`) generava gli slot delle finiture con
    `SELECT ... UNION ALL` a più rami: con 7 finiture ha superato lo stesso limite di D1 già
    scoperto sulla migrazione dei placeholder ("too many terms in compound SELECT"). Sostituito
    con `VALUES`, che non ha quel limite.

  **Album ridisegnato**: le due viste (proprio album / album dell'altro) impilate invece che
  affiancate; carte "piene" senza box/cornice attorno (solo la carta con la sua ombra nativa +
  nome sotto, non più un riquadro); slot vuoti come sagome tratteggiate a forma di carta
  invece di riquadri pieni con un punto interrogativo; ogni set dentro una "pagina" con sfondo/
  bordo propri invece di una griglia nuda sul pannello di sfondo. Bug di CSS trovato: senza
  `align-items: start` sul contenitore della carta, il comportamento di default dei grid item
  (stretch) scalava la carta più piccola quando il nome andava a capo su due righe.

  **Apertura bustina ridisegnata**: da una griglia con le 5 carte già scoperte a una sequenza
  "una alla volta" — la prima carta appare grande, "Avanti" la gira e la manda in una riga
  sotto mostrando la prossima, "Apri tutte" salta direttamente alla fine. A bustina finita, se
  ce ne sono altre disponibili compare anche "Apri la prossima" oltre a "Chiudi" (ordine:
  Chiudi/Avanti prima, poi Apri tutte/Apri la prossima). Riservato lo spazio della carta e
  della riga fin da subito (altezza calcolata sulle proporzioni reali 3:4 della carta, non un
  quadrato arbitrario) per evitare salti di layout quando la carta o la riga compaiono/
  scompaiono.

  **Tab "Bustina" eliminata**: conteneva solo un contatore e un bottone, sproporzionata come
  tab a sé rispetto alle altre; il contenuto è ora in cima alla tab Album, dove le carte aperte
  finiscono comunque.

  Verificato ad ogni passaggio con Playwright su account di prova (poi ripuliti dal D1 locale
  condiviso): screenshot reali del foil metallico e a mosaico su più finiture, riproduzione
  diretta di ciascun bug prima del fix e riverifica dopo.

- [x] #16 — seconda avventura del Gioco di Ruolo, "La casa che trattiene il respiro": scritta
  e pubblicata (era rimasta solo la card "Coming soon", vedi voce più sotto nel Fatto storico).
  Avventura play-by-chat con incipit fisso pubblico (via editor GDR, blocchi CMS) e resto dello
  script tenuto privato come materiale da Master, non contenuto CMS. Pannello di gioco condiviso
  `GdrPanel` (bottom sheet a tab Personaggio/Regole/Appunti, docked come card su desktop e a
  tutta larghezza su mobile), riusabile da future avventure — non ricostruito da zero per questa.
  Scheda del personaggio resa condivisa tra i due account invece che privata per utente.
  Editor appunti diventato rich text leggero (grassetto/sottolineato/colore) con
  `GdrNotesEditor` condiviso, riusato anche da "I Tuoi Appunti" invece di duplicarlo. Bottone
  "Disattiva tutte le animazioni" aggiunto nella Stanza dei Bottoni nello stesso giro. **Bug
  corretto in un secondo commit**: l'editor admin dei blocchi (`GdrDocumentEditor`) esisteva già
  su "Il Prezzo della Verità" ma non era mai stato montato sulla pagina della seconda avventura
  — l'admin non poteva modificare l'incipit dal sito finché non aggiunto, stesso pattern
  (pannello a sé sotto la pagina) usato altrove.

- [x] #e5 — Chat asincrona nei Ponti: nuova pagina `/ponti-chat`, sostituisce il vecchio
  documento Google Docs linkato dalla card "Chat" (che comunque resta raggiungibile, come
  link secondario più piccolo nella stessa card, "nel dubbio" come richiesto). Messaggi
  testuali e allegati foto/video, tabella `ponti_chat_messages` (migrazione
  `0088_add_ponti_chat.sql`), `sender_identity` sempre derivato dalla sessione lato server
  come nel Barattolo dei Pensieri (mai dal client). Upload media su R2 con lo stesso schema
  stream-binario della Bacheca (niente multipart, per non bufferizzare video grossi in
  memoria nel Worker). I media hanno una scadenza di 30 giorni ("non possono rimanere lì per
  sempre"): prima vera cancellazione R2 del sito, con pulizia pigra ad ogni lettura della
  chat invece di un Cloudflare Cron Trigger dedicato (nessun precedente esisteva, il volume
  è basso). Eliminazione possibile solo dei propri messaggi (cancella anche il media da R2).
  **Corretti in corsa due bug**: le bolle non seguivano lo stile vetro (`--panel-color` +
  `backdrop-filter`) del resto del sito — usavano una variabile CSS inventata
  (`--accent-color-soft`) mai definita nel progetto, che cadeva sul fallback opaco pieno,
  risultando in un riquadro colorato a blocco invece che trasparente; e lo scroll automatico
  in fondo alla chat non funzionava su conversazioni lunghe (`queueMicrotask` leggeva
  `scrollHeight` prima che Angular avesse davvero aggiornato il DOM con i nuovi messaggi,
  sostituito con `afterNextRender`). **Bug preesistente trovato e corretto nello stesso
  giro** (non legato alla chat, notato durante la verifica del bootstrap dell'app): al
  refresh di qualunque pagina, `WorldSettingsService` partiva da un default con tutti gli
  effetti del mondo a `true` in attesa della risposta reale dal server, causando un flash
  "tutti gli effetti accesi" per un istante ad ogni caricamento. Corretto con una cache in
  `localStorage` (`noi-world-settings-cache-v1`, stesso schema già usato da `ThemeService`
  per il tema): il primo paint parte dall'ultimo stato reale noto invece che dal default,
  aggiornata ad ogni caricamento riuscito e ad ogni modifica salvata. Verificato con
  Playwright end-to-end su account di prova (poi ripuliti da D1/R2 locali): invio testo,
  upload foto, eliminazione messaggio proprio, scroll automatico su chat lunga (caricamento
  e dopo invio), stile vetro coerente col resto del sito.

- [x] #f2 — Animazione palloncini: salgono verso l'alto con lo stesso schema delle lanterne
  (`world-lanterns.ts`), ma disegnati in SVG invece che con un'unica emoji — 4 forme vere
  (tondo classico, cuore, cane, pinguino), non solo variazioni di proporzioni, colore casuale
  tra 6 tinte, filo ondulato invece di una linea dritta. Movimento sostituito dallo zig-zag a
  scatti delle lanterne con una vera curva sinusoidale (`@keyframes balloon-rise`, 17 fermate,
  due oscillazioni complete durante la salita), su richiesta di Rory dopo aver visto la prima
  versione. Nuovo componente `world-balloons.ts`, stesso interruttore condiviso
  (`world_settings`) degli altri effetti, gruppo "Festa" nella Stanza dei Bottoni (non legato a
  nessun tema, come lanterne e brillantini). **Bug trovato dopo che Rory ha segnalato "non si
  vedono"**: `.world-balloon` era rimasto con `opacity: 0` di base da una versione precedente,
  ma le nuove keyframe sinusoidali animano solo `transform`, mai `opacity` — restavano
  invisibili per l'intero volo. Tolto lo stato iniziale a 0 (non serve: i palloncini entrano ed
  escono già fuori schermo, sopra/sotto il bordo, quindi non c'è bisogno di dissolvenza per
  nascondere l'inizio/fine del ciclo).
  **Secondo giro di feedback** (filo staccato, movimento a scatti non sinusoidale, cane con
  faccia tagliata e coda staccata, cuore troppo allungato): (1) movimento a scatti — colpa di
  `ease-in-out` applicato sopra keyframe già curve a mano in forma sinusoidale: la doppia
  modulazione (curva del keyframe + accelerazione/decelerazione di `ease-in-out` a ogni
  fermata) spezzettava quella che doveva essere un'unica curva continua. Cambiato in `linear`,
  che interpola i punti già calcolati a velocità costante — la sinusoide ora è vera. (2) filo
  staccato — ogni forma (tondo/cuore/cane/pinguino) finiva a un'altezza diversa dentro lo stesso
  `viewBox`, quindi il filo (elemento separato, attaccato subito sotto) aveva uno spazio vuoto
  diverso per ognuna. Uniformato il punto più basso di tutte le forme a circa la stessa
  coordinata `y` nel `viewBox` (ora `0 0 28 32` per tutte, prima variava), più un piccolo
  margine negativo sul filo per sovrapporlo leggermente al corpo. (3) cane tagliato — la testa
  (cerchio) usciva dal bordo destro del `viewBox` originale (troppo stretto), letteralmente
  ritagliata dal rendering SVG; allargato il `viewBox`. Zampe e coda ridisegnate per sovrapporsi
  davvero al corpo invece di restare ellissi separate con uno spazio vuoto in mezzo (stesso
  principio del filo: serve sovrapposizione esplicita, non solo vicinanza). Orecchie rifatte più
  "floppy" (ruotate di lato) invece che dritte come un gatto. (4) cuore troppo allungato —
  ridisegnato con proporzioni più equilibrate (larghezza quasi uguale all'altezza, prima era
  molto più alto che largo). Verificato con screenshot reali isolati per ogni forma (Playwright,
  account di prova poi ripulito dal DB locale).
  **Terzo giro** (Rory: il cane ha ancora il filo staccato, il palloncino sparisce appena tocca
  il tetto della pagina): due bug distinti, non varianti dello stesso problema. (1) filo del
  cane ancora staccato — il vero difetto architetturale: corpo e filo erano due `<svg>`
  separati con viewBox e scale indipendenti (`world-balloon-body` e `world-balloon-string`), e
  ognuna delle 4 forme finiva a un'altezza leggermente diversa dentro il proprio viewBox — il
  margine "a occhio" (`margin-top: -0.35em`) tra i due elementi funzionava quasi per caso per
  le forme arrotondate ma non per il cane (zampe più basse e più larghe del resto). Risolto alla
  radice fondendo corpo e filo in un unico `<svg>` con lo stesso sistema di coordinate: ogni
  forma disegna il proprio filo a partire esattamente dal proprio punto più basso reale (stesse
  coordinate, nessun margine da indovinare), quindi l'attacco è sempre esatto per costruzione,
  non per approssimazione. (2) il palloncino "spariva" toccando il tetto — bug reale distinto:
  il palloncino parte già 14% più in basso del bordo inferiore (`bottom: -14%`), ma le keyframe
  della salita percorrevano solo 100vh in totale, quindi il ciclo si esauriva (e ripartiva di
  scatto dal basso) mentre il palloncino era ancora visibile a 14vh dal bordo superiore — non uscendo
  mai davvero dallo schermo prima di riapparire di colpo in basso. Percorso esteso a 120vh
  (114vh il minimo per compensare il -14% di partenza, con un margine di sicurezza), stesso
  principio già usato dalle lanterne (`world-lanterns.ts`, partono da -10% e salgono di 115vh)
  mai applicato per errore ai palloncini. Verificato con screenshot reali (Playwright, account
  di prova poi ripulito dal DB locale): filo attaccato per tutte e 4 le forme, cane compreso.
  **Quarto giro** (Rory: il filo del cane sembra ancora staccato, il movimento non sembra
  sinusoidale): campionata la trasformazione reale via Web Animations API
  (`animation.currentTime` impostato a mano, `getComputedStyle().transform` letto a ogni
  passo) invece di fidarsi dell'occhio — la curva è risultata matematicamente una sinusoide
  corretta, ma con un'ampiezza di soli 20-48px su un percorso verticale di oltre 1000px: troppo
  piccola per leggersi come un'onda, sembrava quasi una linea dritta. Ampiezza passata da px a
  `vw` (6-14vw invece di 20-48px), quasi triplicata in proporzione allo schermo — verificato di
  nuovo con lo stesso campionamento che l'oscillazione ora è ampia (~130px anche su una
  variazione minima). Per il cane: il filo unificato nello stesso `<svg>` (terzo giro) partiva
  comunque nel punto sbagliato, `x=14.5` — il centro geometrico della forma, ma anche lo spazio
  vuoto esattamente **tra** due zampe (a x=12 e x=17), quindi non toccava nessuna delle due.
  Spostato il punto di partenza del filo sulle coordinate esatte di una zampa reale (x=12,
  y=30.4, la stessa ellisse della zampa) invece che sul centro della figura — attacco garantito
  per costruzione, non per vicinanza. Verificato con screenshot reali.
  **Quinto giro** (Rory: la sinusoide "fa cagare"): tornato allo zig-zag a 4 tratti originale
  delle lanterne (0/25/50/75/100%, direzione alternata), tenendo solo `linear` al posto di
  `ease-in-out` — leggero e fluido come richiesto, senza il doppio-easing che lo rendeva a
  scatti nella primissima versione.
  **Aumento della frequenza dei lanci**: intervallo tra un fuoco e l'altro dimezzato (0.6-1.6s
  invece di 1.4-3.6s). Verificato di nuovo con lo stesso test Playwright sugli FPS: 60fps
  stabili anche con più fuochi contemporanei.
  **Quinta forma di esplosione — crepitante**: ogni stella (dorata o bianca) "scoppietta" una
  volta durante il volo con un piccolo pop di 4-7 scintille in ogni direzione, in un istante
  scelto a caso per stella (15-75% della sua vita) così il crepitio si sente diffuso nel tempo
  invece che tutto insieme — non un effetto a parte ma una variante di `createStar` che riusa
  l'array `glitters` già esistente per le scintille secondarie, zero duplicazione. Verificato
  con screenshot reali (Playwright, account di prova poi ripulito dal DB locale) e di nuovo con
  il test FPS: ancora 60fps stabili.
- [x] #f3 — Animazione fuochi d'artificio. Primo tentativo in puro CSS (span + keyframes, come
  tutti gli altri effetti del sito) bocciato da Rory dopo averlo visto: troppo povero rispetto
  a un vero motore fireworks su `<canvas>` che aveva trovato online e passato come riferimento
  (gravità, attrito nell'aria, scie che sfumano). Riscritto da zero come componente `<canvas>`
  (`world-fireworks.ts`), ispirato a quell'idea ma non copiato — niente audio, menu
  impostazioni, qualità regolabile o localStorage propri (avrebbero duplicato `world_settings`
  e la Stanza dei Bottoni): un razzo con scia sale verso un punto casuale, esplode in una tra
  tre forme (crisantemo pieno anche a due colori, ad anello, con pistillo centrale di un
  secondo colore), le scintille cadono per gravità simulata e rallentano per attrito prima di
  spegnersi. Lanci automatici ogni 1.4-3.6s, posizione/colori/forma casuali ogni volta. Il
  componente si avvia/ferma da sé in base a `worldSettingsService.settings().fireworks` (un
  `effect()` Angular, non un `@if` nel template) e rispetta `prefers-reduced-motion` disattivando
  il loop invece di nascondere solo via CSS.
  **Secondo giro** (Rory: "pochi giochi di luce" rispetto al riferimento): aggiunto bagliore via
  `shadowBlur`/`shadowColor`, scia di ogni stella ridisegnata su più punti anziché un solo
  segmento per fotogramma, nucleo più luminoso in testa, scintille "glitter" secondarie, lampo
  bianco radiale al momento del botto.
  **Terzo giro** (Rory: ora laggava): `shadowBlur` è un filtro ricalcolato per ogni forma
  disegnata a ogni fotogramma — con centinaia di stelle attive era quello a far scattare la
  pagina, non il canvas in sé. Il codice di riferimento di Rory infatti non lo usa mai: il suo
  bagliore viene dal blend mode `lighten` tra due canvas sovrapposti, non da un blur per
  singola forma. Tolto `shadowBlur` ovunque, sostituito con `globalCompositeOperation =
  'lighter'` (economico, stesso principio "tanti tratti chiari che si sommano") e un solo
  `stroke()` per stella per l'intera scia (prima erano 4 `beginPath`/`stroke` separati a
  fotogramma per stella). Ridotto anche il numero di stelle per esplosione (~46-66 invece di
  65-100) e la probabilità di scintille glitter (18% invece di 40%). Verificato con un test
  Playwright che misura gli FPS reali per 8s durante più esplosioni consecutive: 60fps stabili,
  zero fotogrammi lenti (prima del fix impossibile da misurare così, il lag era percepibile a
  occhio). Nuovo componente `world-balloons.ts` per #f2 sopra, stesso schema di interruttore
  condiviso, gruppo "Festa" nella Stanza dei Bottoni. Migrazione
  `0082_add_balloons_fireworks_world_settings.sql`.

- [x] #e13 — Editor GDR riprogettato in stile Homebrewery: sostituito l'editor "un blocco alla volta" (selettore del tipo + campo JSON grezzo, vedi CMS Fase 7 più sotto) con un unico campo di testo a sintassi leggera (markdown per titoli/paragrafi/liste/immagini/tabelle, blocchi delimitati `::: callout` / `::: npc` per i due tipi senza equivalente markdown) e un'anteprima live accanto, aggiornata mentre si scrive. Rory lo trovava troppo macchinoso rispetto a un editor libero tipo Google Docs; niente nuova libreria markdown (progetto non ne aveva già una): parser/serializzatore scritti a mano (`gdr-markdown.parser.ts`/`gdr-markdown.serializer.ts`), sintassi ristretta abbastanza da non giustificarne una. L'anteprima riusa `GdrBlocks` (lo stesso componente del rendering pubblico) invece di un renderer parallelo, quindi lo stile pubblico resta identico per costruzione — backend e tabella `gdr_blocks` invariati. Toolbar di bottoni (uno per tipo di blocco) che inserisce lo scheletro alla posizione del cursore, per non dover ricordare la sintassi a memoria. Salvataggio "cancella e ricrea" invece di un diff riga per riga: editing admin-only non concorrente su documenti di poche decine di blocchi, un diff testo→blocchi sarebbe stato sproporzionato. Errori di sintassi (tabella con colonne sbagliate, blocco mai chiuso, NPC con campo mancante) mostrati con numero di riga, Salva disabilitato finché non sono risolti. **Corretti in corsa due problemi di UX segnalati da Rory dopo il primo giro**: i due riquadri (testo/anteprima) sembravano scollegati per via di bordi/altezze diverse — ora condividono un unico bordo con divisore centrale e altezza fissa uguale; lo scroll dei due pannelli non era sincronizzato — ora scorrono insieme in proporzione (`syncScroll`, con guardia anti-loop). Verificato con Playwright su un account admin di prova (poi ripulito da D1): tutti e 7 i tipi di blocco renderizzati correttamente in anteprima, toolbar di inserimento, validazione di una tabella disallineata, split-view e scroll sincronizzato.

### Extra (fuori scaletta, chiesto il 13/08/2026)

- [x] #e10 — "Prova a Dire No": nuovo gioco nel Tavolo (`/tavolo-da-gioco/prova-a-dire-no`,
  card e voce nell'Atlante del Mappamondo incluse). Introduzione in pagina (CMS,
  `prova-a-dire-no.introduzione`) che spiega perché esiste: ai video di TikTok con questo
  format Rory ha visto lei mettere like/ricondividerli. 8 domande in sequenza, una a
  schermo alla volta con puntini di avanzamento.

  Prima versione con 3 comportamenti di fuga era "carina ma un po' meh" (feedback di Rory) —
  cercati esempi veri (CodePen "runaway button", trend TikTok) per capire cosa li rende
  divertenti sul serio: il bottone che scappa già mentre il cursore si avvicina, non solo al
  click. Versione finale, 4 comportamenti fissi per domanda (non casuali a ogni apertura):
  "si sposta" ora scappa in continuo mentre il mouse si avvicina entro un raggio (non solo al
  click/tap — da touch, senza hover, resta il dodge al tocco); "sparisce" e ricompare altrove
  dopo una breve pausa; "scambia posto" con "Sì" (ex "diventa Sì": cambiare etichetta nello
  stesso tocco confondeva — un test reale mostrava che non si capiva cosa fosse successo — ora
  i due bottoni si scambiano visibilmente posizione, con un piccolo rimbalzo); "cresce" fa
  crescere "Sì" e restringere "No" in tandem a ogni tentativo, finché il primo non copre tutto
  lo schermo (sfondo pieno e ben visibile, non la stessa pillola trasparente ingrandita —
  altrimenti a schermo intero il colore quasi trasparente pensato per una pillola piccola
  diventava invisibile).

  Le 2 domande "a scelta" (quando ci si vede la prossima volta / quando si fa il prossimo
  viaggio) inizialmente non avevano nessuna opzione negativa (osservazione di Rory) — aggiunta
  un'opzione "Mai" per ciascuna che scappa con lo stesso trucco del "No" a comportamento
  "si sposta", le altre restano scelte libere e valide (opzioni scherzose, non un vero
  selettore di data).

  La fuga funziona anche da mobile: si attiva su `pointerdown`, prima che il tocco si
  completi, non su `hover`. Logga in silenzio (stesso schema del resto del sito, solo ID
  domanda + numero di tentativi sbagliati, mai testo) — richiesta doppia allowlist lato
  server: sia `CLIENT_EVENT_TYPES` in `functions/api/telemetry/events.js` sia
  `ALLOWED_EVENTS` in `functions/api/_shared/events.js` (la seconda mancava, l'evento
  falliva silenziosamente finché non l'ho trovata testando con curl). Migrazioni
  `0076_add_prova_a_dire_no_atlas.sql` e `0077_seed_prova_a_dire_no_intro.sql`.

- [x] #f4 — "Prova a Dire No" doveva avere molta più varietà, mai un comportamento ripetuto
  (seguito di #e10). Create **35 proposte diverse** in
  `proposte_effetti_prova_a_dire_no.md`, poi un **playground** dedicato
  (`/tavolo-da-gioco/prova-a-dire-no/playground`, dietro `adminGuard`, non linkato in
  nessuna pagina pubblica) per provarle una a una prima di toccare il gioco vero. Rory ne ha
  scelte 9, rifinite lì con vari giri di correzioni (fisica della pioggia, bug di
  coordinate della calamita — poi eliminata —, animazione della bolla "scattosa", intercettore
  eliminato, crollo in pezzi eliminato) prima di portare le 6 superstiti nel gioco vero,
  insieme alle 4 già esistenti: **10 domande, 10 comportamenti diversi, mai ripetuti**
  ("si sposta", "sparisce", "si scambia con Sì", "cresce/si restringe", "Sì si moltiplica"
  sparso su tutta la finestra, "bolla di sapone" che scoppia per sempre, "pioggia di Sì" con
  gravità vera via `requestAnimationFrame`, "gioco delle tre carte" a due tocchi — la prima
  carta scoperta è la scelta finale, le altre due restano coperte —, "bottone permaloso" con
  18 frasi, "falso errore di sistema").

  Le vecchie 2 domande "a scelta" con opzioni scherzose sono state sostituite da un unico
  passaggio subito dopo "Vuoi fare un viaggio con me?": due `<input type="date">` veri e un
  bottone "Fatto 🙄", loggato in telemetria come le altre risposte (non salvato nel
  Calendario del sito, su richiesta esplicita).

  Bug strutturale trovato e corretto: il gioco delle tre carte usava un vero flip 3D con
  facce separate (`position: absolute`, dimensioni fisse) — visivamente diverso dagli altri
  bottoni della pagina. Semplificato per riusare gli stessi bottoni `.pand-no`/`.pand-yes` di
  sempre: il "giro" è solo il testo che cambia insieme al pulse già condiviso con l'effetto
  "si scambia con Sì", non un'animazione a parte. Anche l'effetto vetro (`--panel-color` +
  `backdrop-filter`, stesso stile di "Torna al Mondo Bianco") esteso a tutti i bottoni della
  pagina, e il titolo riportato al pattern hero condiviso (`--hero-size-md`,
  `styles/components/typography.css`) invece di dimensioni inventate a mano.

- [x] #25 — Mappa: Sicilia completata. I 4 paragrafi veri sono stati scritti (fiume
  Amenano/Catania, Gole dell'Alcantara, laghetti di Cavagrande/Avola, Isola Bella a Taormina),
  foto già a posto da prima.

- [x] #26 — Mappa: Roma completata. Paragrafo vero scritto, foto (Fontana di Trevi e
  Colosseo) con layout "stacked" forzato (vedi voce sotto sull'override manuale). Nota per la
  prossima volta: il modulo di modifica carica i dati al momento dell'apertura, non del
  salvataggio — se si lascia la pagina di modifica aperta a lungo mentre nel frattempo cambia
  qualcos'altro sulla stessa destinazione (es. le immagini), salvare il testo sovrascrive
  anche quello con la versione vecchia. Successo una volta con "stacked": true su Roma,
  risolto correggendo il DB a mano.

- [x] #e3 — "Emoji che cadono": 18 tipi (arcobaleno, unicorno, gelato, sole, luna, orsetto,
  cuore, caramella, stella, ciambella, lecca-lecca, fiocco, farfalla, biscotto, cioccolato,
  torta, patatine, pizza), emoji invece di SVG disegnati a mano (Rory ha cambiato idea in
  corsa — ok anche libreria open source/emoji). Stessa meccanica di caduta dei fiori
  (`world-petals.ts`) ma sottoinsieme scelto a piacere invece di forma singola/mix: checkbox
  indipendenti per ogni tipo nella card "Emoji che cadono" sotto "Consigliato per Love" nella
  Stanza dei Bottoni, più un bottone "Tutte"/"Nessuna". Valore salvato "all", "none" o lista
  separata da virgola; validazione lato server in `functions/api/world-settings.js` (nuova
  chiave `stickers`, allowlist dei kind invece di un Set di stringhe fisse). Migrazione
  `0073_add_stickers_world_setting.sql`. Trovato e sistemato anche un bug preesistente: nei
  temi White World e Love `--panel-color` era quasi opaco invece che vetro-trasparente come
  gli altri temi (`themes.css`), rendendo il pulsante "Torna al Mondo Bianco" (e tutte le
  altre card) diverso dal resto del sito.

- [x] #f1 — Mappamondo: done per adesso. Nessuna richiesta concreta ricevuta; il contenuto
  (scene, dialoghi) è comunque già modificabile dal sito dal 12/08/2026 (editor CMS dedicato).
  Da riaprire se emerge un'esigenza specifica.

- [x] #e13 — Luna/Sole in base al tema: sia la luna piccola nell'angolo del cielo (sfondo
  globale, `world-moon.ts`) sia quella grande della pagina "Il Cielo" mostrano il sole
  (disco pieno dorato, senza fasi) nei temi chiari (White World, Ocean, Love), la luna con
  le fasi negli altri. Aggiunto l'input `isSun` a `MoonDisc` (condiviso dai due punti, zero
  duplicazione) e `isLightTheme()` in `theme.service.ts` come unico elenco dei temi chiari.
  Sistemato anche il selettore nella Stanza dei Bottoni: il toggle "🌙 La luna" diventa
  "☀️ Il sole" nei temi chiari (stessa impostazione `moon`, solo etichetta/icona), e la fase
  scompare perché il sole non ne ha.

- [x] Atlante del Mappamondo: esteso per includere sia le destinazioni principali sia quelle secondarie annidate (es. le voci del Tavolo da Gioco: Cruciverba, Messaggio Criptato, Giochi di Ruolo, oltre a Suggerimenti, Linguaggio Segreto e Profilo). Creata la migrazione `0072_add_atlas_destinations.sql` per inserire i record in `mondo_bianco_cards` rendendo anche le destinazioni secondarie personalizzabili via CMS dal sito. Aggiunta la freccia indicatrice `→` e la regolazione del layout grid anche per le voci figlie.

- [x] Atlante del Mappamondo: rimossi i due stili alternativi "Costellazione" e "Scaffale"
  (e il selettore per passarci sopra), tenuto solo "Sommario". Rimosso il signal `atlasView`
  e ripulite le relative regole CSS non più usate in `mappamondo.css`. Verificato che la
  pagina non abbia bisogno di un evento di telemetria al click: l'apertura di ogni pagina
  (mappamondo compreso) è già tracciata automaticamente da `AppShell` al caricamento
  (`world_page_opened`), come per la home — non serve nulla di aggiuntivo legato al click.

### Extra (fuori scaletta, chiesti il 12/08/2026)

- [x] #e11 — il finale del Mappamondo è diventato un atlante del sito senza interrompere la
  storia: dopo l'ultima scena compare **“Ora, dove vuoi andare?”**, con il Mondo Bianco al
  centro e le destinazioni divise in quattro regioni (`Per ritrovare noi`, `Per immaginare il
  dopo`, `Per giocare`, `Per cambiare il mondo`). Ogni voce ha icona, nome, indicazione breve
  e link; “La casa che trattiene il respiro” mostra soltanto “Arriverà presto”. Home e atlante
  usano ora lo stesso registro `WORLD_PLACES`, quindi rotte, disponibilità e nuove pagine non
  vanno duplicate. Per le 14 destinazioni principali l'atlante riusa anche nomi e descrizioni
  già modificabili tramite il CMS delle card del Mondo Bianco. Su mobile il disegno orbitale
  diventa una sequenza lineare leggibile.

- [x] CMS Fase 7 — editor della Bacheca dei Ricordi, ultima e più grande collezione del piano
  (302 blocchi su 142 righe, 19 giorni, 5 periodi — un ordine di grandezza sopra tutto il
  resto fatto in questa sessione). Rory ha chiesto esplicitamente un'opzione ibrida ("opzione
  D") invece del CRUD granulare a 5 livelli usato per le altre collezioni: un giorno è un solo
  record con l'intero layout (righe→colonne→blocchi) come JSON, ma l'admin non vede mai quel
  JSON — solo un editor visuale con controlli semplici sui blocchi reali. Fatta in 5 fasi
  come richiesto:
  1. **Migrazione struttura**: `bacheca_periods` (lista piatta) + `bacheca_days` (annidati per
     periodo, `content` come blob JSON), migrazioni 0067/0068, dati importati da
     `bacheca-layout.json` con `external`→`link` rinominato e `devId` tolto (serviva solo per
     il vecchio riferimento incrociato nel JSON grezzo, superato ora che si modifica in loco).
     Verificato byte-per-byte: zero differenze su tutti i 302 blocchi.
  2. **Editor visuale** (`BachecaDayEditor`, componente dedicato): righe con 5 preset
     (larghezza intera / due colonne / tre colonne / foto+testo / testo+foto — gli ultimi due
     strutturalmente uguali a "due colonne", esistono solo per farli riconoscere subito nel
     picker), blocchi tipizzati (testo/foto/video/audio/link) con un vero modulo per tipo, non
     JSON. Riordino senza drag&drop come richiesto: frecce su/giù per le righe e i blocchi
     nella stessa colonna, comando "Sposta…" con destinazione "dopo la riga #" per i salti
     lunghi. Tutta la modifica avviene su una copia in memoria; "Salva" invia l'intero
     `content` del giorno in un colpo solo.
  3. **Pannello admin periodi/giorni** integrato direttamente nella pagina reale (non un
     pannello separato sotto): CRUD+riordino per i periodi, CRUD+riordino+comando "Sposta…"
     (periodo di destinazione + "dopo quale giorno") per i giorni — "Aggiungi giorno" crea un
     giorno vuoto con un blocco di testo segnaposto e mostra subito "Aggiungi blocco".
  4. **Upload media verso R2** (`/api/bacheca-media/upload`): l'admin non scrive mai una
     chiave a mano, viene generata dal server; per le foto la miniatura è generata **nel
     browser** (Canvas, ridimensionata a 480px) prima dell'upload — Cloudflare Workers non può
     eseguire una libreria di resize nativa come `sharp` (usata invece dallo script Node
     esistente per le foto già migrate), quindi il ridimensionamento lato server non era
     un'opzione. Validazione rigorosa di formato/dimensione per tipo (foto ≤15MB
     jpeg/png/webp, video ≤200MB mp4/webm/mov, audio ≤50MB). Il file originale non viene mai
     eliminato automaticamente alla rimozione di un blocco (solo il riferimento sparisce dal
     layout), come richiesto esplicitamente per non rischiare perdite.
  5. **Verifica finale e pulizia**: `bacheca-layout.json`, `bacheca.json` e la vecchia
     implementazione `pages/bacheca/bacheca.*` (mai instradata, tenuta in vita solo perché
     `BachecaPreview` ne ereditava lightbox/utility media) eliminati — la logica del lightbox
     è stata prima portata direttamente in `BachecaPreview`, così l'eredità da un componente
     morto non bloccasse la rimozione del JSON da cui quel componente dipendeva.

  **Bug trovato e corretto durante la verifica**: il validatore backend del contenuto di un
  giorno limitava le didascalie a 300 caratteri, ma nella Bacheca reale sono spesso paragrafi
  narrativi (la più lunga esistente è 736 caratteri) — il primo tentativo di salvare un giorno
  reale falliva sempre con 400, scoperto testando in browser (non dal solo build), isolato con
  un confronto diretto tra un payload rifiutato e il validatore eseguito fuori dal Worker.
  Portato il limite a 4000 caratteri. Rifatta la verifica byte-per-byte dopo il fix: tutti i
  19 giorni ora superano la validazione.

  Testato con Playwright end-to-end su un account admin di prova (poi ripulito dal DB, incluso
  il file di test caricato su R2): resa pubblica identica all'originale (237 foto, 25 video, 2
  audio, 38 testi), editor con creazione/modifica/eliminazione/spostamento di righe e blocchi,
  creazione/eliminazione di un periodo di prova, upload reale di una foto con generazione
  della miniatura (verificato che entrambi i file esistano davvero su R2 scaricandoli),
  lightbox (apertura/navigazione/chiusura) ancora funzionante dopo la rimozione del componente
  legacy da cui dipendeva. Verifica byte-per-byte finale ripetuta a fine sessione: zero
  differenze.

- [x] CMS Fase 7 — editor del GDR "Il Prezzo della Verità" (punto 6 dell'ordine di
  migrazione consigliato, il più corposo rimasto): il testo narrativo di `avventura.html`
  (41 blocchi: titoli, paragrafi, callout, immagini, la griglia dei 4 NPC) e le sezioni
  editoriali di `la-tua-maga.html` (Abilità speciali, tabella Effetti Selvaggi, Incantesimi —
  4 blocchi; la scheda utente Aspetto/Statistiche/Inventario resta dati dinamici come deciso
  nell'inventario) sono migrati in un'unica tabella D1 `gdr_blocks`
  (`document_key` + `position` scoped al documento, migrazioni 0065/0066). Estratti in modo
  programmatico con un parser HTML (BeautifulSoup) dal markup esistente, non ritrascritti a
  mano, per la stessa fedeltà byte-per-byte delle altre migrazioni di questa sessione — poi
  verificato con un confronto automatico che conferma zero differenze sui 45 blocchi totali.
  Un blocco è `{ type, data }` con 7 tipi possibili (`heading`, `paragraph`, `callout`,
  `image`, `npc_grid`, `list`, `table`): editor "senza fronzoli" con selettore del tipo e un
  campo JSON grezzo per `data` (stesso principio già usato per le immagini di Mappa), non un
  builder visuale per 7 forme di dati diverse. Endpoint `/api/gdr-blocks` con CRUD + `move.js`
  (su/giù dentro lo stesso documento); nessun comando "Sposta…" qui, a differenza del
  Linguaggio Segreto — i blocchi non si spostano tra Avventura e La Tua Maga, sono due pagine
  diverse. Costruiti due componenti condivisi riusati identici dalle due pagine (zero
  duplicazione): `GdrBlocks` (rendering pubblico, un `@switch` sui 7 tipi) e
  `GdrDocumentEditor` (pannello admin, parametrizzato solo da `documentKey`). Estratta anche
  la funzione di rendering dei link interni `[etichetta](/rotta)` da `EditorialText` in
  un'utility condivisa (`shared/inline-text.ts`), riusata ora anche dai paragrafi del GDR
  invece di duplicare la stessa regex. Le regole CSS specifiche (sezioni, figure, griglia NPC,
  callout, liste, tabella) spostate da `tavolo.css` (page-scoped, non avrebbe raggiunto un
  componente figlio per via dell'incapsulamento di Angular) al CSS proprio di `GdrBlocks`.
  Verificato con Playwright su un account admin di prova (poi ripulito dal DB): conteggi
  titoli/paragrafi/figure/NPC/callout corretti su Avventura, link interno verso "La Tua Maga"
  funzionante, tabella Effetti Selvaggi e liste Abilità/Incantesimi corrette su La Tua Maga,
  editor admin con creazione/spostamento/eliminazione di un blocco di prova verificati
  end-to-end. Trovato e corretto un piccolo problema di stile in corsa (le voci delle liste
  Abilità/Incantesimi apparivano senza il riquadro previsto in un primo screenshot — risolto,
  verificato di nuovo che il riquadro (bordo + sfondo) sia presente).

- [x] CMS — `cruciverba.titolo`/`cruciverba.sottotitolo` migrati a `content_entries`
  (migrazione 0064): erano rimasti come costanti nel codice quando `data.json` è stato
  eliminato. Ora `<h1 id="title">`/`<p id="subtitle">` in `cruciverba.html` usano
  `<app-editorial-text>` come ogni altro testo editoriale, con pulsante "Modifica" per
  l'admin. Rimossi di conseguenza i signal `title`/`subtitle` e le costanti hardcoded da
  `crossword.service.ts` (non più letti da nessuno). Verificato con Playwright: testo
  corretto, modifica e ripristino funzionanti. **Deciso anche** (chiarito da Rory):
  `portone.*` e `not-found.messaggio` restano nel codice — non sono testi personali ma testi
  del software (istruzioni di accesso), quindi non richiedono un percorso di lettura pubblico
  su `/api/content` né alcuna migrazione futura.

- [x] CMS Fase 7 — editor del Linguaggio Segreto (punto 6 dell'ordine di migrazione
  consigliato in `documentazione/cms/inventario-contenuti.md`): le 6 categorie, i 25 simboli annidati e i 12
  esempi sono migrati da `linguaggio-segreto.ts` (array TypeScript inline) a tre tabelle D1
  dedicate — `linguaggio_segreto_categories`, `linguaggio_segreto_symbols` (con `category_id`,
  annidati sotto una categoria) e `linguaggio_segreto_examples` (lista piatta indipendente),
  migrazioni 0062/0063. Tre collezioni di endpoint CRUD+move
  (`/api/linguaggio-segreto-categories`, `-symbols`, `-examples`), stesso schema di
  Mappa/Cruciverba. Per i simboli, oltre al su/giù tra vicini nella stessa categoria
  (`move.js`), aggiunto anche il comando "Sposta…" richiesto esplicitamente
  dall'inventario (decisione #4): sceglie categoria di destinazione ed elemento dopo cui
  inserire (o "in cima" alla categoria) in una sola operazione, senza dover premere giù N
  volte per spostamenti lontani — mai esistito prima nel codebase, progettato da zero
  (`move-to.js`, ricalcola le posizioni chiudendo il vuoto nella categoria di origine e
  aprendone uno in quella di destinazione). Verificato byte-per-byte con un confronto
  automatico contro l'array TypeScript originale (categorie, icone, note, ogni simbolo con
  significato/spiegazione, ogni esempio): nessuna differenza. Testato con Playwright su un
  account admin di prova (poi ripulito dal DB): le 6 schede pubbliche mostrano i conteggi
  corretti (9+2+4+4+4+2 simboli, 12 esempi), creazione/spostamento cross-categoria/
  eliminazione di un simbolo di prova verificati end-to-end (Urgenza 2→3→2, Soggetti 2→3→2,
  ordine di inserimento rispettato), screenshot dell'editor admin confrontato con lo stile del
  resto del sito. Notato e lasciato invariato (coerente con tutte le altre collezioni
  esistenti): un `DELETE` non rinumera le posizioni rimaste, lascia un "buco" nella sequenza —
  l'ordinamento resta comunque corretto perché si legge sempre `ORDER BY position`, solo i
  valori non restano contigui.

- [x] CMS — chiusura dei testi semplici rimasti "Da migrare" (punto 1 dell'ordine di
  migrazione consigliato in `documentazione/cms/inventario-contenuti.md`, mai completato del tutto).
  Scoperto per prima cosa che l'inventario era rimasto fermo al 09/08: quasi tutti i content
  key elencati come "Da migrare" erano in realtà già migrati nelle sessioni precedenti
  (migrazioni 0038/0039/0046) senza che il documento venisse aggiornato — verificato ogni riga
  sul codice reale invece di fidarsi del documento, e corretto lo stato di tutte. I pochi
  davvero ancora da fare: `mondo-bianco.canzone.citazione`, `storie.suggerimento.eyebrow`,
  `storie.suggerimento.titolo`, `bacheca.introduzione`, `linguaggio-segreto.messaggio-codice`,
  `profilo.introduzione` (migrazione 0061). Tre restano volutamente **bloccati**: `portone.*`
  e `not-found.messaggio` perché sono pagine raggiungibili prima del login e `/api/content`
  richiede sempre una sessione autenticata (servirebbe un percorso di lettura pubblico, una
  decisione non presa qui); `messaggio-criptato.istruzioni` perché il testo contiene un link a
  un sito esterno e la sintassi link di `EditorialText` supporta solo rotte interne — coerente
  con la decisione già presa che il Messaggio Criptato non ha un editor CMS dedicato.
  `ponti.solo.introduzione` non era applicabile: la card non ha oggi un corpo separato.
  Aggiunto anche un supporto minimo mai esistito prima in `EditorialText`: gli a-capo singoli
  dentro un paragrafo diventano `<br>` (necessario per i 4 versi della canzone, che devono
  restare un unico blocco compatto e non diventare paragrafi separati con la spaziatura
  normale). Durante la migrazione di Storie trovato un bug non ovvio: i contenitori grid/flex
  non "collassano" il margine di default dei `<p>` dei loro figli come farebbe il normale
  flusso a blocchi, quindi il riquadro del suggerimento cresceva ben oltre l'altezza prevista
  (112px attesi, 211px ottenuti) — risolto alla radice nel componente condiviso
  (`:host p { margin: 0 } :host p + p { margin-top: 1em }`), non con un CSS specifico per quella
  sola pagina, così qualunque altro contesto grid/flex futuro non ripete lo stesso bug.
  Verificato con Playwright su un account di prova (poi ripulito dal DB) ogni pagina toccata:
  testo letterale e HTML renderizzato confrontati con l'originale, dimensioni del riquadro di
  Storie prima/dopo il fix, screenshot di Mondo Bianco/Storie/Linguaggio Segreto/Profilo/Bacheca.

- [x] CMS Fase 7 — editor del Cruciverba: le 100 definizioni (soluzione, definizione,
  coordinate riga/colonna, direzione) sono migrate da `data.json` alla tabella dedicata
  `crossword_words` (migrazioni 0059/0060), stesso pattern posizione esplicita + riordino
  su/giù di Mappa/Storie/Ricettario/Cuffiette (`/api/crossword-words`, CRUD + `move.js`).
  L'id resta un intero progressivo (non uno slug testuale come le altre collezioni): non è
  mai stato un identificativo leggibile, solo il numero mostrato in griglia. Verificato
  byte-per-byte che le 100 righe importate corrispondano esattamente all'originale (id,
  soluzione, definizione, riga, colonna, direzione, posizione). Aggiunto un editor
  amministrativo dedicato nella pagina del gioco stesso (pannello richiudibile "Modifica
  definizioni", sotto la griglia, non mescolato al gioco) con lo stesso schema
  aggiungi/modifica/elimina/sposta delle altre collezioni. Aggiornati anche i due punti del
  backend che leggevano `data.json` server-side per validare le risposte
  (`functions/api/crossword/_shared.js`, `functions/api/telemetry/word-attempts.js`): ora
  interrogano `crossword_words` ordinata per `position`, mantenendo lo stesso indice 1-based
  che il client assegna per ordine (non l'id stabile della riga), coerente con come
  `data.json` era sempre stato un array ordinato a mano. Titolo e sottotitolo del gioco
  (`cruciverba.titolo`/`cruciverba.sottotitolo`, content key distinti non ancora migrati)
  spostati come costanti in `crossword.service.ts`, non più letti da `data.json`. Testato con
  Playwright end-to-end su un account admin di prova (poi ripulito dal DB): caricamento della
  griglia da 100 parole, inserimento di una risposta corretta con "Controlla" (completamento
  registrato), editor admin con creazione/modifica/eliminazione/riordino di una definizione di
  prova, e le due chiamate server-side (`PUT /api/crossword/answers/:wordId`,
  `POST /api/telemetry/word-attempts`) verificate via curl dopo la rimozione di `data.json`
  dal disco. `web/public/data.json` eliminato: non c'è più nessun consumatore, né client né
  server.
- [x] #c1 — verifica generale della telemetria completata. Le aperture di tutte le pagine e
  le principali scritture erano già registrate; aggiunti gli eventi mancanti per cambio di
  tema/impostazioni del mondo, cambio nickname, lettura di una nuova lettera, proposta di una
  Storia e richiesta di un suggerimento nel cruciverba. Gli autosalvataggi degli appunti GDR
  restano volutamente esclusi per non creare un evento a ogni pausa di scrittura.
- [x] #16 — seconda avventura GDR: “La casa che trattiene il respiro” è visibile soltanto
  come card “Coming soon”, senza esporre testo o sistemi incompleti.
- [x] #33 — “Cose da fare insieme” è diventata **L'Agenda delle Idee**: tutte le attività
  sono mantenute nell'ordine originale con periodo approssimativo, categorie filtrabili e
  stati condivisi “Da fare / Fatto / Da rifare”. Comprende la vecchia #23 nella categoria
  Giochi e permette di proporre nuove idee attraverso i Suggerimenti. Le righe NSFW arrivano
  dal server solo dopo lo sblocco temporaneo; il tentativo e la risposta vengono registrati
  negli eventi come dichiarato nella modale.
- [x] Uniformata la pagina **La Stanza dei Bottoni** (prima “Impostazioni del Mondo”): testi
  meno ripetitivi, nome ed emoji aggiornati. Corretto il componente `app-select` condiviso:
  menu opaco e leggibile e card portata davanti alle sorelle durante l'apertura. Uniformate
  anche la freccia di ritorno delle pagine interne, il pulsante in fondo e la barra profilo
  alle superfici e ai colori del tema.
- [x] #e2 - Tema **Love**: palette chiara fragola e panna, pannelli rosati traslucidi,
  contrasto scuro e cielo con luce crema. Ha una propria anteprima e icona a cuore nel
  selettore; il preset usa i petali già esistenti.
- [x] #e7 - Animazione bolle di sapone per Ocean: salgono vagando leggermente e si dissolvono con un piccolo scoppio. Effetto indipendente e disattivabile dalla Stanza dei bottoni.
- [x] #e8 - Animazione cuori per Love: dimensioni diverse, caduta leggera e dissolvenza. Effetto indipendente e disattivabile dalla Stanza dei bottoni.
- [x] #e9 - Tema **White World**: bianco perla e avorio freddo, con riflessi larghi che
  ricordano il raso senza usare texture decorative. Pannelli bianchi leggibili, ombre calde
  leggere, testo antracite e icona a perla. È distinto dall'id storico `the-white-world`, che
  continua a rappresentare Night Sky per compatibilità.
  L'effetto **Seta** è indipendente, trasparente e senza varianti: modifica soltanto luci e
  ombre, conservando la palette del tema. L'**Aurora** è un effetto distinto, con raggi
  nordici nei colori verde/azzurro/magenta/misti ed è consigliata per Night Sky.
- [x] #e13 - Animazione **Stelle cadenti** per Night Sky: scie rare con posizione, lunghezza,
  luminosità e tempi differenti. Effetto indipendente e disattivabile dalla Stanza dei
  bottoni; fa parte del preset Night Sky e rispetta `prefers-reduced-motion`.

### Extra (fuori scaletta, chiesto l'11/08/2026)

- [x] #b2 — Restyle del selettore temi: spostato come prima sezione di Impostazioni del
  Mondo e trasformato in una griglia responsive di card con vere anteprime del cielo, nome,
  breve descrizione e stato attivo. “Notte” rinominato “Night Sky”. Ripreso il linguaggio
  visivo delle icone legacy senza emoji: luna e stelle per Night Sky, onda per Ocean, drappo
  per Velvet e le lettere storiche D/R per Red of You e Green of Me. Gli stili ora vivono nel
  componente `theme-switcher`, non nel CSS scoped della pagina padre.

- [x] #35 — Cruciverba: aggiunto il bottone “Suggerimento”. Non rivela lettere o soluzioni:
  propone casualmente uno dei piccoli pegni affettuosi definiti in
  `web/public/content/crossword-hints.json` da fare in chat e invita poi a
  chiedere il suggerimento direttamente a Rory. La stessa richiesta non viene proposta due
  volte di seguito.

### Extra (fuori scaletta, chiesti il 10/08/2026 — secondo giro)

- [x] #27 — rendere più personali le scritte ancora generiche: riletto tutto il testo del
  sito (ogni pagina, i JSON di contenuto) — era già quasi ovunque scritto in prima persona
  rivolto a lei, con ricordi specifici. Solo due testi risultavano davvero "scritti da
  Claude" (Linguaggio Segreto, già segnalati nel codice); sostituiti col testo vero (vedi
  #38-#41). Il resto (comprese le regole del GDR e le istruzioni di Messaggio Criptato,
  valutate e lasciate intenzionalmente così) non richiedeva modifiche.
- [x] #37 — "Leggi questo ricordo" nella card di anteprima della Mappa è diventato "Vai alla
  meta".
- [x] #38 — Linguaggio Segreto: aggiunta l'interazione dei cinque cuori nella tabella stessa
  (`.....` → "Ti amo", con la spiegazione dei cinque cuori) invece di tenerla come sezione a
  sé separata in alto (rimossa, era ridondante). Il significato di `0` è ora "Sono sul
  documento / Ti ho scritto".
- [x] #39 — Colonna del simbolo nella tabella troppo stretta (8rem): con simboli come
  ">>> oppure <<<" il testo sforava e restava appiccicato al significato. Allargata a 11rem
  con più padding.
- [x] #40 — Aggiunta una spiegazione per (quasi) ogni simbolo della tabella, sotto il
  significato in corsivo più piccolo — testo preso quasi parola per parola da quello scritto
  da Rory. Lasciato senza spiegazione solo `0`, di cui lui stesso non ricorda l'origine.
- [x] #41 — Aggiunta una sezione "Frasi vere, di quando lo abbiamo inventato" con le 12 frasi
  reali (combinazioni di simboli) dal messaggio del 08/04/2026 sull'app ntfy — anche il testo
  della nota "perché esiste questo linguaggio" in cima alla pagina è stato sostituito con
  quello vero di Rory (non più l'abbozzo di Claude), stesso per la spiegazione generale dei
  puntini incrementali.
- [x] #36 — Card di anteprima della Mappa (quella con foto + titolo + estratto + link) tagliava
  il fondo — verificato con misure reali (Playwright) che a schermi non larghissimi il
  contenuto (immagine + testo) superava l'altezza reale del riquadro anche di 100+ px, e
  `overflow: hidden` nascondeva in silenzio il link "Vai alla meta" senza che si notasse.
  Passata da grid a flex: l'immagine si restringe fino a un minimo, il testo si prende lo
  spazio restante e — solo nei casi estremi — scorre al suo interno invece di sparire.
  Verificato che il link resti sempre raggiungibile su più larghezze (1440/1100/950/900px).

### Extra (fuori scaletta, chiesti il 10/08/2026 — terzo giro)

- [x] #20 — player audio proprio: completato (SoundCloud/YouTube già sostituiti ovunque nel
  sito in una sessione precedente). Redesign ulteriore del player condiviso
  (`web/src/app/shared/audio-player/`): nuovo layout "card" verticale con copertina grande
  (usato in apertura del Mondo Bianco) accanto alla pillola "line" di prima (liste come le
  Cuffiette); waveform reale via Web Audio API, generata solo al primo play effettivo per non
  aprire `AudioContext` inutili sulle pagine con più tracce; stato di caricamento che ignora un
  secondo click mentre il buffering è in corso (prima sembrava "non partire"); fix al
  trascinamento della barra di ricerca (il rilascio del puntatore si intercetta su tutta la
  finestra, non solo sull'input, che è troppo stretto per non uscirne durante un drag reale).
  Copertina di default condivisa (`audio-default-cover.webp`) per le tracce senza immagine
  propria. Non verificato visivamente in questa sessione (nessun tool browser disponibile):
  compilazione TypeScript pulita, asset e copertina confermati serviti via `curl`, resta da
  dare un'occhiata a occhio su `localhost:4201`.
- Miniature per la Bacheca dei Ricordi: generate (480px, script già esistente
  `scripts/build-bacheca-thumbnails.mjs`) e caricate su R2 per tutte le 130 foto, con
  `thumbKey` aggiunto a ognuna in `bacheca.json` (il supporto in `bacheca.ts`/`.html` era già
  presente da una sessione precedente, mancava solo l'esecuzione dello script). Verificato che
  un oggetto thumb esista davvero su R2 scaricandolo con `wrangler r2 object get`.
- [x] #a1 — colore del tema Notte (the-white-world) scurito di circa il 13% (`#17243a` →
  `#141f32`), leggermente più notturno senza perdere leggibilità — aggiornato in tre punti che
  devono restare identici (`:root`, l'override del tema in `themes.css`, il cielo in
  `world-atmosphere.css`, e lo swatch del selettore in `theme.service.ts`), altrimenti torna il
  lampo di colore sbagliato al primo paint (bug #12).
- [x] #a2 — le 150 stelle ora si affievoliscono e riaccendono (mai fino a sparire) invece di
  restare fisse — durata e ritardo dell'animazione randomizzati per stella in
  `world-stars.ts`, altrimenti pulserebbero tutte in sincrono (effetto palesemente finto).
  Rispettato `prefers-reduced-motion`. Solo il colore delle stelle cambia per tema come prima
  (es. Ocean, l'unico cielo diurno); opacità e animazione restano uguali ovunque.
  **Seguito (segnalato subito dopo la prima versione)**: il ciclo era troppo lento (3-7s) e il
  calo troppo lieve (fino al 55% dell'opacità base), praticamente impercettibile. Accorciato a
  ~0.9-1.9s e approfondito fino al 15%. Aggiunta anche una seconda animazione sull'alone
  (box-shadow) delle sole stelle "luminose", che ora cresce e si restringe in sincrono con il
  brillio invece di restare una macchia fissa — corretto di conseguenza anche
  `prefers-reduced-motion`, che senza un selettore esplicito su `.is-bright` non disattivava
  questa nuova animazione (specificità più alta della sola regola `.world-star`).
  **Altri due giri di feedback dopo aver visto il risultato a schermo**: troppo veloce →
  rallentato (durata raddoppiata 0.9-1.9s → 1.8-3.8s) e alone un po' più grande al picco
  (11px/3px → 14px/3.6px); ancora troppo veloce → durata raddoppiata di nuovo, 3.6-7.6s
  (ritardo scalato di conseguenza a 0-10s in entrambi i giri, per restare proporzionato al
  ciclo più lungo). Questa volta verificato a schermo da Rory, non solo dal CSS compilato.
- [x] #a3 — lanterne che salgono. Prima versione: solo nel tema Notte, 8 lanterne poche e
  distanziate nel tempo. Componente nuovo (`world-lanterns`), estratto anche il generatore di
  numeri casuali (prima duplicato identico in `world-stars.ts`) in un helper condiviso
  `shared/random.ts`.
  **Seguito, dopo aver visto una foto di riferimento (festa delle lanterne in Thailandia,
  cielo denso di lanterne calde)**: 8 erano troppo poche e troppo deboli. Salite a 36, più
  grandi (1.6-3.4rem), bagliore a tre strati (drop-shadow stretto+intenso, medio, largo e
  diffuso — uno solo sembrava finto). Rivista anche la scelta "solo tema Notte": Rory ha fatto
  notare che non ha senso legarle a un tema specifico, meglio un interruttore a sé. Vedi #a5
  qui sotto per l'infrastruttura condivisa che ne è nata. Non verificato a schermo in un
  browser reale in questa sessione: confermato via build di produzione (chunk/CSS compilati)
  e un test end-to-end con due account di prova sull'endpoint delle impostazioni.
- [x] #a5 — sfondi animati per gli altri temi, in parte: durante #a2 era emerso per caso che il
  brillio/alone delle stelle non è mai stato scoped al tema Notte — gira già su tutti e 5 i
  temi. Discutendo di #a3 (le lanterne "non possono stare sempre nel tema Notte"), invece di
  creare temi dedicati o proliferare varianti per tema, è nata un'idea più grande di Rory:
  una "stanza" del mondo dove attivare/disattivare gli effetti, **condivisa tra i due
  account** (non una preferenza per dispositivo come il tema) — chi accende/spegne qualcosa lo
  vede cambiare anche l'altro. Costruita l'infrastruttura: tabella `world_settings`
  (chiave/valore + chi l'ha toccata per ultimo), endpoint `/api/world-settings` (GET/POST
  autenticati, allowlist esplicita delle chiavi note), `WorldSettingsService` letto al
  bootstrap dell'app, nuova pagina `/impostazioni-mondo` con un toggle vero (checkbox nascosta
  + switch in CSS, accessibile da tastiera), raggiungibile come scorciatoia extra dal Mondo
  Bianco. Per ora l'unico interruttore è "lanterne" (non più legate a nessun tema); aggiungerne
  altri in futuro (es. per gli altri temi) è solo una riga in più nell'allowlist e nella
  pagina, non una nuova migrazione. **Non ancora fatto**: nessun effetto dedicato per i 4 temi
  diversi da Notte, solo l'infrastruttura per poterli aggiungere e renderli togglabili.
  Verificato end-to-end con due account di prova (poi ripuliti dal DB, sessioni/eventi
  compresi): il valore è davvero condiviso tra account diversi, non solo persistito per uno.
  **Migrazione applicata solo in locale** (`--local`): quella sul D1 di produzione
  (`--remote`) resta da fare a mano, non l'ha applicata Claude.
- [x] #a7 — secondo interruttore nella stanza appena costruita per #a5: le stelle nel cielo,
  prima sempre attive su ogni tema, ora spegnibili — stessa infrastruttura di #a5
  (`world_settings`, allowlist, `WorldSettingsService`), solo una nuova migrazione di seed
  (0023) e una riga in più nella pagina. Toggle della pagina reso generico
  (`toggleSetting(key, event)`) invece di duplicare il metodo che c'era solo per le lanterne.
  Verificato end-to-end con un account di prova (poi ripulito): default `true`, spegni/riaccendi,
  letto correttamente insieme a "lanterns" nella stessa risposta. Anche questa migrazione è
  applicata solo in locale, non sul D1 di produzione.
- [x] #a6 — terzo interruttore nella stanza: la luna, con la fase reale di oggi. A differenza
  di #a4 (la pagina "il cielo" pensata a parte, con un'API esterna vera) qui la fase è
  **calcolata**, non presa da un servizio esterno — un elemento di sfondo sempre presente su
  ogni pagina non deve dipendere dalla rete. Formula astronomica standard (riferimento noto di
  luna nuova + durata del mese sinodico, `shared/moon-phase.ts`), mappata su una delle 8 emoji
  di fase (🌑→🌘). Un solo elemento fisso in un angolo del cielo (non 150 come le stelle, non
  50 come le lanterne — la luna è una sola), bagliore freddo/argenteo per distinguerla dal
  caldo delle lanterne. Stessa infrastruttura di #a5/#a7 (migrazione 0024, allowlist, terzo
  toggle nella pagina). Verificato end-to-end con un account di prova (poi ripulito). Anche
  questa migrazione resta da applicare sul D1 di produzione.
  **Seguito, chiesto subito dopo**: Rory ha notato due macchie di luce statiche già presenti
  nel cielo di "the-white-world" (radial-gradient nella regola base di
  `world-atmosphere.css`) e ha chiesto di toglierle, visto che ora è la luna vera a fare da
  fonte di luce — poi ha esteso la richiesta a **tutti** i radial-gradient decorativi degli
  altri temi (Ocean compreso), non solo quelli del tema Notte: con luna/stelle/lanterne ora
  elementi veri e personalizzabili, un bagliore statico e non spegnibile restava "rumore"
  fuori dal loro controllo. Tolti da tutti e 5 i temi (rimane solo il gradiente lineare del
  cielo per ciascuno); rimossa anche `--world-glow`, la custom property diventata inutilizzata.
  **Secondo seguito**: la luna-emoji era "brutta e piccola", e mancava il selettore di fase
  scelta a mano che Rory aveva effettivamente chiesto fin dall'inizio (perso nel primo giro).
  Chiesto a Rory come vuole la resa prima di rifarla (sfera CSS con ombra reale vs. emoji
  grande) invece di indovinare senza poterla vedere — scelta la sfera. Ridisegnata come tre
  livelli CSS: un disco con sfumatura (per dare volume), una metà sempre scura (sinistra se
  crescente, destra se calante) e un'ellisse che si somma o sottrae a quella metà in base alla
  fase — geometria del terminatore lunare verificata numericamente (area scura attesa vs.
  ottenuta ai 4 punti cardinali e alle fasi intermedie) prima di scriverla, non "a occhio".
  Molto più grande (`clamp(4.5rem, 9vw, 8rem)` invece di un'emoji a 2.6rem). Aggiunto anche il
  selettore di fase mancante: `world_settings` ha ora una colonna `value` generica (migrazione
  0025, non solo per la luna: pensata per impostazioni future non booleane), popolata da un
  `<select>` nella pagina Impostazioni con "fase reale di oggi" più le 8 fasi scelte a mano —
  la stessa lista (`MOON_PHASE_LABEL`) è pensata per essere riusata da #a4 in futuro. Verificato
  end-to-end con un account di prova (poi ripulito): value preservato quando si cambia solo
  enabled, rifiuto di valori sconosciuti (400). Anche questa migrazione resta da applicare sul
  D1 di produzione.
  **Terzo seguito**: bagliore reso leggermente più luminoso (opacità e raggio dei due strati
  di drop-shadow alzati un po').
- [x] #a8 — tema condiviso tra i due account, non più una preferenza per dispositivo: quarto
  "interruttore" nella stanza (anche se qui `enabled` non ha senso ed è sempre `true`, conta
  solo `value` — stesso schema generico già usato per la fase della luna). Selettore spostato
  dalla barra utente (dove viveva in ogni pagina) alla pagina Impostazioni del Mondo, come
  card più grandi con il nome sempre visibile invece che a comparsa su hover — stesso
  componente `ThemeSwitcher` di prima, solo con un CSS diverso per il nuovo contesto (zero
  duplicazione, non un secondo componente). Le vecchie regole CSS compatte per la barra utente
  sono state rimosse (morte, nessuno le usa più). `ThemeService.applyTheme` distingue ora due
  tipi di persistenza (`persistLocal`/`persistRemote`): la scelta dell'utente aggiorna
  entrambe, la sincronizzazione dal server all'avvio (`applySharedTheme`, chiamata dopo
  `WorldSettingsService.load()`) aggiorna solo la cache locale senza rimandarla al server da
  cui è appena arrivata. `localStorage` resta com'era pensato: solo la cache che lo script
  inline in `index.html` legge prima del primo paint, non più la fonte di verità — quindi il
  fix del bug #12 (lampo di colore sbagliato) resta intatto. Nessun polling/WebSocket, come
  specificato: l'altro account vede il cambio al prossimo caricamento/navigazione. Verificato
  end-to-end con un account di prova (poi ripulito) e con una build di produzione pulita.
  Anche questa migrazione (0026) resta da applicare sul D1 di produzione.
- [x] #a4 — pagina minimale "Il Cielo" (`/il-cielo`): solo la luna, grande e centrata, con la
  stessa fase condivisa scelta in Impostazioni del Mondo (auto o manuale — stessa regola,
  `resolveMoonPhaseFraction`, non due implementazioni). Stelle e lanterne di sfondo non
  richiedevano nulla di nuovo: sono già globali (`app.html`), presenti su ogni pagina compresa
  questa. Nessuna API esterna, come specificato — riusa il calcolo locale già esistente.
  Lavoro principale: estratta la sfera della luna (disco + ombra a falce/gibbosa) dal
  componente di sfondo `world-moon.ts` in un componente a sé, `MoonDisc`
  (`shared/moon-disc.ts` + `styles/components/moon-disc.css`), senza posizionamento né
  dimensione propri — riempie sempre il contenitore di chi la usa. `world-moon.ts` (piccola,
  fissa in un angolo, su ogni pagina) e la nuova pagina (grande, centrata) sono ora due
  contesti diversi che riusano lo stesso identico componente invece di duplicare la geometria
  del terminatore lunare una seconda volta. Aggiunta anche una scorciatoia extra dal Mondo
  Bianco (🌌), come le altre non ufficiali.
  **Seguito, dopo feedback di Rory sulla prima versione**: la pagina rispettava ancora la fase
  scelta a mano — corretto, qui la fase è sempre quella reale di oggi, la personalizzazione è
  un'altra pagina (Impostazioni del Mondo). Layout rifatto da zero, "molto più minimale":
  niente hero, niente link, niente etichetta di fase — solo un piccolo titolo e la luna. Trovati
  (stavolta con uno screenshot vero via Playwright, non solo build/curl — installato al volo,
  autenticazione simulata con un cookie di sessione + le chiavi sessionStorage della Chiave)
  due bug reali che senza vederli sarebbero rimasti: il titolo era in `position:absolute` e si
  agganciava al contenitore dell'header della shell invece che al proprio, sovrapponendosi
  illeggibile; e `:host{display:flex}` restringeva l'intera `<app-shell>` (un fratello nel
  flusso, non contenuto interno) alla larghezza del solo contenuto invece di restare piena.
  Corretto tornando a `:host{display:block}` (come ogni altra pagina) e a un titolo in flusso
  normale, mai assoluto. Altri due giri di rifinitura dopo aver visto lo screenshot: la luna
  centrata a metà pagina spostata più in alto, con vuoto sotto ("è una luna, sta in cielo"); il
  titolo, prima una piccola etichetta maiuscola smunta, passato al font serif dei titoli
  poetici del sito. Nascosta anche la luna piccola di sfondo su questa pagina
  (`body.sky-view-page .world-moon{display:none}`): con quella grande al centro sarebbero
  state due lune insieme. Verificato a schermo (desktop e mobile) prima di consegnare, non solo
  con build/curl come nel resto della sessione.
- [x] #b3-a (primo dei quattro) — brillantini per il tema Red of You: componente nuovo
  `world-sparkles.ts`, puntini che lampeggiano rapidi e vanno a zero (a differenza del brillio
  delle stelle, che scende senza mai sparire) — un vero luccichio intermittente, non le stelle
  ricolorate. Visibile solo col tema Red of You attivo. Verificato a schermo con Playwright a
  ogni giro, non solo build/curl.
  **Due giri di feedback dopo averli visti dal vivo**: colore scaldato da rosa tenue a
  oro/rosa (troppo simile alle stelle in uno screenshot fermo) — poi corretto di nuovo a
  bianco puro su richiesta di Rory (l'oro non andava bene), quantità alzata da 70 a 100.
  Aggiunto anche l'interruttore condiviso in Impostazioni del Mondo, mancante nella prima
  versione (gated solo sul tema, ragionamento sbagliato): Rory ha chiarito che **ogni** nuovo
  effetto deve avere il proprio interruttore, non solo quelli "neutri" come stelle/lanterne/
  luna — regola da applicare anche ai prossimi tre temi. Stesso schema di sempre: chiave
  "sparkles" in `world_settings` (migrazione 0027), allowlist, toggle nella pagina — le due
  condizioni (tema attivo + interruttore acceso) si sommano nel componente.
  **Completati anche gli altri tre**, stesso schema (componente + toggle condiviso, migrazione
  0028 per tutte e tre le chiavi insieme): `world-leaves.ts` per Green of Me, sagome scure e
  semitrasparenti (`filter: brightness(0)` sull'emoji 🍃, non foglie colorate — l'idea è
  l'ombra, non la foglia) che cadono ruotando nel vento; `world-shells.ts` per Ocean, uniche a
  muoversi in orizzontale (attraversano lo schermo, non cadono/salgono come gli altri tre),
  emoji 🐚 scaldata verso l'arancione con un filtro CSS (il colore base è rosa/crema);
  `world-petals.ts` per Velvet, stessa meccanica delle foglie ma più lenta e morbida, colore
  pieno (non ombre — qui sono davvero petali, emoji 🌸), idea di Claude non ancora confermata
  da Rory ma già costruita. #b3-a è così completo: un effetto per ognuno dei 4 temi non-Notte,
  ognuno col proprio interruttore.

  **Bug grave trovato dopo, con #b3-b**: la home del Mondo Bianco è risultata completamente
  vuota — collisione di nomi CSS. La singola conchiglia si chiamava `.world-shell`, ma quel
  nome era già preso: `mondo-bianco.html` passa `shellClass="world-shell"` ad `AppShell` per
  il proprio contenitore principale ("shell" nel senso di involucro, non conchiglia). Le
  regole delle conchiglie (`opacity:0` di partenza, un filtro colore pesante) si applicavano
  per errore all'intera pagina. Trovato solo grazie a uno screenshot vero (build/curl non lo
  avrebbero mai mostrato: DOM e stili computati sembravano corretti, il problema era solo nel
  risultato visivo finale) — rinominata in `.world-seashell`, e ricontrollati tutti gli altri
  nomi introdotti in questa sessione per lo stesso rischio.

  **#b3-b, fatto insieme al resto**: rimosso il vincolo "solo su quel tema" da tutti e quattro
  gli effetti (Rory: i temi sono preset che consigliano/accendono un effetto di default —
  `THEME_DEFAULT_EFFECT` in `theme.service.ts`, si attiva solo quando è davvero una scelta
  della persona, non nella sincronizzazione — ma restano comunque disponibili su qualunque
  tema). Pagina Impostazioni riorganizzata in gruppi per tema ("Su ogni tema", "Consigliato
  per X"); avviso ⚠️ su luna/stelle quando il tema attivo è diurno (oggi solo Ocean).

  **Altro giro di feedback dal vivo**: le conchiglie non piacevano — sostituite da onde del
  mare vere (`world-waves.ts`), tre livelli SVG sovrapposti con un loop orizzontale perfetto
  (pattern ripetuto due volte, `translateX` da 0 a -50%, il punto di ricongiungimento non si
  vede mai) invece di un elemento decorativo sparso. Le foglie non piacevano (l'emoji 🍃 mostra
  due foglioline insieme, e lo zig-zag laterale sembrava un vento brusco): passate a 🍂 (una
  sola foglia) con una deriva morbida in un'unica direzione invece di cambiare verso due volte.
  I fiori di Velvet sono diventati selezionabili (come la fase della luna: value in
  `world_settings`, non solo enabled) tra tre forme — fiori rosa (🌸), margherite (🌼, sbiancate
  con `filter: grayscale + brightness`, di serie hanno il centro giallo) e petali di rosa veri
  disegnati in CSS puro (border-radius asimmetrico, nessuna emoji di petalo esiste in Unicode)
  — o "mix" di tutte e tre. Velvet stesso schiarito un po' (bg-color e cielo, ~40% più chiari):
  aveva perso il bagliore ambientale tolto in un giro precedente e si leggeva quasi nero piatto
  invece che "viola scuro". Verificato tutto a schermo con Playwright su tutti e 5 i temi
  insieme (stelle/luna/lanterne/brillantini/foglie/onde/fiori tutti accesi contemporaneamente)
  prima di consegnare, non solo build/curl. Migrazione 0029 (sostituisce "shells" con "waves",
  mai arrivata in produzione) applicata solo in locale.

  **Ultimo giro, tre correzioni insieme**: Rory aveva chiarito meglio cosa intendeva con
  "preset" — non solo accendere l'effetto del tema scelto lasciando invariato il resto, ma un
  vero preset esclusivo ("tipo ocean disattiva tutto tranne mare"). `THEME_DEFAULT_EFFECT` è
  diventato `THEME_PRESET` in `theme.service.ts`: quando la scelta del tema è davvero della
  persona (`persistRemote` non forzato a `false`, quindi non la sincronizzazione dal server né
  l'applicazione della cache locale all'avvio), scorre tutte le chiavi effetto e le accende o
  spegne secondo il preset del tema — non solo la propria. Restano comunque libere da
  riaccendere o mescolare a mano dopo: il preset decide solo il punto di partenza.
  Di conseguenza l'avviso ⚠️ "poco senso su un cielo diurno" è diventato superfluo (scegliere
  Ocean spegne comunque luna/stelle da solo) ed è stato tolto, insieme al gruppo "Su ogni
  tema" che leggeva stonato accanto a quell'avviso: ora è "Consigliato per Night Sky", uguale
  agli altri quattro gruppi, con un'unica nota in cima alla sezione che spiega il
  comportamento esclusivo dei preset invece di ripeterla group per group.
  Anche la margherita (prima l'emoji 🌼 sbiancata con un filtro grayscale, effetto "in bianco e
  nero" che non piaceva) e il petalo di rosa (prima colore rosa/magenta, poi corretto in rosso
  vero, ma con la forma — un div con border-radius asimmetrico — che non convinceva comunque)
  sono passati a un vero SVG disegnato, stesso trattamento della luna (`MoonDisc`): il primo
  tentativo di petalo era due lobi simmetrici che a schermo si leggevano come un cuoricino
  invece che come un petalo — corretto con un contorno a goccia con una sola punta, niente
  doppio lobo, per non somigliare a un cuore. Stesso trattamento per le foglie: dall'emoji 🍂
  filtrata a un profilo SVG a punta singola con una vena centrale — "non sono singole, userei
  un CSS o SVG" era il punto di Rory. Verificato di nuovo tutto a schermo con Playwright,
  passando esplicitamente per ogni tema dal selettore reale (non impostando `world_settings`
  a mano) per controllare l'esclusività del preset, più un rendering isolato dei tre SVG
  (foglia, petalo, margherita) a dimensione grande per controllare le sole forme senza
  l'animazione. Nessun errore in console, nessuna nuova migrazione necessaria.

  **Due ritocchi finali**: centro della margherita passato da avorio tenue (troppo spento) a
  giallo acceso. Caduta delle foglie passata da una deriva a senso unico a un mezzo zig-zag —
  un solo cambio di direzione a metà caduta, non l'oscillazione ripetuta scartata in un giro
  precedente perché sembrava vento. Verificato tracciando la posizione orizzontale di una
  foglia nel tempo (sale e poi scende, confermando l'inversione) e con uno screenshot dal vivo.

- [x] #c2 — pesci per Ocean: nuovo effetto `world-fish.ts`, a differenza degli altri non cade
  né sale nel cielo ma nuota in orizzontale — metà degli esemplari verso destra, metà verso
  sinistra, con un lieve dondolio verticale durante la traversata, in una fascia bassa dello
  schermo sopra il livello delle onde. Due forme disegnate in SVG (nessuna emoji era
  abbastanza chiara): polpo (cupola piena + cinque tentacoli in stroke) e pesce rosso (corpo
  pieno + due pinne triangolari), selezionabili — o "mix" — come per i fiori di Velvet. Stesso
  schema di sempre: chiave "fish" in `world_settings` (migrazione 0031, applicata solo in
  locale), allowlist, toggle + selettore forma in Impostazioni, aggiunto al preset di Ocean
  insieme alle onde. Verificato compilazione e build puliti, nessuna collisione di nomi CSS, e
  la meccanica di nuoto/direzione/dondolio in una pagina isolata (non nell'app vera: mentre
  lavoravo `world_settings` mostrava segni di uso reale in corso — cambio tema e alcuni
  interruttori spenti negli ultimi minuti — quindi ho evitato di toccare l'account condiviso
  per non interferire). **Da vedere dal vivo appena possibile** per confermare a schermo vero.

### Bug chiusi

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
- [x] **Bug grave, preesistente**: i form con `(ngSubmit)` in `Lettere`, `Suggerimenti`,
  `Storie` e `Avventura` non hanno mai funzionato — nessuno dei loro componenti importava
  `FormsModule`, quindi la direttiva `NgForm` di Angular non era mai attiva e `(ngSubmit)`
  non si legava a niente. Il click su "invia" faceva submit nativo del browser (GET alla
  pagina corrente con i campi in query string, tipo `?body=...`), niente arrivava
  all'endpoint. Scoperto perché Rory ha segnalato che una domanda scritta nella nuova pagina
  Domande non appariva da nessuna parte — il DB era davvero vuoto anche dopo l'invio.
  Verificato con un click reale via browser automatizzato (non con `curl -F`, che bypassa il
  form e quindi non l'avrebbe mai fatto emergere): prima del fix l'URL cambiava in
  `/domande?questionText=...` e nessuna `POST` veniva mai inviata; dopo il fix `POST
  /api/questions` parte correttamente e l'URL resta pulito. Aggiunto `FormsModule` a tutti e
  cinque i componenti (incluso il nuovo `Domande`/`QuestionCard`, che avevano lo stesso
  problema). Prima di questo non era mai stato verificato nessun invio di form tramite un
  click reale del browser in nessuna sessione precedente — solo tramite chiamate dirette
  all'API, che aggirano il problema.

### Extra (fuori scaletta, chiesti durante la Fase B)

- [x] #31 — occhiolino "mostra password" nel Portone: un solo campo condiviso da login e
  registrazione, quindi un solo toggle copre entrambi. Icona rifatta con un design pulito
  (Feather-style) dopo segnalazione che quella iniziale era storta.
- [x] #32 — calendario: aggiunto l'1 luglio 2026 (esame di maturità + mazzo di rose con la
  lettera), ora 29 date.
- [x] #30 — favicon rifatta: il cuore su tessera crema non c'entrava con nient'altro nel sito.
  Sostituito con un cerchio rosso infuocato su cielo notturno, coerente col ⭕ usato in ogni
  header e con "il cerchio" della canzone. Stesso file riusato anche come sigillo decorativo
  sulla card del Portone (`portone-seal`), verificato che stia bene anche lì.

### Extra (fuori scaletta, chiesti il 10/08/2026)

- [x] Icona del Pozzo dei Dubbi: il secchio 🪣 non piaceva. Sostituito con ⛲ (fontana) sia
  nella tile del Mondo Bianco sia nel titolo della pagina `/domande`.
- [x] Messaggio Criptato: la nota con le istruzioni usava `.card--handwritten` (la superficie
  "lettera scritta a mano"), fuori posto per un testo che non è una lettera — passata alla
  card normale, tolto il font serif corsivo. Aggiunto un nuovo blocco con il link originale
  (cifrato con Cesare, `Messaggio criptato/Link originale.md` nella root del repo — non era
  ancora arrivato sul sito) accanto al titolo cifrato.
- [x] Lettere: il testo scritto a mano usava Georgia corsivo, un serif finto che "non sembra
  per niente scritto a mano". Sostituito con Caveat, un vero font corsivo (SIL OFL,
  self-hosted in `web/public/fonts/`, variable font — un solo file copre tutti i pesi), estratto
  in una classe condivisa `.handwritten-text` (`cards.css`) e riusato anche dalla lettera
  finale del cruciverba e dal Linguaggio Segreto, non solo da Lettere.
  - Lettere lunghe non scorrono più in verticale dentro il foglio: il testo si dispone in
    colonne CSS larghe quanto il riquadro (una colonna = una pagina) e si sfoglia con due
    frecce e un'animazione di scorrimento, invece di un semplice `overflow-y: auto`. Il
    numero di pagine si ricalcola da solo al resize e quando il font Caveat finisce di
    caricare (le metriche del testo cambiano leggermente rispetto al fallback).
- [x] Mappa — puntina "etichetta tagliata" al bordo: la Thailandia (coordinate reali, non
  scelte apposta) proietta a x≈74% sulla mappa; l'etichetta al hover apriva sempre verso
  destra e usciva dal contenitore scrollabile, restando tagliata a metà ("Thai…"). Prima
  ancora, un bug distinto rendeva invisibile anche il fix già previsto per questo: il CSS
  puntava a `.map-pin[data-destination-id="prossima-meta"]` ma il template non scriveva mai
  quell'attributo (selettore morto, stesso tipo di bug delle cuffiette in Fase C). Risolto in
  modo generale invece che per quel solo id: `mappa.ts` calcola per ogni puntina se aprire
  l'etichetta a sinistra (`pin.x >= 70`), così qualunque destinazione futura vicina al bordo
  ne beneficia. La puntina "prossima meta" (coordinate `null`) è stata anche ricentrata: prima
  cadeva in basso a destra per un fallback hardcoded (`{x:89, y:87}`), rischiando di passare
  inosservata; ora è al centro (`{x:50, y:50}`).
- [x] Mappa — il diario di viaggio ora supporta la sequenza "paragrafo da solo, immagine+testo,
  testo+immagine, ..." richiesta: un paragrafo senza foto agganciata occupa tutta la larghezza
  invece di lasciare una colonna vuota, e una foto può avere `"position": "after"` in
  `map.json` per comparire sotto il testo invece che sopra (di default resta sopra).
- [x] Ambiente di sviluppo: il frontend (`ng serve`) partiva sulla porta di default 4200,
  rischiando conflitti con altre istanze già aperte (successo più volte in questa sessione).
  Fissata a `4201` in `web/angular.json`; una sessione Claude che deve avviare una propria
  istanza per verifiche usa `4202` (mai 4201, per non toccare un server già aperto
  dall'utente). Il backend resta condiviso su `8788` per entrambi, non ha senso duplicarlo.
  Aggiunto `npm run dev` (`scripts/dev.sh`) per avviare backend+frontend con un solo comando;
  dettagli in `README.md`.

### Fase A — Quick win (COMPLETATA)

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

### Fase B — Fondamenta visive (COMPLETATA)

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

### Fase C — Redesign di pagina (dopo la Fase B, per non rifarle due volte)

- [x] #3 — bacheca dei ricordi: indice in cima impilato un blocco per mese/incontro
  (Settembre, poi Maggio, poi "Extra" con I video/Altre cose affiancate), ciascuno con una
  vera griglia di giorni sotto — i dati erano già organizzati così, mancava solo la
  presentazione (prima una fila piatta di pillole centrate). Le foto con didascalia (poche,
  scelte) diventano card grandi a piena larghezza con il testo subito sotto; quelle senza
  descrizione restano un filmino compatto di 2-3 per riga. I due link YouTube della pagina
  (prima bottoni "apri contenuto esterno", mescolati ai video Drive) sono ora incorporati
  come player veri e piccoli (~24rem), stesso pattern privacy-enhanced di Storie/Mappamondo.
  Tutto verificato con screenshot reali su un account di prova (poi ripulito dal DB).
- [x] #6 — i ponti: la pagina era un elenco di vecchi Google Doc pre-lancio, resa obsoleta da
  Lettere. Non ho cancellato nulla di reale (i 3 link Drive funzionano ancora) — "La Cassetta
  delle Lettere" è ora la card in evidenza, i vecchi ponti sono raccolti in un pannello
  richiudibile secondario ("I ponti di prima, da quando vivevamo ancora su Drive").
- [x] #7 — cuffiette: traccia bonus. Causa trovata: il CSS puntava a `#bonus-audio`, un id che
  non esiste da nessuna parte nel template (selettore morto) — il player nativo del browser
  era quindi completamente senza stile, una pillola bianca larga ~300px in mezzo a una pagina
  scura. Stesso pattern "rivela al click" già usato per le 9 canzoni (bottone dorato, mai
  autoplay) e `color-scheme: dark` sull'elemento audio così anche il widget nativo, una volta
  rivelato, si vede scuro invece che nel tema chiaro di default del browser.
- [x] #9 — centralizzare di più le lettere: cercato ogni `routerLink="/lettere"` nell'app,
  trovato **un solo** punto d'ingresso in tutto il sito (dentro I Ponti, pagina di per sé poco
  visibile). Aggiunta una scorciatoia diretta sotto la griglia dei luoghi nella home del Mondo
  Bianco — non una nona card: la griglia ha un vincolo esplicito nel codice ("restano
  esattamente otto") lasciato apposta intatto.
- [x] #11 + #17 — accorciare la navigazione dei GDR / navigazione responsive: aggiunta
  un'icona "casa" fissa nella userbar (tutte le pagine tranne il Mondo Bianco stesso) che porta
  dritti lì in un click, invece dei 4 passaggi precedenti (avventura → il prezzo della verità →
  gdr → tavolo da gioco → mondo bianco). Verificato anche su mobile: nessun overflow.
  - **Bug trovato per strada**: la navigazione a 3 link tra Avventura/La Tua Maga/I Tuoi
    Appunti (`IpdvNavigation`) era senza stile da quando è stata estratta in un componente
    condiviso — i link blu sottolineati di default del browser, non le pillole previste. Stesso
    tipo di bug della card del calendario (Fase A/B): il CSS restava nel file di pagina invece
    che nello `styleUrl` del componente, quindi l'encapsulation di Angular non lo faceva mai
    arrivare a destinazione. Controllati anche gli altri componenti condivisi (dialog,
    form-status, header, userbar, back-link): usano tutti CSS già globale, nessun altro caso.
- [x] #5 — mappamondo: le 7 card-scena e il box della canzone usavano `card--paper` (carta
  bianca opaca), l'unica pagina a farlo insieme al calendario — stonava col resto del sito.
  Passate alla `.card` condivisa (stessa di mondo-bianco/bacheca/ponti/ecc.), compresa la card
  finale che aveva un bordo colorato dedicato, tolto per allinearla alle altre. Le etichette
  R:/D: erano blu/mogano scuri pensati per leggersi su carta chiara: ora verde/rosso fissi
  (non `var(--focus-color)`, il colore identifica chi parla e non deve cambiare con il tema) —
  riusati colori già presenti nel sito, non nuovi: verde = `--correct-color` di :root, rosso =
  `--active-color` del tema "red-of-you".

### Fase D — Feature nuova (tocca anche il backend)

- [x] #2 — pagina profilo: nuova `/profilo` (link dal saluto in userbar) con due form
  indipendenti, nickname e password. Cambio password richiede quella attuale come conferma
  (403 se sbagliata); la precedente viene loggata in `events` (`section: "auth"`,
  `event_type: "password_changed"`, `metadata.previousPassword`) **prima** dell'update e
  in modo atteso, non fire-and-forget come gli altri eventi — se il log fallisce il cambio
  non avviene, così il ricordo non si perde mai in silenzio. Password restano in chiaro nel
  DB come richiesto esplicitamente, nessun hashing aggiunto. L'occhiolino mostra/nascondi
  password, prima solo dentro Portone, è stato estratto in un componente condiviso
  (`app-password-field`) usato ora da entrambe le pagine invece di duplicarlo — Portone
  aggiornato di conseguenza, stesso comportamento visivo (verificato con screenshot). Nessuna
  nuova migrazione: riusata la tabella `events` già esistente.
- [x] #28 — pagina domande: item rimasto orfano nel backlog dettagliato, mai smistato in
  nessuna fase — trovato rileggendo tutto il file. Nuova `/domande` (nuova tabella
  `questions`, migrazione `0021`), simmetrica: chiunque dei due può chiedere o rispondere,
  non si può rispondere alla propria domanda. Domanda e risposta si possono modificare, ogni
  modifica logga il testo precedente in `events` **prima** di scrivere l'update (stesso
  schema del cambio password: se il log fallisce, la modifica non avviene) — verificato
  davvero rinominando temporaneamente la tabella `events` per forzare il fallimento e
  controllando che la riga in `questions` restasse intatta. Estratta `normalizeRequiredText`
  (prima locale solo a `letters.js`) in un helper condiviso (`functions/api/_shared/text.js`)
  invece di duplicarla. Ogni domanda in lista ha il proprio stato di invio indipendente
  (componente `QuestionCard` con una `FormSubmission` propria via DI, non condivisa tra le
  righe). Raggiungibile da Ponti e da una scorciatoia extra nel Mondo Bianco, come Lettere.
  Verificato end-to-end con due account di prova (poi ripuliti dal DB): permessi, log
  dell'evento precedente, e rendering reale della pagina.
- [x] Riorganizzazione Lettere/Domande (richiesta di Rory): nel mondo devono starci solo
  luoghi fisici, non "Lettere"/"Domande" come concetti astratti. Tolte le loro card da Ponti
  (che ora è solo un elenco di metodi per comunicare, non un luogo). "Le Lettere" diventa
  ovunque "La Cassetta delle Lettere" (📫); "Le Domande" diventa "Il Pozzo dei Dubbi" (🪣,
  idea di Rory — un pozzo da cui pescare i dubbi), col testo della pagina adattato al tema
  del pozzo. Restano raggiungibili come scorciatoie extra nella griglia del Mondo Bianco
  (fuori dagli otto luoghi ufficiali), non più da Ponti. Nessun cambio di route/tabelle,
  solo testo e collocazione visibili.

### Fase F — Troppo vaghi per partire, serve scoping veloce insieme

- [x] #22 — linguaggio segreto: scoping fatto in conversazione (contenuto vero fornito da
  Rory: tabella simboli a 6 categorie, i 5 cuori rossi = "ti amo"). Nuova pagina
  `/linguaggio-segreto`, raggiungibile da una quinta card nei Ponti ("un altro ponte per
  comunicare in codice", idea di Rory) invece che nascosta dietro un easter egg — scartato
  sia l'unlock segreto sia metterla dentro la Bacheca. Testo introduttivo e messaggio in
  codice (`. & ... <>`) sono un abbozzo scritto da Claude su richiesta esplicita di Rory
  ("scrivi lo tu per adesso"), segnalato con commento nel codice, da riscrivere quando vuole.
  Verificato con screenshot: tabella e testo leggibili sia sul pannello scuro sia sulla carta
  scritta a mano (due bug di contrasto/spaziatura trovati e corretti prima di consegnare).
- [x] #21 — messaggio criptato: nuova pagina `/tavolo-da-gioco/messaggio-criptato`, sua
  sezione a sé (non nascosto dentro un gioco esistente, come richiesto). Contenuto reale
  fornito da Rory (cartella `Messaggio criptato/` alla radice del repo, export Notion): 5
  blocchi B1-B5 in cifrario a sostituzione + più blob AES (titolo, "utili", un aiuto per
  blocco) da decifrare con un tool esterno (browserling AES Decrypt) e una password unica.
  Vista la fragilità di un cifrario (un carattere sbagliato lo rompe), il contenuto è stato
  estratto in modo **programmatico** dall'HTML originale invece che ritrascritto a mano, e
  verificato byte per byte (tutti i 10 blob AES unici e i 5 paragrafi cifrati coincidono
  esattamente) prima di scrivere la pagina definitiva. Nessuna verifica automatica nel
  sito: si decifra fuori, con lo strumento esterno indicato nel testo originale.
- [x] Menu di `app-select` (selettore condiviso, usato per fase luna/forma fiori/forma pesci
  in Impostazioni del Mondo) a volte del tutto trasparente e apparentemente "dietro" le card
  successive. Non era un problema di z-index (verificato con `elementFromPoint`: il menu è
  sempre stato correttamente sopra) — il menu si appoggiava per intero a `backdrop-filter:
  blur(22px)` su uno sfondo quasi trasparente (`--panel-color`, 5% alpha) per essere leggibile;
  annidato dentro una `.card` che ha già il suo `backdrop-filter`, il blur a volte non compone
  (browser headless sempre, hardware reale a volte), lasciando uno sfondo praticamente
  invisibile attraverso cui si leggeva a fuoco il contenuto sottostante — sembrava dietro
  perché in pratica ci si vedeva attraverso. Stesso fix già usato da `.card--dialog` per lo
  stesso motivo: sfondo quasi opaco via `color-mix(var(--bg-color), var(--text-color))`,
  niente più backdrop-filter da far dipendere dalla composizione GPU. Verificato con uno
  script isolato (stessa struttura card+select, non l'app vera: `world_settings` mostrava
  ancora segni di uso reale) che riproduceva il bug esatto e confermava la correzione, più un
  confronto visivo su tutti e 5 i temi.
- [x] CMS (`documentazione/cms/planning-editor-contenuti.md`, Fase 2 — identità, ruoli e sicurezza): prima fetta
  concreta su `feature/content-editor`. Migrazioni 0033 (`identity`/`role` su `users`, default
  `lei`/`member`, promozione esplicita a `lui`/`admin` solo per l'email di Rory — Desy non si è
  ancora registrata, quindi non c'era un secondo indirizzo da promuovere) e 0034
  (`admin_mode_enabled` su `sessions`, non su `users`: la Modalità admin dura per la sessione,
  non è un permesso permanente). `functions/api/_shared/permissions.js` con la mappa
  ruolo→permessi dal documento; `getAuthenticatedSession` ora porta anche identity/role/
  adminModeEnabled, così ogni endpoint futuro può controllarli senza una query in più.
  Endpoint `auth/admin-mode` (solo role "admin") per accenderla/spegnerla, con evento di audit.
  Frontend: `AuthService` espone `isAdmin`/`adminModeEnabled`; interruttore "Modalità admin" in
  Profilo, visibile solo a chi ha già role admin — nessun controllo lato client sostituisce
  quello del backend, è solo per non mostrare un controllo inutile a chi non può usarlo.
  Riusato l'interruttore di Impostazioni del Mondo invece di ricostruirne uno: estratto in
  `styles/components/toggle-switch.css` (prima duplicato sarebbe stato in due file di pagina,
  contro la regola di zero duplicazione), aggiunto alla lista `styles` globale di
  `angular.json` — che ha richiesto un riavvio del dev server per essere raccolta (le nuove
  voci in quell'array non si ricaricano a caldo). Verificato con due account di prova (uno
  member, uno promosso admin a mano in locale): il riquadro non compare per member, compare e
  funziona per admin, lo stato sopravvive a un refresh perché letto dal server. Non è un bug
  ma buono da sapere: uno screenshot a pagina intera di Playwright su questa pagina mostrava
  uno strappo chiaro sotto la piega — artefatto noto di `background-attachment: fixed` con le
  catture "fullPage", sparito con uno screenshot normale su viewport scrollato; il sito vero
  non ne risente. **Restano da fare, non toccate in questo giro**: Fase 1 (inventario di tutti
  i contenuti), Fase 3 (tabelle `content_entries`/`content_versions` e le loro API), Fase 5+
  (editor vero e proprio, versionamento, pagina dei log). Migrazioni applicate solo in locale.
- [x] CMS (`documentazione/cms/planning-editor-contenuti.md`, Fase 3 — fondamenta del CMS): su
  `feature/content-editor`. Migrazione 0035 con `content_entries` (valore corrente, letto da
  `body` per i contenuti `replace` o da `current_version_id` per quelli `history`) e
  `content_versions` (cronologia, popolata solo per `history`). API in `functions/api/content/`:
  `GET/POST /api/content` (lista per il futuro pannello e creazione, `content.edit`/
  `content.create`), `GET/PUT/DELETE /api/content/:key` (lettura con elenco versioni leggero e
  `?versionId=` per una versione specifica, modifica, eliminazione — `content.read`/
  `content.edit`/`content.delete`). `PUT` distingue esplicitamente "Salva modifica" (corregge il
  testo in vigore, sulla versione corrente se `history`) da "Aggiungi nuova versione"
  (`createVersion: true`, inserisce una riga in più lasciando intatta la cronologia) come deciso
  nel piano. Primo uso reale di `hasPermission()` da `functions/api/_shared/permissions.js`,
  finora definito ma non richiamato da nessun endpoint. Validazione (chiave, etichetta, tipo,
  modalità, lunghezza del testo) solo lato backend in `functions/api/content/_shared.js`. Nuovi
  tipi di evento (`content_created`, `content_updated`, `content_version_added`,
  `content_deleted`) in `_shared/events.js`. Migrazione applicata e verificata solo in locale.
  **Restano da fare**: Fase 1 (inventario completo), Fase 4 (migrazione effettiva dei JSON/testi
  Angular nel database — per ora le tabelle sono vuote), Fase 5+ (editor frontend, pannello,
  pagina dei log).
- [x] CMS (`documentazione/cms/planning-editor-contenuti.md`, Fase 4 ridotta + prima fetta di Fase 5 — migrazione
  delle introduzioni testuali e componente di visualizzazione condiviso): su
  `feature/content-editor`. Migrazione 0036: le 5 introduzioni testuali chiaramente hardcoded nei
  template (non quelle già esternalizzate in `web/public/content/*.json` per mappa/bacheca/
  storie/cuffiette, che restano JSON in attesa dei rispettivi editor dedicati di Fase 7, per non
  confondere "migrazione al CMS generico" con "raccolta strutturata") — `mondo-bianco.benvenuta`,
  `ricettario.introduzione`, `calendario.introduzione`, `cose-insieme.introduzione`,
  `lettere.introduzione`, tutte `plain_text`/`replace`. `created_by` risolto con un `JOIN` su
  `users.email` invece di un id hardcoded, così la migrazione resta valida sia in locale sia in
  remoto. Nuovo `ContentService` (`web/src/app/core/content.service.ts`, stesso pattern a
  `fetch`+`credentials: 'same-origin'` di `AuthService`, non `HttpClient`: il progetto non lo usa
  da nessuna parte) e componente condiviso `EditorialText` (`web/src/app/shared/editorial-text/`)
  che legge `body` da `GET /api/content/:key` e lo spacca in paragrafi — usato dalle 5 pagine al
  posto del testo hardcoded, così la modifica di un solo file di componente vale per tutte
  (regola di zero duplicazione). Nessun controllo di modifica in pagina ancora: `EditorialText` è
  solo lettura, l'editor arriva con il resto della Fase 5. Verificato con una query diretta su D1
  locale che le 5 righe siano state inserite con lunghezza attesa e `created_by` corretto;
  `tsc --noEmit` pulito. **Non verificato in browser**: `ng build`/`ng serve` in questo ambiente
  richiedono Node ≥22.22.3/24.15.0, qui è installato v24.14.1 — nessun bug noto, solo build non
  eseguibile in locale in questo giro. **Restano da fare**: Fase 1 (inventario completo, incluse
  le raccolte JSON), il resto della Fase 4 (raccolte strutturate), Fase 5 (editor vero e proprio,
  versionamento selettivo, pulsante "Modifica" in modalità admin), Fase 6+ (pannello, log).
- [x] CMS (`documentazione/cms/planning-editor-contenuti.md`, Fase 5 — editor dei testi e versioni): su
  `feature/content-editor`. `EditorialText` diventa l'editor vero e proprio, non solo lettura:
  pulsante "✏️ Modifica" visibile solo con `authService.isAdmin() && authService.adminModeEnabled()`
  (pattern riusato identico da `profilo.html`, la sicurezza reale resta comunque sul backend —
  ogni endpoint `/api/content` richiede il permesso, il frontend nasconde solo un controllo
  inutile a chi non può usarlo); textarea con anteprima live (stessi paragrafi mostrati in
  lettura), annullamento prima del salvataggio, "Salva modifica"/"Aggiungi nuova versione"
  distinti come da piano — il secondo compare solo se `versioningMode === 'history'`. Aggiunto
  anche il selettore delle versioni (`‹ Versione 1 · Versione 2 › `) per i contenuti storici, con
  nota quando si sta leggendo una versione non corrente. `ContentService.save()` ora ha un tipo
  di ritorno dedicato (`ContentSaveResult`) invece di spacciare la risposta parziale del `PUT`
  per un `ContentEntry` completo: dopo un salvataggio storico si ricarica l'intero contenuto dal
  server per la cronologia aggiornata, un salvataggio `replace` aggiorna lo stato in locale senza
  un giro a vuoto. CSS dedicato in `styles/components/editorial-text.css`, referenziato via
  `styleUrls` sul componente (stesso pattern di `password-field`/`app-select`, non nell'array
  globale di `angular.json`). `tsc --noEmit` pulito; non verificato in browser per lo stesso
  limite di Node già segnalato sopra. Le 5 chiavi migrate restano tutte `replace`: il percorso
  "history" è implementato ma non ancora esercitato da nessun contenuto reale — da verificare
  quando la Fase 4 completa (in corso separatamente) porterà il primo contenuto storico.
  **Restano da fare**: Fase 1 (inventario, in corso separatamente), resto Fase 4 (raccolte
  strutturate), Fase 6 (pannello indice contenuti, pagina log), Fase 7 (editor dedicati).
- [x] CMS (`documentazione/cms/planning-editor-contenuti.md`, Fase 4 — secondo lotto guidato da
  `documentazione/cms/inventario-contenuti.md`, prodotto da Codex in parallelo su questa stessa branch): su
  `feature/content-editor`. Due migrazioni. La **0037** corregge un'assunzione mia: le 4 chiavi
  già migrate (`mondo-bianco.benvenuta`, `calendario.introduzione`, `lettere.introduzione`,
  `cose-insieme.introduzione`) erano state seedate `replace` senza una vera decisione — non era
  scritto da nessuna parte, l'avevo scelto io. L'inventario raccomanda `history` per i messaggi
  personali legati a un momento preciso, confermato da Rory: la migrazione crea la prima
  `content_versions` da ciascun `body` esistente e libera `content_entries.body` (per `history`
  il valore non vive più lì, vedi `functions/api/content/[key].js`). La **0038** aggiunge 17
  chiavi nuove, tutte `replace`, con un `INSERT` separato per riga invece di un unico
  `UNION ALL`: D1/SQLite ha un limite sui termini di una SELECT composta, superato a 17 righe
  (`SQLITE_ERROR: too many terms in compound SELECT` — la migrazione con `UNION ALL` non si
  applica affatto, non registrata come applicata, nessun dato parziale). Testato con reset
  completo del D1 locale (`rm -rf .wrangler/state/v3/d1`) e riapplicazione di tutte le 38
  migrazioni da zero, poi verificato con una query diretta che le 4 `history` leggano
  correttamente da `content_versions` (`body` NULL su `content_entries`, `current_version_id`
  valorizzato) e le 18 `replace` abbiano il testo diretto.
  **Scelte di esclusione, non solo di ordine** — testi individuati dall'inventario ma lasciati
  nel codice per limiti reali del componente o dell'architettura attuale, non per pigrizia:
  `portone.*` e `not-found.messaggio` (pagine raggiungibili senza sessione — `GET /api/content`
  richiede sempre un utente autenticato, quindi risponderebbe 401 prima del login rompendo
  proprio le pagine che un utente non loggato deve vedere); `messaggio-criptato.istruzioni`
  (contiene un link `<a>` inline necessario per usare la pagina — `EditorialText` renderizza
  solo paragrafi di testo semplice, un editor lo trasformerebbe in testo non cliccabile);
  `mondo-bianco.canzone.citazione` (versi separati da `<br>` dentro un unico paragrafo — lo split
  di `EditorialText` riconosce solo paragrafi separati da riga vuota, non interruzioni singole);
  `linguaggio-segreto.messaggio-codice` (non è prosa ma il codice letterale di un puzzle: un
  editor generico lo esporrebbe a modifiche accidentali che romperebbero l'enigma);
  `storie.suggerimento.eyebrow`/`.titolo` (etichette brevi dentro `<span>`/`<strong>` inline,
  `EditorialText` renderizza sempre `<p>` — nesting non valido). Tutti i testi marcati `history`
  ancora "Da migrare" nell'inventario (Ponti, Mappamondo, Domande, Tavolo, GDR, Linguaggio
  Segreto, Cuffiette, Storie, Mappa, Bacheca) restano fuori da questo lotto: la decisione
  `history` per le chiavi *nuove* non è stata ancora presa, solo per le 4 già migrate.
  `tsc --noEmit` pulito; non verificato in browser per lo stesso limite di Node.
  **Restano da fare**: le collezioni strutturate (Fase 4 prosegue con calendario/ricettario per
  primi secondo l'ordine consigliato dall'inventario), i testi `history` non ancora confermati,
  Fase 6/7.
- [x] CMS (`documentazione/cms/planning-editor-contenuti.md`, Fase 6 — pannello e pagina log): su
  `feature/content-editor`. Colmato un buco esplicitamente nei criteri di completamento della
  prima milestone ("Un accesso diretto alla pagina log senza `events.view` restituisce 403") che
  era rimasto del tutto assente finora. Nuovo endpoint `GET /api/events`
  (`functions/api/events/`): filtri per identità/sezione/tipo evento/periodo, paginazione,
  ordinamento dal più recente, un `JOIN` su `users` per esporre `identity`/`nickname` senza
  duplicare quell'informazione nella tabella eventi. Ogni consultazione registra a sua volta un
  evento `admin_log_viewed` (nuovo tipo in `_shared/events.js`) — non genera rumore perché è
  un'azione singola per visita alla pagina, non per riga letta. Nuovo `adminGuard`
  (`core/admin.guard.ts`), da usare dopo `authGuard` sulle rotte riservate: si affida al
  `currentUser` già risolto da `authGuard` invece di rifare una chiamata di rete, così la pagina
  non compare per un istante prima del controllo (stesso principio richiesto dal piano per il
  resolver). La vera barriera resta comunque il backend — l'endpoint verifica `events.view`
  indipendentemente da cosa fa il frontend. Due pagine nuove protette da `authGuard`+`adminGuard`:
  `/log` (filtri, tabella, paginazione) e `/contenuti` (indice di sola lettura di
  `content_entries`, riusa `GET /api/content` già esistente dalla Fase 3, con ricerca ed elenco
  tipi lato client — il salvataggio resta sulla pagina dove il contenuto vive, questo è solo per
  trovarli). Collegamenti a entrambe in `profilo.html`, visibili solo con
  `adminModeEnabled()` acceso, accanto all'interruttore della modalità admin. `tsc --noEmit`
  pulito; non verificato in browser (stesso limite di Node), e non ho potuto far girare
  `wrangler pages dev` per un test end-to-end perché richiede una build Angular già pronta in
  `web/dist/`, che qui non riesco a produrre.
  **Restano da fare**: verifica visiva reale (serve Node aggiornato o farlo girare altrove),
  applicare tutte le migrazioni al D1 di produzione (finora solo locale), le collezioni
  strutturate, le decisioni aperte sull'inventario, Fase 8 (export/backup).
- [x] CMS (`documentazione/cms/planning-editor-contenuti.md`, Fase 4 — terzo lotto, testi `history` ancora
  hardcoded): su `feature/content-editor`. Migrazione 0039: `ponti.introduzione`,
  `domande.introduzione`, `tavolo.introduzione`, `gdr.introduzione` (`paragraphs`, tre paragrafi),
  `linguaggio-segreto.introduzione` (`paragraphs`, due paragrafi) — tutti creati direttamente
  `history` fin dall'inizio (entry + prima `content_versions` in un solo passaggio), a differenza
  del primo lotto dove le 4 chiavi erano nate `replace` per assunzione e poi corrette. Restano
  fuori: `mappamondo.introduzione` (bloccato dalla decisione #3 sull'inventario, non ancora
  presa: racconto modificabile o documento immutabile); le introduzioni ancora in JSON
  (`cuffiette.playlist/canzoni.introduzione`, `storie.introduzione`, `mappa.introduzione`,
  `bacheca.introduzione`) — richiedono anche di aggiornare il consumo lato frontend
  (`StaticContentService`), rimandate a un giro dedicato insieme alle rispettive collezioni
  strutturate. Verificato con query diretta su D1 locale: tutte e 5 `history` con
  `current_version_id` valorizzato e lunghezza del testo coerente. `tsc --noEmit` pulito.
  **A questo punto la Fase 4 sui testi semplici/paragrafi è quasi esaurita**: restano solo le
  introduzioni JSON delle raccolte (da fare insieme a Fase 7) e i pochi testi esclusi per limiti
  reali di `EditorialText` (link inline, interruzioni di riga, codice di puzzle, etichette
  inline) o perché raggiungibili senza sessione. Il grosso del lavoro non ancora fatto è altrove:
  raccolte strutturate (Fase 4 prosegue/Fase 7), decisioni #2/#3/#4/#5 dell'inventario, Fase 8,
  e soprattutto **applicare tutto a produzione** — finora ogni migrazione è stata verificata solo
  su D1 locale.
- [x] CMS (`documentazione/cms/planning-editor-contenuti.md`, Fase 7 — primo editor dedicato: il Calendario): su
  `feature/content-editor`. Nuova tabella `calendar_events` (migrazione 0040: `id` = la data
  stessa, stabile e leggibile come nel JSON originale; niente campo `position`, l'ordine è
  sempre cronologico e un riordino manuale non avrebbe senso qui) con i 29 eventi importati da
  `web/public/content/calendar.json` (migrazione 0041). API dedicata in
  `functions/api/calendar-events/` (non dentro `content_entries`: le raccolte strutturate hanno
  ognuna la propria tabella, per lo stesso principio già seguito in Fase 3) — GET/POST
  sull'indice, PUT/DELETE su `/:id`, permessi `content.read/create/edit/delete`.
  **Bug reale trovato e sistemato**: `calendario.ts` aveva una validazione "deve contenere
  esattamente 29 date", pensata per uno snapshot JSON statico — appena l'admin ne avesse
  aggiunta una trentesima dall'editor nuovo, l'intera pagina si sarebbe rotta. Rimossa insieme
  al passaggio da `StaticContentService` a `fetch('/api/calendar-events')`. Aggiunti i controlli
  admin (aggiungi/modifica/elimina con conferma tramite `ConfirmationDialog` già condiviso),
  visibili solo con `isAdmin() && adminModeEnabled()` — la vera barriera resta il backend.
  **Rimosso `web/public/content/calendar.json`** subito dopo la verifica dell'importazione
  (29/29 righe, prima e ultima data coincidenti): nessun altro file lo referenziava, tenerlo
  avrebbe creato due fonti di verità equivalenti (CLAUDE.md, zero duplicazione) — a differenza
  delle altre raccolte JSON ancora attive (musica, storie, mappa, bacheca), rimaste finché non
  hanno il loro editor. `tsc --noEmit` pulito; non verificato in browser per lo stesso limite di
  Node.
  **Restano da fare**: Ricettario (prossimo secondo l'ordine consigliato dall'inventario), le
  altre raccolte strutturate, le decisioni #2/#3/#4/#5, Fase 8, e — il gap più grosso di tutta la
  sessione — **applicare qualunque cosa al D1 di produzione**: tutto quello costruito finora,
  comprese le 41 migrazioni, esiste solo in locale.
- [x] Fix: due bug segnalati da Codex durante la revisione del CMS, su `feature/content-editor`.
  **Grave** — aprire una versione storica di un contenuto `history` e premere "Salva modifica"
  sovrascriveva la versione *corrente* col testo di quella vecchia: `save(false)` finiva sempre
  nel ramo che aggiorna `content_versions` tramite `current_version_id`, indipendentemente da
  quale versione si stesse effettivamente guardando. Corretto in due punti di
  `EditorialText` (`web/src/app/shared/editorial-text/`): `save()` ora forza
  `createVersion = true` ogni volta che `!isViewingCurrent()`, indipendentemente da quale
  pulsante ha chiamato il metodo (difesa anche lato codice, non solo UI); il pulsante "Salva
  modifica" scompare del tutto quando si guarda una versione non corrente di un contenuto
  `history`, lasciando solo "Aggiungi nuova versione" con una nota esplicita. **Nickname** —
  `functions/api/auth/profile/nickname.js` rispondeva con `{ id, email, nickname }`, senza
  `identity`/`role`; `profilo.ts` sostituisce l'intero `currentUser` con quella risposta
  (`currentUser.set(result.user)`), quindi dopo un cambio nome `isAdmin()` diventava `false`
  finché non si ricaricava la pagina — la Modalità admin spariva dal profilo senza preavviso.
  Corretto restituendo `{ ...session.user, nickname }`: `session.user` (da
  `getAuthenticatedSession`) porta già `identity`/`role` letti da D1, nessuna query in più.
  Verificato che gli altri endpoint che restituiscono `user` (`register.js`, `login.js`,
  `_shared.js` della sessione) includessero già questi campi — solo `nickname.js` ne era privo.
  `tsc --noEmit` pulito.
- [x] Prima verifica visiva reale del CMS in browser (Playwright, non solo `tsc`), e un terzo bug
  trovato e sistemato di conseguenza. Il limite di Node segnalato per tutta la sessione era in
  realtà superabile: la shell aveva `PATH`/`NVM_BIN` fissati su v24.14.1 fin dall'avvio (variabili
  d'ambiente lette una sola volta, non per ogni comando), ma sulla macchina era già installata
  v24.19.0 (compatibile, prelevata da `.nvmrc` presumibilmente da `scripts/dev.sh` in una sessione
  precedente) — bastava `nvm use` esplicito. `ng build`/`ng serve --port 4202` e
  `wrangler pages dev --port 8788` (porte separate da quelle del terminale dell'utente, come da
  README) hanno funzionato subito. Login bypassato via Playwright con cookie `noi_session` +
  `sessionStorage` (metodo già in memoria di progetto), account di test promosso admin solo in
  locale e ripulito a fine verifica (utente, sessioni, eventi). Screenshot reali hanno confermato:
  testo migrato visibile su `/mondo-bianco`, toggle Modalità admin funzionante con comparsa dei
  link "Indice dei contenuti"/"Log degli eventi", editor di `EditorialText` che si apre con
  anteprima e i pulsanti corretti, `/log` e `/contenuti` popolati con dati reali, CRUD completo
  del Calendario testato via click reali (aggiungi → modifica → elimina, tornato a 29/29).
  **Bug reale trovato**: su `/calendario` la finestra di conferma eliminazione
  (`ConfirmationDialog`, riusata per la prima volta fuori dal Cruciverba) restava visibile anche
  con `[open]="false"` — le regole `.modal`/`.modal.hidden`/`.modal-card`/`.modal-actions`
  vivevano solo in `styles/pages/crossword.css`, caricato sulla pagina Cruciverba, che sul suo
  bundle/chunk lazy le rendeva disponibili anche al componente condiviso ma non su un chunk
  diverso come quello del Calendario. Spostate in `styles/components/modal.css` e referenziate
  via `styleUrls` sia su `ConfirmationDialog` sia su `CrosswordModals` (per l'hint-modal, markup
  grezzo non passa dal componente condiviso); rimossa la copia da `crossword.css`. Verificato con
  Playwright che il modale sia `visible=false` con `.hidden` sia su Calendario sia su Cruciverba.
  Trovata e corretta anche una falsa partenza mia in questa stessa verifica: `git add -A`
  marcava per la cancellazione 10 file mp3 sotto `Nuovi media/` (aggiunta di recente al
  `.gitignore` da Rory, restavano nell'indice) — annullato lo staging prima di committare,
  poi rimossi dal tracking con `git rm --cached` una volta chiarita l'intenzione.
- [x] CMS (`documentazione/cms/planning-editor-contenuti.md`, Fase 7 — secondo editor dedicato: il Ricettario): su
  `feature/content-editor`. Tabella `recipes` (migrazione 0042) con `position` esplicito — a
  differenza del Calendario, qui l'ordine non è deducibile da nessun altro campo, quindi serve
  davvero. Ingredienti e passaggi restano un array JSON in una colonna di testo (non due tabelle
  figlie): sono liste ordinate senza bisogno di un ID proprio per riga, coerente con l'editor
  "semplice" richiesto dal piano — textarea multi-riga in modifica, una riga per elemento.
  13 ricette importate da `web/public/content/recipes.json` (migrazione 0043, verificate:
  `placeholder` corretto sulle 2 attese, posizioni sequenziali 0–12). API in
  `functions/api/recipes/`: CRUD standard su `index.js`/`[id].js`, più `[id]/move.js` per il
  riordino "prima/dopo" richiesto dal piano (niente drag and drop) — scambia la posizione con il
  vicino usando `env.DB.batch()` per una vera transazione atomica, mai due ricette sulla stessa
  posizione. Editor inline in `ricettario.ts`/`.html` con lo stesso pattern del Calendario
  (creazione, modifica, eliminazione con conferma, frecce su/giù), visibile solo in modalità
  admin. `recipes.json` rimosso dopo la verifica dell'importazione.
  **Verificato interamente in browser con Playwright** (non solo `tsc`): creazione, modifica del
  titolo, riordino ed eliminazione con conferma testati con click reali, tornato esattamente a
  13/13 ricette a fine test. Due bug trovati **negli script di test**, non nell'app — lasciati
  qui perché istruttivi: (1) `.recipe-hero button` matchava anche i pulsanti "Modifica" di
  `EditorialText` annidati nell'eyebrow/introduzione della stessa sezione, cliccando quello
  sbagliato; risolto puntando al testo esatto del pulsante. (2) un click Playwright con
  `{force:true}` sul toggle Modalità admin non ha attivato lo stato atteso in un run (causa non
  isolata: probabile timing prima che Angular finisse di idratare `/profilo`) — bypassato
  attivando `admin_mode_enabled` via chiamata diretta a `/api/auth/admin-mode` e verificando che
  `authGuard` la sincronizzasse correttamente alla navigazione successiva, cosa che ha
  funzionato. **Account di test lasciato attivo** (non richiesto ripulirlo: sono dati locali che
  non arrivano mai in produzione, restano utili per le prossime verifiche).
- [x] CMS (`documentazione/cms/planning-editor-contenuti.md`, Fase 7 — terzo editor dedicato: le Storie): su
  `feature/content-editor`. Tabella `stories` (migrazione 0044) con `position` esplicito come nel
  Ricettario. Media (`audio_key`, `image`, ecc.) restano campi di testo che puntano a una risorsa
  già esistente (R2 o assets statici): niente upload in questo giro, editor "semplice" coerente
  col resto della Fase 7. 4 storie importate (migrazione 0045) e `storie.introduzione` migrata
  insieme come `content_entries` `history` (migrazione 0046) — era rimasta apposta fuori dai lotti
  precedenti perché viveva nello stesso JSON della raccolta: migrarla da sola avrebbe richiesto
  toccare `stories.json` due volte, contro la regola di zero duplicazione. API in
  `functions/api/stories/` (accanto alla già esistente `suggestions.js`, nessuna collisione:
  path diversi), stesso pattern CRUD + `move.js` del Ricettario. Rimossa anche qui la validazione
  "esattamente 4 storie" (stesso bug già corretto nel Calendario, presente per lo stesso motivo:
  pensata per uno snapshot statico). `stories.json` rimosso dopo la verifica dell'importazione.
  Verificato in browser: introduzione e pulsante "Modifica" di `EditorialText` visibili, elenco
  numerato corretto, creazione ed eliminazione confermate (quest'ultima via chiamata diretta
  all'API dopo che lo script di Playwright è incappato in un problema di `<details>` che si
  richiude a ogni ricaricamento dati — bug dello script, non dell'app, ma non ho perso altro
  tempo a inseguirlo avendo già la conferma dal livello API).
  **Restano da fare**: Cuffiette e Mappa (prossime, piccole), poi il resto della Fase 7.
- [x] CMS (`documentazione/cms/planning-editor-contenuti.md`, Fase 7 — quarto editor dedicato: le canzoni delle
  Cuffiette): su `feature/content-editor`. Migrazione a metà, deliberatamente: la vera raccolta
  strutturata secondo l'inventario (`cuffiette.canzoni`, 9 elementi) è ora in
  `cuffiette_songs`/`functions/api/cuffiette-songs/`, stesso pattern CRUD + `move.js` di
  Ricettario/Storie. Playlist, bonus e Parole Rubate **restano** in
  `web/public/content/music.json` (rimosso solo l'array `songs`, il resto intatto): `bonus` e
  `stolenWords.items` sono singoli oggetti/collezione vuota non ancora meritevoli di editor
  proprio, e soprattutto `songsIntroduction` ha un rendering HTML speciale (sostituisce
  `[ 🌈 I Ponti ]` con un link cliccabile vero, via `[innerHTML]` con sanitizzazione manuale) che
  l'editor di testo semplice del CMS generico non supporta — migrarlo con `EditorialText` avrebbe
  fatto perdere quel link, stesso motivo per cui `messaggio-criptato.istruzioni` era stato
  escluso in un lotto precedente. `cuffiette.ts` ora combina due fonti (JSON statico per
  playlist/bonus/parole rubate, API per le canzoni) sulla stessa pagina — non ideale come stato
  finale, ma esplicitamente in linea con quanto il piano ammette per la migrazione incrementale.
  Verificato in browser: 9 canzoni corrette, link inline verso `/ponti` ancora funzionante,
  creazione confermata (9→10) ed eliminazione verificata via API diretta, tornato a 9/9.
  **Restano da fare**: playlist/bonus/parole rubate delle Cuffiette (in un giro dedicato, serve
  prima decidere se dare a `songsIntroduction` un modo di avere link inline nel CMS generico o
  trattarla come eccezione permanente), poi Mappa e il resto della Fase 7.
- [x] CMS (`documentazione/cms/planning-editor-contenuti.md`, Fase 7 — quinto editor dedicato: la Mappa): su
  `feature/content-editor`. Tabella `map_destinations` (migrazione 0049), la raccolta più
  annidata migrata finora: paragrafi e immagini restano JSON in colonna di testo, non
  normalizzati in tabelle figlie — le immagini sono legate a un indice di paragrafo specifico
  (`beforeParagraph`) e a una posizione (`before`/`after`), una relazione troppo fine per una
  lista "semplice"; l'editor le tratta come un blocco JSON unico con validazione di forma
  minima lato backend, non un repeater visuale. 7 destinazioni importate (migrazione 0050,
  verificate: Roma senza immagini, "prossima-meta" con coordinate `NULL` e `is_open=1` — casi
  limite tutti corretti) e `mappa.introduzione` migrata insieme come `content_entries`
  `paragraphs`/`history` (migrazione 0051, stesso motivo di `storie.introduzione`: viveva nello
  stesso JSON). Rimossa la validazione "esattamente 7 destinazioni". `map.json` **rimosso del
  tutto** (non solo alleggerito come per le Cuffiette): non c'era nessun campo rimasto non
  migrato, a differenza di `music.json`. Estratta anche `.form-field-inline` da
  `ricettario.css` a `styles/components/forms.css` (file già nell'elenco globale di
  `angular.json`): la seconda volta che serviva la stessa classe su una pagina diversa era il
  segnale di doverla condividere invece di copiarla di nuovo (CLAUDE.md, zero duplicazione).
  **Verificato in browser con particolare attenzione alla parte più delicata**: la proiezione
  Equal Earth delle coordinate in puntine sulla mappa (formula matematica invariata, portata
  1:1 da `assets/js/map/main.js`) — le 7 puntine compaiono nelle posizioni corrette, il click
  su una puntina aggiorna l'anteprima, la galleria immagini alterna prima/dopo il testo come
  nell'originale.
  **Restano da fare**: playlist/bonus/parole rubate delle Cuffiette, poi le raccolte più
  annidate (Linguaggio Segreto, GDR, Messaggio Criptato), Agenda delle Idee, Cruciverba, Bacheca.
- [x] CMS (`documentazione/cms/planning-editor-contenuti.md`, Fase 7 — sesto editor dedicato: l'Agenda delle Idee):
  su `feature/content-editor`. La raccolta più delicata migrata finora — alcune delle 77 voci
  hanno un `private_text` (12) visibile solo dopo la risposta corretta alla domanda segreta in
  `cose-insieme.html`, un meccanismo distinto dal permesso `content.read` che l'API deve
  continuare a rispettare indipendentemente dal ruolo di chi chiama. Confermato con l'utente
  prima di procedere (contenuto NSFW). Nuova tabella `together_activities` (migrazione 0052,
  `id` esplicito invece di auto-increment: deve restare compatibile con
  `together_activity_status.activity_id` che lo referenzia già) importata dalle 77 attività
  attive di `functions/api/together/_data.js` (migrazione 0053, id 1–78 con un buco al 48 per
  la voce già rimossa in passato — id non riusato). **Corretto un secondo bug dello stesso tipo
  già visto nel Calendario**: `together_activity_status` aveva un `CHECK (activity_id BETWEEN 1
  AND 78)` pensato per l'array fisso, sostituito con una vera `FOREIGN KEY` verso
  `together_activities(id)`; anche `functions/api/together/status.js` aveva lo stesso limite
  `activityId > 78` hardcoded, sostituito con una query di esistenza reale — altrimenti lo stato
  di una 79ª attività aggiunta dall'editor non si sarebbe mai potuto salvare.
  **Disegno della privacy, verificato esplicitamente**: `GET /api/together` (pubblico) non
  include mai `private_text`, nemmeno come campo nullo — confermato via chiamata diretta
  contando i campi (`0` su 77 righe). Solo due strade per raggiungere quel testo: (1)
  `GET /api/together/activities`, dietro `content.edit` (quindi admin), usata solo per
  precompilare il form di modifica lato `cose-insieme.ts`, mai per il rendering della lista
  pubblica; (2) `POST /api/together/unlock`, invariato nella logica (stesso set di risposte
  accettate, normalizzazione identica), ora legge da D1 invece che dall'array statico. Verificato
  con un account `member` appena creato: `403` su `/api/together/activities`, `200` su
  `/api/together`, e l'unlock con la risposta corretta restituisce comunque le 12 parti private
  (il gate è basato sulla risposta, non sul ruolo — comportamento invariato, Desy è la
  destinataria di quel contenuto). Verificato in browser: `0` testi privati visibili prima dello
  sblocco, `12` dopo. CRUD admin testato via API diretta: creazione (id 79, oltre il vecchio
  limite fisso), modifica, impostazione stato, eliminazione con pulizia dello stato orfano
  collegato, tornato esattamente a 77/77. Rimosso `functions/api/together/_data.js` (l'array
  statico), non più importato da nessun endpoint.
  **Restano da fare**: Cruciverba (100 definizioni con coordinate, zero margine di errore) e
  Bacheca (la più complessa, due fonti JSON da unificare prima) sono le ultime due raccolte
  strutturate del piano.
- [x] Fix: gap trovato rileggendo il piano — avevo eliminato `calendar.json`, `recipes.json`,
  `stories.json`, `map.json` e `_data.js` senza mai creare l'"export di sicurezza" che il piano
  richiede esplicitamente prima di rimuovere una vecchia fonte (criterio di completamento della
  prima milestone, Fase 8). I dati restavano recuperabili dalla cronologia git, ma la procedura
  del piano non era stata seguita. Aggiunto `GET /api/export` (`functions/api/export/`, dietro
  `content.edit`): dump JSON di tutte le tabelle CMS (`content_entries`/`content_versions`,
  `calendar_events`, `recipes`, `stories`, `cuffiette_songs`, `map_destinations`,
  `together_activities` — quest'ultima **con** `private_text`, è un backup per l'autore, non un
  endpoint pubblico, resta comunque dietro lo stesso permesso admin di ogni altra azione). Link
  "⬇️ Esporta backup di sicurezza" in `/contenuti`. Prodotto un export reale per colmare
  retroattivamente il gap (29 content_entries, 29 eventi calendario, 13 ricette, 4 storie, 9
  canzoni, 7 destinazioni, 77 attività — tutti i conteggi coincidono con quanto migrato finora).
  Il file resta fuori da git (`backups/` in `.gitignore`): contiene anche il testo NSFW privato
  dell'Agenda, non ha senso concentrarlo in un unico file facilmente individuabile in un
  repository, anche se lo stesso contenuto era già in chiaro nella cronologia di `_data.js`.
- [x] Decisioni #2-#6 dell'inventario (`documentazione/cms/inventario-contenuti.md`) prese da Rory/Codex:
  separare contenuto e navigazione nelle card del Mondo Bianco; Mappamondo modificabile con
  editor strutturato; GDR ampliabile ma con editor dedicato futuro (non il semplice editor di
  paragrafi), Messaggio Criptato invece concluso e permanentemente nel codice;
  `bacheca-layout.json` confermato come sola fonte strutturale; supporto minimo a link interni
  da aggiungere a `EditorialText` prima di migrare `songsIntroduction`. Sbloccano: Mappamondo
  (introduzione + scene), card del Mondo Bianco (nome/descrizione), playlist/parole
  rubate/`songsIntroduction` delle Cuffiette (dopo il supporto ai link), Bacheca. Restano fuori
  scope: GDR e Linguaggio Segreto (nessun editor dedicato ancora costruito).
- [x] CMS (`documentazione/cms/planning-editor-contenuti.md`, Fase 7 — settimo editor dedicato: il Mappamondo,
  decisione #3 dell'inventario): su `feature/content-editor`. La collezione più delicata sul
  piano della fedeltà del testo: non un elenco di paragrafi come Storie/Mappa, ma dialoghi con
  tag "R:"/"D:" a volte incorporati nello **stesso paragrafo** insieme alla narrazione (scena
  "Dentro": "...con la mano e un piccolo inchino dico R: 'Prego! Ovviamente prima le donne'").
  Un editor a paragrafi semplici avrebbe appiattito questa distinzione — fermato e chiesto
  esplicitamente a Rory come procedere prima di rischiare di degradare un testo scritto con
  cura. Progettato un formato dedicato: ogni riga di ogni scena è una lista di "segmenti"
  `{speaker: null|"r"|"d", text}`, quasi sempre un solo segmento per riga, più di uno solo nei
  paragrafi misti. Tabella `mappamondo_scenes` (migrazione 0054), 7 scene importate
  trascrivendo `mappamondo.html` (migrazione 0055) — verificato che il paragrafo misto della
  scena "Dentro" sia arrivato con due segmenti distinti, non fuso in uno. Editor admin con un
  piccolo form per riga (select narrazione/R/D + testo, aggiungi/rimuovi riga, aggiungi
  segmento nella stessa riga) invece di una textarea libera, per evitare che un admin scriva
  markup a mano. **Verificato in browser**: 7 scene, 14 tag speaker totali, il paragrafo misto
  della scena "Dentro" renderizza esattamente come "narrazione... R: \"battuta\"" nello stesso
  `<p>`, l'immagine del mappamondo resta posizionata tra la scena 6 e la 7 (non dentro la card,
  serviva un `@if` sul fratello precedente, non dentro il loro contenuto).
  `mondo-bianco.canzone.citazione` (versi con `<br>`) e `mappamondo.introduzione` (non un testo
  isolato ben definito, l'eyebrow resta strutturale) restano fuori, stessa cautela di sempre sui
  contenuti con formattazione non banale.
  **Restano da fare**: card del Mondo Bianco, supporto a link interni in `EditorialText` +
  Cuffiette (playlist/parole rubate/`songsIntroduction`), Cruciverba, Bacheca.
- [x] CMS: supporto minimo ai link interni in `EditorialText` (decisione #6 dell'inventario) e
  completamento delle Cuffiette. `EditorialText` ora riconosce solo la sintassi esplicita
  `[etichetta](/rotta)` — mai HTML libero, mai URL esterni (la regex richiede `/` iniziale) —
  escapando prima tutto il resto del paragrafo e sostituendo solo i match con un vero `<a>`;
  template passato da interpolazione a `[innerHTML]` con `DomSanitizer.bypassSecurityTrustHtml`
  sull'esito già escapato, sia in lettura sia nell'anteprima di modifica. Migrate le ultime 3
  chiavi delle Cuffiette (migrazione 0056): `cuffiette.playlist.introduzione` e
  `cuffiette.canzoni.introduzione` (`history`), `cuffiette.parole-rubate.introduzione`
  (`replace`) — quest'ultima aveva `[ 🌈 I Ponti ]` nella vecchia notazione a mano gestita da
  `cuffiette.ts`, convertita in `[🌈 I Ponti](/ponti)` durante la migrazione. Rimossi da
  `cuffiette.ts` il `computed` `songsIntroductionHtml` e il metodo `renderSongsIntroduction` —
  il caso speciale non serve più, lo gestisce il componente condiviso. `music.json` alleggerito
  di altri tre campi (restano solo `playlist.name/url`, `bonus`, le citazioni di
  `stolenWords.items`). Verificato in browser: il link renderizza come `<a href="/ponti">🌈 I
  Ponti</a>` vero (non più testo con parentesi quadre), tutte e 3 le introduzioni visibili.
  **Restano da fare**: card del Mondo Bianco, Cruciverba, Bacheca.
- [x] CMS (`documentazione/cms/planning-editor-contenuti.md`, Fase 7 — card del Mondo Bianco, decisione #2
  dell'inventario): su `feature/content-editor`. A differenza delle altre raccolte, qui
  l'insieme delle card è fisso — emoji, rotta, ordine e disponibilità restano hardcoded in
  `mondo-bianco.ts` (`PLACES`, un array readonly), solo nome e descrizione sono contenuto
  editoriale. Per questo la tabella `mondo_bianco_cards` (migrazione 0057) e l'API
  (`functions/api/mondo-bianco-cards/`) hanno solo GET e PUT — niente POST/DELETE/riordino, non
  avrebbe senso: aggiungere o togliere una card è comunque una modifica di codice. 14 card
  importate con il nome attuale (migrazione 0058, `description` parte `NULL`: non esisteva già
  prima). Il template ora fa `@for` sull'array fisso arricchito dai nomi/descrizioni dal
  server, con un pulsante ✏️ per card in modalità admin. **Verificato in browser**: 14 card, 14
  pulsanti di modifica, salvataggio di nome+descrizione riflesso subito, e soprattutto il
  `routerLink` verso `/bacheca` ancora funzionante dopo la modifica — la rotta non passa mai
  dall'editor, resta quella hardcoded nell'array `PLACES`.
  **Restano da fare**: solo Cruciverba e Bacheca, le ultime due raccolte del piano.
