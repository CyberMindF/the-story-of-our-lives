-- Prime due foto di Roma (#26): Fontana di Trevi e Colosseo, affiancate nella stessa riga
-- (stesso beforeParagraph, come "images-2" in destination-gallery). Il testo resta ancora il
-- placeholder "roma roma" in attesa dei paragrafi veri.
UPDATE map_destinations
SET images = '[{"src": "../assets/images/world/map/roma-fontana-di-trevi.webp", "alt": "La Fontana di Trevi illuminata dal sole", "beforeParagraph": 0, "position": "before"}, {"src": "../assets/images/world/map/roma-colosseo.webp", "alt": "Il Colosseo all''alba", "beforeParagraph": 0, "position": "before"}]',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 'roma';
