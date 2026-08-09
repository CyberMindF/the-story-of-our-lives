# Checklist di migrazione del Mondo Bianco

Checklist operativa derivata da `ANALISI_MONDO_BIANCO_ORIGINALE.md`. Ripulita il 09/08/2026: contiene solo le cose ancora aperte. Tutto quello che era stato completato o deciso come "da non fare" (fondazioni, nucleo navigabile, archivi e media, quasi tutta la P3, i test/audit di qualità) è stato tolto da qui — la cronologia completa delle decisioni resta nella storia di git (i commit precedenti a questa pulizia) per chi volesse ritrovarla.

## Regole del nuovo flusso

- Il Portone e l'interfaccia di autenticazione diventano un'unica esperienza.
- Se l'utente apre il sito senza una destinazione specifica, dopo l'accesso entra nel Mondo Bianco, che diventa la home autenticata.
- Il cruciverba non è più la home: diventa un gioco interno protetto del Tavolo da Gioco.
- Se l'utente apre direttamente una pagina interna, dopo login completo o conferma della sola Chiave torna alla pagina richiesta.
- Una sessione server valida determina se basta la Chiave; una sessione assente o scaduta richiede le credenziali complete e la Chiave.
- Pagine, API e media personali devono essere protetti anche sul server; nascondere soltanto l'interfaccia non è sufficiente.
- Foto personali, note vocali, video privati e allegati sono protetti per impostazione predefinita; immagini decorative e asset grafici dell'interfaccia possono restare pubblici nel frontend.
- Le pagine narrative e visualmente uniche conservano il contenuto in HTML; JSON è riservato alle collezioni ripetitive da ordinare, filtrare o renderizzare. I contenuti originali migrati non vengono salvati in D1.

## Cose ancora aperte

- [ ] **Progettare la navigazione responsive.** Rendere raggiungibili luoghi e ritorno alla home su desktop e telefono mantenendo orientamento e accessibilità. Rimandata su richiesta di Rory ("preferisco verificarla dopo").

- [X] **Ottimizzare le immagini simboliche delle pagine.** Fatto il 09/08/2026 con `scripts/optimize-world-images.mjs` (sharp, conversione WebP qualità 82): le 7 immagini hero di `assets/images/world/` e le 6 ritratti NPC di `assets/images/gdr/il-prezzo-della-verita/` sono passate da ~29MB totali a poco più di 1MB (riduzioni tra 89% e 98%), stessa composizione e qualità visiva. Gli originali PNG/JPG restano sul disco accanto ai `.webp` (non cancellati, non più referenziati da nessuna pagina). Tutti i riferimenti HTML/JSON aggiornati e verificati con Playwright su ogni pagina coinvolta.

- [ ] **Aggiungere la seconda avventura del Gioco di Ruolo.** Rory ha già pronta una seconda storia giocabile, con un regolamento diverso da `Il Prezzo della Verità` (non condividono lo stesso sistema di regole). Struttura già pronta ad accoglierla: `tavolo-da-gioco/gdr/index.html` elenca le avventure in `.tavolo-games-grid-compact` (oggi solo IPDV), ognuna con pagina propria (`tavolo-da-gioco/gdr/<slug>/index.html`) sul modello di `tavolo-da-gioco/gdr/il-prezzo-della-verita/`. Non condividere il regolamento tra le due: ognuna tiene il proprio. Aspettare titolo, testo e regole da Rory prima di crearla.

- [X] **Risolvere la frattura stilistica tra Mondo Bianco e cruciverba.** Fatto il 09/08/2026, in due parti:
  1. **Struttura**: `tavolo-da-gioco/cruciverba/index.html` ora usa lo stesso `.place-header`/`.place-userbar` (saluto, 💡 suggerimenti, logout) e lo stesso link "torna a..." in fondo alla pagina di tutte le altre pagine del Mondo Bianco, invece della sua intestazione a parte. Aggiunto anche il cielo stellato (`world-atmosphere.css` + `createWorldStars()`), prima assente sul cruciverba.
  2. **Colori**: nuovo tema fisso `the-white-world` in `themes.css`, con le stesse variabili di colore già usate (hardcoded) dalle altre pagine. Il selettore dei 4 temi (Ocean/Velvet/Red of You/Green of Me) è stato **tolto dal cruciverba** su richiesta di Rory, per non avere un'unica pagina con un selettore che il resto del sito non ha — i 4 temi restano definiti nel codice, pronti per tornare come selettore su tutto il sito se in futuro si deciderà di introdurre i temi ovunque (vedi item sotto). CSS morto rimosso (`.hero`, `.theme-bar`, `.theme-switcher`, `.theme-chip*`, `.theme-toast`, `.crossword-back-link`).
  Verificato con Playwright: nessun errore console, tema applicato, cielo stellato presente, lampadina e link funzionanti, gioco (scrittura lettere, controllo risposte) e vista mobile invariati.

