# Il Nostro Linguaggio

> Proposta di grammatica — versione 0.2  
> **Esistente** indica un codice già presente nel Mondo Bianco. **Proposta** indica un’aggiunta da provare e modificare.

## Idea di base

Il linguaggio deve funzionare in due modi:

1. **Segnale rapido** — pochi simboli, come `... <>` o `>>> 0`.
2. **Frase completa** — simboli ordinati secondo una grammatica, per sostenere una conversazione.

Non è una cifratura sicura: serve a rendere i messaggi incomprensibili a una lettura casuale e, soprattutto, a creare un modo di parlare solo nostro.

## Grammatica essenziale

Una frase completa segue questo ordine:

```text
[tempo] [soggetto] [modalità] [azione o stato] [luogo, persona o oggetto] [sentimento] [tono]
```

Esempio:

```text
>>> : % { 0 ....
domani io voglio venire sul documento, ti voglio benissimo
```

### Regole di lettura

- Gli elementi separati da uno spazio sono concetti distinti.
- Gli elementi attaccati formano un solo concetto: `#` è casa, `#;` è casa tua.
- Il soggetto omesso è normalmente chi sta scrivendo.
- Il tempo omesso indica il presente.
- `?` alla fine trasforma la frase in una domanda.
- `/` davanti a un elemento lo nega: `/X` significa “non impegnato”.
- `/` all’inizio nega l’intera frase.
- `&` unisce elementi o frasi sullo stesso piano.
- `!`, `!!`, `!!!` indicano urgenza crescente.
- Le ripetizioni hanno valore solo quando sono previste dal dizionario.

## Dizionario esistente

### Sentimenti e gesti

| Codice | Significato | Stato |
|---|---|---|
| `.` | Ti penso; talvolta rabbia o via libera | Esistente, ambiguo |
| `..` | Messaggio ricevuto / ho capito | Esistente |
| `...` | Mi manchi | Esistente |
| `....` | Ti voglio benissimo | Esistente |
| `.....` | Ti amo | Esistente |
| `-` | Sto male | Esistente |
| `+` | Sto bene | Esistente |
| `*` | Bacino | Esistente |
| `<>` | Abbraccio | Esistente |
| `Z` | Buonanotte | Esistente |
| `Y` | Buongiorno | Esistente |

### Urgenza

| Codice | Significato | Stato |
|---|---|---|
| `!` | C’è un piccolo problema / è urgente | Esistente |
| `!!` | C’è un problema importante | Esistente |
| `!!!` | Urgenza molto grave | Estensione regolare |

### Tempo

| Codice | Significato | Stato |
|---|---|---|
| `\|` | Adesso / oggi | Esistente, ambiguo |
| `>` | Tra poco | Esistente |
| `<` | Poco fa | Esistente |
| `>>` | Stasera | Esistente |
| `<<` | Stamattina | Esistente |
| `>>>` | Domani | Esistente |
| `<<<` | Ieri | Esistente |
| `\|\|` | Oggi, ma non necessariamente adesso | Proposta |
| `>>>>` | Nei prossimi giorni | Proposta |
| `<<<<` | Nei giorni scorsi | Proposta |

### Luoghi e disponibilità

| Codice | Significato | Stato |
|---|---|---|
| `#` | A casa | Esistente |
| `@` | Fuori / luogo non specificato | Esistente |
| `0` | Sul documento / ti ho scritto | Esistente |
| `X` | Impegnato o non disponibile | Esistente |

### Sintassi e risposte

| Codice | Significato | Stato |
|---|---|---|
| `?` | Domanda | Esistente |
| `/` | No / negazione | Esistente |
| `V` | Sì / affermazione | Esistente |
| `&` | E / congiunzione | Esistente |
| `^` | Un’altra persona | Esistente |
| `^^` | Altre persone | Esistente |

## Espansione proposta

### Soggetti e persone

| Codice | Significato |
|---|---|
| `:` | Io / me |
| `;` | Tu / te |
| `::` | Noi |
| `;;` | Voi |
| `^` | Lui, lei o un’altra persona |
| `^^` | Loro o altre persone |

La posizione chiarisce il ruolo:

```text
: ~ ;
io parlo con te

; ~ : ?
vuoi parlare con me?
```

### Azioni e stati fondamentali

| Codice | Significato | Immagine mentale |
|---|---|---|
| `=` | Essere / stare / rimanere | Due lati fermi e uguali |
| `{` | Venire / avvicinarsi | Movimento verso l’interno |
| `}` | Andare / allontanarsi | Movimento verso l’esterno |
| `><` | Incontrarsi / raggiungersi | Due frecce che si avvicinano |
| `~` | Parlare / scrivere / comunicare | Un’onda o una voce |
| `_` | Aspettare | Una linea ferma |
| `%` | Volere / desiderare | Qualcosa che vale, che si desidera |
| `$` | Avere bisogno | Qualcosa di necessario o prezioso |

### Oggetti e modificatori

| Codice | Significato |
|---|---|
| `[]` | Messaggio / contenuto da leggere |
| `()` | Insieme |
| `/X` | Libero / disponibile |
| `/+` | Non sto bene |
| `/-` | Non sto male |

