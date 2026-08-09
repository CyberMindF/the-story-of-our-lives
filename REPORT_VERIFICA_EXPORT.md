# Verifica dell'export originale

Verifica eseguita l'8 agosto 2026 sull'export Notion conservato nel progetto.

## Inventario

- 11 pagine HTML analizzate.
- 163 file complessivi.
- 149 riferimenti a media locali.
- 0 media locali mancanti.
- 35 collegamenti esterni contenutistici.
- 2 riferimenti a risorse tecniche esterne.
- 36 URL esterni unici verificati.

## Dipendenze esterne

| Dominio | URL unici | Esito HTTP |
| --- | ---: | --- |
| SoundCloud | 9 | 9 raggiungibili |
| Short.io (`short.gy`) | 10 | 10 raggiungibili |
| Google Docs | 4 | 4 raggiungibili |
| Google Drive | 6 | 6 raggiungibili |
| YouTube | 4 | 4 raggiungibili |
| Browserling | 1 | 1 raggiungibile |
| CDNJS | 2 | 2 raggiungibili |

Gli short link risolvono verso otto pagine Notion, una risorsa Spotify e una risorsa Google Drive. Tutti i 36 URL unici hanno restituito stato finale `200` durante la verifica.

## Metodo e limiti

`scripts/analyze-notion-export.mjs` estrae in `web/public/content/original/` un file di testo versionato per ogni pagina e registra link, risorse esterne, riferimenti media e hash SHA-256 senza modificare la fonte. `scripts/verify-external-links.mjs` usa richieste sequenziali, segue i redirect e registra URL finale e stato HTTP.

Il dettaglio completo è salvato e versionato in `reports/export/`, così resta disponibile durante la migrazione da altri computer. Una risposta HTTP positiva conferma la raggiungibilità al momento del test, ma non garantisce disponibilità futura, proprietà del contenuto o corretta visualizzazione dopo un'eventuale autenticazione del provider.
