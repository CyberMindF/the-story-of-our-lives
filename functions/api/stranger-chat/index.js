import { getAuthenticatedSession, json, readJson } from "../auth/_shared.js";
import { recordEvent } from "../_shared/events.js";

function toMessageView(row) {
  return {
    id: row.id,
    senderIdentity: row.sender_identity,
    body: row.body,
    createdAt: row.created_at
  };
}

// GET: cronologia completa (chat a due, nessun filtro per identità: entrambi vedono tutto).
// POST: nuovo messaggio, solo testo — niente media, a differenza dei Ponti.
export async function onRequestGet(context) {
  const { env, request } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const { results } = await env.DB
      .prepare("SELECT * FROM stranger_chat_messages ORDER BY created_at ASC, id ASC")
      .all();

    return json({ messages: results.map(toMessageView) });
  } catch (error) {
    console.error(JSON.stringify({ event: "stranger_chat_list_error", message: error.message }));
    return json({ error: "Errore interno del server." }, 500);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const payload = await readJson(request);
    const body = typeof payload?.body === "string" ? payload.body.trim().slice(0, 2000) : "";
    if (!body) return json({ error: "Il messaggio è vuoto." }, 400);

    const now = new Date().toISOString();
    const result = await env.DB
      .prepare("INSERT INTO stranger_chat_messages (sender_identity, body, created_by, created_at) VALUES (?, ?, ?, ?)")
      .bind(session.user.identity, body, session.user.id, now)
      .run();

    const created = await env.DB.prepare("SELECT * FROM stranger_chat_messages WHERE id = ?").bind(result.meta.last_row_id).first();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "stranger-chat",
      eventType: "chat_message_sent",
      metadata: { messageId: created.id }
    }));

    return json(toMessageView(created), 201);
  } catch (error) {
    console.error(JSON.stringify({ event: "stranger_chat_create_error", message: error.message }));
    return json({ error: "Non è stato possibile inviare il messaggio." }, 500);
  }
}
