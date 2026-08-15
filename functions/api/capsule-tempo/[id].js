import { getAuthenticatedSession, json } from "../auth/_shared.js";
import { recordEvent } from "../_shared/events.js";

// Una capsula si può eliminare solo da chi l'ha scritta, prima o dopo lo sblocco (nessuna
// modifica del contenuto dopo la creazione: è "sigillata", coerente con l'idea della capsula).
export async function onRequestDelete(context) {
  const { env, request, params } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const id = Number(params.id);
    if (!Number.isInteger(id)) return json({ error: "Id non valido." }, 400);

    const existing = await env.DB.prepare("SELECT * FROM capsule_tempo WHERE id = ?").bind(id).first();
    if (!existing) return json({ error: "Capsula non trovata." }, 404);
    if (existing.author_identity !== session.user.identity) {
      return json({ error: "Non puoi eliminare una capsula che non hai scritto." }, 403);
    }

    if (existing.media_key) {
      await env.MEDIA.delete(existing.media_key);
    }
    await env.DB.prepare("DELETE FROM capsule_tempo WHERE id = ?").bind(id).run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "capsula-del-tempo",
      eventType: "content_deleted",
      metadata: { capsulaId: id }
    }));

    return json({ deleted: true });
  } catch (error) {
    console.error(JSON.stringify({ event: "capsule_tempo_delete_error", message: error.message }));
    return json({ error: "Non è stato possibile eliminare la capsula." }, 500);
  }
}
