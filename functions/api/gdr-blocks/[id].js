import { getAuthenticatedSession, json, readJson } from "../auth/_shared.js";
import { hasPermission } from "../_shared/permissions.js";
import { recordEvent } from "../_shared/events.js";
import { normalizeData, normalizeType } from "./_shared.js";
import { toBlockView } from "./index.js";

// Modifica tipo e contenuto del blocco (documento e posizione restano invariati: per
// spostarlo dentro il documento c'è move.js).
export async function onRequestPut(context) {
  const { request, env, params } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.edit")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const existing = await env.DB.prepare("SELECT id FROM gdr_blocks WHERE id = ?").bind(params.id).first();
    if (!existing) {
      return json({ error: "Blocco non trovato." }, 404);
    }

    const payload = await readJson(request);
    const type = normalizeType(payload?.type);
    const data = normalizeData(payload?.data);

    if (!type) return json({ error: "Tipo di blocco non valido." }, 400);
    if (!data) return json({ error: "Contenuto del blocco non valido." }, 400);

    const now = new Date().toISOString();
    await env.DB
      .prepare("UPDATE gdr_blocks SET type = ?, data = ?, updated_at = ? WHERE id = ?")
      .bind(type, data, now, params.id)
      .run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "gdr",
      eventType: "content_updated",
      metadata: { blockId: params.id }
    }));

    const updated = await env.DB.prepare("SELECT * FROM gdr_blocks WHERE id = ?").bind(params.id).first();
    return json(toBlockView(updated));
  } catch (error) {
    console.error(JSON.stringify({ event: "gdr_blocks_update_error", message: error.message }));
    return json({ error: "Non è stato possibile salvare il blocco." }, 500);
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

    const existing = await env.DB.prepare("SELECT id FROM gdr_blocks WHERE id = ?").bind(params.id).first();
    if (!existing) {
      return json({ error: "Blocco non trovato." }, 404);
    }

    await env.DB.prepare("DELETE FROM gdr_blocks WHERE id = ?").bind(params.id).run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "gdr",
      eventType: "content_deleted",
      metadata: { blockId: params.id }
    }));

    return json({ id: params.id, deleted: true });
  } catch (error) {
    console.error(JSON.stringify({ event: "gdr_blocks_delete_error", message: error.message }));
    return json({ error: "Non è stato possibile eliminare il blocco." }, 500);
  }
}
