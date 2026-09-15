import { getAuthenticatedSession, json, readJson } from "../auth/_shared.js";
import { recordEvent } from "../_shared/events.js";
import {
  normalizeFolderId,
  normalizeFolderName,
  toFolderView,
} from "./_shared.js";

export async function onRequestPut(context) {
  const { request, env, params } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const folderId = normalizeFolderId(params.id);
    if (!folderId) return json({ error: "Cartella non valida." }, 400);
    const existing = await env.DB.prepare(
      "SELECT id FROM study_folders WHERE id = ? AND deleted_at IS NULL",
    )
      .bind(folderId)
      .first();
    if (!existing) return json({ error: "Cartella non trovata." }, 404);

    const payload = await readJson(request);
    const name = normalizeFolderName(payload?.name);
    if (!name)
      return json({ error: "Il nome della cartella non è valido." }, 400);

    const now = new Date().toISOString();
    await env.DB.prepare(
      "UPDATE study_folders SET name = ?, updated_at = ? WHERE id = ?",
    )
      .bind(name, now, folderId)
      .run();
    const updated = await env.DB.prepare(
      "SELECT * FROM study_folders WHERE id = ? AND deleted_at IS NULL",
    )
      .bind(folderId)
      .first();

    context.waitUntil(
      recordEvent(
        env,
        { userId: session.user.id, sessionId: session.sessionId },
        {
          section: "aula-studio",
          eventType: "content_updated",
          metadata: { folderId, contentType: "folder" },
        },
      ),
    );

    return json(toFolderView(updated));
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "study_folders_update_error",
        message: error.message,
      }),
    );
    return json(
      { error: "Non è stato possibile rinominare la cartella." },
      500,
    );
  }
}

export async function onRequestDelete(context) {
  const { request, env, params } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const folderId = normalizeFolderId(params.id);
    if (!folderId) return json({ error: "Cartella non valida." }, 400);
    const existing = await env.DB.prepare(
      "SELECT id FROM study_folders WHERE id = ? AND deleted_at IS NULL",
    )
      .bind(folderId)
      .first();
    if (!existing) return json({ error: "Cartella non trovata." }, 404);

    const content = await env.DB.prepare(
      `SELECT
         EXISTS(SELECT 1 FROM study_folders WHERE parent_id = ? AND deleted_at IS NULL) AS has_folders,
         EXISTS(SELECT 1 FROM study_topics WHERE folder_id = ? AND deleted_at IS NULL) AS has_topics`,
    )
      .bind(folderId, folderId)
      .first();
    if (content?.has_folders || content?.has_topics) {
      return json(
        {
          error:
            "La cartella non è vuota. Sposta o elimina prima il suo contenuto.",
        },
        409,
      );
    }

    const now = new Date().toISOString();
    await env.DB.prepare(
      "UPDATE study_folders SET deleted_at = ?, updated_at = ? WHERE id = ?",
    )
      .bind(now, now, folderId)
      .run();
    context.waitUntil(
      recordEvent(
        env,
        { userId: session.user.id, sessionId: session.sessionId },
        {
          section: "aula-studio",
          eventType: "content_deleted",
          metadata: { folderId, contentType: "folder" },
        },
      ),
    );
    return json({ id: folderId, deleted: true, deletedAt: now });
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "study_folders_delete_error",
        message: error.message,
      }),
    );
    return json({ error: "Non è stato possibile eliminare la cartella." }, 500);
  }
}
