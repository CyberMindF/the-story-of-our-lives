import { getAuthenticatedSession, json, readJson } from "../auth/_shared.js";
import { hasPermission } from "../_shared/permissions.js";
import { recordEvent } from "../_shared/events.js";
import { toSetView } from "./index.js";

export async function onRequestPut(context) {
  const { request, env, params } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.edit")) return json({ error: "Non autorizzato." }, 403);

    const id = Number(params.id);
    if (!Number.isInteger(id)) return json({ error: "Id non valido." }, 400);

    const payload = await readJson(request);
    const nome = typeof payload?.nome === "string" ? payload.nome.trim() : "";
    const descrizione = typeof payload?.descrizione === "string" ? payload.descrizione.trim() : "";
    if (!nome) return json({ error: "Nome non valido." }, 400);

    const existing = await env.DB.prepare("SELECT id FROM carte_sets WHERE id = ?").bind(id).first();
    if (!existing) return json({ error: "Set non trovato." }, 404);

    await env.DB.prepare("UPDATE carte_sets SET nome = ?, descrizione = ? WHERE id = ?").bind(nome, descrizione || null, id).run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "carte",
      eventType: "carte_set_modificato",
      metadata: { setId: id }
    }));

    const updated = await env.DB.prepare("SELECT * FROM carte_sets WHERE id = ?").bind(id).first();
    return json(toSetView(updated));
  } catch (error) {
    console.error(JSON.stringify({ event: "carte_sets_update_error", message: error.message }));
    return json({ error: "Non è stato possibile aggiornare il set." }, 500);
  }
}

export async function onRequestDelete(context) {
  const { request, env, params } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.delete")) return json({ error: "Non autorizzato." }, 403);

    const id = Number(params.id);
    if (!Number.isInteger(id)) return json({ error: "Id non valido." }, 400);

    const hasDesigns = await env.DB.prepare("SELECT id FROM carte_designs WHERE set_id = ? LIMIT 1").bind(id).first();
    if (hasDesigns) return json({ error: "Il set contiene ancora delle carte: rimuovile prima." }, 409);

    await env.DB.prepare("DELETE FROM carte_sets WHERE id = ?").bind(id).run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "carte",
      eventType: "carte_set_eliminato",
      metadata: { setId: id }
    }));

    return json({ ok: true });
  } catch (error) {
    console.error(JSON.stringify({ event: "carte_sets_delete_error", message: error.message }));
    return json({ error: "Non è stato possibile eliminare il set." }, 500);
  }
}