`+` e `-` restano gli stati principali; le forme negate servono quando la distinzione è importante.

## Composti

I simboli attaccati permettono di creare significati nuovi senza aggiungere una parola per ogni caso.

### Case

| Codice | Significato |
|---|---|
| `#:` | Casa mia |
| `#;` | Casa tua |
| `#^` | Casa sua / di un’altra persona |
| `#^1` | Casa della persona identificata come `^1` |

### Domande fondamentali

| Codice | Significato |
|---|---|
| `@?` | Dove? |
| `\|?` | Quando? |
| `^?` | Chi? |
| `??` | Cosa? / non ho capito, ripeti |
| `%?` | Che cosa vuoi? |

### Persone, luoghi e argomenti privati

Le cifre possono identificare elementi ricorrenti:

| Famiglia | Esempio | Uso |
|---|---|---|
| Persone | `^1`, `^2`, `^3` | Persone conosciute |
| Luoghi | `@1`, `@2`, `@3` | Luoghi abituali |
| Argomenti | `01`, `02`, `03` | Documenti, progetti o temi |

Il significato preciso resta in un piccolo dizionario privato:

| Codice | Significato da assegnare |
|---|---|
| `^1` | — |
| `^2` | — |
| `@1` | — |
| `@2` | — |
| `01` | — |
| `02` | — |

## Frasi costruite per livelli

### Livello 1 — segnali

| Frase | Traduzione |
|---|---|
| `.` | Ti penso |
| `... <>` | Mi manchi, ti abbraccio |
| `>>> 0` | Domani vengo / ci sono sul documento |
| `/ >>` | Stasera non posso o non ci sono |
| `@?` | Dove sei? |
| `#^` | A casa sua |

### Livello 2 — frasi brevi

| Frase | Traduzione |
|---|---|
| `\| : = /X` | Adesso sono libero |
| `> : } @` | Tra poco esco |
| `>> :: >< #:` | Stasera ci incontriamo a casa mia |
| `: $ ~ ; !` | Ho bisogno di parlarti, è urgente |
| `: = - & ...` | Sto male e mi manchi |
| `; >>> { 0 ?` | Domani vieni sul documento? |

### Livello 3 — frasi complete

| Frase | Traduzione |
|---|---|
| `>>> : % { #; & >< ;` | Domani voglio venire a casa tua e vederti |
| `>> :: = () & ~` | Stasera stiamo insieme e parliamo |
| `<<< ^1 } @2 & : = -` | Ieri la persona 1 è andata nel luogo 2 e io ci sono rimasto male |
| `/ : % } @ !` | Non voglio uscire: c’è un problema |
| `>>>> :: % >< @1 ....` | Nei prossimi giorni vogliamo incontrarci nel luogo 1, ti voglio benissimo |

## Dialoghi di prova

### Organizzarsi

```text
A: ; >> = /X ?
   Sei libero stasera?

B: V & >> 0
   Sì, e stasera sarò sul documento.

A: .. & : >> { 0
   Ricevuto, stasera vengo sul documento.
```

### Chiedere dove si trova l’altra persona

```text
A: @?
   Dove sei?

B: #^1
   A casa della persona 1.

A: > : { #^1 ?
   Tra poco posso venire lì?

B: V
   Sì.
```

### Messaggio affettivo

```text
A: ... & : $ <> ;
   Mi manchi e ho bisogno di abbracciarti.

B: .... <> & *
   Ti voglio benissimo: abbraccio e bacino.
```

## Ambiguità da risolvere

1. **`.` ha troppi significati.** La proposta è conservarlo soltanto come “ti penso”; per “via libera” usare `V` e per la rabbia introdurre in futuro un simbolo specifico.
2. **`\|` significa sia oggi sia adesso.** La proposta è usare `\|` per “adesso” e `\|\|` per “oggi”.
3. **`0` significa sia documento sia “ti ho scritto”.** Può restare un’abbreviazione contestuale, oppure `[]` può assumere stabilmente il significato di messaggio.
4. **`X` unisce impegno e indisponibilità.** Per ora è accettabile; `/X` indica chiaramente la disponibilità.
5. **`{` e `}` dipendono dal punto di vista.** `{` indica movimento verso chi riceve o verso il luogo nominato; `}` indica movimento lontano.

## Regole per far crescere il linguaggio

Un nuovo codice dovrebbe:

- servire in conversazioni reali e frequenti;
- avere un solo significato di base;
- essere facile da digitare anche dal telefono;
- non entrare in conflitto con codici esistenti;
- poter formare composti utili;
- essere aggiunto soltanto dopo averlo provato in alcune frasi.

La regola più importante è questa: **prima si tenta di costruire il significato con i simboli esistenti; solo se non è possibile si crea un simbolo nuovo.**

## Decisioni per la versione 0.3

- Scegliere i soggetti definitivi.
- Approvare o sostituire i simboli delle azioni.
- Assegnare i primi codici privati a persone, luoghi e argomenti.
- Provare a sostenere una conversazione di almeno dieci messaggi usando soltanto il linguaggio.
- Annotare ciò che non si riesce a dire: quelle mancanze formeranno il prossimo vocabolario.
