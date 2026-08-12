import { getAuthenticatedSession, json, readJson } from "../auth/_shared.js";
import { hasPermission } from "../_shared/permissions.js";
import { recordEvent } from "../_shared/events.js";
import { daySlugExists, normalizeSlug, normalizeTitle, periodExists, validateContent } from "./_shared.js";

// Editor "ibrido" della Bacheca (opzione D concordata il 12/08/2026): un giorno = un record
// con l'intero layout (righe/colonne/blocchi) come JSON validato rigorosamente, non 5 livelli
// di tabelle CRUD. Annidati sotto un periodo (period_id + position scoped al periodo), stesso
// pattern di category_id per i simboli del Linguaggio Segreto.
export async function onRequestGet(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.read")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const { results } = await context.env.DB
      .prepare("SELECT * FROM bacheca_days ORDER BY period_id, position")
      .all();

    return json({ days: results.map(toDayView) });
  } catch (error) {
    console.error(JSON.stringify({ event: "bacheca_days_list_error", message: error.message }));
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
    const periodId = typeof payload?.periodId === "string" ? payload.periodId.trim().toLowerCase() : "";
    const slug = normalizeSlug(payload?.slug);
    const title = normalizeTitle(payload?.title);
    const content = validateContent(payload?.content);

    if (!(await periodExists(env, periodId))) return json({ error: "Periodo non valido." }, 400);
    if (!slug) return json({ error: "Slug non valido." }, 400);
    if (await daySlugExists(env, periodId, slug)) {
      return json({ error: "Esiste già un giorno con questo slug nel periodo scelto." }, 409);
    }
    if (title === undefined) return json({ error: "Titolo non valido." }, 400);
    if (!content) return json({ error: "Contenuto del giorno non valido." }, 400);

    const maxId = await env.DB.prepare("SELECT MAX(id) AS max FROM bacheca_days").first();
    const id = (maxId?.max ?? 0) + 1;
    const maxPosition = await env.DB
      .prepare("SELECT MAX(position) AS max FROM bacheca_days WHERE period_id = ?")
      .bind(periodId)
      .first();
    const position = (maxPosition?.max ?? -1) + 1;
    const now = new Date().toISOString();

    await env.DB
      .prepare(`
        INSERT INTO bacheca_days (id, period_id, slug, title, content, position, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(id, periodId, slug, title, JSON.stringify(content), position, session.user.id, now, now)
      .run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "bacheca",
      eventType: "content_created",
      metadata: { dayId: id, periodId }
    }));

    const created = await env.DB.prepare("SELECT * FROM bacheca_days WHERE id = ?").bind(id).first();
    return json(toDayView(created), 201);
  } catch (error) {
    console.error(JSON.stringify({ event: "bacheca_days_create_error", message: error.message }));
    return json({ error: "Non è stato possibile creare il giorno." }, 500);
  }
}

export function toDayView(row) {
  return {
    id: String(row.id),
    periodId: row.period_id,
    slug: row.slug,
    title: row.title,
    content: JSON.parse(row.content),
    position: row.position,
    updatedAt: row.updated_at
  };
}
