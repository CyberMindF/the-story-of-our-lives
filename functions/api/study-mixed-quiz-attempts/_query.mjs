export const MIXED_QUIZ_SOURCE_SQL = `WITH RECURSIVE folder_tree(
  id, parent_id, name, unit_id, unit_title, path, depth
) AS (
  SELECT id, parent_id, name, id, name, name, 0
  FROM study_folders WHERE id = ? AND deleted_at IS NULL
  UNION ALL
  SELECT child.id, child.parent_id, child.name,
    CASE WHEN tree.depth = 0 THEN child.id ELSE tree.unit_id END,
    CASE WHEN tree.depth = 0 THEN child.name ELSE tree.unit_title END,
    tree.path || ' › ' || child.name, tree.depth + 1
  FROM study_folders child
  INNER JOIN folder_tree tree ON child.parent_id = tree.id
  WHERE child.deleted_at IS NULL
)
SELECT tree.unit_id, tree.unit_title, tree.path AS source_path,
  quiz.id AS quiz_id, quiz.title AS quiz_title, quiz.shuffle_options,
  question.id AS question_id, question.type, question.prompt, question.difficulty_level,
  question.image_url, question.image_alt, question.reference_answer,
  question.position AS question_position,
  option_row.id AS option_id, option_row.text AS option_text,
  option_row.is_correct, option_row.position AS option_position
FROM folder_tree tree
INNER JOIN study_quizzes quiz ON quiz.folder_id = tree.id AND quiz.deleted_at IS NULL
INNER JOIN study_quiz_questions question ON question.quiz_id = quiz.id
LEFT JOIN study_quiz_options option_row ON option_row.question_id = question.id
ORDER BY tree.path COLLATE NOCASE, quiz.id, question.position, option_row.position`;
