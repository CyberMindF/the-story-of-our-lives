# Audit dell'effetto vetro

Aggiornato il 15 settembre 2026 durante l'introduzione della utility condivisa
`.glass-surface`.

## Regola standard

La superficie standard usa:

- sfondo `var(--panel-color)`;
- bordo `var(--panel-border-color)`;
- `backdrop-filter: blur(12px)`.

Forma, dimensioni, spaziatura, ombre e stati interattivi non fanno parte della utility:
restano responsabilità di card, bottoni e singoli componenti.

## Valori diversi trovati

| Elemento | Valore | Valutazione | Stato nel refactoring |
| --- | --- | --- | --- |
| Avviso di aggiornamento dell'app (`.app-update-notice`) | `blur(16px)` | **Probabile incoerenza.** È una normale card flottante e nel CSS non è documentata una ragione per 16 invece di 12. | Migrato a `.glass-surface`, valore 16 preservato tramite `--glass-filter` in attesa di decisione. |
| Suggerimento nelle Storie (`.story-suggestion`) | `blur(16px)` | **Probabile incoerenza.** È un pannello standard e non risulta una motivazione specifica. | Migrato, valore 16 preservato. |
| Pannello grande della Mappa (`.dream-map-layout`) | `blur(14px)` | **Da verificare.** Potrebbe essere stato aumentato per la grande superficie, ma non c'è una nota che lo spieghi. | Migrato, valore 14 preservato. |
| Paragrafi sovrapposti alle foto della Mappa (`.destination-passage > p`) | `blur(14px)` | **Plausibilmente intenzionale**, per separare testo e foto; resta comunque un valore non documentato. | Migrato, valore 14 preservato. |
| Etichetta delle puntine (`.pin-label`) | `blur(8px)` | **Probabilmente intenzionale.** È un tooltip molto piccolo: un blur più leggero evita un alone sproporzionato. | Migrato, valore 8 preservato. |
| Card del Portone (`.portone-card`) | `blur(18px)` e sfondo `panel-color` all'88% | **Da verificare.** La maggiore separazione del form di accesso è sensata, ma 18 non è spiegato e potrebbe essere un residuo locale. | Migrato, aspetto preservato con variabili della utility. |
| Pulsante scheda GDR (`.gdr-panel-trigger`) | `blur(10px)` e sfondo derivato da `button-bg` | **Probabile regolazione locale.** Il materiale diverso può avere senso per il controllo flottante; la differenza 10/12 sembra poco significativa. | Migrato, aspetto preservato. |
| Trigger della chat globale (`.global-chat-trigger`) | `blur(20px) saturate(165%)`, gradiente dedicato | **Intenzionale.** È un controllo flottante sopra sfondi molto variabili e il gradiente/saturazione fanno parte del suo design. | Migrato, variante preservata. |
| Pannello chat globale (`.global-chat-panel`) | `blur(18px)`, sfondo quasi opaco al 92% | **Intenzionale per leggibilità**, soprattutto con molti messaggi; il numero 18 può comunque essere uniformato se visivamente inutile. | Migrato, variante preservata. |
| Barra e foglio di navigazione (`.world-navigation-rail`, `.world-navigation-sheet`) | `blur(20px) saturate(145%)`, sfondo dedicato | **Intenzionale.** Sono due parti dello stesso drawer e devono restare leggibili su qualunque pagina. | Migrati entrambi alla stessa variante della utility. |
| Badge “Tema attivo” (`.theme-chip-selected`) | `blur(6px)`, sfondo scuro dedicato | **Intenzionale.** È un piccolo badge sopra un'anteprima illustrata, non una card standard. | Migrato, variante preservata. |

## Effetti non migrati perché non sono superfici di vetro standard

| Elemento | Valore | Motivo |
| --- | --- | --- |
| Overlay delle modali (`.modal`) | `blur(3px)` | Sfoca tutta la pagina dietro la modale; non è una superficie contenitore. |
| Overlay del menu dei luoghi (`.world-navigation-backdrop`) | `blur(5px)` | È uno strato di oscuramento/click-away a schermo intero, non il pannello. |
| Bolle decorative del mondo (`.world-bubble`) | `blur(1.5px)` | È parte dell'illustrazione animata della bolla, non UI. |
| Drawer mobile degli indizi (`.clues-panel`) | `blur(4px)` solo sotto breakpoint mobile | È applicato condizionalmente dal media query. Aggiungere la utility direttamente al markup cambierebbe anche il layout desktop; va eventualmente separato con una variante responsive dedicata. |

## Esclusioni esplicite (`backdrop-filter: none`)

- `.card--paper` e `.card--dialog`: devono apparire rispettivamente come carta e come
  finestra opaca leggibile, non come vetro.
- paragrafo della Mappa senza immagini: perde volutamente riquadro e vetro.
- pulsante “Sì” a schermo intero di “Prova a dire no”: diventa volutamente una superficie
  piena e non trasparente.

## Candidati da uniformare dopo confronto visivo

I candidati più sospetti sono `app-update-notice` (16px), `story-suggestion` (16px),
`dream-map-layout` (14px) e `portone-card` (18px). Prima di portarli tutti al valore standard
di 12px conviene confrontarli nei temi con sfondi attivi: il refactoring attuale non modifica
volontariamente il loro aspetto.
