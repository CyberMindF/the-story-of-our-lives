# Planning — Editor dei contenuti del sito

## Obiettivo

Permettere a Rory di modificare direttamente dal sito testi e contenuti, aggiungerne di nuovi,
riordinare le raccolte e, dove serve, conservare più versioni dello stesso messaggio.

Il risultato deve essere un piccolo CMS interno al Mondo Bianco: semplice da usare, coerente
con il design del sito e completamente protetto sul backend. Desy continua normalmente a
leggere e a proporre modifiche tramite i Suggerimenti.

## Vincolo della branch di lavoro

Lo sviluppo descritto in questo documento deve avvenire in una branch dedicata esclusivamente
al CMS e alla centralizzazione dei contenuti.

Finché quella branch è attiva, se Rory chiede modifiche che non riguardano direttamente:

- editor e visualizzazione dei contenuti;
- migrazione e gestione dei dati editoriali;
- identità, ruoli, permessi e modalità admin;
- pannello amministrativo, suggerimenti e log;
- infrastruttura necessaria a queste funzionalità;

bisogna fermarsi prima di modificare file e avvisarlo che la richiesta è fuori dallo scope
della branch. Il lavoro estraneo va fatto soltanto dopo una sua conferma esplicita e
preferibilmente passando a `main` o a un'altra branch dedicata. Non bisogna inserire per
comodità correzioni o feature scollegate nel commit del CMS.

## Decisioni concordate

- I contenuti editoriali devono essere centralizzati nel database. Non devono rimanere divisi
  tra database, template Angular e JSON pubblici.
- Il versionamento è configurabile per singolo contenuto:
  - una modifica normale sostituisce il valore corrente;
  - una modifica storica crea una nuova versione del messaggio, lasciando consultabili anche
    quelle precedenti.
- Le versioni storiche sono visibili a entrambi, una alla volta, senza creare muri di testo.
- Non servono bozze: il salvataggio pubblica direttamente la modifica.
- Le date sono quelle reali e automatiche del salvataggio. Non serve una data editoriale
  personalizzata.
- L'editor supporta testo semplice e paragrafi. Non servono Markdown, grassetto, corsivo o
  formattazione libera.
- I controlli amministrativi compaiono soltanto dopo aver attivato esplicitamente la modalità
  admin.
- La sicurezza non può dipendere dal frontend: API, dati amministrativi e log devono essere
  protetti dal backend e non restituiti agli utenti senza permesso.
- Per le raccolte strutturate saranno creati editor dedicati, compresa una modalità semplice
  per modificarne l'ordine attraverso ID e posizione, senza richiedere drag and drop.

## Identità, ruoli e permessi

Identità e ruolo sono informazioni distinte.

### Identità

Indica chi è la persona all'interno del sito:

- `lui`
- `lei`

Può essere usata per attribuzione, colori, testi e comportamenti legati specificamente a uno
dei due. Non concede automaticamente privilegi amministrativi.

### Ruoli

Indicano il livello di accesso:

- `member`
- `admin`

Configurazione iniziale:

| Persona | Identità | Ruolo | Comportamento |
|---|---|---|---|
| Rory | `lui` | `admin` | Può attivare la modalità admin e gestire i contenuti |
| Desy | `lei` | `member` | Può leggere e proporre modifiche tramite i Suggerimenti |

### Permessi

I ruoli assegnano capacità esplicite, per esempio:

- `content.read`
- `content.edit`
- `content.create`
- `content.delete`
- `content.reorder`
- `events.view`
- `users.manage`

La prima versione può associare questi permessi ai ruoli nel codice backend, senza costruire
subito un editor visuale dei permessi. Le API verificano comunque il singolo permesso, così in
futuro sarà possibile modificare le associazioni senza riscrivere ogni endpoint.

## Modalità admin

Essere admin non rende automaticamente visibili i controlli editoriali durante la normale
navigazione. Rory deve attivare una **Modalità admin** dalla propria area profilo o da un
comando dedicato.

Quando è disattivata, il sito appare identico a quello visto da Desy. Quando è attiva può
mostrare:

- pulsanti Modifica/Aggiungi;
- controlli di riordino;
- collegamento al pannello contenuti;
- collegamento alla pagina dei log;
- informazioni tecniche utili alla gestione.

Lo stato della modalità può durare per la sessione o fino alla disattivazione manuale. Non
sostituisce i permessi: anche conoscendo l'URL o modificando il frontend, un utente senza
permesso deve ricevere `403` dal backend e nessun dato riservato.

## Visualizzazione delle versioni

Un contenuto configurato come storico mostra una sola versione alla volta. Se esistono più
versioni, sotto o accanto al testo compare un selettore discreto, per esempio:

```text
‹  Versione 1  ·  Versione 2  ·  Versione 3  ›
```

