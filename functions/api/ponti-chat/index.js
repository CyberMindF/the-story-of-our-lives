import { getAuthenticatedSession, json, readJson } from "../auth/_shared.js";
import { recordEvent } from "../_shared/events.js";
import { normalizeBody, mediaExpiryFromNow, toMessageView, purgeExpiredMedia } from "./_shared.js";

// GET: cronologia completa (chat a due, nessun filtro per identità: entrambi vedono tutto).
// POST: nuovo messaggio, testo e/o media (mediaKey ottenuta prima da POST /api/ponti-chat/media).
export async function onRequestGet(context) {
  const { env, request } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    await purgeExpiredMedia(env);

    const { results } = await env.DB
      .prepare("SELECT * FROM ponti_chat_messages ORDER BY created_at ASC, id ASC")
      .all();

    return json({ messages: results.map(toMessageView) });
  } catch (error) {
    console.error(JSON.stringify({ event: "ponti_chat_list_error", message: error.message }));
    return json({ error: "Errore interno del server." }, 500);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const payload = await readJson(request);
    const body = normalizeBody(payload?.body);
    const mediaKey = typeof payload?.mediaKey === "string" && payload.mediaKey.startsWith("ponti-chat/uploads/") ? payload.mediaKey : null;
    const mediaType = mediaKey && (payload?.mediaType === "photo" || payload?.mediaType === "video") ? payload.mediaType : null;

    if (body === undefined) return json({ error: "Testo del messaggio non valido." }, 400);
    if (!body && !mediaKey) return json({ error: "Il messaggio è vuoto." }, 400);
    if (mediaKey && !mediaType) return json({ error: "Tipo di media mancante." }, 400);

    const now = new Date().toISOString();
    const mediaExpiresAt = mediaKey ? mediaExpiryFromNow() : null;

    const result = await env.DB
      .prepare(`
        INSERT INTO ponti_chat_messages
          (sender_identity, body, media_key, media_type, media_expires_at, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(session.user.identity, body, mediaKey, mediaType, mediaExpiresAt, session.user.id, now)
      .run();

    const created = await env.DB.prepare("SELECT * FROM ponti_chat_messages WHERE id = ?").bind(result.meta.last_row_id).first();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "ponti-chat",
      eventType: "chat_message_sent",
      metadata: { messageId: created.id, hasMedia: Boolean(mediaKey) }
    }));

    return json(toMessageView(created), 201);
  } catch (error) {
    console.error(JSON.stringify({ event: "ponti_chat_create_error", message: error.message }));
    return json({ error: "Non è stato possibile inviare il messaggio." }, 500);
  }
}
