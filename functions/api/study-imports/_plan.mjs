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
  const quizzes = [];

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
    for (const quiz of path.quizzes) {
      quizzes.push({ ...quiz, folderRef: parentRef, position: quizzes.length });
    }
  }

  return {
    foldersToCreate,
    topics,
    quizzes,
    summary: {
      paths: parsed.paths.length,
      topics: parsed.totalTopics,
      cards: parsed.totalCards,
      quizzes: parsed.totalQuizzes,
      quizQuestions: parsed.totalQuizQuestions,
    },
    preview: parsed.paths.map((path) => ({
      path: path.path,
      topics: path.topics
        .map((topic) => ({
          kind: "flashcard",
          title: topic.title,
          cardCount: topic.cards.length,
        }))
        .concat(
          path.quizzes.map((quiz) => ({
            kind: "quiz",
            title: quiz.title,
            questionCount: quiz.questions.length,
          })),
        ),
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
      JSON.stringify({ ...plan.summary, details: plan.preview }),
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

  if (plan.quizzes.length > 0) {
    statements.push(
      statement(
        `INSERT INTO study_quizzes
        (user_id, folder_id, title, correction_mode, shuffle_questions, shuffle_options,
         created_at, updated_at, source_import_id, source_import_position)
       SELECT ?,
         CASE json_extract(quiz.value, '$.folderKind')
           WHEN 'root' THEN NULL
           WHEN 'existing' THEN json_extract(quiz.value, '$.folderId')
           ELSE (SELECT id FROM study_folders WHERE source_import_id = ? AND source_import_position = json_extract(quiz.value, '$.folderPosition'))
         END,
         json_extract(quiz.value, '$.title'), json_extract(quiz.value, '$.correctionMode'),
         json_extract(quiz.value, '$.shuffleQuestions'), json_extract(quiz.value, '$.shuffleOptions'),
         ?, ?, ?, json_extract(quiz.value, '$.position')
       FROM json_each(?) AS quiz ORDER BY json_extract(quiz.value, '$.position')`,
        userId,
        importId,
        now,
        now,
        importId,
        JSON.stringify(plan.quizzes.map(quizPayload)),
      ),
    );
    statements.push(
      statement(
        `INSERT INTO study_quiz_questions
        (quiz_id, type, prompt, image_url, image_alt, reference_answer, position)
       SELECT imported_quiz.id, json_extract(question.value, '$.type'),
         json_extract(question.value, '$.prompt'), json_extract(question.value, '$.imageUrl'),
         json_extract(question.value, '$.imageAlt'), json_extract(question.value, '$.referenceAnswer'),
         CAST(question.key AS INTEGER)
       FROM json_each(?) AS quiz
       JOIN json_each(json_extract(quiz.value, '$.questions')) AS question
       JOIN study_quizzes AS imported_quiz ON imported_quiz.source_import_id = ?
         AND imported_quiz.source_import_position = json_extract(quiz.value, '$.position')`,
        JSON.stringify(plan.quizzes.map(quizQuestionsPayload)),
        importId,
      ),
    );
    statements.push(
      statement(
        `INSERT INTO study_quiz_options (question_id, text, is_correct, position)
       SELECT imported_question.id, json_extract(option.value, '$.text'),
         json_extract(option.value, '$.correct'), CAST(option.key AS INTEGER)
       FROM json_each(?) AS quiz
       JOIN json_each(json_extract(quiz.value, '$.questions')) AS question
       JOIN json_each(json_extract(question.value, '$.options')) AS option
       JOIN study_quizzes AS imported_quiz ON imported_quiz.source_import_id = ?
         AND imported_quiz.source_import_position = json_extract(quiz.value, '$.position')
       JOIN study_quiz_questions AS imported_question ON imported_question.quiz_id = imported_quiz.id
         AND imported_question.position = CAST(question.key AS INTEGER)`,
        JSON.stringify(plan.quizzes.map(quizQuestionsPayload)),
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

function quizPayload(quiz) {
  return {
    ...refPayload(quiz.folderRef, "folder"),
    title: quiz.title,
    position: quiz.position,
    correctionMode: quiz.correctionMode,
    shuffleQuestions: quiz.shuffleQuestions ? 1 : 0,
    shuffleOptions: quiz.shuffleOptions ? 1 : 0,
  };
}

function quizQuestionsPayload(quiz) {
  return { position: quiz.position, questions: quiz.questions };
}

function statement(sql, ...params) {
  return { sql, params };
}
