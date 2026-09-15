import { json, readJson } from "../auth/_shared.js";
import { recordEvent } from "../_shared/events.js";
import { buildImportStatements, buildStudyBulkPlan } from "./_plan.mjs";
import { parseStudyBulkSource } from "./_shared.mjs";
import {
  loadStudyFolders,
  parseSummary,
  prepareD1Statements,
  requireStudyBulkAdmin,
  sha256,
} from "./_endpoint-shared.js";

const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9_-]{16,100}$/;

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
