# Checklist di migrazione del Mondo Bianco

Checklist operativa derivata da `ANALISI_MONDO_BIANCO_ORIGINALE.md`. Le attività sono ordinate per priorità e dipendenze. Ogni checkbox rappresenta una pagina o una funzionalità che può essere sviluppata e verificata indipendentemente.

## Regole del nuovo flusso

- Il Portone e l'interfaccia di autenticazione diventano un'unica esperienza.
- Se l'utente apre il sito senza una destinazione specifica, dopo l'accesso entra nel Mondo Bianco, che diventa la home autenticata.
- Il cruciverba non è più la home: diventa un gioco interno protetto del Tavolo da Gioco.
- Se l'utente apre direttamente una pagina interna, dopo login completo o conferma della sola Chiave torna alla pagina richiesta.
- Una sessione server valida determina se basta la Chiave; una sessione assente o scaduta richiede le credenziali complete e la Chiave.
- Pagine, API e media personali devono essere protetti anche sul server; nascondere soltanto l'interfaccia non è sufficiente.
- Foto personali, note vocali, video privati e allegati sono protetti per impostazione predefinita; immagini decorative e asset grafici dell'interfaccia possono restare pubblici nel frontend.
- Le pagine narrative e visualmente uniche conservano il contenuto in HTML; JSON è riservato alle collezioni ripetitive da ordinare, filtrare o renderizzare. I contenuti originali migrati non vengono salvati in D1.

## P0 - Fondazioni bloccanti

- [X] **Congelare la fonte originale.** Conservare l'export Notion come riferimento immutabile, registrare hash e quantità degli asset e impedire che la migrazione sovrascriva i file originali.

- [X] **Definire la mappa delle route.** Assegnare uno slug stabile a Portone, hub, cruciverba e ogni luogo, includendo la corrispondenza con URL Notion e short link precedenti.

- [X] **Separare la home dal cruciverba.** Spostare l'applicazione su una route figlia del Tavolo da Gioco senza perdere salvataggi, autenticazione, telemetria o funzionamento desktop/mobile.

- [X] **Unificare Portone e autenticazione.** Trasformare il Portone nella schermata reale di registrazione, login e conferma della Chiave, conservando immagine, metafora, testo e indizio ma rimuovendo la decifratura manuale tramite Browserling.

- [X] **Impostare il Mondo Bianco come home autenticata.** In assenza di `returnTo`, qualsiasi registrazione, login o sblocco riuscito deve aprire l'hub e non il cruciverba.

- [X] **Completare il redirect post-accesso.** Se l'accesso nasce da una pagina interna, conservare pathname, query e hash, validare che la destinazione sia interna e tornarvi dopo login o sola Chiave.

- [X] **Proteggere tutte le pagine interne.** Applicare un guard condiviso che distingua sessione scaduta, sessione valida ma Chiave non confermata e scheda già sbloccata, senza mostrare contenuti durante il controllo.

- [X] **Definire il comportamento del logout.** Revocare logicamente la sessione, rimuovere lo sblocco della scheda e riportare al Portone; se il logout parte da una pagina interna, non riaprire automaticamente quella pagina senza un nuovo accesso.

- [X] **Definire il modello di autorizzazione dei media.** Conservare pubblici nel frontend gli asset decorativi e strutturali; servire foto personali, note vocali, video privati e allegati da storage non pubblico esclusivamente dopo una verifica server della sessione.

- [X] **Definire la convenzione dei contenuti.** Usare HTML per hub, Portone e racconti con composizione unica e JSON versionato per calendari, gallerie, playlist e altre raccolte ripetitive. D1 resta limitato ad autenticazione, progresso, telemetria e altre funzioni applicative già deliberate; qualsiasi futura gestione dei contenuti dal sito richiederà una decisione separata. Definire lo schema JSON specifico quando si migra ciascuna raccolta.