Le etichette possono essere ricavate automaticamente dalla data reale del salvataggio. La
versione più recente viene mostrata inizialmente; frecce e chip permettono a entrambi di
consultare le precedenti.

Per un contenuto non storico, il salvataggio aggiorna semplicemente il valore corrente. Per
esempio correggere il punto 4 dell'Agenda delle Idee non deve generare una nuova versione
visibile.

Quando Rory modifica un contenuto, sceglie esplicitamente tra:

- **Salva modifica** — aggiorna il contenuto corrente;
- **Aggiungi nuova versione** — conserva il testo corrente e aggiunge il nuovo messaggio alla
  cronologia.

La seconda azione compare soltanto sui contenuti per cui il versionamento ha senso.

## Modello dati indicativo

### Utenti

Estendere gli utenti con:

- `identity`: `lui` o `lei`;
- `role`: `member` o `admin`.

Una migrazione assegna esplicitamente i valori ai due account esistenti. Non bisogna dedurre
l'identità dal nickname o dall'email a ogni richiesta.

### `content_entries`

Rappresenta un contenuto modificabile.

- `id`
- `content_key`, univoca, per esempio `mondo-bianco.introduzione`
- `label`, nome leggibile nel pannello
- `content_type`, per esempio `plain_text`, `paragraphs`, `recipe`, `calendar_event`
- `versioning_mode`: `replace` oppure `history`
- `current_version_id`, se il contenuto usa versioni
- `created_by`
- `created_at`
- `updated_at`

### `content_versions`

Usata soltanto per i contenuti con `versioning_mode = history`.

- `id`
- `entry_id`
- `body`
- `author_id`
- `created_at`

Non serve una data personalizzata: `created_at` è sia la data reale sia quella mostrata
nell'interfaccia.

### Contenuti strutturati

Le collezioni non devono essere serializzate tutte dentro un unico campo di testo. Ogni area
può avere tabelle adatte alla propria struttura, collegate quando utile a `content_entries`.
Gli elementi ordinabili devono avere almeno:

- un ID stabile;
- un campo `position` numerico;
- titolo o etichetta leggibile;
- autore e date di modifica.

## Esperienza editoriale

### Testi semplici

In modalità admin compare un piccolo comando **Modifica**. L'editor offre:

- textarea con il testo corrente;
- supporto a più paragrafi;
- anteprima;
- salvataggio immediato;
- annullamento prima del salvataggio;
- scelta “Aggiungi nuova versione” soltanto se prevista dal contenuto.

Non sono previste bozze: Rory può preparare il testo altrove o modificarlo nuovamente dopo il
salvataggio.

### Raccolte strutturate

Ogni editor dedicato deve permettere almeno:

- aggiunta;
- modifica;
- eliminazione con conferma;
- riordino;
- anteprima dei dati principali.

Per il riordino è sufficiente una lista compatta `ID — titolo`, con un campo posizione o
comandi “prima/dopo”. Non è necessario implementare il drag and drop.

### Suggerimenti di Desy

Desy non modifica direttamente i contenuti. Continua a usare i Suggerimenti, possibilmente
con categoria e contenuto di destinazione già selezionati. In futuro il pannello admin può
mostrare i suggerimenti ricevuti e permettere a Rory di trasformarli in contenuti, senza
pubblicarli automaticamente.

## Cosa rendere modificabile

### Editor generico per testi

- introduzioni delle pagine;
- messaggi personali;
- descrizioni di luoghi e sezioni;
- didascalie semplici;
- istruzioni visibili nelle pagine;
- testi composti da uno o più paragrafi.

### Da lasciare nel codice

- etichette puramente funzionali dei controlli;
- messaggi di errore e caricamento;
- testi di accessibilità;
- termini strutturali richiesti dal funzionamento, come “Ingredienti” e “Procedimento”.

### Editor dedicati

- Bacheca: foto, video, testi, didascalie e ordine;
- Ricettario: ricette, ingredienti, procedimento e stato;
- Calendario: date ed eventi;
- Mappa: mete, coordinate, paragrafi e immagini;
- Cuffiette: canzoni, descrizioni, testi e media;
- Storie: testo, data e media;
- Agenda delle Idee: attività, categorie, periodo, privacy e stato.

## Pagina amministrativa dei log

Aggiungere una pagina riservata per consultare gli eventi registrati nel database.

Requisiti:

- rotta protetta prima del caricamento della pagina;
- endpoint accessibile soltanto con `events.view`;
- nessun dato precaricato nel bundle o restituito a utenti non autorizzati;
- filtri per persona, sezione, tipo evento e periodo;
- paginazione;
- dettaglio dei metadati;
- ordinamento dal più recente;
- collegamento visibile soltanto in modalità admin;
- evento di audit quando un admin consulta i log, se non genera rumore eccessivo.

