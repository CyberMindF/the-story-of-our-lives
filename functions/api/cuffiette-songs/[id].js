import { getAuthenticatedSession, json, readJson } from "../auth/_shared.js";
import { hasPermission } from "../_shared/permissions.js";
import { recordEvent } from "../_shared/events.js";
import { normalizeMediaKey, normalizeText, normalizeTitle } from "./_shared.js";
import { toSongView } from "./index.js";

export async function onRequestPut(context) {
  const { request, env, params } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.edit")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const existing = await env.DB.prepare("SELECT id FROM cuffiette_songs WHERE id = ?").bind(params.id).first();
    if (!existing) {
      return json({ error: "Canzone non trovata." }, 404);
    }

    const payload = await readJson(request);
    const title = normalizeTitle(payload?.title);
    const introduction = normalizeText(payload?.introduction);
    const lyrics = normalizeText(payload?.lyrics);
    const mediaKey = normalizeMediaKey(payload?.mediaKey);

    if (!title) return json({ error: "Titolo non valido." }, 400);
    if (!introduction) return json({ error: "Introduzione non valida." }, 400);
    if (!lyrics) return json({ error: "Testo non valido." }, 400);
    if (!mediaKey) return json({ error: "Chiave media non valida." }, 400);

    const now = new Date().toISOString();
    await env.DB
      .prepare("UPDATE cuffiette_songs SET title = ?, introduction = ?, lyrics = ?, media_key = ?, updated_at = ? WHERE id = ?")
      .bind(title, introduction, lyrics, mediaKey, now, params.id)
      .run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "cuffiette",
      eventType: "content_updated",
      metadata: { songId: params.id }
    }));

    const updated = await env.DB.prepare("SELECT * FROM cuffiette_songs WHERE id = ?").bind(params.id).first();
    return json(toSongView(updated));
  } catch (error) {
    console.error(JSON.stringify({ event: "cuffiette_songs_update_error", message: error.message }));
    return json({ error: "Non è stato possibile salvare la canzone." }, 500);
  }
}

export async function onRequestDelete(context) {
  const { env, params } = context;
  try {
    const session = await getAuthenticatedSession(context.request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.delete")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const existing = await env.DB.prepare("SELECT id FROM cuffiette_songs WHERE id = ?").bind(params.id).first();
    if (!existing) {
      return json({ error: "Canzone non trovata." }, 404);
    }

    await env.DB.prepare("DELETE FROM cuffiette_songs WHERE id = ?").bind(params.id).run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "cuffiette",
      eventType: "content_deleted",
      metadata: { songId: params.id }
    }));

    return json({ id: params.id, deleted: true });
  } catch (error) {
    console.error(JSON.stringify({ event: "cuffiette_songs_delete_error", message: error.message }));
    return json({ error: "Non è stato possibile eliminare la canzone." }, 500);
  }
}
