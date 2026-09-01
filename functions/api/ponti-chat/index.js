import { getAuthenticatedSession, json, readJson } from "../auth/_shared.js";
import { recordEvent } from "../_shared/events.js";
import { notifyRealtime } from "../_shared/realtime.js";
import { normalizeBody, mediaExpiryFromNow, toMessageView, purgeExpiredMedia } from "./_shared.js";

// GET: cronologia completa (chat a due, nessun filtro per identità: entrambi vedono tutto).
// POST: nuovo messaggio, testo e/o media (mediaKey ottenuta prima da POST /api/ponti-chat/media).
export async function onRequestGet(context) {
  const { env, request } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    await purgeExpiredMedia(env);

    const requestedLimit = Number(new URL(request.url).searchParams.get("limit"));
    const limit = Number.isInteger(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 100) : null;
    const query = limit
      ? "SELECT * FROM (SELECT * FROM ponti_chat_messages ORDER BY id DESC LIMIT ?) ORDER BY id ASC"
      : "SELECT * FROM ponti_chat_messages ORDER BY created_at ASC, id ASC";
    const statement = env.DB.prepare(query);
    const { results } = await (limit ? statement.bind(limit) : statement).all();
    const readState = await env.DB
      .prepare("SELECT last_read_message_id FROM ponti_chat_reads WHERE user_id = ?")
      .bind(session.user.id)
      .first();
    const unread = await env.DB
      .prepare("SELECT COUNT(*) AS count FROM ponti_chat_messages WHERE sender_user_id != ? AND id > ?")
      .bind(session.user.id, readState?.last_read_message_id ?? 0)
      .first();

    return json({ messages: results.map(toMessageView), unreadCount: Number(unread?.count ?? 0) });
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
          (sender_user_id, sender_identity, body, media_key, media_type, media_expires_at, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(session.user.id, session.user.identity, body, mediaKey, mediaType, mediaExpiresAt, session.user.id, now)
      .run();

    const created = await env.DB.prepare("SELECT * FROM ponti_chat_messages WHERE id = ?").bind(result.meta.last_row_id).first();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "ponti-chat",
      eventType: "chat_message_sent",
      metadata: { messageId: created.id, hasMedia: Boolean(mediaKey) }
    }));
    context.waitUntil(notifyRealtime(env, {
      type: "ponti-chat:changed",
      action: "created",
      actorUserId: session.user.id,
      messageId: created.id
    }));

    return json(toMessageView(created), 201);
  } catch (error) {
    console.error(JSON.stringify({ event: "ponti_chat_create_error", message: error.message }));
    return json({ error: "Non è stato possibile inviare il messaggio." }, 500);
  }
}
