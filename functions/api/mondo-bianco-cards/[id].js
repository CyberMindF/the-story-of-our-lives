import { getAuthenticatedSession, json, readJson } from "../auth/_shared.js";
import { hasPermission } from "../_shared/permissions.js";
import { recordEvent } from "../_shared/events.js";

const MAX_NAME_LENGTH = 60;
const MAX_DESCRIPTION_LENGTH = 200;

// Solo PUT: niente POST (l'insieme delle card non cresce dall'editor) né DELETE (una card non
// scompare finché non sparisce dal codice). L'id deve già esistere — creato solo dalla seed.
export async function onRequestPut(context) {
  const { request, env, params } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.edit")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const existing = await env.DB.prepare("SELECT id FROM mondo_bianco_cards WHERE id = ?").bind(params.id).first();
    if (!existing) {
      return json({ error: "Card non trovata." }, 404);
    }

    const payload = await readJson(request);
    const name = typeof payload?.name === "string" ? payload.name.trim() : "";
    const description = typeof payload?.description === "string" ? payload.description.trim() : "";

    if (!name || name.length > MAX_NAME_LENGTH) {
      return json({ error: "Nome non valido." }, 400);
    }
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      return json({ error: "Descrizione troppo lunga." }, 400);
    }

    const now = new Date().toISOString();
    await env.DB
      .prepare("UPDATE mondo_bianco_cards SET name = ?, description = ?, updated_at = ? WHERE id = ?")
      .bind(name, description || null, now, params.id)
      .run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "mondo-bianco",
      eventType: "content_updated",
      metadata: { cardId: params.id }
    }));

    return json({ id: params.id, name, description: description || null, updatedAt: now });
  } catch (error) {
    console.error(JSON.stringify({ event: "mondo_bianco_cards_update_error", message: error.message }));
    return json({ error: "Non è stato possibile salvare la card." }, 500);
  }
}