- [X] **Separare il JavaScript condiviso.** Organizzare autenticazione, API, redirect, visite e temi in moduli ES riutilizzabili, lasciando al cruciverba un entry point dedicato.

- [X] **Creare un importatore verificabile dell'export.** Estrarre testi, collegamenti e associazioni ai media senza correggere automaticamente il contenuto originale, registrando hash e file mancanti in un report locale non pubblicato.

- [X] **Verificare tutte le dipendenze esterne.** Controllare destinazione e raggiungibilità di link e risorse tecniche SoundCloud, YouTube, Drive, Docs, Browserling, CDNJS e short link, conservando il dettaglio degli URL fuori dal repository.

## P1 - Nucleo navigabile

- [X] **Migrare la pagina Il Mondo Bianco.** Creare l'hub con testo di benvenuto, immagine principale, citazione, canzone e gli otto luoghi originali, attivando i collegamenti interni man mano che le rispettive pagine vengono migrate e senza aggiungere il cruciverba come nono luogo.

- [X] **Migrare la pagina Il Mappamondo.** Conservare integralmente il racconto fondativo R/D, l'immagine del globo e l'accompagnamento, presentandolo come prologo leggibile e responsive.

- [X] **Completare la shell condivisa del Mondo Bianco.** Partendo da atmosfera, temi, autenticazione, saluto e logout già condivisi, aggiungere ritorno all'hub, stato di caricamento e cornice comune usando hub e Mappamondo come casi reali.

- [ ] **Progettare la navigazione responsive.** Dopo aver definito l'hub e una seconda pagina reale, rendere raggiungibili luoghi e ritorno alla home su desktop e telefono mantenendo orientamento e accessibilità.

- [X] **Migrare la pagina Il Calendario.** Trasformare le 27 date originali in una timeline strutturata, ordinata e mobile-first, preservando testo e ricorrenze senza aggiungere date automaticamente.

- [X] **Migrare la pagina Le Storie.** Importare le quattro storie con titolo, data, testo e immagini, offrendo indice e modalità di lettura senza alterare la voce originale.

- [X] **Migrare la pagina La Mappa.** Importare Thailandia, Oslo, Sharm el-Sheikh, Olanda, Roma e la prossima meta, con immagini e testi disponibili sia in vista visuale sia in lista accessibile.

- [X] **Migrare la pagina Le Cuffiette.** Strutturare playlist, nove brani, introduzioni, testi, `Parole Rubate` e bonus, usando player accessibili e caricamento progressivo. Il bonus resta indicato ma non viene esposto finché non sarà trasferito nello storage privato previsto in P2.

- [X] **Migrare la pagina I Ponti in modalità fedele.** Riprodurre metafora Bifrost, quattro destinazioni e testi originali mantenendo temporaneamente i collegamenti Google verificati. Controllare la Sezione in fondo a questo documento per le idee. Quando la pagina esiste, collegare anche il richiamo "I Ponti" già evidenziato (senza link) nell'introduzione delle canzoni in Le Cuffiette (`assets/js/music/main.js`, `renderSongsIntroduction`).

- [X] **Migrare Il Tavolo da Gioco in modalità fedele.** Portare introduzione, regolamento, statistiche, Stress, Magia e abilità, lasciando inizialmente il gioco come contenuto informativo. Pensare però a una visualizzazione che possa successivamente accogliere giochi avventure e altro rendedo il tavolo da gioco una sorta di "hub" dei giochi

- [X] **Integrare il cruciverba nel Tavolo da Gioco.** Aggiungerlo all'elenco dei giochi, verificare apertura diretta protetta, ritorno al Tavolo e conservazione dei progressi esistenti.

- [X] **Creare una pagina 404 interna.** Fornire un ritorno sicuro al Mondo Bianco, senza esporre dettagli tecnici e senza perdere lo stato di autenticazione.

