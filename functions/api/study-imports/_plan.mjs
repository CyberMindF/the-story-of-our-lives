import { normalizeLookupText } from "./_shared.mjs";

export function buildStudyBulkPlan(parsed, existingFolders) {
  const existingByParentAndName = new Map();
  for (const folder of existingFolders) {
    const key = folderKey(existingRef(folder.parent_id), folder.name);
    if (!existingByParentAndName.has(key)) {
      existingByParentAndName.set(key, folder);
    }
  }

  const resolvedFolders = new Map();
  const foldersToCreate = [];
  const topics = [];

  for (const path of parsed.paths) {
    let parentRef = rootRef();
    for (const [depthIndex, name] of path.segments.entries()) {
      const key = folderKey(parentRef, name);
      let folderRef = resolvedFolders.get(key);
      if (!folderRef) {
        const existing =
          parentRef.kind === "new" ? null : existingByParentAndName.get(key);
        folderRef = existing
          ? existingRef(existing.id)
          : newRef(foldersToCreate.length);
        if (!existing) {
          foldersToCreate.push({
            name,
            parentRef,
            depth: depthIndex + 1,
            position: folderRef.position,
          });
        }
        resolvedFolders.set(key, folderRef);
      }
      parentRef = folderRef;
    }

    for (const topic of path.topics) {
      topics.push({
        title: topic.title,
        cards: topic.cards,
        folderRef: parentRef,
        position: topics.length,
      });
    }
  }

  return {
    foldersToCreate,
    topics,
    summary: {
      paths: parsed.paths.length,
      topics: parsed.totalTopics,
      cards: parsed.totalCards,
    },
    preview: parsed.paths.map((path) => ({
      path: path.path,
      topics: path.topics.map((topic) => ({
        title: topic.title,
        cardCount: topic.cards.length,
      })),
    })),
  };
}

export function buildImportStatements({
  plan,
  importId,
  userId,
  idempotencyKey,
  sourceHash,
  now,
}) {
  const statements = [
    statement(
      `INSERT INTO study_imports
        (id, user_id, idempotency_key, source_hash, summary_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      importId,
      userId,
      idempotencyKey,
      sourceHash,
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
        JSON.stringify((foldersByDepth.get(depth) ?? []).map(folderPayload)),
      ),
    );
  }

  if (plan.topics.length > 0) {
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
        JSON.stringify(plan.topics.map(topicPayload)),
      ),
    );

    statements.push(
      statement(
        `INSERT INTO study_cards (topic_id, question, answer, position, created_at)
         SELECT imported_topic.id,
           json_extract(card.value, '$.question'),
           json_extract(card.value, '$.answer'),
           CAST(card.key AS INTEGER), ?
         FROM json_each(?) AS topic
         JOIN json_each(json_extract(topic.value, '$.cards')) AS card
         JOIN study_topics AS imported_topic
           ON imported_topic.source_import_id = ?
          AND imported_topic.source_import_position = json_extract(topic.value, '$.position')
         ORDER BY json_extract(topic.value, '$.position'), CAST(card.key AS INTEGER)`,
        now,
        JSON.stringify(plan.topics.map(topicCardsPayload)),
        importId,
      ),
    );
  }

  return statements;
}

function rootRef() {
  return { kind: "root" };
}

function existingRef(id) {
  return id === null || id === undefined ? rootRef() : { kind: "existing", id };
}

function newRef(position) {
  return { kind: "new", position };
}

function refKey(ref) {
  if (ref.kind === "root") return "root";
  return ref.kind === "existing" ? `existing:${ref.id}` : `new:${ref.position}`;
}

function folderKey(parentRef, name) {
  return `${refKey(parentRef)}\u0000${normalizeLookupText(name)}`;
}

function refPayload(ref, prefix) {
  if (ref.kind === "root") return { [`${prefix}Kind`]: "root" };
  if (ref.kind === "existing") {
    return { [`${prefix}Kind`]: "existing", [`${prefix}Id`]: ref.id };
  }
  return { [`${prefix}Kind`]: "new", [`${prefix}Position`]: ref.position };
}

function folderPayload(folder) {
  return {
    ...refPayload(folder.parentRef, "parent"),
    name: folder.name,
    position: folder.position,
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
  return { position: topic.position, cards: topic.cards };
}

function statement(sql, ...params) {
  return { sql, params };
}
