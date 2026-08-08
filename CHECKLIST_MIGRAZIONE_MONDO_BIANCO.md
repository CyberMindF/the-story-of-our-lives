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

- [ ] **Migrare la pagina La Mappa.** Importare Thailandia, Oslo, Sharm el-Sheikh, Olanda, Roma e la prossima meta, con immagini e testi disponibili sia in vista visuale sia in lista accessibile.

- [ ] **Migrare la pagina Le Cuffiette.** Strutturare playlist, nove brani, introduzioni, testi, `Parole Rubate` e bonus, usando player accessibili e caricamento progressivo.

- [ ] **Migrare la pagina I Ponti in modalità fedele.** Riprodurre metafora Bifrost, quattro destinazioni e testi originali mantenendo temporaneamente i collegamenti Google verificati.

- [ ] **Migrare Il Tavolo da Gioco in modalità fedele.** Portare introduzione, regolamento, statistiche, Stress, Magia e abilità, lasciando inizialmente il gioco come contenuto informativo.

- [ ] **Integrare il cruciverba nel Tavolo da Gioco.** Aggiungerlo all'elenco dei giochi, verificare apertura diretta protetta, ritorno al Tavolo e conservazione dei progressi esistenti.

- [ ] **Creare una pagina 404 interna.** Fornire un ritorno sicuro al Mondo Bianco, senza esporre dettagli tecnici e senza perdere lo stato di autenticazione.

- [ ] **Implementare i redirect legacy.** Reindirizzare vecchi URL e short link controllabili alle nuove route, evitando catene di redirect e collegamenti rotti.

## P2 - Archivi personali e media

- [ ] **Configurare R2 privato.** Prima di importare la Bacheca o qualsiasi nota vocale, video personale o audio riservato, creare bucket e binding, definire convenzioni per originali, thumbnail e versioni ottimizzate e predisporre un endpoint autenticato o URL firmati a breve scadenza.

- [ ] **Migrare la struttura della Bacheca dei Ricordi.** Creare periodi, giornate, screenshot, video e altri ricordi con un indice funzionante e URL/ancore stabili.

- [ ] **Importare i 130 media della Bacheca in R2.** Conservare originali, ordine e associazioni alle didascalie, generando versioni leggere senza sostituire i file sorgente.

- [ ] **Creare la galleria protetta della Bacheca.** Implementare thumbnail, lazy loading, lightbox accessibile, navigazione touch e controllo server su ogni media.

- [ ] **Migrare le didascalie della Bacheca.** Collegare ogni testo alla fotografia corretta e verificare manualmente le sequenze di Settembre, Maggio, screenshot e bonus.

- [ ] **Migrare i video della Bacheca.** Verificare i contenuti YouTube/Drive, scegliere embed protetto o link esterno e gestire indisponibilità e permessi mancanti.

- [ ] **Ottimizzare le immagini simboliche delle pagine.** Generare formati e dimensioni responsive preservando originali, composizione e qualità visuale.

- [ ] **Proteggere l'MP3 bonus delle Cuffiette.** Servirlo tramite R2 o endpoint autenticato, impedendo che il percorso statico pubblico aggiri il Portone.

- [ ] **Definire testi alternativi e descrizioni media.** Aggiungere alt text utile senza esporre informazioni private nelle pagine o risposte non autenticate.

## P3 - Funzionalità riprogettate

- [ ] **Creare La Cassetta delle Lettere interna.** Consentire upload autenticato in R2, messaggio opzionale, stato ricevuto e cancellazione logica senza dipendere dalla convenzione manuale su Drive.

- [ ] **Creare l'archivio delle lettere.** Conservare mittente, destinatario, data, stato e allegati in D1/R2, separando lettura, ricevuta e cancellazione logica.

- [ ] **Progettare la Chat dei Ponti.** Sostituire il Google Doc con comunicazione asincrona protetta, definendo prima conservazione, modifica, cancellazione e notifiche.

- [ ] **Migrare `Se ti sentirai sola e avrai bisogno di me`.** Recuperare il documento esterno, conservarne una copia autorizzata e presentarlo come contenuto interno versionato.

- [ ] **Migrare il documento Bifrost.** Recuperare il contenuto esterno e trasformarlo in uno spazio interno coerente con I Ponti.

- [ ] **Recuperare Il Prezzo della Verità.** Acquisire e inventariare la campagna esterna non presente nell'export prima di progettare il gioco persistente.

- [ ] **Implementare lo stato del personaggio GDR.** Salvare Mente, Cuore, Corpo, Magia, Stress, abilità e scena corrente in D1.

- [ ] **Implementare i turni play-by-chat.** Consentire invio e risposta dei turni, cronologia permanente, tiri d8 e stato della scena senza automatizzare il ruolo del master.

- [ ] **Consentire l'aggiunta controllata di date.** Aggiungere nuove ricorrenze senza modificare quelle originali, registrando autore e data di creazione.

- [ ] **Consentire l'aggiunta controllata di mete.** Aggiungere una nuova puntina con testo e media mantenendo distinta la mappa originale dagli aggiornamenti.

- [ ] **Consentire l'aggiunta controllata di storie.** Supportare bozze e pubblicazione senza sovrascrivere le quattro storie originali.

- [ ] **Consentire l'aggiunta controllata di ricordi.** Aggiungere periodi, giornate, media e didascalie con ordinamento esplicito e audit delle modifiche.

- [ ] **Implementare una ricerca globale protetta.** Cercare in titoli, date, storie, canzoni, mete e ricordi senza indicizzare o restituire contenuti a utenti non autorizzati.

## P4 - Telemetria, qualità e rilascio

- [ ] **Estendere gli eventi al Mondo Bianco.** Registrare aperture significative di hub e pagine usando il sistema `events`, senza duplicare stato o contenuti.

- [ ] **Aggiungere eventi media essenziali.** Registrare volontariamente riproduzione/completamento dei brani e apertura delle raccolte, evitando tracking di scroll, tasti o singole foto caricate automaticamente.

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


IDEA
Fare una pagina dove lei può lasciare un messaggio o una lettera o anche io. Questa appare proprio come una lettera, quindi scritta in "corsivo" e nel finale c'è scritto il nostro "nick" o nome, da vedere. Tipo "~ Desy", in basso a destra.
