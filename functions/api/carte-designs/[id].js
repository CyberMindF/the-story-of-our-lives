import { getAuthenticatedSession, json, readJson } from "../auth/_shared.js";
import { hasPermission } from "../_shared/permissions.js";
import { recordEvent } from "../_shared/events.js";
import { toDesignView } from "./index.js";

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
    const immagineKey = typeof payload?.immagineKey === "string" && payload.immagineKey.trim() ? payload.immagineKey.trim() : null;
    if (!nome) return json({ error: "Nome non valido." }, 400);

    const existing = await env.DB.prepare("SELECT id FROM carte_designs WHERE id = ?").bind(id).first();
    if (!existing) return json({ error: "Carta non trovata." }, 404);

    await env.DB.prepare("UPDATE carte_designs SET nome = ?, immagine_key = ? WHERE id = ?").bind(nome, immagineKey, id).run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "carte",
      eventType: "carte_design_modificato",
      metadata: { designId: id }
    }));

    const updated = await env.DB.prepare("SELECT * FROM carte_designs WHERE id = ?").bind(id).first();
    return json(toDesignView(updated));
  } catch (error) {
    console.error(JSON.stringify({ event: "carte_designs_update_error", message: error.message }));
    return json({ error: "Non è stato possibile aggiornare la carta." }, 500);
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

    // Cancellazione a cascata manuale (D1 non applica ON DELETE CASCADE di default): rimuove
    // prima il possesso e le definizioni, altrimenti resterebbero righe orfane referenziate da
    // carte_possesso/carte_trade_items. Non blocca la cancellazione se qualcuno ne possiede
    // copie: sono "cose nostre", non un catalogo di prodotto da proteggere.
    const { results: definizioni } = await env.DB.prepare("SELECT id FROM carte_definizioni WHERE design_id = ?").bind(id).all();
    if (definizioni.length > 0) {
      const placeholders = definizioni.map(() => "?").join(", ");
      const ids = definizioni.map((row) => row.id);
      await env.DB.batch([
        env.DB.prepare(`DELETE FROM carte_possesso WHERE carta_definizione_id IN (${placeholders})`).bind(...ids),
        env.DB.prepare(`DELETE FROM carte_definizioni WHERE id IN (${placeholders})`).bind(...ids)
      ]);
    }
    await env.DB.prepare("DELETE FROM carte_designs WHERE id = ?").bind(id).run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "carte",
      eventType: "carte_design_eliminato",
      metadata: { designId: id }
    }));

    return json({ ok: true });
  } catch (error) {
    console.error(JSON.stringify({ event: "carte_designs_delete_error", message: error.message }));
    return json({ error: "Non è stato possibile eliminare la carta." }, 500);
  }
}