- [X] **Introdurre i temi selezionabili su tutto il Mondo Bianco.** Fatto il 09/08/2026: le 16 pagine del Mondo Bianco (tutte tranne il cruciverba) ora mostrano lo stesso selettore tema — 5 pallini colorati (Notte/Ocean/Velvet/Red of You/Green of Me) — nella userbar, con `the-white-world` come tema di default. Stessa `localStorage` key (`noi-crossword-theme-v15`) già condivisa da tutte le pagine, quindi la scelta resta coerente ovunque. Nota: per ora cambia solo `--focus-color`/il tint del cielo stellato, non ancora i colori hardcoded di ogni pagina (quello resta un refactoring più profondo, non ancora fatto — vedi sotto).

- [X] **Valutare un sistema di template/include per l'HTML.** Fatto il 09/08/2026: aggiunto un generatore statico (`scripts/build-world-pages.mjs` + `templates/world-page.html` + `templates/pages/*.content.html` + `scripts/world-pages.manifest.mjs`) che assembla header/userbar/footer condivisi con il contenuto specifico di ogni pagina e scrive gli `index.html` finali nel repo — nessun cambiamento all'hosting statico di Cloudflare Pages, i file generati sono commit normali. Applicato a tutte le 16 pagine del Mondo Bianco (comprese le 4 del GDR). Il cruciverba resta volutamente fuori da questo sistema: ha una shell diversa (`.app-shell`, niente selettore tema) ed è l'unica pagina con quella struttura, quindi non c'è duplicazione da eliminare lì. D'ora in poi, per modificare l'header/footer condiviso si tocca `templates/world-page.html` e si rilancia `node scripts/build-world-pages.mjs`, non più ogni pagina a mano. Rimosse anche le ~9 regole CSS `.XXX-home-link` duplicate (una identica per pagina) in favore di un'unica `.place-bottom-link` in `world-shell.css`. Verificato con Playwright su tutte le 16 pagine: 0 errori console, switcher funzionante e persistente, invio moduli (maga, appunti, turno, suggerimenti) tutti confermati funzionanti dopo la rigenerazione.

- [ ] **Preparare backup e rollback.** Salvare D1, manifest R2 e contenuti versionati prima di ogni rilascio importante.

- [ ] **Completare il rilascio progressivo.** Pubblicare prima Portone, hub e pagine in sola lettura; attivare upload, chat e gioco solo dopo test separati.

## Criterio di completamento generale

La migrazione può considerarsi conclusa quando il Portone coincide con l'accesso reale, il Mondo Bianco è la home autenticata, il cruciverba è un gioco interno del Tavolo da Gioco, ogni link diretto ritorna alla destinazione richiesta dopo l'accesso, tutti i contenuti originali risultano verificati e nessun media personale è raggiungibile senza autorizzazione server.


IDEA 2
Sostituire l'embed SoundCloud delle Cuffiette con un player audio proprio del sito, quando i nove brani saranno ospitati direttamente (R2 o storage posseduto) invece che su SoundCloud.

IDEA 6
Aggiungere anche il messaggio criptato ai giochi

IDEA 7
Aggiungere il nostro linguaggio segreto da qualche parte (magari introducendo qualcosa di speciale per i 5 cuori e per il cerchio)

IDEA 8
Aggiungere una zona dei giochi da fare insieme, con didascalia sotto. Come se fosse la lista delle mie note sul telefono ma qui, condivisa, magari anche lei può suggerire giochi o cosa da fare (a questo punto capire se solo giochi o cose da fare insieme o se farle entrambe in modo diviso). https://www.youtube.com/shorts/4jmIPLqo7Hc

IDEA 9
Una ricerca globale protetta: cercare per parola dentro titoli, date, storie, canzoni, mete e ricordi tutti insieme, invece di aprire ogni pagina a cercare a occhio. Deve restare autenticata (nessun contenuto indicizzabile o raggiungibile da chi non ha fatto login). Rimandata: più un'idea per quando il sito avrà più contenuto da cercare, che una necessità adesso.

TODO (La Mappa)
Aggiungere la Sicilia tra le mete (è la terra di Rory, tanti posti bellissimi). Posti già in mente: il fiume Amenano sotto l'ostello (a Catania), le Gole dell'Alcantara, i laghetti di Avola (probabilmente Cavagrande del Cassibile, le piscine naturali vicino Avola — da confermare). Altri posti naturali siciliani che potrebbero starci: Scala dei Turchi (Realmonte/Agrigento), Riserva dello Zingaro (San Vito Lo Capo), Isola Bella a Taormina, Marzamemi. Da scrivere insieme quando Rory ha i testi pronti, stesso trattamento delle altre mete (non un posto "originale" preesistente, va segnato come aggiunta).

TODO (La Mappa)
Completare Roma: nel contenuto attuale (`content/map.json`) è ancora un segnaposto quasi vuoto ("roma roma", nessuna immagine) — fedele all'originale Notion, che la lasciava incompleta apposta. Serve il testo vero da Rory prima di poterla scrivere.
