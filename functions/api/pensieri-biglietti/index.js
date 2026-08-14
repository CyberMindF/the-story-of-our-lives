import { getAuthenticatedSession, json, readJson } from "../auth/_shared.js";
import { hasPermission } from "../_shared/permissions.js";
import { recordEvent } from "../_shared/events.js";
import { normalizeText, normalizeTitle, otherIdentity, toBigliettoView } from "./_shared.js";

// GET: lista completa, usata dall'editor admin (la route frontend resta comunque dietro
// adminGuard). POST: "aggiungi" un biglietto — a differenza del resto dell'editor, qui non
// serve alcun permesso di ruolo: chiunque abbia una sessione valida può scrivere per il
// barattolo dell'altro, mai per il proprio (jar_identity è derivato dal server, non dal
// payload, così la regola non richiede validazione: è strutturalmente impossibile violarla).
export async function onRequestGet(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.read")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const { results } = await context.env.DB
      .prepare("SELECT * FROM pensieri_biglietti ORDER BY jar_identity, position")
      .all();

    return json({ biglietti: results.map(toBigliettoView) });
  } catch (error) {
    console.error(JSON.stringify({ event: "pensieri_biglietti_list_error", message: error.message }));
    return json({ error: "Errore interno del server." }, 500);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const payload = await readJson(request);
    const text = normalizeText(payload?.text);
    const title = normalizeTitle(payload?.title);

    if (!text) return json({ error: "Il testo del biglietto non è valido." }, 400);
    if (title === undefined) return json({ error: "Il titolo non è valido." }, 400);

    const jarIdentity = otherIdentity(session.user.identity);

    const maxId = await env.DB.prepare("SELECT MAX(id) AS max FROM pensieri_biglietti").first();
    const id = (maxId?.max ?? 0) + 1;
    const maxPosition = await env.DB
      .prepare("SELECT MAX(position) AS max FROM pensieri_biglietti WHERE jar_identity = ?")
      .bind(jarIdentity)
      .first();
    const position = (maxPosition?.max ?? -1) + 1;
    const now = new Date().toISOString();

    await env.DB
      .prepare(`
        INSERT INTO pensieri_biglietti
          (id, jar_identity, text, title, is_active, position, draw_count, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, 1, ?, 0, ?, ?, ?)
      `)
      .bind(id, jarIdentity, text, title, position, session.user.id, now, now)
      .run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "barattolo-dei-pensieri",
      eventType: "content_created",
      metadata: { biglioId: id, jarIdentity }
    }));

    const created = await env.DB.prepare("SELECT * FROM pensieri_biglietti WHERE id = ?").bind(id).first();
    return json(toBigliettoView(created), 201);
  } catch (error) {
    console.error(JSON.stringify({ event: "pensieri_biglietti_create_error", message: error.message }));
    return json({ error: "Non è stato possibile aggiungere il biglietto." }, 500);
  }
}
