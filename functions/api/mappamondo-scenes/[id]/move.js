import { getAuthenticatedSession, json, readJson } from "../../auth/_shared.js";
import { hasPermission } from "../../_shared/permissions.js";
import { recordEvent } from "../../_shared/events.js";

// Stesso riordino "prima/dopo" delle altre raccolte.
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

    const current = await env.DB.prepare("SELECT id, position FROM mappamondo_scenes WHERE id = ?").bind(params.id).first();
    if (!current) {
      return json({ error: "Scena non trovata." }, 404);
    }

    const neighbor = direction === "up"
      ? await env.DB.prepare("SELECT id, position FROM mappamondo_scenes WHERE position < ? ORDER BY position DESC LIMIT 1").bind(current.position).first()
      : await env.DB.prepare("SELECT id, position FROM mappamondo_scenes WHERE position > ? ORDER BY position ASC LIMIT 1").bind(current.position).first();

    if (!neighbor) {
      return json({ error: "Non c'è nessuna scena da scambiare in quella direzione." }, 409);
    }

    const now = new Date().toISOString();
    await env.DB.batch([
      env.DB.prepare("UPDATE mappamondo_scenes SET position = ?, updated_at = ? WHERE id = ?").bind(neighbor.position, now, current.id),
      env.DB.prepare("UPDATE mappamondo_scenes SET position = ?, updated_at = ? WHERE id = ?").bind(current.position, now, neighbor.id)
    ]);

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "mappamondo",
      eventType: "content_updated",
      metadata: { sceneId: current.id, swappedWith: neighbor.id }
    }));

    return json({ id: current.id, position: neighbor.position });
  } catch (error) {
    console.error(JSON.stringify({ event: "mappamondo_scenes_move_error", message: error.message }));
    return json({ error: "Non è stato possibile riordinare la scena." }, 500);
  }
}
