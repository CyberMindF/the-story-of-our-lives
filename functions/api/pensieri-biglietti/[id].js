import { getAuthenticatedSession, json, readJson } from "../auth/_shared.js";
import { hasPermission } from "../_shared/permissions.js";
import { recordEvent } from "../_shared/events.js";
import { normalizeText, normalizeTitle, toBigliettoView } from "./_shared.js";

// Modifica e cancellazione restano riservate all'editor admin (content.edit/content.delete),
// a differenza della creazione (index.js POST) che è aperta a entrambi gli utenti.
export async function onRequestPut(context) {
  const { request, env, params } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.edit")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const current = await env.DB.prepare("SELECT id FROM pensieri_biglietti WHERE id = ?").bind(params.id).first();
    if (!current) return json({ error: "Biglietto non trovato." }, 404);

    const payload = await readJson(request);
    const text = normalizeText(payload?.text);
    const title = normalizeTitle(payload?.title);
    const isActive = payload?.isActive === false ? 0 : 1;

    if (!text) return json({ error: "Il testo del biglietto non è valido." }, 400);
    if (title === undefined) return json({ error: "Il titolo non è valido." }, 400);

    const now = new Date().toISOString();
    await env.DB
      .prepare("UPDATE pensieri_biglietti SET text = ?, title = ?, is_active = ?, updated_at = ? WHERE id = ?")
      .bind(text, title, isActive, now, params.id)
      .run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "barattolo-dei-pensieri",
      eventType: "content_updated",
      metadata: { biglioId: Number(params.id) }
    }));

    const updated = await env.DB.prepare("SELECT * FROM pensieri_biglietti WHERE id = ?").bind(params.id).first();
    return json(toBigliettoView(updated));
  } catch (error) {
    console.error(JSON.stringify({ event: "pensieri_biglietti_update_error", message: error.message }));
    return json({ error: "Non è stato possibile modificare il biglietto." }, 500);
  }
}

export async function onRequestDelete(context) {
  const { request, env, params } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.delete")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const current = await env.DB.prepare("SELECT id, jar_identity, position FROM pensieri_biglietti WHERE id = ?").bind(params.id).first();
    if (!current) return json({ error: "Biglietto non trovato." }, 404);

    const now = new Date().toISOString();
    await env.DB.batch([
      env.DB.prepare("DELETE FROM pensieri_estrazioni WHERE biglietto_id = ?").bind(params.id),
      env.DB.prepare("DELETE FROM pensieri_biglietti WHERE id = ?").bind(params.id),
      env.DB
        .prepare("UPDATE pensieri_biglietti SET position = position - 1, updated_at = ? WHERE jar_identity = ? AND position > ?")
        .bind(now, current.jar_identity, current.position)
    ]);

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "barattolo-dei-pensieri",
      eventType: "content_deleted",
      metadata: { biglioId: Number(params.id) }
    }));

    return json({ deleted: true });
  } catch (error) {
    console.error(JSON.stringify({ event: "pensieri_biglietti_delete_error", message: error.message }));
    return json({ error: "Non è stato possibile cancellare il biglietto." }, 500);
  }
}
