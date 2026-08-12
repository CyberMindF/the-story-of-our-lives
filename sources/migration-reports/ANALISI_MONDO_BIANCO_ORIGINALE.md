# Analisi tecnica del Mondo Bianco originale

> **Stato:** documento storico preparatorio alla migrazione, completata il 9 agosto 2026.
> Percorsi, architettura proposta e fasi descritte qui fotografano il piano iniziale e non
> costituiscono la roadmap corrente. Per lo stato del porting vedere
> La migrazione Angular è conclusa; per le attività future vedere `prossimi sviluppi.md`.

## 1. Scopo e perimetro

Questo documento analizza l'esportazione HTML originale di Notion presente in `ExportBlock-fbd237dd-039c-4dc5-9ab4-b9f20c5dcf16-Part-1`. L'obiettivo è preservare struttura, contenuti, tono e simboli prima della migrazione nella nuova applicazione.

L'analisi riguarda ciò che è materialmente presente nell'archivio. Alcuni collegamenti conducono a SoundCloud, YouTube, Google Drive, Google Docs o pagine raggiunte tramite short link: tali contenuti esterni non fanno parte dell'esportazione e dovranno essere verificati separatamente prima della migrazione definitiva.

Non sono state apportate modifiche al codice dell'applicazione, ai dati o ai file esportati.

## 2. Sintesi dell'archivio

- 11 file HTML: 10 pagine Notion e una pagina-contenitore tecnica chiamata `Gruppo pagine`.
- 149 immagini locali: 135 JPG e 14 PNG.
- 1 allegato MP3 locale.
- Dimensione complessiva: circa 55 MiB.
- 37 collegamenti esterni rilevati.
- 296 riferimenti interni a media locali.
- Nessun media mancante, inutilizzato o duplicato per contenuto.
- Nessun database Notion esportato, form applicativo o logica JavaScript proprietaria.
- Interattività nativa limitata a link, immagini apribili e 15 blocchi `<details>`/toggle.

La Bacheca dei Ricordi concentra 130 media e circa 30 MiB. È quindi la sezione dominante sia per volume sia per sensibilità dei dati.

## 3. Architettura informativa originale

### 3.1 Percorso principale

```text
Il Portone
  -> rituale della Chiave e decifratura manuale
  -> short link del Mondo Bianco
  -> Il Mondo Bianco, pagina-hub
       -> La Bacheca dei Ricordi
       -> Il Mappamondo
       -> I Ponti
       -> Le Storie
       -> Il Calendario
       -> Le Cuffiette
       -> Il Tavolo da Gioco
       -> La Mappa
```

Quasi tutte le sezioni presentano un collegamento esplicito per tornare al Mondo Bianco. Esistono inoltre due collegamenti laterali:

- `Le Cuffiette -> I Ponti`;
- `Il Tavolo da Gioco -> Il Prezzo della Verità`, contenuto esterno non incluso nell'archivio.

La pagina `Gruppo pagine` non appartiene all'esperienza narrativa. È l'indice tecnico generato da Notion e contiene link diretti alle dieci pagine esportate.

### 3.2 Modello mentale

Il sito non è organizzato come un archivio tradizionale, ma come un luogo immaginario. Ogni categoria di contenuto viene trasformata in un oggetto o ambiente fisico:

- il Portone è accesso e riconoscimento;
- il Mondo Bianco è casa e spazio comune;
- il Mappamondo contiene il racconto fondativo del mondo;
- la Bacheca espone fotografie e ricordi;
- il Calendario conserva le date;
- le Cuffiette custodiscono musica e parole;
- i Ponti collegano luoghi di comunicazione esterni;
- la Mappa raccoglie mete e sogni di viaggio;
- le Storie conservano sogni e racconti;
- il Tavolo da Gioco apre uno spazio ludico condiviso.

Questa metafora spaziale è l'identità primaria del progetto e dovrebbe guidare il futuro hub.

### 3.3 Decisione per la nuova gerarchia

