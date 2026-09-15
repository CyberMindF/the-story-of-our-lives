import { json, readJson } from "../auth/_shared.js";
import { recordEvent } from "../_shared/events.js";
import {
  buildImportStatements,
  buildStudyBulkPlan,
  normalizeConflictPolicy,
} from "./_plan.mjs";
import { parseStudyBulkSource } from "./_shared.mjs";
import {
  loadStudyImportState,
  prepareD1Statements,
  requireStudyBulkAdmin,
  sha256,
  toImportView,
} from "./_endpoint-shared.js";

const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9_-]{16,100}$/;

export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const access = await requireStudyBulkAdmin(request, env);
    if (access.response) return access.response;

    const latest = await env.DB.prepare(
      `SELECT id, conflict_policy, summary_json, created_at, undone_at
       FROM study_imports
       WHERE user_id = ? AND undone_at IS NULL
       ORDER BY created_at DESC, rowid DESC
       LIMIT 1`,
    )
      .bind(access.session.user.id)
      .first();
    return json({ import: toImportView(latest) });
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "study_bulk_latest_error",
        message: error instanceof Error ? error.message : String(error),
      }),
    );
    return json(
      { error: "Non è stato possibile leggere l'ultima importazione." },
      500,
    );
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  let userId = null;
  let idempotencyKey = null;
  let sourceHash = null;
  let conflictPolicy = null;

  try {
    const access = await requireStudyBulkAdmin(request, env);
    if (access.response) return access.response;
    userId = access.session.user.id;

    const payload = await readJson(request);
    idempotencyKey =
      typeof payload?.idempotencyKey === "string"
        ? payload.idempotencyKey.trim()
        : "";
    conflictPolicy = normalizeConflictPolicy(payload?.conflictPolicy);
    if (!IDEMPOTENCY_KEY_PATTERN.test(idempotencyKey)) {
      return json({ error: "La chiave dell'importazione non è valida." }, 400);
    }
    if (!conflictPolicy) {
      return json({ error: "La gestione dei conflitti non è valida." }, 400);
    }

    const parsed = parseStudyBulkSource(payload?.source);
    if (parsed.errors.length > 0) return json({ errors: parsed.errors }, 400);
    sourceHash = await sha256(payload.source);

    const existingImport = await findImportByKey(env, userId, idempotencyKey);
    if (existingImport) {
      return duplicateImportResponse(
        existingImport,
        sourceHash,
        conflictPolicy,
      );
    }

    const state = await loadStudyImportState(env);
    const plan = buildStudyBulkPlan(
      parsed,
      state.folders,
      state.topics,
      conflictPolicy,
    );
    if (plan.errors.length > 0) return json({ errors: plan.errors }, 409);

    const importId = crypto.randomUUID();
    const now = new Date().toISOString();
    const operations = buildImportStatements({
      plan,
      importId,
      userId,
      idempotencyKey,
      sourceHash,
      conflictPolicy,
      now,
    });
    await env.DB.batch(prepareD1Statements(env, operations));

    context.waitUntil(
      recordEvent(
        env,
        { userId, sessionId: access.session.sessionId },
        {
          section: "aula-studio",
          eventType: "bulk_import_created",
          metadata: { importId, conflictPolicy, ...plan.summary },
        },
      ),
    );

    return json(
      {
        importId,
        conflictPolicy,
        summary: plan.summary,
        createdAt: now,
        idempotent: false,
      },
      201,
    );
  } catch (error) {
    if (userId && idempotencyKey && sourceHash && conflictPolicy) {
      const existingImport = await findImportByKey(env, userId, idempotencyKey);
      if (existingImport) {
        return duplicateImportResponse(
          existingImport,
          sourceHash,
          conflictPolicy,
        );
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

async function findImportByKey(env, userId, idempotencyKey) {
  return env.DB.prepare(
    `SELECT id, source_hash, conflict_policy, summary_json, created_at, undone_at
     FROM study_imports WHERE user_id = ? AND idempotency_key = ?`,
  )
    .bind(userId, idempotencyKey)
    .first();
}

function duplicateImportResponse(existing, sourceHash, conflictPolicy) {
  if (
    existing.source_hash !== sourceHash ||
    existing.conflict_policy !== conflictPolicy
  ) {
    return json(
      { error: "Questa chiave è già stata usata per un'importazione diversa." },
      409,
    );
  }
  const view = toImportView(existing);
  return json({
    importId: view.id,
    conflictPolicy: view.conflictPolicy,
    summary: view.summary,
    createdAt: view.createdAt,
    undoneAt: view.undoneAt,
    idempotent: true,
  });
}
