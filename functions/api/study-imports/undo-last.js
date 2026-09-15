import { json } from "../auth/_shared.js";
import { recordEvent } from "../_shared/events.js";
import { buildUndoStatements } from "./_plan.mjs";
import {
  prepareD1Statements,
  requireStudyBulkAdmin,
  toImportView,
} from "./_endpoint-shared.js";

export async function onRequestPost(context) {
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
    if (!latest)
      return json({ error: "Non ci sono importazioni da annullare." }, 404);

    const { results: folderChanges } = await env.DB.prepare(
      `SELECT depth FROM study_import_folder_changes
       WHERE import_id = ? AND action = 'created'`,
    )
      .bind(latest.id)
      .all();
    const now = new Date().toISOString();
    const operations = buildUndoStatements(
      latest.id,
      folderChanges.map((change) => change.depth),
      now,
    );
    await env.DB.batch(prepareD1Statements(env, operations));

    const remainingFolders = await env.DB.prepare(
      `SELECT COUNT(*) AS count FROM study_folders
       WHERE source_import_id = ? AND deleted_at IS NULL`,
    )
      .bind(latest.id)
      .first("count");

    context.waitUntil(
      recordEvent(
        env,
        { userId: access.session.user.id, sessionId: access.session.sessionId },
        {
          section: "aula-studio",
          eventType: "bulk_import_undone",
          metadata: {
            importId: latest.id,
            retainedNonEmptyFolders: Number(remainingFolders || 0),
          },
        },
      ),
    );

    return json({
      import: { ...toImportView(latest), undoneAt: now },
      retainedNonEmptyFolders: Number(remainingFolders || 0),
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "study_bulk_undo_error",
        message: error instanceof Error ? error.message : String(error),
      }),
    );
    return json(
      {
        error:
          "Non è stato possibile annullare l'importazione: nessuna modifica parziale è stata mantenuta.",
      },
      500,
    );
  }
}
