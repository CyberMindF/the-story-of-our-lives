-- Card dell'Atlante del Mappamondo per il gioco di carte collezionabili (#e4), Blocco 1
-- "route + card" (e4-carte-collezionabili.md). Senza questa riga l'editor admin "Modifica"
-- della card nell'Atlante darebbe 404, stesso motivo per cui esiste 0076_add_prova_a_dire_no_atlas.sql.

INSERT OR IGNORE INTO mondo_bianco_cards (id, name, description, created_by)
SELECT 'carte', 'Le Carte Collezionabili', 'Bustine, rarità e scambi con carte che siamo noi.', id FROM users ORDER BY id LIMIT 1;
