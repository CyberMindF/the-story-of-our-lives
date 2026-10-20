import { json, readJson } from "../auth/_shared.js";
import { recordEvent } from "../_shared/events.js";
import { buildImportStatements, buildStudyBulkPlan } from "./_plan.mjs";
import {
  LEGACY_IMPORT_DETAILS_SQL,
  normalizeStoredImportDetails,
} from "./_history.mjs";
import { parseStudyBulkSource } from "./_shared.mjs";
import {
  loadStudyFolders,
  parseSummary,
  prepareD1Statements,
  requireStudyBulkAdmin,
  sha256,
} from "./_endpoint-shared.js";

const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9_-]{16,100}$/;

export async function onRequestGet({ request, env }) {
  try {
    const access = await requireStudyBulkAdmin(request, env);
    if (access.response) return access.response;

    const { results } = await env.DB.prepare(
      `SELECT imports.id, imports.summary_json, imports.created_at,
              imports.reverted_at, creator.nickname AS creator_nickname,
              reverted_by.nickname AS reverted_by_nickname,
              (SELECT COUNT(*) FROM study_folders AS folders
               WHERE folders.source_import_id = imports.id) AS folder_count,
              ((SELECT COUNT(*) FROM study_topics AS topics
                WHERE topics.source_import_id = imports.id
                  AND topics.deleted_at IS NULL
                  AND topics.updated_at > imports.created_at) +
               (SELECT COUNT(*) FROM study_quizzes AS quizzes
                WHERE quizzes.source_import_id = imports.id
                  AND quizzes.deleted_at IS NULL
                  AND quizzes.updated_at > imports.created_at) +
               (SELECT COUNT(*) FROM study_folders AS modified_folders
                WHERE modified_folders.source_import_id = imports.id
                  AND modified_folders.deleted_at IS NULL
                  AND modified_folders.updated_at > imports.created_at)) AS modified_item_count
       FROM study_imports AS imports
       JOIN users AS creator ON creator.id = imports.user_id
       LEFT JOIN users AS reverted_by ON reverted_by.id = imports.reverted_by_user_id
       ORDER BY imports.created_at DESC
       LIMIT 100`,
    ).all();

    const imports = results.map(toImportView);
    await addLegacyImportDetails(env, imports);
    return json({ imports });
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "study_bulk_import_list_error",
        message: error instanceof Error ? error.message : String(error),
      }),
    );
    return json(
      { error: "Non è stato possibile caricare le importazioni." },
      500,
    );
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  let userId;
  let idempotencyKey;
  let sourceHash;

  try {
    const access = await requireStudyBulkAdmin(request, env);
    if (access.response) return access.response;
    userId = access.session.user.id;

    const payload = await readJson(request);
    idempotencyKey =
      typeof payload?.idempotencyKey === "string"
        ? payload.idempotencyKey.trim()
        : "";
    if (!IDEMPOTENCY_KEY_PATTERN.test(idempotencyKey)) {
      return json({ error: "La chiave dell'importazione non è valida." }, 400);
    }

    const parsed = parseStudyBulkSource(payload?.source);
    if (parsed.errors.length > 0) return json({ errors: parsed.errors }, 400);
    sourceHash = await sha256(payload.source);

    const existing = await findImport(env, userId, idempotencyKey);
    if (existing) return duplicateResponse(existing, sourceHash);

    const plan = buildStudyBulkPlan(parsed, await loadStudyFolders(env));
    const importId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const operations = buildImportStatements({
      plan,
      importId,
      userId,
      idempotencyKey,
      sourceHash,
      now: createdAt,
    });
    await env.DB.batch(prepareD1Statements(env, operations));

    context.waitUntil(
      recordEvent(
        env,
        { userId, sessionId: access.session.sessionId },
        {
          section: "aula-studio",
          eventType: "bulk_import_created",
          metadata: { importId, ...plan.summary },
        },
      ),
    );

    return json(
      { importId, summary: plan.summary, createdAt, idempotent: false },
      201,
    );
  } catch (error) {
    if (userId && idempotencyKey && sourceHash) {
      try {
        const existing = await findImport(env, userId, idempotencyKey);
        if (existing) return duplicateResponse(existing, sourceHash);
      } catch {
        // Mantiene l'errore originale come causa principale.
      }
    }
    console.error(
      JSON.stringify({
        event: "study_bulk_import_error",
        message: error instanceof Error ? error.message : String(error),
      }),
    );
    return json(
      {
        error: "L'importazione non è riuscita: nessun dato è stato modificato.",
      },
      500,
    );
  }
}

function findImport(env, userId, idempotencyKey) {
  return env.DB.prepare(
    `SELECT id, source_hash, summary_json, created_at
     FROM study_imports WHERE user_id = ? AND idempotency_key = ?`,
  )
    .bind(userId, idempotencyKey)
    .first();
}

function duplicateResponse(existing, sourceHash) {
  if (existing.source_hash !== sourceHash) {
    return json(
      { error: "Questa chiave è già stata usata per un'importazione diversa." },
      409,
    );
  }
  return json({
    importId: existing.id,
    summary: parseSummary(existing.summary_json),
    createdAt: existing.created_at,
    idempotent: true,
  });
}

function toImportView(row) {
  const summary = parseSummary(row.summary_json) ?? {};
  return {
    id: row.id,
    createdAt: row.created_at,
    createdBy: row.creator_nickname,
    revertedAt: row.reverted_at ?? null,
    revertedBy: row.reverted_by_nickname ?? null,
    createdFolders: Number(row.folder_count || 0),
    modifiedItems: Number(row.modified_item_count || 0),
    details: normalizeStoredImportDetails(summary.details),
    summary: {
      paths: Number(summary.paths || 0),
      topics: Number(summary.topics || 0),
      cards: Number(summary.cards || 0),
      quizzes: Number(summary.quizzes || 0),
      quizQuestions: Number(summary.quizQuestions || 0),
    },
  };
}

async function addLegacyImportDetails(env, imports) {
  const importIds = imports
    .filter((item) => item.details.length === 0)
    .map((item) => item.id);
  if (importIds.length === 0) return;

  const { results } = await env.DB.prepare(LEGACY_IMPORT_DETAILS_SQL)
    .bind(JSON.stringify(importIds))
    .all();

  const importsById = new Map(imports.map((item) => [item.id, item]));
  for (const row of results) {
    const item = importsById.get(row.source_import_id);
    if (!item) continue;
    item.details.push({
      path: String(row.path),
      kind: row.kind === "quiz" ? "quiz" : "flashcard",
      title: String(row.title),
      itemCount: Number(row.item_count || 0),
    });
  }
}
