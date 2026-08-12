import { getAuthenticatedSession, json, readJson } from "../auth/_shared.js";
import { hasPermission } from "../_shared/permissions.js";
import { recordEvent } from "../_shared/events.js";
import { daySlugExists, normalizeSlug, normalizeTitle, validateContent } from "./_shared.js";
import { toDayView } from "./index.js";

// Modifica slug/titolo/contenuto (periodo e posizione restano invariati: per spostarlo ci
// sono move.js e move-to.js).
export async function onRequestPut(context) {
  const { request, env, params } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.edit")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const existing = await env.DB.prepare("SELECT id, period_id FROM bacheca_days WHERE id = ?").bind(params.id).first();
    if (!existing) {
      return json({ error: "Giorno non trovato." }, 404);
    }

    const payload = await readJson(request);
    const slug = normalizeSlug(payload?.slug);
    const title = normalizeTitle(payload?.title);
    const content = validateContent(payload?.content);

    if (!slug) return json({ error: "Slug non valido." }, 400);
    if (await daySlugExists(env, existing.period_id, slug, params.id)) {
      return json({ error: "Esiste già un giorno con questo slug nel periodo." }, 409);
    }
    if (title === undefined) return json({ error: "Titolo non valido." }, 400);
    if (!content) return json({ error: "Contenuto del giorno non valido." }, 400);

    const now = new Date().toISOString();
    await env.DB
      .prepare("UPDATE bacheca_days SET slug = ?, title = ?, content = ?, updated_at = ? WHERE id = ?")
      .bind(slug, title, JSON.stringify(content), now, params.id)
      .run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "bacheca",
      eventType: "content_updated",
      metadata: { dayId: params.id }
    }));

    const updated = await env.DB.prepare("SELECT * FROM bacheca_days WHERE id = ?").bind(params.id).first();
    return json(toDayView(updated));
  } catch (error) {
    console.error(JSON.stringify({ event: "bacheca_days_update_error", message: error.message }));
    return json({ error: "Non è stato possibile salvare il giorno." }, 500);
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

    const existing = await env.DB.prepare("SELECT id FROM bacheca_days WHERE id = ?").bind(params.id).first();
    if (!existing) {
      return json({ error: "Giorno non trovato." }, 404);
    }

    await env.DB.prepare("DELETE FROM bacheca_days WHERE id = ?").bind(params.id).run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "bacheca",
      eventType: "content_deleted",
      metadata: { dayId: params.id }
    }));

    return json({ id: params.id, deleted: true });
  } catch (error) {
    console.error(JSON.stringify({ event: "bacheca_days_delete_error", message: error.message }));
    return json({ error: "Non è stato possibile eliminare il giorno." }, 500);
  }
}
