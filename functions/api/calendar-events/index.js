import { getAuthenticatedSession, json, readJson } from "../auth/_shared.js";
import { hasPermission } from "../_shared/permissions.js";
import { recordEvent } from "../_shared/events.js";
import { isValidDate, normalizeBody, normalizeLabel } from "./_shared.js";

// Editor dedicato del Calendario (planning editor contenuti.md, Fase 7): primo di una serie di
// raccolte strutturate, ognuna con la propria tabella invece di forzarle dentro
// content_entries/content_versions, che restano per i testi generici.
export async function onRequestGet(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.read")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const { results } = await context.env.DB
      .prepare("SELECT id, event_date, label, body, updated_at FROM calendar_events ORDER BY event_date")
      .all();

    return json({ events: results.map(toEventView) });
  } catch (error) {
    console.error(JSON.stringify({ event: "calendar_events_list_error", message: error.message }));
    return json({ error: "Errore interno del server." }, 500);
  }
}

// L'id è la data stessa (stabile e leggibile, come nel JSON originale): niente id generato a
// parte, un secondo evento nello stesso giorno userebbe semplicemente una label diversa.
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.create")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const payload = await readJson(request);
    const date = payload?.date;
    const label = normalizeLabel(payload?.label);
    const body = normalizeBody(payload?.body);

    if (!isValidDate(date)) {
      return json({ error: "Data non valida." }, 400);
    }
    if (!label) {
      return json({ error: "Etichetta non valida." }, 400);
    }
    if (!body) {
      return json({ error: "Testo non valido." }, 400);
    }

    const existing = await env.DB.prepare("SELECT id FROM calendar_events WHERE id = ?").bind(date).first();
    if (existing) {
      return json({ error: "Esiste già un evento in questa data." }, 409);
    }

    const now = new Date().toISOString();
    await env.DB
      .prepare("INSERT INTO calendar_events (id, event_date, label, body, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .bind(date, date, label, body, session.user.id, now, now)
      .run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "calendario",
      eventType: "content_created",
      metadata: { eventId: date }
    }));

    return json({ id: date, date, label, body, updatedAt: now }, 201);
  } catch (error) {
    console.error(JSON.stringify({ event: "calendar_events_create_error", message: error.message }));
    return json({ error: "Non è stato possibile creare l'evento." }, 500);
  }
}

function toEventView(row) {
  return { id: row.id, date: row.event_date, label: row.label, body: row.body, updatedAt: row.updated_at };
}
