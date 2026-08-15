-- Dodici carte segnaposto (#e4) per rendere bustine/album/scambi provabili davvero prima che
-- arrivino le foto vere di Rory (vedi "Lavori che solo Rory può fare" in
-- e4-carte-collezionabili.md, punto 1 — nessuna AI può scegliere le foto reali). Nomi
-- riconoscibili invece di "Carta 1..12" così è ovvio a colpo d'occhio cosa è ancora finto;
-- niente immagine_key: la UI mostra già il fallback 🃏 quando manca (gestito in carte.html).
-- Da eliminare con l'editor admin non appena arriva il primo set vero. INSERT singoli invece di
-- UNION ALL: D1 rifiuta un compound SELECT con troppi termini in un file eseguito via wrangler.
INSERT INTO carte_sets (slug, nome, descrizione, position, created_by, created_at)
SELECT 'placeholder', 'Placeholder', 'Carte segnaposto in attesa delle foto vere.', -1, id, CURRENT_TIMESTAMP
FROM users ORDER BY id LIMIT 1;

INSERT INTO carte_designs (set_id, nome, position, created_by, created_at)
SELECT (SELECT id FROM carte_sets WHERE slug = 'placeholder'), 'Gattino Segnaposto', 0, id, CURRENT_TIMESTAMP FROM users ORDER BY id LIMIT 1;
INSERT INTO carte_designs (set_id, nome, position, created_by, created_at)
SELECT (SELECT id FROM carte_sets WHERE slug = 'placeholder'), 'Stella Cadente Finta', 1, id, CURRENT_TIMESTAMP FROM users ORDER BY id LIMIT 1;
INSERT INTO carte_designs (set_id, nome, position, created_by, created_at)
SELECT (SELECT id FROM carte_sets WHERE slug = 'placeholder'), 'Cuore di Prova', 2, id, CURRENT_TIMESTAMP FROM users ORDER BY id LIMIT 1;
INSERT INTO carte_designs (set_id, nome, position, created_by, created_at)
SELECT (SELECT id FROM carte_sets WHERE slug = 'placeholder'), 'Astronauta Farlocco', 3, id, CURRENT_TIMESTAMP FROM users ORDER BY id LIMIT 1;
INSERT INTO carte_designs (set_id, nome, position, created_by, created_at)
SELECT (SELECT id FROM carte_sets WHERE slug = 'placeholder'), 'Ciambella Immaginaria', 4, id, CURRENT_TIMESTAMP FROM users ORDER BY id LIMIT 1;
INSERT INTO carte_designs (set_id, nome, position, created_by, created_at)
SELECT (SELECT id FROM carte_sets WHERE slug = 'placeholder'), 'Drago Tascabile', 5, id, CURRENT_TIMESTAMP FROM users ORDER BY id LIMIT 1;
INSERT INTO carte_designs (set_id, nome, position, created_by, created_at)
SELECT (SELECT id FROM carte_sets WHERE slug = 'placeholder'), 'Nuvola Provvisoria', 6, id, CURRENT_TIMESTAMP FROM users ORDER BY id LIMIT 1;
INSERT INTO carte_designs (set_id, nome, position, created_by, created_at)
SELECT (SELECT id FROM carte_sets WHERE slug = 'placeholder'), 'Pinguino Segnaposto', 7, id, CURRENT_TIMESTAMP FROM users ORDER BY id LIMIT 1;
INSERT INTO carte_designs (set_id, nome, position, created_by, created_at)
SELECT (SELECT id FROM carte_sets WHERE slug = 'placeholder'), 'Cactus di Scorta', 8, id, CURRENT_TIMESTAMP FROM users ORDER BY id LIMIT 1;
INSERT INTO carte_designs (set_id, nome, position, created_by, created_at)
SELECT (SELECT id FROM carte_sets WHERE slug = 'placeholder'), 'Fantasma Temporaneo', 9, id, CURRENT_TIMESTAMP FROM users ORDER BY id LIMIT 1;
INSERT INTO carte_designs (set_id, nome, position, created_by, created_at)
SELECT (SELECT id FROM carte_sets WHERE slug = 'placeholder'), 'Barchetta di Carta', 10, id, CURRENT_TIMESTAMP FROM users ORDER BY id LIMIT 1;
INSERT INTO carte_designs (set_id, nome, position, created_by, created_at)
SELECT (SELECT id FROM carte_sets WHERE slug = 'placeholder'), 'Luna Storta', 11, id, CURRENT_TIMESTAMP FROM users ORDER BY id LIMIT 1;
