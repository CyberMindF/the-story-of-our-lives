import { getAuthenticatedSession, json, readJson } from "../../auth/_shared.js";
import { hasPermission } from "../../_shared/permissions.js";
import { recordEvent } from "../../_shared/events.js";

// Scambio "prima/dopo" per le correzioni vicine, sempre dentro lo stesso barattolo (per
// spostamenti lontani c'è move-to.js). Non esiste spostamento tra barattoli diversi: un
// biglietto appartiene per sempre al jar_identity con cui è stato creato.
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

    const current = await env.DB.prepare("SELECT id, jar_identity, position FROM pensieri_biglietti WHERE id = ?").bind(params.id).first();
    if (!current) {
      return json({ error: "Biglietto non trovato." }, 404);
    }

    const neighbor = direction === "up"
      ? await env.DB.prepare("SELECT id, position FROM pensieri_biglietti WHERE jar_identity = ? AND position < ? ORDER BY position DESC LIMIT 1").bind(current.jar_identity, current.position).first()
      : await env.DB.prepare("SELECT id, position FROM pensieri_biglietti WHERE jar_identity = ? AND position > ? ORDER BY position ASC LIMIT 1").bind(current.jar_identity, current.position).first();

    if (!neighbor) {
      return json({ error: "Non c'è nessun biglietto da scambiare in quella direzione, in questo barattolo." }, 409);
    }

    const now = new Date().toISOString();
    await env.DB.batch([
      env.DB.prepare("UPDATE pensieri_biglietti SET position = ?, updated_at = ? WHERE id = ?").bind(neighbor.position, now, current.id),
      env.DB.prepare("UPDATE pensieri_biglietti SET position = ?, updated_at = ? WHERE id = ?").bind(current.position, now, neighbor.id)
    ]);

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "barattolo-dei-pensieri",
      eventType: "content_updated",
      metadata: { biglioId: current.id, swappedWith: neighbor.id }
    }));

    return json({ id: current.id, position: neighbor.position });
  } catch (error) {
    console.error(JSON.stringify({ event: "pensieri_biglietti_move_error", message: error.message }));
    return json({ error: "Non è stato possibile riordinare il biglietto." }, 500);
  }
}
