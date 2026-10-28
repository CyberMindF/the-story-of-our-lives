-- Consente di annullare un'aggiunta senza rimuovere le flashcard già presenti.
ALTER TABLE study_cards ADD COLUMN source_import_id TEXT;

UPDATE study_cards
SET source_import_id = (
  SELECT source_import_id FROM study_topics WHERE study_topics.id = study_cards.topic_id
);

CREATE INDEX idx_study_cards_import ON study_cards(source_import_id)
  WHERE source_import_id IS NOT NULL;