Il cruciverba non diventerà un luogo autonomo del Mondo Bianco. Sarà una delle esperienze contenute nel `Tavolo da Gioco`, insieme al gioco di ruolo e agli eventuali giochi futuri. La sua route dovrà quindi essere figlia del Tavolo da Gioco e l'hub continuerà a presentare gli otto luoghi originali senza aggiungere una nona destinazione.

### 3.4 Mappa delle route WIP

Questa mappa serve come riferimento operativo iniziale e potrà essere modificata mantenendo redirect dai percorsi precedenti.

| Route | Destinazione |
| --- | --- |
| `/` | Portone/autenticazione e ingresso al Mondo Bianco |
| `/mondo-bianco/` | Hub autenticato |
| `/mappamondo/` | Racconto fondativo |
| `/bacheca/` | Bacheca dei Ricordi |
| `/calendario/` | Calendario |
| `/cuffiette/` | Cuffiette |
| `/storie/` | Storie |
| `/ponti/` | Ponti |
| `/mappa/` | Mappa dei viaggi |
| `/tavolo-da-gioco/` | Raccolta dei giochi |
| `/tavolo-da-gioco/cruciverba/` | Cruciverba |

Il comportamento previsto distingue la route dall'accesso: una visita normale passa dal Portone e raggiunge l'hub, mentre un link diretto a una pagina protetta passa dal Portone soltanto quando necessario e poi torna alla destinazione richiesta.

## 4. Mappa completa delle pagine

### 4.1 Il Portone

**Ruolo:** ingresso rituale e verifica simbolica dell'identità.

**Contenuto:** immagine di un portone in legno circondato da rose rosse e bianche, margherite e tulipani; testo rivolto all'unica persona che dovrebbe possedere la Chiave; indizio espandibile basato su tatuaggio, bracciale, simbolo, disegno, infinito, noi ed emoji; stringa AES; collegamento a un decryptor esterno.

**Interazione:** l'utente deve intuire la Chiave, copiare il testo cifrato, aprire Browserling, decifrarlo e usare l'URL risultante. È un rituale significativo, ma tecnicamente macchinoso e dipendente da un servizio terzo.

**Destinazione verificata:** il contenuto cifrato risolve allo short link del Mondo Bianco. La Chiave non viene riportata in questo documento.

### 4.2 Il Mondo Bianco

**Ruolo:** hub centrale e benvenuto.

**Contenuto:** canzone `Il Cerchio` tramite SoundCloud, citazione del ritornello, grande immagine del mondo bianco con divano, letto, luna e cielo stellato, istruzioni per usare la visualizzazione desktop, testo di benvenuto e griglia a due colonne con otto luoghi.

**Navigazione:** tutti gli otto collegamenti usano short link esterni invece dei link Notion diretti.

**Nota:** il messaggio che consiglia il sito desktop dichiara esplicitamente il principale limite responsive dell'originale.

### 4.3 Il Mappamondo

**Ruolo:** racconto fondativo e tour narrativo del Mondo Bianco.

**Contenuto:** lungo dialogo tra `R` e `D`. R accompagna D nel mondo onirico, le chiede fiducia, mostra il Portone fiorito, rivela che il cerchio al polso è la Chiave e descrive il mondo come luogo sicuro, modificabile e sottratto alle regole esterne. Compaiono divano, letto a baldacchino, cuffiette, bacheca, calendario e mappamondo.

**Media:** immagine chiara di un globo trasparente contenente il mondo; link YouTube usato come accompagnamento esterno.

**Funzione narrativa:** questa pagina spiega perché le altre sezioni esistono. È più simile a un prologo interattivo che a una pagina informativa.

### 4.4 La Bacheca dei Ricordi

**Ruolo:** archivio fotografico e commento personale dei momenti condivisi.

**Struttura:** introduzione, indice visuale, blocco `Settembre`, blocco `Maggio`, video e altri ricordi.

**Settembre:** sei giornate del primo incontro più due fotografie bonus. Le fotografie sono spesso accompagnate da didascalie lunghe, dettagli sensoriali, ricostruzioni e osservazioni personali.

