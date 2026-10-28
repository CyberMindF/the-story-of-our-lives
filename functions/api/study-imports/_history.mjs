export const LEGACY_IMPORT_DETAILS_SQL = `WITH RECURSIVE
  selected_imports(id) AS (
    SELECT CAST(value AS TEXT) FROM json_each(?)
  ),
  folder_paths(id, path, visited) AS (
    SELECT folders.id, folders.name, ',' || folders.id || ','
    FROM study_folders AS folders
    WHERE folders.parent_id IS NULL
    UNION ALL
    SELECT child.id, parent.path || ' › ' || child.name,
           parent.visited || child.id || ','
    FROM study_folders AS child
    JOIN folder_paths AS parent ON parent.id = child.parent_id
    WHERE instr(parent.visited, ',' || child.id || ',') = 0
  ),
  imported_content AS (
    SELECT topics.source_import_id, topics.source_import_position AS position,
           'flashcard' AS kind, topics.title, topics.folder_id,
           (SELECT COUNT(*) FROM study_cards AS cards
            WHERE cards.topic_id = topics.id
              AND cards.source_import_id = topics.source_import_id) AS item_count
    FROM study_topics AS topics
    JOIN selected_imports ON selected_imports.id = topics.source_import_id
    UNION ALL
    SELECT quizzes.source_import_id, quizzes.source_import_position AS position,
           'quiz' AS kind, quizzes.title, quizzes.folder_id,
           (SELECT COUNT(*) FROM study_quiz_questions AS questions
            WHERE questions.quiz_id = quizzes.id) AS item_count
    FROM study_quizzes AS quizzes
    JOIN selected_imports ON selected_imports.id = quizzes.source_import_id
  )
SELECT content.source_import_id, content.kind, content.title,
       content.item_count,
       CASE
         WHEN content.folder_id IS NULL THEN 'Aula studio'
         ELSE COALESCE(folder_paths.path, 'Cartella non disponibile')
       END AS path
FROM imported_content AS content
LEFT JOIN folder_paths ON folder_paths.id = content.folder_id
ORDER BY content.source_import_id, path COLLATE NOCASE,
         content.kind, content.position`;

export function normalizeStoredImportDetails(value) {
  if (!Array.isArray(value)) return [];
  const details = [];
  for (const path of value) {
    if (!path || typeof path !== "object" || !Array.isArray(path.topics)) {
      continue;
    }
    const pathName = typeof path.path === "string" ? path.path : "Aula studio";
    for (const topic of path.topics) {
      if (!topic || typeof topic !== "object") continue;
      const kind = topic.kind === "quiz" ? "quiz" : "flashcard";
      details.push({
        path: pathName,
        kind,
        title: typeof topic.title === "string" ? topic.title : "Senza titolo",
        itemCount: Number(
          kind === "quiz" ? topic.questionCount || 0 : topic.cardCount || 0,
        ),
      });
    }
  }
  return details;
}
