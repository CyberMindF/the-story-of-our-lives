import { getAuthenticatedSession, json, readJson } from "../auth/_shared.js";
import { hasPermission } from "../_shared/permissions.js";
import { recordEvent } from "../_shared/events.js";
import { isValidDate, normalizeBody, normalizeOptionalText, normalizeTitle } from "./_shared.js";

// Editor dedicato delle Storie (planning editor contenuti.md, Fase 7). Stesso pattern del
// Ricettario: 'position' esplicito, riordino su un endpoint separato (move.js).
export async function onRequestGet(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.read")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const { results } = await context.env.DB
      .prepare("SELECT * FROM stories ORDER BY position")
      .all();

    return json({ stories: results.map(toStoryView) });
  } catch (error) {
    console.error(JSON.stringify({ event: "stories_list_error", message: error.message }));
    return json({ error: "Errore interno del server." }, 500);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.create")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const payload = await readJson(request);
    const id = typeof payload?.id === "string" ? payload.id.trim().toLowerCase() : "";
    const title = normalizeTitle(payload?.title);
    const date = payload?.date;
    const body = normalizeBody(payload?.body);
    const videoUrl = normalizeOptionalText(payload?.videoUrl);
    const audioKey = normalizeOptionalText(payload?.audioKey);
    const audioLabel = normalizeOptionalText(payload?.audioLabel, 160);
    const image = normalizeOptionalText(payload?.image);
    const imageAlt = normalizeOptionalText(payload?.imageAlt, 300);

    if (!/^[a-z][a-z0-9-]{0,63}$/.test(id)) return json({ error: "ID non valido." }, 400);
    if (!title) return json({ error: "Titolo non valido." }, 400);
    if (!isValidDate(date)) return json({ error: "Data non valida." }, 400);
    if (!body) return json({ error: "Testo non valido." }, 400);

    const existing = await env.DB.prepare("SELECT id FROM stories WHERE id = ?").bind(id).first();
    if (existing) {
      return json({ error: "Esiste già una storia con questo ID." }, 409);
    }

    const maxPosition = await env.DB.prepare("SELECT MAX(position) AS max FROM stories").first();
    const position = (maxPosition?.max ?? -1) + 1;
    const now = new Date().toISOString();

    await env.DB
      .prepare(`
        INSERT INTO stories
          (id, title, story_date, body, video_url, audio_key, audio_label, image, image_alt, position, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(id, title, date, body, videoUrl, audioKey, audioLabel, image, imageAlt, position, session.user.id, now, now)
      .run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "storie",
      eventType: "content_created",
      metadata: { storyId: id }
    }));

    const created = await env.DB.prepare("SELECT * FROM stories WHERE id = ?").bind(id).first();
    return json(toStoryView(created), 201);
  } catch (error) {
    console.error(JSON.stringify({ event: "stories_create_error", message: error.message }));
    return json({ error: "Non è stato possibile creare la storia." }, 500);
  }
}

export function toStoryView(row) {
  return {
    id: row.id,
    title: row.title,
    date: row.story_date,
    body: row.body,
    videoUrl: row.video_url,
    audioKey: row.audio_key,
    audioLabel: row.audio_label,
    image: row.image,
    imageAlt: row.image_alt,
    position: row.position,
    updatedAt: row.updated_at
  };
}
