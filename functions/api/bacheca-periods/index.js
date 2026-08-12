import { getAuthenticatedSession, json, readJson } from "../auth/_shared.js";
import { hasPermission } from "../_shared/permissions.js";
import { recordEvent } from "../_shared/events.js";
import { normalizeTitle } from "./_shared.js";

// I periodi della Bacheca sono una lista piatta, stesso pattern CRUD + move.js delle
// categorie del Linguaggio Segreto; i giorni annidati sotto ognuno vivono nella collezione
// a sé `bacheca-days`.
export async function onRequestGet(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.read")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const { results } = await context.env.DB
      .prepare("SELECT * FROM bacheca_periods ORDER BY position")
      .all();

    return json({ periods: results.map(toPeriodView) });
  } catch (error) {
    console.error(JSON.stringify({ event: "bacheca_periods_list_error", message: error.message }));
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
    const id = typeof payload?.id === "string" ? payload.id.trim().toLowerCase() : "";
    const title = normalizeTitle(payload?.title);

    if (!/^[a-z][a-z0-9-]{0,63}$/.test(id)) return json({ error: "ID non valido." }, 400);
    if (!title) return json({ error: "Titolo non valido." }, 400);

    const existing = await env.DB.prepare("SELECT id FROM bacheca_periods WHERE id = ?").bind(id).first();
    if (existing) {
      return json({ error: "Esiste già un periodo con questo ID." }, 409);
    }

    const maxPosition = await env.DB.prepare("SELECT MAX(position) AS max FROM bacheca_periods").first();
    const position = (maxPosition?.max ?? -1) + 1;
    const now = new Date().toISOString();

    await env.DB
      .prepare("INSERT INTO bacheca_periods (id, title, position, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(id, title, position, session.user.id, now, now)
      .run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "bacheca",
      eventType: "content_created",
      metadata: { periodId: id }
    }));

    const created = await env.DB.prepare("SELECT * FROM bacheca_periods WHERE id = ?").bind(id).first();
    return json(toPeriodView(created), 201);
  } catch (error) {
    console.error(JSON.stringify({ event: "bacheca_periods_create_error", message: error.message }));
    return json({ error: "Non è stato possibile creare il periodo." }, 500);
  }
}

export function toPeriodView(row) {
  return {
    id: row.id,
    title: row.title,
    position: row.position,
    updatedAt: row.updated_at
  };
}
