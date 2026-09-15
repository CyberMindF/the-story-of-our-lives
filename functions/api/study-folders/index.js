import { getAuthenticatedSession, json, readJson } from "../auth/_shared.js";
import { recordEvent } from "../_shared/events.js";
import {
  folderExists,
  normalizeFolderName,
  normalizeNullableFolderId,
  toFolderView,
} from "./_shared.js";

// Come gli argomenti, le cartelle appartengono allo spazio studio condiviso.
export async function onRequestGet(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const { results } = await context.env.DB.prepare(
      "SELECT * FROM study_folders WHERE deleted_at IS NULL ORDER BY name COLLATE NOCASE, id",
    ).all();
    return json({ folders: results.map(toFolderView) });
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "study_folders_list_error",
        message: error.message,
      }),
    );
    return json({ error: "Non è stato possibile caricare le cartelle." }, 500);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const payload = await readJson(request);
    const name = normalizeFolderName(payload?.name);
    const parentId = normalizeNullableFolderId(payload?.parentId);
    if (!name)
      return json({ error: "Il nome della cartella non è valido." }, 400);
    if (parentId === undefined)
      return json({ error: "La cartella superiore non è valida." }, 400);
    if (!(await folderExists(env, parentId))) {
      return json({ error: "La cartella superiore non esiste più." }, 404);
    }

    const now = new Date().toISOString();
    const inserted = await env.DB.prepare(
      `INSERT INTO study_folders (user_id, parent_id, name, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
      .bind(session.user.id, parentId, name, now, now)
      .run();
    const folder = {
      id: inserted.meta.last_row_id,
      name,
      parentId,
      createdAt: now,
      updatedAt: now,
    };

    context.waitUntil(
      recordEvent(
        env,
        { userId: session.user.id, sessionId: session.sessionId },
        {
          section: "aula-studio",
          eventType: "content_created",
          metadata: {
            folderId: folder.id,
            parentFolderId: parentId,
            contentType: "folder",
          },
        },
      ),
    );

    return json(folder, 201);
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "study_folders_create_error",
        message: error.message,
      }),
    );
    return json({ error: "Non è stato possibile creare la cartella." }, 500);
  }
}
