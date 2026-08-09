# Refactoring Angular: componentizzazione

## Obiettivo

Ridurre a una sola implementazione ogni struttura o comportamento realmente condiviso,
senza trasformare semplici elementi HTML in wrapper Angular privi di valore. Aspetto,
accessibilita', route, API e telemetria devono restare invariati.

## Criteri

- Un componente condiviso possiede struttura, comportamento o semantica riutilizzata; una
  classe CSS basta quando cambia soltanto l'aspetto di un elemento nativo.
- Niente componenti universali governati da molti flag: preferire componenti piccoli e
  composizione.
- Ogni estrazione elimina le copie originarie.
- Le differenze intenzionali restano locali e vengono documentate.
- Build e audit browser desktop/mobile seguono ogni blocco strutturale.

## Baseline

- Porting funzionale: commit `0f50ba7` su `main`.
- Audit Angular: 36/36 route/viewport senza errori console, rete, immagini o overflow.
- Il frontend vanilla resta solo in `legacy-archive/` come riferimento.

## Audit iniziale

### Duplicazioni confermate

- Link inferiore di ritorno: 16 copie; 10 identiche verso il Mondo Bianco e 6 con la stessa
  struttura verso il parent locale.
- `AppShell` concentra header, utente/logout, layout e telemetria.
- `ipdv-nav`: stessi tre link copiati in Avventura, La Tua Maga e I Tuoi Appunti.
- Flusso FormData e feedback ripetuti tra Suggerimenti, Storie, Lettere e pagine GDR, con
  contratti API non ancora del tutto uniformi.
- CSS di campi e feedback duplicato soprattutto tra Suggerimenti e Storie.

### Ripetizioni intenzionali

- Hero, card narrative e sezioni specifiche non diventano componenti generici solo perche'
  usano gli stessi tag.
- I bottoni nativi restano `button`/`a` con API CSS `.btn` finche' non condividono anche un
  comportamento.
- I dialog di Lettere e Bacheca hanno contenuti e interazioni diverse: prima di unificarli va
  individuata una primitive accessibile realmente comune.

## Roadmap

### Blocco 1 - Layout condiviso

- [x] Estratti `WorldHeader` e `WorldUserBar`.
- [x] Estratto `BackLink`; rimosse tutte le 16 copie dai template pagina.
- [x] `AppShell` ridotta a composizione layout e telemetria.

### Blocco 2 - Navigazione e feedback

- [x] Estratta `IpdvNavigation`; rimosse le tre copie e centralizzato lo stato attivo accessibile.
- [x] Modellato il contratto equivalente di Suggerimenti, Storie e Lettere in `FormSubmission`,
  con un'istanza isolata per pagina e callback successiva opzionale.
- [x] Estratto `FormStatus` e consolidato in `forms.css` il CSS comune di campi, focus,
  placeholder, riga submit e feedback. Le sole differenze di altezza/responsive restano locali.

### Blocco 3 - Logica e overlay

- [ ] Estrarre il flusso FormData solo per endpoint e gestione errori equivalenti.
- [ ] Valutare una primitive dialog accessibile.
- [ ] Consolidare loading, error ed empty state ripetuti.

### Blocco 4 - Verifica conclusiva

- [ ] Build production e test strict.
- [ ] Audit browser completo desktop/mobile.
- [ ] Audit finale delle duplicazioni residue e motivazione di quelle intenzionali.

## Verifiche eseguite

- Build production Angular pulita, senza warning.
- Audit della dist servita da Wrangler: 36/36 route/viewport, nessun errore console/rete,
  immagine rotta o overflow.
- Ispezione visuale desktop di Suggerimenti e mobile di Storie dopo il consolidamento CSS.
- Metriche sorgente: zero `place-bottom-link` nei template pagina e zero `ipdv-nav` duplicati.

## Autonomia del frontend

- [x] Spostati CSS attivi in `web/src/styles/`.
- [x] Spostati immagini, contenuti, `data.json`, favicon e redirect in `web/public/`.
- [x] Inclusa l'immagine del Portone in `web/public/assets/images/portone/`.
- [x] Aggiornati gli script di generazione e ottimizzazione ai nuovi percorsi.
- [x] Rimossi `asset-root` e tutti i symlink applicativi; zero riferimenti residui nel codice.
- [x] Esternalizzati tutti i 12 template inline in file `.html` dedicati.
- [x] Build e audit Wrangler della nuova struttura: 36/36 route/viewport.
