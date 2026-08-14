import { getAuthenticatedSession, json } from "../auth/_shared.js";
import { recordEvent } from "../_shared/events.js";

// Un messaggio si può eliminare solo se inviato dalla propria identità (non serve un ruolo
// admin: qui i due unici utenti sono anche gli unici autori possibili dei propri messaggi).
export async function onRequestDelete(context) {
  const { env, request, params } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const id = Number(params.id);
    if (!Number.isInteger(id)) return json({ error: "Id non valido." }, 400);

    const existing = await env.DB.prepare("SELECT * FROM ponti_chat_messages WHERE id = ?").bind(id).first();
    if (!existing) return json({ error: "Messaggio non trovato." }, 404);
    if (existing.sender_identity !== session.user.identity) {
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

    return json({ deleted: true });
  } catch (error) {
    console.error(JSON.stringify({ event: "ponti_chat_delete_error", message: error.message }));
    return json({ error: "Non è stato possibile eliminare il messaggio." }, 500);
  }
}