- [X] **Implementare i redirect legacy.** Reindirizzare vecchi URL e short link controllabili alle nuove route, evitando catene di redirect e collegamenti rotti. Implementato in `_redirects` (Cloudflare Pages): 7 alias permanenti (301) con lo stesso slug dei vecchi short link `rsgmsfcfm.short.gy/<slug>`, più `la-bacheca` temporaneo (302) verso l'hub finché quella pagina non esiste. **Azione manuale da fare su short.gy**: aggiornare ogni short link facendolo puntare a `https://<dominio-reale>/<slug>` (stesso slug, nuovo dominio) invece del vecchio URL Notion — non è automatizzabile da qui perché short.gy è un servizio esterno. Esclusi `dthc` (playlist Spotify) e `gdr` (documento esterno de Il Prezzo della Verità): non sono link di navigazione tra pagine, restano collegamenti diretti ai contenuti esterni.

## P2 - Archivi personali e media

- [X] **Configurare R2 privato.** Prima di importare la Bacheca o qualsiasi nota vocale, video personale o audio riservato, creare bucket e binding, definire convenzioni per originali, thumbnail e versioni ottimizzate e predisporre un endpoint autenticato o URL firmati a breve scadenza. Bucket `the-white-world-media` creato da Rory su Cloudflare (privato, nessun dominio pubblico); binding `MEDIA` in `wrangler.toml` (dev e produzione). Endpoint `GET /api/media/<percorso>` verificato: 401 senza sessione, 400 su path traversal, 404 su oggetto assente, 200 con contenuto e content-type corretti quando autenticato. Convenzione percorsi (`<sezione>/<id>/original|web|thumb/<file>`) documentata nel README.

- [X] **Migrare la struttura della Bacheca dei Ricordi.** Creare periodi, giornate, screenshot, video e altri ricordi con un indice funzionante e URL/ancore stabili. Struttura ricostruita automaticamente da `scripts/build-bacheca-content.mjs`, che cammina l'HTML originale nel suo ordine reale (non lo riscrive a mano) e produce `content/bacheca.json`. Indice in cima alla pagina con 12 ancore reali (`#settembre-giorno-1`, ecc.) — risolve il bug dei link rotti dell'originale.