**Maggio:** tre giornate del secondo incontro e una sezione di screenshot.

**Altri contenuti:** video per i quattro anni, auguri di Natale, collegamenti YouTube/Drive, un messaggio su Google Docs, ricordi di Minecraft e The Sims, vestiti, fiori e altri simboli.

**Media:** 130 immagini locali e diversi video esterni. È la pagina più grande e più privata.

**Problema di navigazione:** i dodici link dell'indice (`Giorno 1`, `Giorno 2`, `Screenshots`, `Vai`, ecc.) puntano tutti al file della Bacheca senza un frammento di destinazione. Nell'export ricaricano quindi la pagina invece di raggiungere la sezione indicata.

### 4.5 Il Calendario

**Ruolo:** timeline delle date significative.

**Contenuto:** introduzione sul valore della memoria e 27 ricorrenze comprese tra il 17 agosto 2021 e il 27 luglio 2026. Include anniversari, regali, incontri, canzoni, nascita e creazione del Mondo Bianco, riprese di contatto e momenti condivisi.

**Pattern:** il 17 è contemporaneamente giorno dell'incontro, anniversario ricorrente e dettaglio dell'emoji calendario. Settembre è il mese dominante.

**Implementazione originale:** coppie data/testo in colonne Notion, senza ordinamento, filtri, reminder o dettaglio espandibile.

### 4.6 Le Cuffiette

**Ruolo:** archivio musicale, diario di composizione e raccolta di parole associate alla relazione.

**Struttura:** playlist esterna, richiesta personale relativa alle reazioni, sezione `Dove ti ho cercata`, nove canzoni originali o dedicate e una sezione `Parole Rubate`.

**Brani identificati:** `Il Cerchio`, `Cosa Resterà?`, `Il Porno Migliore`, `Dimmi Cosa Provi Adesso`, `Conta`, `Cosa Sei Per Me`, `Ti Amo Male`, `Resta Qui Con Me`, `Desyland`, più un MP3 bonus locale.

**Interazione:** collegamenti SoundCloud e testi completi dentro toggle. I brani sono disposti prevalentemente in coppie di colonne. Un link interno collega ai Ponti.

**Dimensione editoriale:** circa 9.000 parole, la pagina testuale più lunga. Il testo alterna introduzioni, contesto emotivo, testi delle canzoni e citazioni esterne.

### 4.7 Le Storie

**Ruolo:** raccolta di sogni, scene e narrazioni ambientate nel Mondo Bianco.

**Contenuto:** quattro storie complete dentro toggle:

1. `L'Origine del Mondo Bianco` (21/01/2026);
2. `L'Incontro nel Mondo Bianco` (18/02/2026);
3. `Il Magico Campo d'Erba` (09/04/2026);
4. `Il Lento` (17/04/2026).

Le storie sono lunghe, in prima persona o in forma dialogata, e riprendono ambienti e regole del mondo: bianco, silenzio, divano, letto, luna, musica, possibilità di incontrarsi oltre i limiti reali.

**Media:** due immagini atmosferiche; una mostra un campo azzurro luminoso sotto luna e stelle. È presente un link YouTube.

### 4.8 I Ponti

**Ruolo:** raccolta di passaggi verso strumenti di comunicazione e condivisione esterni.

**Metafora:** il Bifrost della mitologia norrena collega due mondi; il ponte arcobaleno rappresenta lo spazio di incontro oltre le regole esterne.

**Destinazioni:** documento `Se ti sentirai sola e avrai bisogno di me`, documento `Bifrost`, documento `Chat`, cartella Drive `La Cassetta delle Lettere`.

**Interazione attuale:** soltanto link verso Google Docs/Drive. La Cassetta usa una convenzione manuale: caricamento del file, emoji aggiunta al nome come ricevuta, cancellazione manuale anche dal cestino.

### 4.9 La Mappa

**Ruolo:** raccolta di viaggi desiderati e immaginati.

**Mete:** Thailandia, Oslo, Sharm el-Sheikh, Olanda, Roma e uno spazio aperto per la prossima meta.

