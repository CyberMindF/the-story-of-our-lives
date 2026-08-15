# Piano: sincronizzare i contenuti locali → produzione, e ripulire il locale

Scritto il 15/08/2026. Contesto: dopo il primo push in produzione e il collegamento del
dominio `il-mondo-bianco.com`, Rory sta ancora sistemando contenuti (Ricettario e altro)
tramite l'editor admin del sito **in locale**. Questi contenuti vanno portati sul D1 di
produzione quando saranno pronti; nel frattempo il D1 locale si è sporcato di dati di test
(sessioni, eventi, chat di prova) accumulati durante le verifiche Playwright di questa e
delle sessioni precedenti.

Nessuno script di sync locale→prod esiste già nel progetto: finora ogni dato è sempre
arrivato in produzione solo tramite migrazioni numerate (`migrations/*.sql`), mai editando
in locale e "spostando" dopo. Questa è la prima volta che serve un vero passaggio di questo
tipo.

## Quando partire

Solo quando Rory ha finito di sistemare le ricette (e qualunque altro contenuto) in locale.
Non prima: l'obiettivo è fare un solo giro di sync pulito, non inseguire modifiche in corso.

## Fase 1 — Diff locale vs remoto

Individuare esattamente quali righe sono cambiate nel D1 locale rispetto a quello remoto,
limitandosi alle tabelle di **contenuto editoriale**:

- `recipes` — Ricettario
- `content_entries` / `content_versions` — contenuti editoriali generici versionati
- `mondo_bianco_cards` — card del Mondo Bianco
- `letters` — Lettere
- `stories` — storie/racconti
- `questions`, `crossword_words`, `crossword_answers` — Cruciverba
- `gdr_blocks`, `gdr_blocks_new`, `gdr_character_fields`, `gdr_character_schema`, `gdr_character_stats` — contenuti/schema editor GDR
- `linguaggio_segreto_categories`, `linguaggio_segreto_examples`, `linguaggio_segreto_symbols` — Linguaggio Segreto
- `map_destinations`, `mappamondo_scenes` — Mappamondo/Atlante
- `bacheca_days`, `bacheca_periods` — Bacheca
- `pensieri_biglietti` — Barattolo dei Pensieri (contenuto scritto, non i log di estrazione)
- `carte_definizioni`, `carte_designs`, `carte_sets`, `carte_bustine` — definizioni/design carte (non l'inventario giocatore)
- `together_activities` — attività condivise
- `cuffiette_songs` — playlist Cuffiette
- `world_settings` — toggle/config editoriali
- `capsule_tempo` — Capsula del Tempo

Da verificare caso per caso se contengono roba editoriale o generata dall'uso:
`story_suggestions`, `world_suggestions`, `calendar_events`.

## Fase 2 — Migrazione mirata

Generare una migrazione SQL nuova e numerata (es. `0095_sync_ricette_locale.sql`) con solo
gli `INSERT`/`UPDATE` per le righe realmente cambiate — stesso meccanismo già usato per i
seed (es. `0091_seed_carte_placeholder.sql`). Verificare **byte-per-byte** il contenuto
contro il locale prima di applicare al remoto (stesso pattern già rodato per Bacheca e GDR
in sessioni precedenti). Niente dump grezzo dell'intero database: trascinerebbe dentro anche
righe di test.

## Fase 3 — Applicazione al DB remoto

`wrangler d1 migrations apply DB --remote` (o comando equivalente), sullo stesso
`database_id` di produzione già configurato in `wrangler.toml` (locale e remoto puntano
allo stesso `database_id` logico, `the-white-world-db` — non serve toccare la config, solo
capire quali righe sono cambiate).

## Fase 4 — Pulizia del D1 locale

Solo dopo aver confermato che la migrazione mirata ha portato tutto il contenuto vero in
produzione, ripulire in locale (**mai in produzione**) le tabelle che si sporcano con
l'uso/i test:

- `sessions`, `users` di prova, `user_access_ips`
- `events`, `events_historical` — telemetria
- `visits`, `visit_session_links` — analytics
- `ponti_chat_messages`, `stranger_chat_messages` — messaggi chat di prova
- `gdr_characters`, `gdr_turns`, `gdr_notes` — stato partita GDR
- `carte_possesso`, `carte_trade`, `carte_trade_items` — inventario/scambi carte
- `pensieri_estrazioni` — log estrazioni
- `crossword_word_attempts` — tentativi cruciverba
- `together_activity_status`, `together_activity_status_new` — stato attività condivise
- le tabelle `*_backup` residue di migrazioni passate (`carte_definizioni_backup`,
  `carte_possesso_backup`, `carte_trade_items_backup`)

## Cosa NON serve fare

Non toccare `wrangler.toml` né la configurazione del database: locale e remoto puntano già
allo stesso `database_id` logico. Il problema è solo "quali righe sono cambiate", non "quale
database".
