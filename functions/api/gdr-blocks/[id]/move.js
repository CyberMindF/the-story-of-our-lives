import { getAuthenticatedSession, json, readJson } from "../../auth/_shared.js";
import { hasPermission } from "../../_shared/permissions.js";
import { recordEvent } from "../../_shared/events.js";

// Scambio "prima/dopo" dentro lo stesso documento (avventura o maga-regole non si mescolano
// mai: sono due pagine distinte).
export async function onRequestPost(context) {
  const { request, env, params } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.reorder")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const payload = await readJson(request);
    const direction = payload?.direction;
    if (direction !== "up" && direction !== "down") {
      return json({ error: "Direzione non valida." }, 400);
    }

    const current = await env.DB.prepare("SELECT id, document_key, position FROM gdr_blocks WHERE id = ?").bind(params.id).first();
    if (!current) {
      return json({ error: "Blocco non trovato." }, 404);
    }

    const neighbor = direction === "up"
      ? await env.DB.prepare("SELECT id, position FROM gdr_blocks WHERE document_key = ? AND position < ? ORDER BY position DESC LIMIT 1").bind(current.document_key, current.position).first()
      : await env.DB.prepare("SELECT id, position FROM gdr_blocks WHERE document_key = ? AND position > ? ORDER BY position ASC LIMIT 1").bind(current.document_key, current.position).first();

    if (!neighbor) {
      return json({ error: "Non c'è nessun blocco da scambiare in quella direzione, in questo documento." }, 409);
    }

    const now = new Date().toISOString();
    await env.DB.batch([
      env.DB.prepare("UPDATE gdr_blocks SET position = ?, updated_at = ? WHERE id = ?").bind(neighbor.position, now, current.id),
      env.DB.prepare("UPDATE gdr_blocks SET position = ?, updated_at = ? WHERE id = ?").bind(current.position, now, neighbor.id)
    ]);

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "gdr",
      eventType: "content_updated",
      metadata: { blockId: current.id, swappedWith: neighbor.id }
    }));

    return json({ id: current.id, position: neighbor.position });
  } catch (error) {
    console.error(JSON.stringify({ event: "gdr_blocks_move_error", message: error.message }));
    return json({ error: "Non è stato possibile riordinare il blocco." }, 500);
  }
}