**Contenuto:** testi personali associati a immagini di templi, natura, festival delle lanterne, aurora boreale, tulipani, Giethoorn e altri luoghi. Roma è ancora un segnaposto quasi vuoto.

**Media:** dieci immagini locali, prevalentemente fotografie di viaggio provenienti dal web.

**Evoluzione implicita:** la pagina è pensata come mappa con nuove puntine, ma l'originale è una sequenza verticale statica.

### 4.10 Il Tavolo da Gioco

**Ruolo:** introduzione a un gioco di ruolo narrativo asincrono `play-by-chat`.

**Sistema:** d8 più quattro statistiche (`Mente`, `Cuore`, `Corpo`, `Magia`), tre fasce di esito, dieci punti Stress, tre abilità speciali e tre slot Magia per scena.

**Interazione attuale:** regolamento in un toggle e short link a `Il Prezzo della Verità`. La campagna, i turni e lo stato del personaggio non sono inclusi nell'archivio.

**Potenziale:** è la funzionalità più vicina a una vera applicazione, ma nell'originale è soltanto una pagina introduttiva.

## 5. Navigazione e collegamenti

### 5.1 Navigazione interna

- Hub centrale con otto destinazioni.
- Ritorno manuale all'hub in quasi ogni pagina.
- Nessun header o menu persistente.
- Nessun breadcrumb.
- Nessuna indicazione di pagina corrente.
- Nessuna ricerca globale.
- Nessun passaggio precedente/successivo tra luoghi.
- Il Portone è esterno alla navigazione dell'hub e funziona come ingresso una tantum.

### 5.2 Dipendenze esterne

- SoundCloud: 10 link.
- Short.io (`rsgmsfcfm.short.gy`): 10 link.
- Google Drive: 6 link.
- Google Docs: 4 link.
- YouTube: 4 link complessivi fra `youtube.com` e `youtu.be`.
- Browserling: 1 link.
- CDNJS: Prism usato dal blocco di codice del Portone.

La disponibilità dell'esperienza dipende quindi da permessi Google, validità degli short link, account SoundCloud e servizi terzi. I collegamenti esterni devono essere inventariati e verificati singolarmente prima del rilascio.

## 6. Media e allegati

| Sezione | File locali | Peso approssimativo |
| --- | ---: | ---: |
| Bacheca dei Ricordi | 130 | 29,88 MiB |
| La Mappa | 10 | 5,61 MiB |
| Le Cuffiette | 2 | 4,30 MiB |
| Le Storie | 2 | 4,10 MiB |
| Il Portone | 1 | 2,29 MiB |
| Il Mondo Bianco | 1 | 2,13 MiB |
| Il Calendario | 1 | 1,75 MiB |
| Il Tavolo da Gioco | 1 | 1,74 MiB |
| Il Mappamondo | 1 | 1,63 MiB |
| I Ponti | 1 | 0,54 MiB |

Tutti i file locali sono raggiungibili da almeno una pagina. Non risultano riferimenti locali rotti né duplicati byte-per-byte.

Le immagini di sezione condividono una direzione precisa: bianco luminoso, nuvole, superfici morbide o trasparenti, bagliori, dettagli dorati e oggetti-simbolo. Il contrasto principale arriva dal cielo notturno, dalla luna, dal ponte arcobaleno e dai fiori rossi.

## 7. Elementi interattivi presenti

- Decifratura manuale del Portone tramite servizio AES esterno.
- Toggle per indizio, regolamento, storie e testi musicali.
- Link a pagine, documenti, cartelle, playlist, audio e video.
- Immagini cliccabili per visualizzazione diretta.
- Un MP3 locale scaricabile/apribile.
- Navigazione visiva a colonne.

Non sono presenti autenticazione reale, salvataggio dello stato, upload integrato, player proprietario, commenti, notifiche, ricerca, filtri, progressi, analytics applicativi o gestione editoriale strutturata.

## 8. Stile comunicativo

Il tono è fortemente personale e riconoscibile:

