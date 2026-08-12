import { getAuthenticatedSession, json, readJson } from "../../auth/_shared.js";
import { hasPermission } from "../../_shared/permissions.js";
import { recordEvent } from "../../_shared/events.js";
import { normalizeCategory, normalizeDateLabel, normalizeOptionalText } from "../_activities-shared.js";
import { toActivityView } from "../activities.js";

export async function onRequestPut(context) {
  const { request, env, params } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.edit")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const id = Number(params.id);
    const existing = await env.DB.prepare("SELECT id FROM together_activities WHERE id = ?").bind(id).first();
    if (!existing) {
      return json({ error: "Attività non trovata." }, 404);
    }

    const payload = await readJson(request);
    const text = normalizeOptionalText(payload?.text);
    const category = normalizeCategory(payload?.category);
    const privateText = normalizeOptionalText(payload?.privateText);
    const link = normalizeOptionalText(payload?.link, 500);
    const approximateDate = normalizeDateLabel(payload?.approximateDate);

    if (text === undefined || privateText === undefined || link === undefined) {
      return json({ error: "Uno dei campi di testo supera la lunghezza massima." }, 400);
    }
    if (!text && !privateText) {
      return json({ error: "Serve almeno un testo pubblico o privato." }, 400);
    }
    if (!category) return json({ error: "Categoria non valida." }, 400);
    if (!approximateDate) return json({ error: "Data indicativa non valida." }, 400);

    const now = new Date().toISOString();
    await env.DB
      .prepare(`
        UPDATE together_activities
        SET text = ?, category = ?, private_text = ?, link = ?, approximate_date = ?, updated_at = ?
        WHERE id = ?
      `)
      .bind(text, category, privateText, link, approximateDate, now, id)
      .run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "cose-insieme",
      eventType: "content_updated",
      metadata: { activityId: id }
    }));

    const updated = await env.DB.prepare("SELECT * FROM together_activities WHERE id = ?").bind(id).first();
    return json(toActivityView(updated));
  } catch (error) {
    console.error(JSON.stringify({ event: "together_activities_update_error", message: error.message }));
    return json({ error: "Non è stato possibile salvare l'attività." }, 500);
  }
}

// Elimina anche l'eventuale stato salvato (together_activity_status): niente FK ON DELETE
// CASCADE in SQLite in questo schema, va fatto esplicitamente per non lasciare una riga di
// stato orfana che punta a un id ormai inesistente.
export async function onRequestDelete(context) {
  const { env, params } = context;
  try {
    const session = await getAuthenticatedSession(context.request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.delete")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const id = Number(params.id);
    const existing = await env.DB.prepare("SELECT id FROM together_activities WHERE id = ?").bind(id).first();
    if (!existing) {
      return json({ error: "Attività non trovata." }, 404);
    }

    await env.DB.batch([
      env.DB.prepare("DELETE FROM together_activity_status WHERE activity_id = ?").bind(id),
      env.DB.prepare("DELETE FROM together_activities WHERE id = ?").bind(id)
    ]);

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "cose-insieme",
      eventType: "content_deleted",
      metadata: { activityId: id }
    }));

    return json({ id, deleted: true });
  } catch (error) {
    console.error(JSON.stringify({ event: "together_activities_delete_error", message: error.message }));
    return json({ error: "Non è stato possibile eliminare l'attività." }, 500);
  }
}
