import { getAuthenticatedSession, json, readJson } from "../auth/_shared.js";
import { hasPermission } from "../_shared/permissions.js";
import { recordEvent } from "../_shared/events.js";
import { normalizeBody, normalizeLabel } from "./_shared.js";

// Modifica un evento esistente. La data (e quindi l'id) non è modificabile qui: cambiarla
// significa cancellare l'evento sbagliato e crearne uno nuovo, non c'è un caso d'uso reale per
// spostare una data mantenendo lo stesso id.
export async function onRequestPut(context) {
  const { request, env, params } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.edit")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const existing = await env.DB.prepare("SELECT id FROM calendar_events WHERE id = ?").bind(params.id).first();
    if (!existing) {
      return json({ error: "Evento non trovato." }, 404);
    }

    const payload = await readJson(request);
    const label = normalizeLabel(payload?.label);
    const body = normalizeBody(payload?.body);
    if (!label) {
      return json({ error: "Etichetta non valida." }, 400);
    }
    if (!body) {
      return json({ error: "Testo non valido." }, 400);
    }

    const now = new Date().toISOString();
    await env.DB
      .prepare("UPDATE calendar_events SET label = ?, body = ?, updated_at = ? WHERE id = ?")
      .bind(label, body, now, params.id)
      .run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "calendario",
      eventType: "content_updated",
      metadata: { eventId: params.id }
    }));

    return json({ id: params.id, label, body, updatedAt: now });
  } catch (error) {
    console.error(JSON.stringify({ event: "calendar_events_update_error", message: error.message }));
    return json({ error: "Non è stato possibile salvare l'evento." }, 500);
  }
}

export async function onRequestDelete(context) {
  const { env, params } = context;
  try {
    const session = await getAuthenticatedSession(context.request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.delete")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const existing = await env.DB.prepare("SELECT id FROM calendar_events WHERE id = ?").bind(params.id).first();
    if (!existing) {
      return json({ error: "Evento non trovato." }, 404);
    }

    await env.DB.prepare("DELETE FROM calendar_events WHERE id = ?").bind(params.id).run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "calendario",
      eventType: "content_deleted",
      metadata: { eventId: params.id }
    }));

    return json({ id: params.id, deleted: true });
  } catch (error) {
    console.error(JSON.stringify({ event: "calendar_events_delete_error", message: error.message }));
    return json({ error: "Non è stato possibile eliminare l'evento." }, 500);
  }
}