- seconda persona diretta, spesso esplicitamente femminile;
- prima persona vulnerabile e confessionale;
- forma dialogata `R`/`D` nelle scene narrative;
- alternanza tra passaggi poetici e oralità quotidiana;
- uso frequente di parentesi, autocorrezioni, ripetizioni, `ahaha`, `beh`, `comunque`, `forse`;
- emoji usate come segnaletica e parte del significato;
- richieste dirette alla destinataria e inviti a partecipare;
- didascalie che non descrivono soltanto le immagini, ma ricostruiscono il ricordo;
- mescolanza intenzionale di malinconia, desiderio, ironia e speranza.

La migrazione non dovrebbe normalizzare automaticamente grammatica, ripetizioni o punteggiatura. Queste caratteristiche fanno parte della voce originale. Eventuali correzioni editoriali devono essere approvate separatamente.

## 9. Simboli e pattern ricorrenti

### Simboli principali

- **Cerchio:** noi, infinito, ritorno, canzone, bracciale, Chiave e possibile tatuaggio.
- **17:** incontro, anniversario, calendario, ricorrenza e coincidenze visive.
- **Bianco:** spazio sicuro, vuoto da costruire, pace e possibilità.
- **Portone e Chiave:** accesso esclusivo, fiducia e riconoscimento.
- **Casa:** divano, letto, profumo, vicinanza e luogo a cui tornare.
- **Luna, stelle e sogni:** modalità di accesso al mondo e sospensione delle regole reali.
- **Ponti/arcobaleno:** collegamento fra due mondi e canale di comunicazione.
- **Musica e cuffiette:** parole difficili da dire direttamente e memoria emotiva.
- **Bacheca/calendario/mappa:** tre modi complementari di conservare passato, tempo e futuro.
- **Rose, margherite e tulipani:** identità, regali, ricordi e cura.
- **Settembre:** mese fondativo e centro della cronologia.

### Pattern narrativi

- distanza contro ritorno;
- mondo reale contro spazio condiviso immaginario;
- oggetti quotidiani trasformati in simboli;
- ricordo incompleto che viene ricostruito attraverso testo e media;
- invito continuo a contribuire e far crescere il mondo;
- contenuti descritti come luoghi visitabili, non come semplici categorie.

## 10. Punti deboli dell'implementazione originale

### Usabilità

- Layout desktop a colonne poco adatto al telefono; l'autore stesso consiglia la modalità desktop.
- Pagine molto lunghe, in particolare Cuffiette, Storie e Bacheca.
- Nessuna navigazione persistente o orientamento globale.
- Indice della Bacheca rotto nell'export: i link non raggiungono le relative sezioni.
- Titoli `Il Mappamondo` e `La Mappa` semanticamente vicini e potenzialmente confondibili.
- Player audio/video non uniformi e spesso sostituiti da URL grezzi.
- Nessuna gestione di caricamento, errore o contenuto esterno non disponibile.

### Manutenibilità

- Contenuti e layout sono intrecciati nell'HTML Notion.
- Ogni pagina contiene circa 20 KiB di CSS Notion duplicato.
- Nomi file includono emoji, spazi e ID Notion.
- Date, brani, storie, mete e ricordi non hanno uno schema dati riutilizzabile.
- Aggiornare indici, collegamenti e ordine richiede lavoro manuale.
- Gli short link nascondono la destinazione e introducono un ulteriore punto di guasto.

### Sicurezza e privacy

- Il rituale AES non costituisce autenticazione: protegge la scoperta del link, non i contenuti.
- Chi conosce un URL diretto può aggirare il Portone.
- Google Drive/Docs applicano permessi separati e non coordinati con il sito.
- Media personali serviti come asset pubblici resterebbero accessibili direttamente anche se la pagina HTML avesse un guard JavaScript.
- Servizi esterni ricevono richieste e metadati di navigazione.

### Accessibilità e prestazioni

