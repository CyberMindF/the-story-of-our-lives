import { getAuthenticatedSession, json } from "../auth/_shared.js";
import { recordEvent } from "../_shared/events.js";
import { notifyRealtime } from "../_shared/realtime.js";

// Un messaggio si può eliminare solo dall'account che lo ha creato. L'identità lui/lei è
// una label narrativa e non partecipa mai ai controlli di proprietà.
export async function onRequestDelete(context) {
  const { env, request, params } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const id = Number(params.id);
    if (!Number.isInteger(id)) return json({ error: "Id non valido." }, 400);

    const existing = await env.DB.prepare("SELECT * FROM ponti_chat_messages WHERE id = ?").bind(id).first();
    if (!existing) return json({ error: "Messaggio non trovato." }, 404);
    if (existing.sender_user_id !== session.user.id) {
      return json({ error: "Non puoi eliminare un messaggio che non hai scritto." }, 403);
    }

    if (existing.media_key) {
      await env.MEDIA.delete(existing.media_key);
    }
    await env.DB.prepare("DELETE FROM ponti_chat_messages WHERE id = ?").bind(id).run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "ponti-chat",
      eventType: "chat_message_deleted",
      metadata: { messageId: id }
    }));
    context.waitUntil(notifyRealtime(env, {
      type: "ponti-chat:changed",
      action: "deleted",
      actorUserId: session.user.id,
      messageId: id
    }));

    return json({ deleted: true });
  } catch (error) {
    console.error(JSON.stringify({ event: "ponti_chat_delete_error", message: error.message }));
    return json({ error: "Non è stato possibile eliminare il messaggio." }, 500);
  }
}
