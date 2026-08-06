# Cruciverba statico "Noi"

Piccola web app statica per un cruciverba personalizzato, compatibile con GitHub Pages e senza dipendenze esterne.

## Avvio in locale

Non conviene aprire `index.html` con doppio click, perché molti browser bloccano o limitano il caricamento di `data.json` tramite `fetch()` quando la pagina usa il protocollo `file://`.

Avvia invece un piccolo server locale dalla cartella del progetto:

```bash
python3 -m http.server 8000
```

```bash (windows)
python -m http.server 8000
```

Poi apri nel browser:

```text
http://localhost:8000
```

## Pubblicazione gratuita con GitHub Pages

1. Crea un repository GitHub e carica questi file.
2. Vai in `Settings` → `Pages`.
3. In `Build and deployment`, scegli `Deploy from a branch`.
4. Seleziona il branch principale, di solito `main`, e la cartella `/ (root)`.
5. Salva: dopo pochi istanti il sito sarà pubblicato.

Il progetto usa solo percorsi relativi come `./style.css`, `./app.js` e `./data.json`, quindi resta compatibile anche se pubblicato sotto un sottopercorso GitHub Pages.

## File da modificare

- Cambiare parole, definizioni, coordinate o ordine: modifica `data.json`.
- Cambiare grafica, colori o dimensione delle celle: modifica `style.css`.
- Cambiare il messaggio finale, il comportamento dell'interfaccia o la logica: modifica `app.js`.

## Struttura

```text
/
├── index.html
├── style.css
├── app.js
├── data.json
└── README.md
```