- Immagini senza testi alternativi significativi.
- Gerarchia dei titoli non sempre semantica: La Mappa usa più `h1` e la pagina giochi usa un `h1` per un link.
- Lunghi muri di testo con poche ancore di navigazione.
- 55 MiB caricabili senza miniature responsive o lazy loading progettato.
- Colore, emoji e disposizione visiva sono talvolta gli unici segnali strutturali.
- Controlli e link non hanno sempre etichette descrittive (`Vai`).

## 11. Principi per una migrazione fedele

1. Conservare integralmente i testi originali in una sorgente immutabile prima di qualsiasi revisione.
2. Separare contenuto, metadati e presentazione senza rendere il tono impersonale.
3. Mantenere la metafora dei luoghi nel futuro hub.
4. Conservare simboli, nomi, ordine narrativo e relazioni fra sezioni.
5. Migliorare navigazione e mobile senza trasformare l'esperienza in un pannello amministrativo generico.
6. Non usare la telemetria per registrare lettura parola per parola o dati intimi non necessari.
7. Proteggere i media a livello server, non soltanto nell'interfaccia.
8. Distinguere contenuti originali, aggiornamenti successivi e contributi della destinataria.
9. Usare URL stabili e leggibili, mantenendo redirect dai vecchi short link quando possibile.
10. Verificare manualmente tutti i contenuti esterni prima di considerarli migrati.

## 12. Architettura proposta

### Cloudflare Pages e Functions

- Pages per shell, hub, componenti visuali e contenuti pubblicabili in modo statico.
- Pages Functions per autorizzazione, API, redirect post-login e accesso protetto ai media.
- `auth-guard.js` su ogni pagina protetta per riportare l'utente alla destinazione richiesta dopo login o Chiave.
- Controllo server obbligatorio per ogni API e per ogni file personale.

### D1

Entità suggerite, da progettare in migration successive:

- `world_pages`: slug, titolo, simbolo, ordine, stato e versione;
- `calendar_events`: data, titolo, descrizione, ordine e visibilità;
- `stories`: titolo, data narrativa, corpo, ordine e stato;
- `songs`: titolo, introduzione, testo, sorgente audio e ordine;
- `memories`: periodo, giorno, testo e ordine;
- `memory_media`: relazione con asset, didascalia e posizione;
- `destinations`: luogo, testo, stato e coordinate opzionali;
- `letters` e `letter_attachments`: contributi della Cassetta;
- tabelle dedicate allo stato del gioco di ruolo;
- `events`: soltanto azioni significative e non contenuto/progresso duplicato.

I testi lunghi possono inizialmente restare in JSON/Markdown versionato. D1 diventa utile quando devono essere aggiornati dall'applicazione, ordinati dinamicamente o collegati a contributi utente.

### R2

- Bucket privato per fotografie, screenshot, audio e futuri video.
- D1 conserva chiavi R2 e metadati, non i blob.
- Download tramite endpoint autenticato o URL firmati a breve scadenza.
- Varianti thumbnail/web ottimizzate per la Bacheca.
- Conservazione dell'originale separata dalle versioni di presentazione.

### Eventi

Eventi riutilizzabili e poco invasivi:

- `world_hub_opened`;
- `world_page_opened` con slug;
- `story_opened`;
- `song_played` e, se utile, `song_completed`;
- `memory_period_opened`;
- `destination_opened`;
- `letter_submitted`;
- `game_started` e `game_turn_submitted`.

Evitare eventi per scroll, singola fotografia visualizzata automaticamente, pressione di tasti o contenuto testuale privato non necessario.

## 13. Piano di migrazione pagina per pagina

### Fase 0 - Conservazione e inventario

- Congelare l'export originale come fonte di verità.
- Calcolare e conservare hash degli asset.
- Verificare i 37 link esterni e i relativi permessi.
- Definire slug stabili e mappatura dagli URL precedenti.
- Classificare i media come personali, esterni, generati o ripubblicabili.

### Fase 1 - Fondazioni comuni

- Creare hub, layout condiviso, navigazione mobile e desktop.
- Integrare autenticazione e ritorno alla pagina richiesta.
- Definire componenti per pagina, racconto, timeline, galleria, player e toggle.
- Creare pipeline R2 privata prima di importare fotografie personali.
- Stabilire tema visuale base coerente con bianco, nuvole, luna e bagliori.

