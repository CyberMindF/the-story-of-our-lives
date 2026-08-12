import { getAuthenticatedSession, json, readJson } from "../auth/_shared.js";
import { hasPermission } from "../_shared/permissions.js";
import { recordEvent } from "../_shared/events.js";
import { isValidDate, normalizeBody, normalizeOptionalText, normalizeTitle } from "./_shared.js";
import { toStoryView } from "./index.js";

export async function onRequestPut(context) {
  const { request, env, params } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.edit")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const existing = await env.DB.prepare("SELECT id FROM stories WHERE id = ?").bind(params.id).first();
    if (!existing) {
      return json({ error: "Storia non trovata." }, 404);
    }

    const payload = await readJson(request);
    const title = normalizeTitle(payload?.title);
    const date = payload?.date;
    const body = normalizeBody(payload?.body);
    const videoUrl = normalizeOptionalText(payload?.videoUrl);
    const audioKey = normalizeOptionalText(payload?.audioKey);
    const audioLabel = normalizeOptionalText(payload?.audioLabel, 160);
    const image = normalizeOptionalText(payload?.image);
    const imageAlt = normalizeOptionalText(payload?.imageAlt, 300);

    if (!title) return json({ error: "Titolo non valido." }, 400);
    if (!isValidDate(date)) return json({ error: "Data non valida." }, 400);
    if (!body) return json({ error: "Testo non valido." }, 400);

    const now = new Date().toISOString();
    await env.DB
      .prepare(`
        UPDATE stories
        SET title = ?, story_date = ?, body = ?, video_url = ?, audio_key = ?, audio_label = ?,
            image = ?, image_alt = ?, updated_at = ?
        WHERE id = ?
      `)
      .bind(title, date, body, videoUrl, audioKey, audioLabel, image, imageAlt, now, params.id)
      .run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "storie",
      eventType: "content_updated",
      metadata: { storyId: params.id }
    }));

    const updated = await env.DB.prepare("SELECT * FROM stories WHERE id = ?").bind(params.id).first();
    return json(toStoryView(updated));
  } catch (error) {
    console.error(JSON.stringify({ event: "stories_update_error", message: error.message }));
    return json({ error: "Non è stato possibile salvare la storia." }, 500);
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

    const existing = await env.DB.prepare("SELECT id FROM stories WHERE id = ?").bind(params.id).first();
    if (!existing) {
      return json({ error: "Storia non trovata." }, 404);
    }

    await env.DB.prepare("DELETE FROM stories WHERE id = ?").bind(params.id).run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "storie",
      eventType: "content_deleted",
      metadata: { storyId: params.id }
    }));

    return json({ id: params.id, deleted: true });
  } catch (error) {
    console.error(JSON.stringify({ event: "stories_delete_error", message: error.message }));
    return json({ error: "Non è stato possibile eliminare la storia." }, 500);
  }
}
