-- Forza il layout "immagini sopra, testo sotto" (stesso di Sharm el-Sheikh) anche se il
-- paragrafo di Roma resta sotto la soglia automatica di 900 caratteri: con 2 foto affiancate
-- un testo breve a fianco resterebbe stretto e schiacciato.
UPDATE map_destinations
SET images = '[{"src": "../assets/images/world/map/roma-fontana-di-trevi.webp", "alt": "La Fontana di Trevi illuminata dal sole", "beforeParagraph": 0, "position": "before", "stacked": true}, {"src": "../assets/images/world/map/roma-colosseo.webp", "alt": "Il Colosseo all''alba", "beforeParagraph": 0, "position": "before"}]',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 'roma';
