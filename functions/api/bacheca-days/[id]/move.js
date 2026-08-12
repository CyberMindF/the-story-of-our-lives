import { getAuthenticatedSession, json, readJson } from "../../auth/_shared.js";
import { hasPermission } from "../../_shared/permissions.js";
import { recordEvent } from "../../_shared/events.js";

// Scambio "prima/dopo" per le correzioni vicine, dentro lo stesso periodo. Per spostare un
// giorno in un altro periodo o a una posizione lontana c'è move-to.js.
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

    const current = await env.DB.prepare("SELECT id, period_id, position FROM bacheca_days WHERE id = ?").bind(params.id).first();
    if (!current) {
      return json({ error: "Giorno non trovato." }, 404);
    }

    const neighbor = direction === "up"
      ? await env.DB.prepare("SELECT id, position FROM bacheca_days WHERE period_id = ? AND position < ? ORDER BY position DESC LIMIT 1").bind(current.period_id, current.position).first()
      : await env.DB.prepare("SELECT id, position FROM bacheca_days WHERE period_id = ? AND position > ? ORDER BY position ASC LIMIT 1").bind(current.period_id, current.position).first();

    if (!neighbor) {
      return json({ error: "Non c'è nessun giorno da scambiare in quella direzione, in questo periodo." }, 409);
    }

    const now = new Date().toISOString();
    await env.DB.batch([
      env.DB.prepare("UPDATE bacheca_days SET position = ?, updated_at = ? WHERE id = ?").bind(neighbor.position, now, current.id),
      env.DB.prepare("UPDATE bacheca_days SET position = ?, updated_at = ? WHERE id = ?").bind(current.position, now, neighbor.id)
    ]);

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "bacheca",
      eventType: "content_updated",
      metadata: { dayId: current.id, swappedWith: neighbor.id }
    }));

    return json({ id: current.id, position: neighbor.position });
  } catch (error) {
    console.error(JSON.stringify({ event: "bacheca_days_move_error", message: error.message }));
    return json({ error: "Non è stato possibile riordinare il giorno." }, 500);
  }
}
