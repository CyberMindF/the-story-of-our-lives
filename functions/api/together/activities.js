import { getAuthenticatedSession, json, readJson } from "../auth/_shared.js";
import { hasPermission } from "../_shared/permissions.js";
import { recordEvent } from "../_shared/events.js";
import { normalizeCategory, normalizeDateLabel, normalizeOptionalText } from "./_activities-shared.js";

// Editor dedicato dell'Agenda delle Idee (planning editor contenuti.md, Fase 7). A differenza di
// GET /api/together (pubblico), questo endpoint richiede content.edit e include private_text:
// serve per la modalità admin, non per la lista che vede chiunque. Nessun 'position'/riordino:
// l'ordine resta quello dell'id, together_activity_status lo referenzia come identità stabile.
export async function onRequestGet(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.edit")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const { results } = await context.env.DB
      .prepare("SELECT * FROM together_activities ORDER BY id")
      .all();

    return json({ activities: results.map(toActivityView) });
  } catch (error) {
    console.error(JSON.stringify({ event: "together_activities_list_error", message: error.message }));
    return json({ error: "Errore interno del server." }, 500);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.create")) {
      return json({ error: "Non autorizzato." }, 403);
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

    const maxId = await env.DB.prepare("SELECT MAX(id) AS max FROM together_activities").first();
    const id = (maxId?.max ?? 0) + 1;
    const now = new Date().toISOString();

    await env.DB
      .prepare(`
        INSERT INTO together_activities (id, text, category, private_text, link, approximate_date, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(id, text, category, privateText, link, approximateDate, session.user.id, now, now)
      .run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "cose-insieme",
      eventType: "content_created",
      metadata: { activityId: id }
    }));

    const created = await env.DB.prepare("SELECT * FROM together_activities WHERE id = ?").bind(id).first();
    return json(toActivityView(created), 201);
  } catch (error) {
    console.error(JSON.stringify({ event: "together_activities_create_error", message: error.message }));
    return json({ error: "Non è stato possibile creare l'attività." }, 500);
  }
}

export function toActivityView(row) {
  return {
    id: row.id,
    text: row.text,
    category: row.category,
    privateText: row.private_text,
    link: row.link,
    approximateDate: row.approximate_date,
    updatedAt: row.updated_at
  };
}
