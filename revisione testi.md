# Revisione dei testi

Audit editoriale del 12/08/2026. Questo file raccoglie soltanto i testi che sembrano
generici, costruiti o poco vicini alla voce personale usata nel resto del sito. Non sono
ancora proposte di modifica e nessuno di questi testi è stato cambiato nell'app.

## Da rivedere sicuramente

### Il Ricettario

File: `web/src/app/pages/ricettario/ricettario.html`

> Cose buone, fatte o immaginate insieme -> Il nostro personalissimo libro di ricette

> Le ricette che abbiamo condiviso e quelle che prima o poi vogliamo provare, conservate qui
> per non doverle più cercare.
|
V
La raccolta di tutte le ricette che abbiamo fatto insieme e tutte quelle che vorremmo fare prima o poi

L'eyebrow sembra uno slogan da template e “immaginate” è poco naturale riferito alle
ricette. Anche “conservate qui” usa il tono da archivio poetico che ricorre spesso nei testi
generati.

### La Cassetta delle Lettere

File: `web/src/app/pages/lettere/lettere.html`

> Scrivi qualcosa quando ti va, o leggi quello che ho lasciato io. Restano qui, una dopo
> l'altra, per quando vorrete tornarci.
|
V
Un tempo era un posto pensato per lasciarmi foto e video come ricordo, adesso invece può essere quello che è sempre stato, una cassetta dove lasciare pensieri e letterine che rimarranno raccolti qui

“Restano qui, una dopo l'altra” sembra una formula narrativa aggiunta per riempire. Inoltre
“vorrete” parla di voi due in terza persona: nel resto della frase avrebbe più senso
“vorremo”.

### Il Pozzo dei Dubbi

File: `web/src/app/pages/domande/domande.html`

> Butta giù un dubbio quando ti va, o pescane uno da qui e rispondi. Restano tutti, uno dopo
> l'altro, per quando vorrete tornarci.
|
V
Questa pagina nasce dai tanti dubbi che mi vengono, quindi ho pensato che sarebbe stato carino raccoglierli qui e tu puoi venire a toglierne qualcuno quando di ti va. Ovviamente anche tu puoi lasciarne di tuoi se ne hai.

La metafora del pozzo funziona, ma la seconda frase replica quasi parola per parola quella
della Cassetta delle Lettere. Questa simmetria fa sembrare entrambe derivate dallo stesso
template. Anche qui “vorrete” è distante rispetto alla voce diretta del sito.

### Pagina 404

File: `web/src/app/pages/not-found/not-found.html`

> Tieni d'occhio le strade! A loro piace cambiare. Segui i cartelli per trovare la via.

Risposta mia: In realtà questo l'ho scritto proprio io ed è una citazione a harry potter, ma è anche un po' modificata perché nel mondo bianco ci sono "le strade" che portano ai luoghi e non sono ben definiti perché è un mondo onirico

È il testo che sembra più chiaramente generato. Introduce strade e cartelli che non hanno un
significato nel Mondo Bianco e prova a essere fiabesco senza dire qualcosa di davvero vostro.

## Da valutare, meno urgenti

### Descrizioni dei temi

File: `web/src/app/core/theme.service.ts`

> Blu profondo e cielo notturno.

> Luce chiara e colori del marini.

> Viola scuro, tranquillo e notturno.

> Il tuo rosso, caldo e acceso.

> Il mio verde, calmo e profondo.

Questi per sbagli li ho proprio sovrascritti, spero che lo capisci comunque

Sono descrizioni funzionali e molto brevi, quindi non rappresentano un vero problema. Ocean
e soprattutto Velvet hanno però un tono da descrizione di catalogo. Red of You e Green of Me
sono già più personali grazie a “tuo” e “mio”.

### Modulo per proporre una Storia

File: `web/src/app/pages/storie/storie.html`

> Una pagina ancora bianca

> Lasciami una storia o una tua idea, e poi io la scriverò aggiungendo una nuova pagina a
> questa raccolta.
|
v
Lascia qui una tua storia o l'idea per farne una e poi verrò qui e la aggiungerò alla raccolta.

Il significato è corretto, ma “pagina ancora bianca” e “aggiungendo una nuova pagina alla
raccolta” sono formule prevedibili. Non stonano molto, semplicemente non raccontano nulla di
specifico di voi.

### Conteggio del Calendario

File: `web/src/app/pages/calendario/calendario.ts`

> 29 date custodite -> 29 date da ricordare

“Custodite” cerca di rendere poetico un semplice contatore. Il lungo testo introduttivo del
Calendario è invece molto personale e non ha questo problema.

### Sottotitolo del Cruciverba

File: `web/public/data.json`

> Un posto dove racchiudere i nostri ricordi, in qualcosa di nostro, un gioco -> I nostri ricordi racchiusi in qualcosa di altrettanto nostro, un gioco

L'idea è giusta, ma la frase è costruita in modo poco naturale e rimane sospesa tra una
descrizione della pagina e una dedica.

## Area ambigua: il GDR

File principali:

- `web/src/app/pages/avventura/avventura.html`
- `web/src/app/pages/il-prezzo-della-verita/il-prezzo-della-verita.html`
- `web/src/app/pages/la-tua-maga/la-tua-maga.html`

Alcuni passaggi dell'avventura e alcune descrizioni dei personaggi hanno una prosa più
costruita e regolare rispetto alla voce usata nelle pagine personali. Potrebbero sembrare
generati se letti come una dedica, ma qui sono narrativa fantasy e istruzioni di gioco: il
registro diverso è giustificato. Li rivedrei soltanto se anche durante il gioco sembrano
anonimi, non per uniformarli forzatamente alle pagine dei ricordi.

## Testi che non toccherei

I testi lunghi di Mappamondo, Bacheca, Mappa, Calendario, Cuffiette, Storie, Ponti e Agenda
delle Idee hanno una voce riconoscibile: contengono ricordi concreti, esitazioni, ripetizioni,
battute e dettagli che non sembrano messi lì per riempire. Anche quando hanno errori o frasi
molto lunghe, quelle imperfezioni li rendono più autentici. Conviene eventualmente correggere
solo refusi evidenti, senza riscriverne lo stile.
