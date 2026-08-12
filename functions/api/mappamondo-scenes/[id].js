import { getAuthenticatedSession, json, readJson } from "../auth/_shared.js";
import { hasPermission } from "../_shared/permissions.js";
import { recordEvent } from "../_shared/events.js";
import { normalizeLines, normalizeTitle } from "./_shared.js";
import { toSceneView } from "./index.js";

export async function onRequestPut(context) {
  const { request, env, params } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.edit")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const existing = await env.DB.prepare("SELECT id FROM mappamondo_scenes WHERE id = ?").bind(params.id).first();
    if (!existing) {
      return json({ error: "Scena non trovata." }, 404);
    }

    const payload = await readJson(request);
    const title = normalizeTitle(payload?.title);
    const sceneNumber = Number(payload?.sceneNumber);
    const lines = normalizeLines(payload?.lines);
    const isWide = payload?.isWide === true;
    const isFinale = payload?.isFinale === true;

    if (!title) return json({ error: "Titolo non valido." }, 400);
    if (!Number.isInteger(sceneNumber) || sceneNumber < 1) return json({ error: "Numero scena non valido." }, 400);
    if (!lines) return json({ error: "Righe non valide." }, 400);

    const now = new Date().toISOString();
    await env.DB
      .prepare(`
        UPDATE mappamondo_scenes
        SET scene_number = ?, title = ?, lines = ?, is_wide = ?, is_finale = ?, updated_at = ?
        WHERE id = ?
      `)
      .bind(sceneNumber, title, JSON.stringify(lines), isWide ? 1 : 0, isFinale ? 1 : 0, now, params.id)
      .run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "mappamondo",
      eventType: "content_updated",
      metadata: { sceneId: params.id }
    }));

    const updated = await env.DB.prepare("SELECT * FROM mappamondo_scenes WHERE id = ?").bind(params.id).first();
    return json(toSceneView(updated));
  } catch (error) {
    console.error(JSON.stringify({ event: "mappamondo_scenes_update_error", message: error.message }));
    return json({ error: "Non è stato possibile salvare la scena." }, 500);
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

    const existing = await env.DB.prepare("SELECT id FROM mappamondo_scenes WHERE id = ?").bind(params.id).first();
    if (!existing) {
      return json({ error: "Scena non trovata." }, 404);
    }

    await env.DB.prepare("DELETE FROM mappamondo_scenes WHERE id = ?").bind(params.id).run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "mappamondo",
      eventType: "content_deleted",
      metadata: { sceneId: params.id }
    }));

    return json({ id: params.id, deleted: true });
  } catch (error) {
    console.error(JSON.stringify({ event: "mappamondo_scenes_delete_error", message: error.message }));
    return json({ error: "Non è stato possibile eliminare la scena." }, 500);
  }
}