### Fase 2 - Il Portone

- Conservare immagine, indizio e metafora della Chiave.
- Sostituire copia/decrittazione esterna con il form di accesso reale.
- Distinguere registrazione, login e sola conferma della Chiave.
- Dopo l'accesso, aprire la pagina originariamente richiesta oppure l'hub.

### Fase 3 - Il Mondo Bianco

- Trasformarlo nel nuovo hub visuale.
- Conservare testo di benvenuto, canzone, citazione e otto luoghi.
- Eliminare l'istruzione “Sito Desktop” rendendo il layout realmente responsive.
- Mostrare eventuali novità senza snaturare la sensazione di esplorazione.

### Fase 4 - Il Mappamondo

- Migrare il racconto senza riscriverlo.
- Presentarlo come prologo leggibile, eventualmente per scene progressive.
- Conservare il dialogo R/D e l'immagine del globo.
- Aggiungere navigazione verso i luoghi nominati nel racconto senza interrompere la lettura.

### Fase 5 - Il Calendario

- Convertire le 27 date in dati strutturati.
- Offrire timeline cronologica mobile-first e dettaglio espandibile.
- Prevedere aggiunta futura di date con audit e senza alterare quelle originali.
- Mantenere visibile il ruolo simbolico del 17 e di settembre.

### Fase 6 - Le Storie

- Importare le quattro storie con titolo, data, corpo e ordine.
- Mantenere una modalità raccolta e una modalità lettura dedicata.
- Salvare facoltativamente lo stato “letto”, senza trasformarlo in requisito.
- Conservare immagini e accompagnamenti esterni verificati.

### Fase 7 - Le Cuffiette

- Strutturare brani, introduzioni, testi e sorgenti audio.
- Usare un player coerente e accessibile.
- Conservare SoundCloud quando necessario; migrare in R2 soltanto audio posseduto e autorizzato.
- Distinguere chiaramente canzoni originali, playlist, bonus e `Parole Rubate`.
- Evitare il caricamento simultaneo di tutti i player e testi.

### Fase 8 - La Bacheca dei Ricordi

- Importare originali in R2 privato e generare thumbnail.
- Modellare periodi, giorni, media, didascalie e ordine.
- Ripristinare un indice funzionante con ancore o viste dedicate.
- Implementare galleria e lightbox accessibili, lazy loading e layout responsive.
- Collegare video esterni verificati senza esporre file privati.
- Preservare l'associazione esatta fra foto e testo.

### Fase 9 - La Mappa

- Convertire le mete in record strutturati.
- Offrire sia una mappa narrativa sia una lista accessibile.
- Usare coordinate soltanto dove aggiungono valore; non affidarsi esclusivamente a una mappa grafica.
- Mantenere Roma come contenuto incompleto e `prossima meta` come spazio aperto.

### Fase 10 - I Ponti

- Migrare i quattro collegamenti come prima versione fedele.
- Sostituire gradualmente Docs/Drive con lettere, chat asincrona e upload protetti.
- Conservare la metafora Bifrost e lo stato di consegna della Cassetta.
- Definire notifiche discrete e controlli di dimensione/tipo per gli allegati.

### Fase 11 - Il Tavolo da Gioco

- Migrare prima introduzione e regolamento 1:1.
- Inserire il cruciverba come gioco interno, conservandone progressi, telemetria e accesso diretto protetto.
- Recuperare separatamente `Il Prezzo della Verità`, assente dall'archivio.
- In una seconda fase modellare personaggio, statistiche, Stress, Magia, scene, tiri e turni.
- Conservare il formato asincrono e la centralità del racconto, evitando di automatizzare il ruolo del master senza una decisione esplicita.

### Fase 12 - Verifica finale

- Confronto pagina per pagina con l'export.
- Verifica ordine, testi, didascalie, media e link.
- Test mobile reale, tastiera, screen reader e connessioni lente.
- Test di accesso diretto a pagina e media senza sessione.
- Verifica redirect dai vecchi URL e comportamento dopo scadenza della sessione.

