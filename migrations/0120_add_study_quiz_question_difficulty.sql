-- Livello facoltativo da 1 a 5 per bilanciare i quiz misti.
ALTER TABLE study_quiz_questions
ADD COLUMN difficulty_level INTEGER
CHECK (difficulty_level IS NULL OR difficulty_level BETWEEN 1 AND 5);
