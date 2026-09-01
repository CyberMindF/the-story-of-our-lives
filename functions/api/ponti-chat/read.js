import { getAuthenticatedSession, json } from "../auth/_shared.js";
import { notifyRealtime } from "../_shared/realtime.js";

// Conserva per ogni account il punto fino al quale la conversazione e' stata letta.
export async function onRequestPost(context) {
  const { env, request } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const latest = await env.DB.prepare("SELECT COALESCE(MAX(id), 0) AS id FROM ponti_chat_messages").first();
    const now = new Date().toISOString();
    await env.DB
      .prepare(`UPDATE ponti_chat_messages
        SET read_at = COALESCE(read_at, ?)
        WHERE sender_user_id != ? AND id <= ?`)
      .bind(now, session.user.id, latest.id)
      .run();
    const result = await env.DB
      .prepare(`INSERT INTO ponti_chat_reads (user_id, last_read_message_id, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          last_read_message_id = MAX(last_read_message_id, excluded.last_read_message_id),
          updated_at = excluded.updated_at`)
      .bind(session.user.id, latest.id, now)
      .run();

    if (result.meta.changes > 0) {
      context.waitUntil(notifyRealtime(env, {
        type: "ponti-chat:changed",
        action: "read",
        actorUserId: session.user.id
      }));
    }

    return json({ ok: true });
  } catch (error) {
    console.error(JSON.stringify({ event: "ponti_chat_read_error", message: error.message }));
    return json({ error: "Errore interno del server." }, 500);
  }
}
