import { normalizeLookupText } from "./_shared.mjs";

const CONFLICT_POLICIES = new Set(["skip", "append", "replace"]);

export function normalizeConflictPolicy(value) {
  return CONFLICT_POLICIES.has(value) ? value : null;
}

export function buildStudyBulkPlan(
  parsed,
  existingFolders,
  existingTopics,
  conflictPolicy,
) {
  if (!normalizeConflictPolicy(conflictPolicy)) {
    throw new Error("Politica di conflitto non valida.");
  }

  const errors = [];
  const existingFolderChildren = indexUnique(
    existingFolders,
    (folder) => folderLookupKey(existingRef(folder.parent_id), folder.name),
    (folder) =>
      `Esistono più cartelle chiamate “${folder.name}” nello stesso livello.`,
    errors,
  );
  const existingTopicsByFolder = indexUnique(
    existingTopics,
    (topic) => topicLookupKey(existingRef(topic.folder_id), topic.title),
    (topic) =>
      `Esistono più argomenti chiamati “${topic.title}” nella stessa cartella.`,
    errors,
  );

  const resolvedFolders = new Map();
  const folderChanges = [];
  const foldersToCreate = [];
  const topics = [];
  let folderPosition = 0;
  let topicPosition = 0;

  for (const path of parsed.paths) {
    let parentRef = rootRef();
    for (const [depthIndex, name] of path.segments.entries()) {
      const lookupKey = folderLookupKey(parentRef, name);
      let folderRef = resolvedFolders.get(lookupKey);
      if (!folderRef) {
        const existing =
          parentRef.kind === "imported"
            ? null
            : existingFolderChildren.get(lookupKey);
        if (existing) {
          folderRef = importedExistingRef(existing.id);
          folderChanges.push({
            ref: folderRef,
            action: "reused",
            depth: depthIndex + 1,
            position: folderPosition,
          });
        } else {
          folderRef = importedNewRef(folderPosition);
          foldersToCreate.push({
            ref: folderRef,
            parentRef,
            name,
            depth: depthIndex + 1,
            position: folderPosition,
          });
          folderChanges.push({
            ref: folderRef,
            action: "created",
            depth: depthIndex + 1,
            position: folderPosition,
          });
        }
        resolvedFolders.set(lookupKey, folderRef);
        folderPosition += 1;
      }
      parentRef = folderRef;
    }

    for (const topic of path.topics) {
      const existing =
        parentRef.kind === "imported"
          ? null
          : existingTopicsByFolder.get(topicLookupKey(parentRef, topic.title));
      const action = existing ? conflictPolicy : "create";
      topics.push({
        position: topicPosition,
        path: path.path,
        pathLine: path.line,
        title: topic.title,
        line: topic.line,
        cards: topic.cards,
        folderRef: parentRef,
        action,
        existingTopicId: existing?.id ?? null,
        previousUpdatedAt: existing?.updated_at ?? null,
      });
      topicPosition += 1;
    }
  }

  const summary = {
    foldersCreated: foldersToCreate.length,
    foldersReused: folderChanges.filter((change) => change.action === "reused")
      .length,
    topicsCreated: topics.filter((topic) => topic.action === "create").length,
    topicsSkipped: topics.filter((topic) => topic.action === "skip").length,
    topicsAppended: topics.filter((topic) => topic.action === "append").length,
    topicsReplaced: topics.filter((topic) => topic.action === "replace").length,
    cardsInserted: topics
      .filter((topic) => topic.action !== "skip")
      .reduce((total, topic) => total + topic.cards.length, 0),
  };

  return {
    errors,
    conflictCount: topics.filter((topic) => topic.existingTopicId !== null)
      .length,
    folderChanges,
    foldersToCreate,
    topics,
    summary,
    preview: parsed.paths.map((path) => ({
      path: path.path,
      segments: path.segments,
      topics: path.topics.map((topic) => {
        const planned = topics.find(
          (candidate) => candidate.line === topic.line,
        );
        return {
          title: topic.title,
          cardCount: topic.cards.length,
          conflict: planned?.existingTopicId !== null,
        };
      }),
    })),
  };
}