- [X] **Importare i 130 media della Bacheca in R2.** Conservare originali, ordine e associazioni alle didascalie, generando versioni leggere senza sostituire i file sorgente. 130/130 originali caricati su `the-white-world-media` (verificato un file a campione: dimensione identica byte per byte all'originale). 130/130 miniature (480px) generate con `sharp` e caricate sotto `.../thumb/`. File sorgente dell'export non toccati.

- [X] **Creare la galleria protetta della Bacheca.** Implementare thumbnail, lazy loading, lightbox accessibile, navigazione touch e controllo server su ogni media. Foto raggruppate per riga originale (non per intera giornata: prima versione mescolava foto e didascalie di righe diverse in un'unica griglia, corretto dopo feedback dell'08/08/2026 — vedi `scripts/build-bacheca-content.mjs`, marcatori "row-boundary" sui `column-list` di Notion), ogni gruppo con la sua didascalia nello stesso riquadro visivo (`.bacheca-unit`). `loading="lazy"` sulle miniature, lightbox con `<dialog>` nativo (focus trap incluso), tastiera (frecce), swipe touch, chiusura su click esterno, navigazione precedente/successiva limitata al gruppo corrente. Ogni foto passa da `/api/media/`, mai da un percorso statico.

- [X] **Migrare le didascalie della Bacheca.** Collegare ogni testo alla fotografia corretta e verificare manualmente le sequenze di Settembre, Maggio, screenshot e bonus. L'abbinamento non è dedotto: viene letto direttamente dalla struttura `<figcaption>` di Notion quando presente, altrimenti il testo libero resta nell'ordine esatto in cui appare nel documento originale, intervallato alle foto a cui si riferiva visivamente. Verificato a mano un caso complesso (blocco "queste 4 foto" nel terzo giorno di Settembre): combacia esattamente col codice sorgente. Non è stata fatta una revisione visiva di tutte le 130 foto una per una: vale la pena che Rory/Desy diano un'occhiata dal vivo, sono gli unici che possono davvero confermare foto per foto.

- [X] **Migrare i video della Bacheca.** Verificare i contenuti YouTube/Drive, scegliere embed protetto o link esterno e gestire indisponibilità e permessi mancanti. Scelto il link esterno (come per I Ponti e Il Prezzo della Verità), non l'embed: sono contenuti su Drive personali, non pubblici. Nessuna gestione speciale di link non più raggiungibili (si comporta come un link esterno qualunque) — coerente con le altre pagine, ma da tenere presente se in futuro si vuole di più.

- [ ] **Ottimizzare le immagini simboliche delle pagine.** Generare formati e dimensioni responsive preservando originali, composizione e qualità visuale.

- [X] **Proteggere l'MP3 bonus delle Cuffiette.** Servirlo tramite R2 o endpoint autenticato, impedendo che il percorso statico pubblico aggiri il Portone. Caricato su `cuffiette/bonus/bonus.mp3` (stesso bucket/endpoint della Bacheca), sezione Bonus visibile solo quando `data.bonus.available`. Verificato: 401 senza sessione, 200 con sessione e dimensione byte-per-byte identica all'originale.

- [X] **Definire testi alternativi e descrizioni media.** Aggiungere alt text utile senza esporre informazioni private nelle pagine o risposte non autenticate. Verificate tutte le immagini statiche e generate da JS del sito: hero delle pagine, Storie, Mappa, Bacheca (didascalia reale come alt quando esiste, fallback generico altrimenti). Nessun buco trovato — erano già state curate pagina per pagina durante la costruzione.

## P3 - Funzionalità riprogettate

- [X] **La Cassetta delle Lettere → diventa la pagina "lettera".** Decisione dell'08/08/2026: la Cassetta originale (upload manuale su Drive con emoji come ricevuta) serviva perché allora non potevano parlarsi in chat normale ed era l'unico modo per scambiarsi foto/messaggi. Ora che si sentono su WhatsApp, quella necessità non c'è più. Non ricostruito il drop-box di file: implementata come `/lettere/` — solo testo per ora (niente allegati, valutabile in futuro via R2), più lettere nel tempo (non una sola).

- [X] **Archivio delle lettere.** Conseguenza diretta del punto sopra: `letters` in D1 (autore, testo, data, `read_at`). Con solo due account non serve un destinatario esplicito: chi non ha scritto è automaticamente chi riceve. `GET/POST /api/letters` + `POST /api/letters/:id` per segnare come letta (solo se chi apre non è l'autore). Verificato con due utenti reali: la lettera scritta da uno risulta "da leggere" per l'altro finché non la apre, poi lo stato si aggiorna. Vista di lettura in stile foglio di carta chiaro, corsivo, firma "~ [nickname]". Raggiungibile da I Ponti: la card "La Cassetta delle Lettere" (che non serve più come upload manuale) ora porta a `/lettere/` con link interno ("Entra →" invece di "Vai ↗", per distinguerla dalle altre tre card esterne). Deciso l'08/08/2026 di riusare posti già esistenti nella navigazione invece di aggiungere nuovi ingressi diretti dall'hub, per non appesantire l'esplorazione.

- [X] **Progettare la Chat dei Ponti.** Confermato l'08/08/2026: si vuole spostare qui, comunicazione asincrona, ma deve essere curata visivamente (non un semplice form). Ancora da progettare conservazione, modifica, cancellazione e notifiche prima di costruirla.

- [WON'T DO] **Migrare `Se ti sentirai sola e avrai bisogno di me`.** Deciso l'08/08/2026: non si migra. È un documento storico di circa 420 pagine, ancora in aggiornamento attivo, usato anche per chattare in passato — non ha senso spostarlo qui. Resta un Google Doc esterno collegato da I Ponti, come già fatto in modalità fedele.

- [WON'T DO] **Migrare il documento Bifrost.** Deciso l'08/08/2026, legato al punto sopra: Bifrost era solo un documento di backup ("non si sa mai") per `Se ti sentirai sola e avrai bisogno di me`. Visto che quello resta esterno, non ha senso migrare nemmeno il suo backup. Resta un Google Doc esterno collegato da I Ponti.

- [ ] **Recuperare Il Prezzo della Verità.** Acquisire e inventariare la campagna esterna non presente nell'export prima di progettare il gioco persistente. Contesto raccolto l'08/08/2026: l'avventura era un documento Google usato come "play-by-chat" manuale (Rory scriveva la scena, inseriva link/immagini dentro il documento stesso, Desy rispondeva nello stesso posto); ambientazione a tema scuola di magia (da qui l'emoji 🪄 scelta invece del generico 🐉, riservato alla categoria "Gioco di Ruolo"). Rory deve ancora mostrare il documento originale/screenshot per capire struttura reale (scene, immagini, bivi) prima di decidere se: (a) restare un documento esterno collegato, (b) diventare contenuto interno versionato letto in sola lettura, oppure (c) diventare la prima vera avventura del gioco persistente (stato personaggio + turni). Decisione da prendere insieme, non bloccare le altre pagine per questo.

- [ ] **Aggiungere la seconda avventura del Gioco di Ruolo.** Rory ha già pronta una seconda storia giocabile, con un regolamento diverso da `Il Prezzo della Verità` (non condividono lo stesso sistema di regole). Struttura già pronta ad accoglierla: `tavolo-da-gioco/gdr/index.html` elenca le avventure in `.tavolo-games-grid-compact` (oggi solo IPDV), ognuna con pagina propria (`tavolo-da-gioco/gdr/<slug>/index.html`) che contiene testo introduttivo e regolamento specifici, sul modello di `tavolo-da-gioco/gdr/il-prezzo-della-verita/`. Non condividere il regolamento tra le due: ognuna tiene il proprio. Aspettare titolo, testo e regole da Rory prima di crearla.

- [ ] **Implementare lo stato del personaggio GDR.** Salvare Mente, Cuore, Corpo, Magia, Stress, abilità e scena corrente in D1.

- [ ] **Implementare i turni play-by-chat.** Consentire invio e risposta dei turni, cronologia permanente, tiri d8 e stato della scena senza automatizzare il ruolo del master.

- [ ] **Consentire l'aggiunta controllata di date.** Aggiungere nuove ricorrenze senza modificare quelle originali, registrando autore e data di creazione.

- [ ] **Consentire l'aggiunta controllata di mete.** Aggiungere una nuova puntina con testo e media mantenendo distinta la mappa originale dagli aggiornamenti.

- [ ] **Consentire l'aggiunta controllata di storie.** Supportare bozze e pubblicazione senza sovrascrivere le quattro storie originali.

- [ ] **Consentire l'aggiunta controllata di ricordi.** Aggiungere periodi, giornate, media e didascalie con ordinamento esplicito e audit delle modifiche.

- [ ] **Implementare una ricerca globale protetta.** Cercare in titoli, date, storie, canzoni, mete e ricordi senza indicizzare o restituire contenuti a utenti non autorizzati.

## P4 - Telemetria, qualità e rilascio

- [ ] **Risolvere la frattura stilistica tra Mondo Bianco e cruciverba.** Segnalato l'08/08/2026: entrando nel cruciverba dal Tavolo da Gioco sembra di finire su un sito diverso. Causa: il cruciverba usa `assets/css/components/shell.css` con pannelli chiari/scuri e variabili proprie (`--panel-color`, `--text-color`, `--muted-color`, ecc.) selezionabili tramite i 4 temi in `themes.css` (Ocean, Velvet, Red of You, Green of Me); le pagine del Mondo Bianco invece hanno una palette fissa "notturna" (blu scuro, stelle, oro) quasi tutta hardcoded nei rispettivi `assets/css/pages/*.css`, senza selettore tema visibile. Due direzioni possibili, da decidere insieme prima di implementare (non farlo di corsa, è un refactoring importante che tocca molti file):
  1. **Aggiungere un 5° tema "the-white-world"** dentro `themes.css`/il theme-switcher del cruciverba: una variante scura coerente con l'estetica del Mondo Bianco (stelle, blu notte, oro), cosicché scegliendolo il cruciverba assomigli visivamente alle altre pagine. Impatto contenuto: nuovo blocco di variabili + voce nello switcher, nessuna modifica alle pagine mondo.
  2. **Centralizzare i temi su tutta la piattaforma**: unificare il sistema di variabili (oggi il cruciverba usa `--panel-color`/`--text-color`/ecc., le pagine mondo usano colori fissi più `--focus-color`/`--error-color` da `themes.css`) in un unico set condiviso, ed esporre lo stesso selettore tema anche nelle pagine mondo. Impatto ampio: tocca `themes.css`, `assets/css/components/*.css`, tutte le `assets/css/pages/*.css` del mondo e probabilmente il modulo JS del theme-switcher.
  Nota collegata: durante la migrazione de I Ponti/Cuffiette si era ipotizzato di relegare i 4 temi esistenti al solo cruciverba (dato che le pagine mondo non li usano già oggi) — ma il Mappamondo racconta che "il Mondo Bianco può cambiare come vogliamo", quindi un tema selezionabile anche lì avrebbe senso narrativo, non solo tecnico. Da rivalutare insieme a questa voce.

- [ ] **Estendere gli eventi al Mondo Bianco.** Registrare aperture significative di hub e pagine usando il sistema `events`, senza duplicare stato o contenuti.

- [ ] **Aggiungere eventi media essenziali.** Registrare volontariamente riproduzione/completamento dei brani, apertura delle raccolte e click sul link della playlist delle Cuffiette, evitando tracking di scroll, tasti o singole foto caricate automaticamente.

- [ ] **Aggiungere eventi di Ponti e GDR.** Registrare invio lettera, turno di gioco e altre azioni esplicite senza salvare il testo privato nei metadata.

- [ ] **Implementare una politica di privacy della telemetria.** Documentare dati, finalità e conservazione; escludere contenuti sensibili e metadata non necessari.

- [ ] **Eseguire il test di accesso diretto.** Provare ogni route con sessione assente, scaduta, valida senza Chiave e completamente sbloccata, verificando sempre il ritorno corretto.

- [ ] **Eseguire il test di protezione media.** Verificare che URL di immagini, audio e allegati personali non funzionino senza autorizzazione valida.

- [ ] **Eseguire il confronto contenuti 1:1.** Controllare testi, ordine, date, didascalie, immagini e collegamenti di ogni pagina contro l'export originale.

- [ ] **Eseguire l'audit accessibilità.** Verificare heading, focus, tastiera, dialog, player, lightbox, contrasto, alt text e screen reader su tutte le pagine.

- [ ] **Eseguire l'audit responsive reale.** Testare telefono e tablet reali, browser con barre dinamiche, tastiera virtuale, orientamento e viewport sicuro.

- [ ] **Eseguire l'audit prestazioni.** Misurare caricamento dell'hub e delle pagine pesanti, lazy loading, cache, thumbnail e consumo dati mobile.

- [ ] **Eseguire l'audit dei link esterni.** Verificare periodicamente link, permessi e fallback per servizi non disponibili.

- [ ] **Preparare backup e rollback.** Salvare D1, manifest R2 e contenuti versionati prima dell'importazione e di ogni rilascio importante.

- [ ] **Completare il rilascio progressivo.** Pubblicare prima Portone, hub e pagine in sola lettura; attivare upload, chat e gioco solo dopo test separati.

## Criterio di completamento generale

La migrazione può considerarsi conclusa quando il Portone coincide con l'accesso reale, il Mondo Bianco è la home autenticata, il cruciverba è un gioco interno del Tavolo da Gioco, ogni link diretto ritorna alla destinazione richiesta dopo l'accesso, tutti i contenuti originali risultano verificati e nessun media personale è raggiungibile senza autorizzazione server.


IDEA 1
Fare una pagina dove lei può lasciare un messaggio o una lettera o anche io. Questa appare proprio come una lettera, quindi scritta in "corsivo" e nel finale c'è scritto il nostro "nick" o nome, da vedere. Tipo "~ Desy", in basso a destra.
(08/08/2026: questa idea sostituisce La Cassetta delle Lettere in P3 — FATTA, vedi `/lettere/` e la voce in P3 per il contesto della decisione.)

IDEA 2
Sostituire l'embed SoundCloud delle Cuffiette con un player audio proprio del sito, quando i nove brani saranno ospitati direttamente (R2 o storage posseduto) invece che su SoundCloud.

IDEA 3 - FATTO (08/08/2026)
Pagina "Feedback" → implementata come `suggerimenti/` (titolo facoltativo + messaggio libero, autenticata, salvata in `world_suggestions` tramite `POST /api/suggestions`, stato `pending` da revisionare). Raggiungibile per ora solo dal bottone "Suggerisci" nella pagina 404; non è ancora un luogo dell'hub principale (non è una pagina narrativa, è un'utility). Da rivedere in futuro: dove altro linkarla, e se serve un'interfaccia per leggere/gestire le proposte ricevute.

IDEA 4 - FATTO (08/08/2026)
Aggiungere alla registrazione la possibilità di scegliere un nick/nome, invece di pescarlo dalla email. Campo facoltativo nel form; se lasciato vuoto resta il comportamento precedente (parte dell'email prima della chiocciola).

IDEA 5 - FATTO (08/08/2026)
Aggiugnere la possibilità di mettere alla registrazione una checkbox "avvisami per email se ci sono aggiornamenti". Preferenza salvata (`users.notify_email_updates`), solo alla registrazione — valutato anche di metterla al login, ma senza sapere già chi è l'utente non si può pre-spuntarla in modo affidabile, quindi scartato per ora. Nota: viene salvata solo la preferenza, l'invio vero delle email non è implementato (serve un servizio email, non ancora configurato). Idea per dopo: un modo per attivarla/disattivarla da dentro il sito una volta loggata, invece che solo in registrazione.

IDEA 6
Aggiungere anche il messaggio criptato ai giochi

IDEA 7
Aggiungere il nostro linguaggio segreto da qualche parte (magari introducendo qualcosa di speciale per i 5 cuori e per il cerchio)

IDEA 8
Aggiungere una zona dei giochi da fare insieme, con didascalia sotto. Come se fosse la lista delle mie note sul telefono ma qui, condivisa, magari anche lei può suggerire giochi o cosa da fare (a questo punto capire se solo giochi o cose da fare insieme o se farle entrambe in modo diviso). https://www.youtube.com/shorts/4jmIPLqo7Hc

TODO (La Mappa)
Aggiungere la Sicilia tra le mete (è la terra di Rory, tanti posti bellissimi). Posti già in mente: il fiume Amenano sotto l'ostello (a Catania), le Gole dell'Alcantara, i laghetti di Avola (probabilmente Cavagrande del Cassibile, le piscine naturali vicino Avola — da confermare). Altri posti naturali siciliani che potrebbero starci: Scala dei Turchi (Realmonte/Agrigento), Riserva dello Zingaro (San Vito Lo Capo), Isola Bella a Taormina, Marzamemi. Da scrivere insieme quando Rory ha i testi pronti, stesso trattamento delle altre mete (non un posto "originale" preesistente, va segnato come aggiunta).

TODO (La Mappa)
Completare Roma: nel contenuto attuale (`content/map.json`) è ancora un segnaposto quasi vuoto ("roma roma", nessuna immagine) — fedele all'originale Notion, che la lasciava incompleta apposta. Serve il testo vero da Rory prima di poterla scrivere. 