La pagina non deve comparire per un istante durante il controllo dei permessi. Il resolver o
guard deve attendere la risposta autenticata prima di attivare la rotta; il backend rimane in
ogni caso la barriera definitiva.

## Fasi di realizzazione

### Fase 1 — Inventario e schema

- inventariare tutti i contenuti editoriali esistenti;
- assegnare chiavi e ID stabili;
- distinguere testi semplici e collezioni strutturate;
- decidere `replace` o `history` per ciascun testo;
- progettare le tabelle definitive per tutte le aree da centralizzare;
- pianificare la migrazione dei JSON e dei testi Angular nel database.

### Fase 2 — Identità, ruoli e sicurezza

- aggiungere `identity` e `role` agli utenti;
- assegnare `lui/admin` a Rory e `lei/member` a Desy;
- definire la mappa ruolo-permessi;
- aggiungere helper backend condivisi per verificare i permessi;
- creare guard frontend che aspettino la verifica dell'utente;
- implementare l'attivazione della modalità admin.

### Fase 3 — Fondamenta del CMS

- aggiungere tabelle D1 per contenuti e versioni;
- creare API autenticate per lettura e modifica;
- creare endpoint separati per le operazioni amministrative;
- registrare negli eventi ogni aggiunta, modifica, eliminazione, riordino e nuova versione;
- validare chiavi, tipi e dimensioni esclusivamente sul backend;
- aggiungere gestione sicura degli errori e dei conflitti.

### Fase 4 — Migrazione dei contenuti

- importare nel database tutti i contenuti editoriali attualmente nei JSON e nei template;
- mantenere nel codice soltanto struttura e testi funzionali;
- verificare il conteggio degli elementi prima e dopo la migrazione;
- creare un comando di importazione ripetibile e sicuro;
- definire backup e procedura di ripristino prima di rimuovere i dati originali;
- evitare una fase permanente in cui contenuti equivalenti abbiano due fonti di verità.

Durante lo sviluppo può esistere una migrazione temporanea, ma l'architettura finale deve
avere il database come unica fonte dei contenuti editoriali.

### Fase 5 — Editor dei testi e versioni

- creare il componente di visualizzazione condiviso;
- creare editor e anteprima;
- implementare salvataggio diretto;
- implementare il versionamento selettivo;
- aggiungere chip e frecce per consultare le versioni;
- verificare che senza modalità admin la pagina resti identica.

### Fase 6 — Pannello amministrativo e log

- creare un indice dei contenuti modificabili;
- aggiungere ricerca e filtro per pagina/tipo;
- integrare i suggerimenti ricevuti;
- creare la pagina protetta degli eventi;
- verificare esplicitamente accesso diretto via URL con un utente senza permessi.

### Fase 7 — Editor dedicati

Implementare progressivamente:

1. Calendario;
2. Ricettario;
3. Storie;
4. Mappa;
5. Cuffiette;
6. Agenda delle Idee;
7. Bacheca.

La Bacheca rimane per ultima perché combina media, testi, raggruppamenti e ordine ed è la
sezione più complessa.

### Fase 8 — Esportazione e backup

- esportare contenuti e versioni in JSON;
- permettere un backup manuale dal pannello;
- documentare il ripristino;
- valutare un'esportazione periodica automatica;
- verificare che gli export non includano dati amministrativi o personali non necessari.

## Prima milestone consigliata

La prima milestone deve costruire fondamenta già compatibili con la centralizzazione finale:

1. identità, ruoli e permessi;
2. modalità admin;
3. schema generico dei testi e delle versioni;
4. migrazione delle introduzioni testuali nel database;
5. editor di testo e paragrafi;
6. versionamento selettivo;
7. visualizzazione delle versioni per entrambi;
8. pagina amministrativa dei log;
9. telemetria delle operazioni editoriali.

Le raccolte strutturate vengono migrate nelle milestone successive, una alla volta, senza
lasciare a regime una parte della stessa raccolta nel JSON e una nel database.

## Criteri di completamento della prima milestone

- Rory può attivare la modalità admin e modificare un testo dal sito.
- Desy vede il testo aggiornato ma non riceve controlli o dati amministrativi.
- Desy può continuare a proporre modifiche tramite i Suggerimenti.
- Un testo `history` mostra entrambe le versioni senza affiancarle in un muro di testo.
- Un testo `replace` cambia senza creare versioni inutili.
- Un accesso diretto alla pagina log senza `events.view` restituisce `403` e non mostra dati.
- Tutte le modifiche editoriali vengono registrate negli eventi.
- I testi migrati hanno il database come unica fonte di verità.
- È disponibile un export di sicurezza prima di eliminare la vecchia fonte.
