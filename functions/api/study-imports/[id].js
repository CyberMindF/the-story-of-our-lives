import { json } from "../auth/_shared.js";
import { recordEvent } from "../_shared/events.js";
import {
  prepareD1Statements,
  requireStudyBulkAdmin,
} from "./_endpoint-shared.js";
import { buildImportRevertOperations } from "./_revert.mjs";

const IMPORT_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function onRequestDelete(context) {
  const { request, env, params } = context;
  try {
    const access = await requireStudyBulkAdmin(request, env);
    if (access.response) return access.response;

    const importId = typeof params.id === "string" ? params.id.trim() : "";
    if (!IMPORT_ID_PATTERN.test(importId)) {
      return json({ error: "Importazione non valida." }, 400);
    }

    const existing = await env.DB.prepare(
      `SELECT id, reverted_at
       FROM study_imports
       WHERE id = ?`,
    )
      .bind(importId)
      .first();
    if (!existing) return json({ error: "Importazione non trovata." }, 404);
    if (existing.reverted_at) {
      return json({
        importId,
        reverted: true,
        alreadyReverted: true,
        revertedAt: existing.reverted_at,
      });
    }

    const { results: folders } = await env.DB.prepare(
      `SELECT id, parent_id
       FROM study_folders
       WHERE source_import_id = ? AND deleted_at IS NULL`,
    )
      .bind(importId)
      .all();
    const now = new Date().toISOString();
    const contentOperations = buildImportRevertOperations({
      importId,
      now,
      folders,
    });
    const operations = [
      ...contentOperations,
      {
        sql: `UPDATE study_imports
              SET reverted_at = ?, reverted_by_user_id = ?
              WHERE id = ? AND reverted_at IS NULL`,
        params: [now, access.session.user.id, importId],
      },
    ];
    const results = await env.DB.batch(prepareD1Statements(env, operations));
    const importUpdate = results.at(-1);
    if (Number(importUpdate?.meta?.changes || 0) === 0) {
      const latest = await env.DB.prepare(
        "SELECT reverted_at FROM study_imports WHERE id = ?",
      )
        .bind(importId)
        .first();
      return json({
        importId,
        reverted: true,
        alreadyReverted: true,
        revertedAt: latest?.reverted_at ?? now,
      });
    }

    const topics = Number(results[0]?.meta?.changes || 0);
    const quizzes = Number(results[1]?.meta?.changes || 0);
    const foldersRemoved = results
      .slice(2, 2 + folders.length)
      .reduce((total, result) => total + Number(result.meta?.changes || 0), 0);

    context.waitUntil(
      recordEvent(
        env,
        {
          userId: access.session.user.id,
          sessionId: access.session.sessionId,
        },
        {
          section: "aula-studio",
          eventType: "bulk_import_reverted",
          metadata: { importId, topics, quizzes, folders: foldersRemoved },
        },
      ),
    );

    return json({
      importId,
      reverted: true,
      alreadyReverted: false,
      revertedAt: now,
      removed: { topics, quizzes, folders: foldersRemoved },
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "study_bulk_import_revert_error",
        message: error instanceof Error ? error.message : String(error),
      }),
    );
    return json(
      { error: "Non è stato possibile annullare l’importazione." },
      500,
    );
  }
}
