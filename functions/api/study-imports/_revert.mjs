export function buildImportRevertOperations({ importId, now, folders }) {
  const operations = [
    statement(
      `UPDATE study_topics
       SET deleted_at = ?, updated_at = ?
       WHERE source_import_id = ? AND deleted_at IS NULL`,
      now,
      now,
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
