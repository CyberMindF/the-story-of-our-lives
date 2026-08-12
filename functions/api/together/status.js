import { getAuthenticatedSession, json } from "../auth/_shared.js";
import { recordEvent } from "../_shared/events.js";

const ALLOWED_STATUS = new Set(["todo", "done", "repeat", "unavailable"]);

export async function onRequestPost(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const body = await context.request.json();
    const activityId = Number(body.activityId);
    const status = typeof body.status === "string" ? body.status : "";
    if (!Number.isInteger(activityId) || activityId < 1 || !ALLOWED_STATUS.has(status)) {
      return json({ error: "Stato non valido." }, 400);
    }

    // Il range fisso "activityId > 78" era pensato per l'array statico originale: con
    // together_activities editabile (l'admin può aggiungerne di nuove) verifichiamo che l'id
    // esista davvero invece di un limite superiore hardcoded, altrimenti lo stato delle nuove
    // attività non si potrebbe mai salvare.
    const activity = await context.env.DB.prepare("SELECT id FROM together_activities WHERE id = ?").bind(activityId).first();
    if (!activity) {
      return json({ error: "Attività non trovata." }, 404);
    }

    const updatedAt = new Date().toISOString();
    await context.env.DB.prepare(`
      INSERT INTO together_activity_status (activity_id, status, updated_by, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(activity_id) DO UPDATE SET
        status = excluded.status,
        updated_by = excluded.updated_by,
        updated_at = excluded.updated_at
    `).bind(activityId, status, session.user.id, updatedAt).run();

    context.waitUntil(recordEvent(
      context.env,
      { userId: session.user.id, sessionId: session.sessionId },
      { section: "cose-insieme", eventType: "together_status_changed", metadata: { activityId, status } }
    ));
    return json({ saved: true, activityId, status, updatedAt });
  } catch (error) {
    console.error(JSON.stringify({ event: "together_status_error", message: error.message }));
    return json({ error: "Non è stato possibile aggiornare l'attività." }, 500);
  }
}
