import { getAuthenticatedSession, json, readJson } from "../auth/_shared.js";
import { hasPermission } from "../_shared/permissions.js";
import { recordEvent } from "../_shared/events.js";

// Editor admin dei "set" (#e4, Blocco 3): contenitore esplicito richiesto da Rory ("così so le
// collezioni"), non un tag libero. Nessun move.js qui: a differenza di Mappa/Cruciverba i set
// si aggiungono di rado (uno ogni tanto, non decine), l'ordine di creazione è già abbastanza.
export async function onRequestGet(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.read")) return json({ error: "Non autorizzato." }, 403);

    const { results } = await context.env.DB.prepare("SELECT * FROM carte_sets ORDER BY position").all();
    return json({ sets: results.map(toSetView) });
  } catch (error) {
    console.error(JSON.stringify({ event: "carte_sets_list_error", message: error.message }));
    return json({ error: "Errore interno del server." }, 500);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.create")) return json({ error: "Non autorizzato." }, 403);

    const payload = await readJson(request);
    const nome = typeof payload?.nome === "string" ? payload.nome.trim() : "";
    const descrizione = typeof payload?.descrizione === "string" ? payload.descrizione.trim() : "";
    if (!nome) return json({ error: "Nome non valido." }, 400);

    const slug = nome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64);
    if (!slug) return json({ error: "Nome non valido." }, 400);

    const existing = await env.DB.prepare("SELECT id FROM carte_sets WHERE slug = ?").bind(slug).first();
    if (existing) return json({ error: "Esiste già un set con questo nome." }, 409);

    const maxPosition = await env.DB.prepare("SELECT MAX(position) AS max FROM carte_sets").first();
    const position = (maxPosition?.max ?? -1) + 1;
    const now = new Date().toISOString();

    const created = await env.DB
      .prepare(
        `INSERT INTO carte_sets (slug, nome, descrizione, position, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?) RETURNING *`
      )
      .bind(slug, nome, descrizione || null, position, session.user.id, now)
      .first();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "carte",
      eventType: "carte_set_creato",
      metadata: { setId: created.id }
    }));

    return json(toSetView(created), 201);
  } catch (error) {
    console.error(JSON.stringify({ event: "carte_sets_create_error", message: error.message }));
    return json({ error: "Non è stato possibile creare il set." }, 500);
  }
}

export function toSetView(row) {
  return { id: String(row.id), slug: row.slug, nome: row.nome, descrizione: row.descrizione, position: row.position };
}
