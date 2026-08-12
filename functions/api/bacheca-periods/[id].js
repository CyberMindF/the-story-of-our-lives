import { getAuthenticatedSession, json, readJson } from "../auth/_shared.js";
import { hasPermission } from "../_shared/permissions.js";
import { recordEvent } from "../_shared/events.js";
import { normalizeTitle } from "./_shared.js";
import { toPeriodView } from "./index.js";

export async function onRequestPut(context) {
  const { request, env, params } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.edit")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const existing = await env.DB.prepare("SELECT id FROM bacheca_periods WHERE id = ?").bind(params.id).first();
    if (!existing) {
      return json({ error: "Periodo non trovato." }, 404);
    }

    const payload = await readJson(request);
    const title = normalizeTitle(payload?.title);
    if (!title) return json({ error: "Titolo non valido." }, 400);

    const now = new Date().toISOString();
    await env.DB.prepare("UPDATE bacheca_periods SET title = ?, updated_at = ? WHERE id = ?").bind(title, now, params.id).run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "bacheca",
      eventType: "content_updated",
      metadata: { periodId: params.id }
    }));

    const updated = await env.DB.prepare("SELECT * FROM bacheca_periods WHERE id = ?").bind(params.id).first();
    return json(toPeriodView(updated));
  } catch (error) {
    console.error(JSON.stringify({ event: "bacheca_periods_update_error", message: error.message }));
    return json({ error: "Non è stato possibile salvare il periodo." }, 500);
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

    const existing = await env.DB.prepare("SELECT id FROM bacheca_periods WHERE id = ?").bind(params.id).first();
    if (!existing) {
      return json({ error: "Periodo non trovato." }, 404);
    }

    const hasDays = await env.DB.prepare("SELECT id FROM bacheca_days WHERE period_id = ? LIMIT 1").bind(params.id).first();
    if (hasDays) {
      return json({ error: "Sposta o elimina prima tutti i giorni di questo periodo." }, 409);
    }

    await env.DB.prepare("DELETE FROM bacheca_periods WHERE id = ?").bind(params.id).run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "bacheca",
      eventType: "content_deleted",
      metadata: { periodId: params.id }
    }));

    return json({ id: params.id, deleted: true });
  } catch (error) {
    console.error(JSON.stringify({ event: "bacheca_periods_delete_error", message: error.message }));
    return json({ error: "Non è stato possibile eliminare il periodo." }, 500);
  }
}
