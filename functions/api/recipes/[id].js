import { getAuthenticatedSession, json, readJson } from "../auth/_shared.js";
import { hasPermission } from "../_shared/permissions.js";
import { recordEvent } from "../_shared/events.js";
import { isValidKind, normalizeList, normalizeNote, normalizeSource, normalizeTitle } from "./_shared.js";
import { toRecipeView } from "./index.js";

// L'id (slug) non è modificabile: cambiarlo significa creare una ricetta nuova, come per il
// Calendario. La posizione si tocca solo da move.js, mai da qui.
export async function onRequestPut(context) {
  const { request, env, params } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.edit")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const existing = await env.DB.prepare("SELECT id FROM recipes WHERE id = ?").bind(params.id).first();
    if (!existing) {
      return json({ error: "Ricetta non trovata." }, 404);
    }

    const payload = await readJson(request);
    const title = normalizeTitle(payload?.title);
    const kind = payload?.kind;
    const note = normalizeNote(payload?.note);
    const placeholder = payload?.placeholder === true;
    const source = normalizeSource(payload?.source);
    const ingredients = normalizeList(payload?.ingredients);
    const steps = normalizeList(payload?.steps);

    if (!title) return json({ error: "Titolo non valido." }, 400);
    if (!isValidKind(kind)) return json({ error: "Categoria non valida." }, 400);
    if (!ingredients) return json({ error: "Ingredienti non validi." }, 400);
    if (!steps) return json({ error: "Procedimento non valido." }, 400);

    const now = new Date().toISOString();
    await env.DB
      .prepare(`
        UPDATE recipes
        SET title = ?, kind = ?, note = ?, placeholder = ?, source_label = ?, source_href = ?,
            ingredients = ?, steps = ?, updated_at = ?
        WHERE id = ?
      `)
      .bind(
        title, kind, note, placeholder ? 1 : 0, source.label, source.href,
        JSON.stringify(ingredients), JSON.stringify(steps), now, params.id
      )
      .run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "ricettario",
      eventType: "content_updated",
      metadata: { recipeId: params.id }
    }));

    const updated = await env.DB.prepare("SELECT * FROM recipes WHERE id = ?").bind(params.id).first();
    return json(toRecipeView(updated));
  } catch (error) {
    console.error(JSON.stringify({ event: "recipes_update_error", message: error.message }));
    return json({ error: "Non è stato possibile salvare la ricetta." }, 500);
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

    const existing = await env.DB.prepare("SELECT id FROM recipes WHERE id = ?").bind(params.id).first();
    if (!existing) {
      return json({ error: "Ricetta non trovata." }, 404);
    }

    await env.DB.prepare("DELETE FROM recipes WHERE id = ?").bind(params.id).run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "ricettario",
      eventType: "content_deleted",
      metadata: { recipeId: params.id }
    }));

    return json({ id: params.id, deleted: true });
  } catch (error) {
    console.error(JSON.stringify({ event: "recipes_delete_error", message: error.message }));
    return json({ error: "Non è stato possibile eliminare la ricetta." }, 500);
  }
}