## 14. Funzionalità migrabili 1:1

- Nomi, emoji e ordine degli otto luoghi.
- Testo di benvenuto dell'hub.
- Racconto completo del Mappamondo.
- Immagini simboliche di ogni sezione.
- Citazioni e callout.
- Toggle per indizio, testi, storie e regolamento.
- Testi e ordine delle quattro Storie.
- Date e descrizioni del Calendario.
- Mete e testi della Mappa.
- Brani, introduzioni, testi e ordine delle Cuffiette.
- Periodi, giornate, fotografie e didascalie della Bacheca.
- Introduzione e regole del Tavolo da Gioco.
- Collegamenti dei Ponti, almeno come fase transitoria.
- Link audio/video esterni ancora validi.
- Collegamento di ritorno al Mondo Bianco.

## 15. Funzionalità da riprogettare

- **Portone:** da offuscamento AES manuale ad autenticazione reale, mantenendo il rituale narrativo.
- **Hub:** da griglia Notion statica a spazio responsive con orientamento coerente.
- **Protezione media:** da asset/link condivisi a R2 privato con autorizzazione server.
- **Bacheca:** da pagina monolitica a galleria strutturata per periodo e giorno.
- **Calendario:** da colonne manuali a timeline ordinabile e aggiornabile.
- **Cuffiette:** da URL grezzi a player uniforme con caricamento progressivo.
- **Storie:** da quattro enormi toggle a indice e modalità lettura.
- **Ponti:** da servizi Google scollegati a strumenti interni per lettere, file e comunicazione.
- **Mappa:** da sequenza statica a raccolta visuale di mete con stato e media.
- **Tavolo da Gioco:** da regolamento/link a esperienza asincrona persistente.
- **Navigazione:** da ritorni manuali a header, breadcrumb o mappa dei luoghi.
- **Ricerca:** introdurre ricerca locale per storie, date, canzoni e ricordi, rispettando l'autorizzazione.
- **Telemetria:** registrare soltanto aperture e azioni significative, non lettura o digitazione granulare.
- **Gestione contenuti:** separare dati e layout, mantenendo versioni e origine dei testi.
- **Accessibilità:** alt text, heading corretti, focus, player e lightbox accessibili.
- **Prestazioni:** thumbnail, formati moderni, lazy loading, cache privata e caricamento per sezione.

## 16. Decisioni da prendere prima dell'implementazione

- Se il futuro hub sostituirà il Mondo Bianco originale o lo conterrà come luogo separato.
- Se il Mappamondo resterà il prologo oppure diventerà un onboarding mostrato una volta.
- Quali media personali possono essere trasferiti e con quale politica di conservazione.
- Quali contenuti esterni sono posseduti, accessibili e autorizzati alla ripubblicazione.
- Se testi originali e futuri aggiornamenti devono essere distinguibili nell'interfaccia.
- Se la destinataria potrà aggiungere ricordi, date, mete e storie.
- Se Chat, Lettere e GDR richiedono notifiche e risposta dell'altro utente.
- Se il sito avrà uno o più utenti autorizzati e quali ruoli saranno necessari.
- Quanto della navigazione deve essere esplorabile liberamente e quanto guidato narrativamente.

## 17. Conclusione

Il Mondo Bianco originale è meno un sito e più una geografia emotiva. La tecnologia Notion ne limita navigazione, privacy, mobile e interattività, ma la struttura concettuale è già forte: ingresso, casa, luoghi, oggetti e passaggi hanno ruoli distinti e coerenti.

La nuova architettura non dovrebbe limitarsi a copiare pagine HTML. Dovrebbe conservare testi, immagini, ordine e rituali 1:1, rendendo però strutturali ciò che oggi è manuale: accesso, protezione dei media, navigazione, timeline, raccolte, upload, stato del gioco e continuità fra pagine. Cloudflare Pages, Functions, D1 e R2 permettono questa evoluzione senza cancellare l'identità originale.