export function buildImportStatements({
  plan,
  importId,
  userId,
  idempotencyKey,
  sourceHash,
  conflictPolicy,
  now,
}) {
  const statements = [
    statement(
      `INSERT INTO study_imports
        (id, user_id, idempotency_key, source_hash, conflict_policy, summary_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      importId,
      userId,
      idempotencyKey,
      sourceHash,
      conflictPolicy,
      JSON.stringify(plan.summary),
      now,
    ),
  ];

  const foldersByDepth = Map.groupBy(
    plan.foldersToCreate,
    (folder) => folder.depth,
  );
  for (const depth of [...foldersByDepth.keys()].sort(
    (left, right) => left - right,
  )) {
    const folders = foldersByDepth.get(depth) ?? [];
    statements.push(
      statement(
        `INSERT INTO study_folders
          (user_id, parent_id, name, created_at, updated_at, source_import_id, source_import_position)
         SELECT ?,
           CASE json_extract(folder.value, '$.parentKind')
             WHEN 'root' THEN NULL
             WHEN 'existing' THEN json_extract(folder.value, '$.parentId')
             ELSE (
               SELECT id FROM study_folders
               WHERE source_import_id = ?
                 AND source_import_position = json_extract(folder.value, '$.parentPosition')
             )
           END,
           json_extract(folder.value, '$.name'), ?, ?, ?,
           json_extract(folder.value, '$.position')
         FROM json_each(?) AS folder
         ORDER BY json_extract(folder.value, '$.position')`,
        userId,
        importId,
        now,
        now,
        importId,
        JSON.stringify(folders.map(folderPayload)),
      ),
    );
  }

  if (plan.folderChanges.length > 0) {
    statements.push(
      statement(
        `INSERT INTO study_import_folder_changes
          (import_id, folder_id, action, depth, position)
         SELECT ?,
           CASE json_extract(change.value, '$.kind')
             WHEN 'existing' THEN json_extract(change.value, '$.id')
             ELSE (
               SELECT id FROM study_folders
               WHERE source_import_id = ?
                 AND source_import_position = json_extract(change.value, '$.importPosition')
             )
           END,
           json_extract(change.value, '$.action'),
           json_extract(change.value, '$.depth'),
           json_extract(change.value, '$.position')
         FROM json_each(?) AS change`,
        importId,
        importId,
        JSON.stringify(plan.folderChanges.map(folderChangePayload)),
      ),
    );
  }

  const replaced = plan.topics.filter((topic) => topic.action === "replace");
  if (replaced.length > 0) {
    statements.push(
      statement(
        `UPDATE study_topics
         SET deleted_at = ?, updated_at = ?
         WHERE id IN (SELECT CAST(value AS INTEGER) FROM json_each(?))
           AND deleted_at IS NULL`,
        now,
        now,
        JSON.stringify(replaced.map((topic) => topic.existingTopicId)),
      ),
    );
  }

  const created = plan.topics.filter(
    (topic) => topic.action === "create" || topic.action === "replace",
  );
  if (created.length > 0) {
    statements.push(
      statement(
        `INSERT INTO study_topics
          (user_id, folder_id, title, created_at, updated_at, source_import_id, source_import_position)
         SELECT ?,
           CASE json_extract(topic.value, '$.folderKind')
             WHEN 'root' THEN NULL
             WHEN 'existing' THEN json_extract(topic.value, '$.folderId')
             ELSE (
               SELECT id FROM study_folders
               WHERE source_import_id = ?
                 AND source_import_position = json_extract(topic.value, '$.folderPosition')
             )
           END,
           json_extract(topic.value, '$.title'), ?, ?, ?,
           json_extract(topic.value, '$.position')
         FROM json_each(?) AS topic
         ORDER BY json_extract(topic.value, '$.position')`,
        userId,
        importId,
        now,
        now,
        importId,
        JSON.stringify(created.map(topicPayload)),
      ),
    );

    statements.push(
      statement(
        `INSERT INTO study_cards
          (topic_id, question, answer, position, created_at, source_import_id)
         SELECT imported_topic.id,
           json_extract(card.value, '$.question'),
           json_extract(card.value, '$.answer'),
           CAST(card.key AS INTEGER), ?, ?
         FROM json_each(?) AS topic
         JOIN json_each(json_extract(topic.value, '$.cards')) AS card
         JOIN study_topics AS imported_topic
           ON imported_topic.source_import_id = ?
          AND imported_topic.source_import_position = json_extract(topic.value, '$.position')`,
        now,
        importId,
        JSON.stringify(created.map(topicCardsPayload)),
        importId,
      ),
    );
  }

  const appended = plan.topics.filter((topic) => topic.action === "append");
  if (appended.length > 0) {
    const appendedPayload = JSON.stringify(appended.map(topicCardsPayload));
    statements.push(
      statement(
        `INSERT INTO study_cards
          (topic_id, question, answer, position, created_at, source_import_id)
         SELECT json_extract(topic.value, '$.existingTopicId'),
           json_extract(card.value, '$.question'),
           json_extract(card.value, '$.answer'),
           COALESCE((
             SELECT MAX(existing_card.position) + 1
             FROM study_cards AS existing_card
             WHERE existing_card.topic_id = json_extract(topic.value, '$.existingTopicId')
           ), 0) + CAST(card.key AS INTEGER), ?, ?
         FROM json_each(?) AS topic
         JOIN json_each(json_extract(topic.value, '$.cards')) AS card`,
        now,
        importId,
        appendedPayload,
      ),
    );
    statements.push(
      statement(
        `UPDATE study_topics SET updated_at = ?
         WHERE id IN (
           SELECT json_extract(value, '$.existingTopicId') FROM json_each(?)
         )`,
        now,
        appendedPayload,
      ),
    );
  }

  if (plan.topics.length > 0) {
    statements.push(
      statement(
        `INSERT INTO study_import_topic_changes
          (import_id, topic_id, previous_topic_id, previous_updated_at, action, cards_added, position)
         SELECT ?,
           CASE json_extract(change.value, '$.targetKind')
             WHEN 'existing' THEN json_extract(change.value, '$.existingTopicId')
             ELSE (
               SELECT id FROM study_topics
               WHERE source_import_id = ?
                 AND source_import_position = json_extract(change.value, '$.position')
             )
           END,
           json_extract(change.value, '$.previousTopicId'),
           json_extract(change.value, '$.previousUpdatedAt'),
           json_extract(change.value, '$.action'),
           json_extract(change.value, '$.cardsAdded'),
           json_extract(change.value, '$.position')
         FROM json_each(?) AS change`,
        importId,
        importId,
        JSON.stringify(plan.topics.map(topicChangePayload)),
      ),
    );
  }

  return statements;
}

export function buildUndoStatements(importId, createdFolderDepths, now) {
  const statements = [
    statement(
      `DELETE FROM study_cards
       WHERE source_import_id = ?
         AND topic_id IN (
           SELECT topic_id FROM study_import_topic_changes
           WHERE import_id = ? AND action = 'appended'
         )`,
      importId,
      importId,
    ),
    statement(
      `UPDATE study_topics
       SET deleted_at = ?, updated_at = ?
       WHERE source_import_id = ? AND deleted_at IS NULL`,
      now,
      now,
      importId,
    ),
    statement(
      `UPDATE study_topics
       SET deleted_at = NULL,
           updated_at = COALESCE((
             SELECT previous_updated_at FROM study_import_topic_changes
             WHERE import_id = ? AND previous_topic_id = study_topics.id
           ), updated_at)
       WHERE id IN (
         SELECT previous_topic_id FROM study_import_topic_changes
         WHERE import_id = ? AND action = 'replaced' AND previous_topic_id IS NOT NULL
       )`,
      importId,
      importId,
    ),
    statement(
      `UPDATE study_topics
       SET updated_at = COALESCE((
         SELECT previous_updated_at FROM study_import_topic_changes
         WHERE import_id = ? AND topic_id = study_topics.id AND action = 'appended'
       ), updated_at)
       WHERE id IN (
         SELECT topic_id FROM study_import_topic_changes
         WHERE import_id = ? AND action = 'appended'
       )`,
      importId,
      importId,
    ),
  ];

  for (const depth of [...new Set(createdFolderDepths)].sort(
    (left, right) => right - left,
  )) {
    statements.push(
      statement(
        `UPDATE study_folders
         SET deleted_at = ?, updated_at = ?
         WHERE source_import_id = ?
           AND id IN (
             SELECT folder_id FROM study_import_folder_changes
             WHERE import_id = ? AND action = 'created' AND depth = ?
           )
           AND NOT EXISTS (
             SELECT 1 FROM study_folders AS child
             WHERE child.parent_id = study_folders.id AND child.deleted_at IS NULL
           )
           AND NOT EXISTS (
             SELECT 1 FROM study_topics AS topic
             WHERE topic.folder_id = study_folders.id AND topic.deleted_at IS NULL
           )`,
        now,
        now,
        importId,
        importId,
        depth,
      ),
    );
  }

  statements.push(
    statement(
      "UPDATE study_imports SET undone_at = ? WHERE id = ? AND undone_at IS NULL",
      now,
      importId,
    ),
  );
  return statements;
}

function indexUnique(rows, keyFor, duplicateMessage, errors) {
  const index = new Map();
  for (const row of rows) {
    const key = keyFor(row);
    if (index.has(key)) errors.push({ message: duplicateMessage(row) });
    else index.set(key, row);
  }
  return index;
}

function rootRef() {
  return { kind: "root" };
}

function existingRef(id) {
  return id === null || id === undefined ? rootRef() : { kind: "existing", id };
}

function importedExistingRef(id) {
  return { kind: "existing", id };
}

function importedNewRef(position) {
  return { kind: "imported", position };
}

function refKey(ref) {
  if (ref.kind === "root") return "root";
  return ref.kind === "existing"
    ? `existing:${ref.id}`
    : `imported:${ref.position}`;
}

function folderLookupKey(parentRef, name) {
  return `${refKey(parentRef)}\u0000${normalizeLookupText(name)}`;
}

function topicLookupKey(folderRef, title) {
  return `${refKey(folderRef)}\u0001${normalizeLookupText(title)}`;
}

function refPayload(ref, prefix) {
  if (ref.kind === "root") return { [`${prefix}Kind`]: "root" };
  if (ref.kind === "existing") {
    return { [`${prefix}Kind`]: "existing", [`${prefix}Id`]: ref.id };
  }
  return { [`${prefix}Kind`]: "imported", [`${prefix}Position`]: ref.position };
}

function folderPayload(folder) {
  return {
    ...refPayload(folder.parentRef, "parent"),
    name: folder.name,
    position: folder.position,
  };
}

function folderChangePayload(change) {
  return {
    ...(change.ref.kind === "existing"
      ? { kind: "existing", id: change.ref.id }
      : { kind: "imported", importPosition: change.ref.position }),
    action: change.action,
    depth: change.depth,
    position: change.position,
  };
}

function topicPayload(topic) {
  return {
    ...refPayload(topic.folderRef, "folder"),
    title: topic.title,
    position: topic.position,
  };
}

function topicCardsPayload(topic) {
  return {
    position: topic.position,
    existingTopicId: topic.existingTopicId,
    cards: topic.cards,
  };
}

function topicChangePayload(topic) {
  const storedAction = {
    create: "created",
    skip: "skipped",
    append: "appended",
    replace: "replaced",
  }[topic.action];
  return {
    targetKind:
      topic.action === "skip" || topic.action === "append"
        ? "existing"
        : "imported",
    existingTopicId: topic.existingTopicId,
    previousTopicId: topic.action === "replace" ? topic.existingTopicId : null,
    previousUpdatedAt: topic.previousUpdatedAt,
    action: storedAction,
    cardsAdded: topic.action === "skip" ? 0 : topic.cards.length,
    position: topic.position,
  };
}

function statement(sql, ...params) {
  return { sql, params };
}
