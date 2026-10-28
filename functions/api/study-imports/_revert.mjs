export function buildImportRevertOperations({ importId, now, folders }) {
  const operations = [
    statement(
      `UPDATE study_topics
       SET deleted_at = ?, updated_at = ?
       WHERE deleted_at IS NULL
         AND (source_import_id = ? OR (
           source_import_id IN (SELECT id FROM study_imports WHERE reverted_at IS NOT NULL)
           AND id IN (SELECT topic_id FROM study_cards WHERE source_import_id = ?)
         ))
         AND NOT EXISTS (
           SELECT 1 FROM study_cards
           WHERE topic_id = study_topics.id AND source_import_id IS NOT ?
         )`,
      now,
      now,
      importId,
      importId,
      importId,
    ),
    statement(
      `UPDATE study_quizzes
       SET deleted_at = ?, updated_at = ?
       WHERE source_import_id = ? AND deleted_at IS NULL`,
      now,
      now,
      importId,
    ),
    statement(
      `UPDATE study_topics SET updated_at = ?
       WHERE deleted_at IS NULL AND id IN (
         SELECT topic_id FROM study_cards WHERE source_import_id = ?
       )`,
      now,
      importId,
    ),
    statement(
      // I gruppi creati da questo import e rimossi conservano le carte per il recupero.
      // Nei gruppi riutilizzati si rimuovono soltanto le carte di questo import.
      `DELETE FROM study_cards
       WHERE source_import_id = ? AND topic_id IN (
         SELECT id FROM study_topics
         WHERE deleted_at IS NULL OR source_import_id IS NOT ?
       )`,
      importId,
      importId,
    ),
  ];

  for (const folder of sortImportFoldersDeepestFirst(folders)) {
    operations.push(
      statement(
        `UPDATE study_folders
         SET deleted_at = ?, updated_at = ?
         WHERE id = ?
           AND source_import_id = ?
           AND deleted_at IS NULL
           AND NOT EXISTS (
             SELECT 1 FROM study_folders AS child
             WHERE child.parent_id = study_folders.id AND child.deleted_at IS NULL
           )
           AND NOT EXISTS (
             SELECT 1 FROM study_topics AS topic
             WHERE topic.folder_id = study_folders.id AND topic.deleted_at IS NULL
           )
           AND NOT EXISTS (
             SELECT 1 FROM study_quizzes AS quiz
             WHERE quiz.folder_id = study_folders.id AND quiz.deleted_at IS NULL
           )`,
        now,
        now,
        folder.id,
        importId,
      ),
    );
  }

  return operations;
}

export function sortImportFoldersDeepestFirst(folders) {
  const byId = new Map(folders.map((folder) => [Number(folder.id), folder]));
  const depths = new Map();

  const depthOf = (folder, visiting = new Set()) => {
    const id = Number(folder.id);
    if (depths.has(id)) return depths.get(id);
    if (visiting.has(id)) return 0;

    const nextVisiting = new Set(visiting).add(id);
    const parent =
      folder.parent_id === null || folder.parent_id === undefined
        ? null
        : byId.get(Number(folder.parent_id));
    const depth = parent ? depthOf(parent, nextVisiting) + 1 : 0;
    depths.set(id, depth);
    return depth;
  };

  return [...folders].sort((left, right) => {
    const depthDifference = depthOf(right) - depthOf(left);
    return depthDifference || Number(right.id) - Number(left.id);
  });
}

function statement(sql, ...params) {
  return { sql, params };
}
