import { getAuthenticatedSession, json, readJson } from "../auth/_shared.js";
import { hasPermission } from "../_shared/permissions.js";
import { recordEvent } from "../_shared/events.js";
import { normalizeIcon, normalizeNote, normalizeTitle } from "./_shared.js";
import { toCategoryView } from "./index.js";

export async function onRequestPut(context) {
  const { request, env, params } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.edit")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const existing = await env.DB.prepare("SELECT id FROM linguaggio_segreto_categories WHERE id = ?").bind(params.id).first();
    if (!existing) {
      return json({ error: "Categoria non trovata." }, 404);
    }

    const payload = await readJson(request);
    const title = normalizeTitle(payload?.title);
    const icon = normalizeIcon(payload?.icon);
    const note = normalizeNote(payload?.note);

    if (!title) return json({ error: "Titolo non valido." }, 400);
    if (!icon) return json({ error: "Icona non valida." }, 400);
    if (note === undefined) return json({ error: "Nota non valida." }, 400);

    const now = new Date().toISOString();
    await env.DB
      .prepare(`
        UPDATE linguaggio_segreto_categories
        SET title = ?, icon = ?, note = ?, updated_at = ?
        WHERE id = ?
      `)
      .bind(title, icon, note, now, params.id)
      .run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "linguaggio-segreto",
      eventType: "content_updated",
      metadata: { categoryId: params.id }
    }));

    const updated = await env.DB.prepare("SELECT * FROM linguaggio_segreto_categories WHERE id = ?").bind(params.id).first();
    return json(toCategoryView(updated));
  } catch (error) {
    console.error(JSON.stringify({ event: "linguaggio_segreto_categories_update_error", message: error.message }));
    return json({ error: "Non è stato possibile salvare la categoria." }, 500);
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

    const existing = await env.DB.prepare("SELECT id FROM linguaggio_segreto_categories WHERE id = ?").bind(params.id).first();
    if (!existing) {
      return json({ error: "Categoria non trovata." }, 404);
    }

    const hasSymbols = await env.DB.prepare("SELECT id FROM linguaggio_segreto_symbols WHERE category_id = ? LIMIT 1").bind(params.id).first();
    if (hasSymbols) {
      return json({ error: "Sposta o elimina prima tutti i simboli di questa categoria." }, 409);
    }

    await env.DB.prepare("DELETE FROM linguaggio_segreto_categories WHERE id = ?").bind(params.id).run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "linguaggio-segreto",
      eventType: "content_deleted",
      metadata: { categoryId: params.id }
    }));

    return json({ id: params.id, deleted: true });
  } catch (error) {
    console.error(JSON.stringify({ event: "linguaggio_segreto_categories_delete_error", message: error.message }));
    return json({ error: "Non è stato possibile eliminare la categoria." }, 500);
  }
}
