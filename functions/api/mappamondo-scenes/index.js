import { getAuthenticatedSession, json, readJson } from "../auth/_shared.js";
import { hasPermission } from "../_shared/permissions.js";
import { recordEvent } from "../_shared/events.js";
import { normalizeLines, normalizeTitle } from "./_shared.js";

// Editor dedicato del Mappamondo (documentazione/cms/planning-editor-contenuti.md, Fase 7, decisione #3
// dell'inventario). Stesso pattern CRUD + move.js delle altre raccolte.
export async function onRequestGet(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.read")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const { results } = await context.env.DB
      .prepare("SELECT * FROM mappamondo_scenes ORDER BY position")
      .all();

    return json({ scenes: results.map(toSceneView) });
  } catch (error) {
    console.error(JSON.stringify({ event: "mappamondo_scenes_list_error", message: error.message }));
    return json({ error: "Errore interno del server." }, 500);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.create")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const payload = await readJson(request);
    const id = typeof payload?.id === "string" ? payload.id.trim().toLowerCase() : "";
    const title = normalizeTitle(payload?.title);
    const sceneNumber = Number(payload?.sceneNumber);
    const lines = normalizeLines(payload?.lines);
    const isWide = payload?.isWide === true;
    const isFinale = payload?.isFinale === true;

    if (!/^[a-z][a-z0-9-]{0,63}$/.test(id)) return json({ error: "ID non valido." }, 400);
    if (!title) return json({ error: "Titolo non valido." }, 400);
    if (!Number.isInteger(sceneNumber) || sceneNumber < 1) return json({ error: "Numero scena non valido." }, 400);
    if (!lines) return json({ error: "Righe non valide." }, 400);

    const existing = await env.DB.prepare("SELECT id FROM mappamondo_scenes WHERE id = ?").bind(id).first();
    if (existing) {
      return json({ error: "Esiste già una scena con questo ID." }, 409);
    }

    const maxPosition = await env.DB.prepare("SELECT MAX(position) AS max FROM mappamondo_scenes").first();
    const position = (maxPosition?.max ?? -1) + 1;
    const now = new Date().toISOString();

    await env.DB
      .prepare(`
        INSERT INTO mappamondo_scenes (id, scene_number, title, lines, is_wide, is_finale, position, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(id, sceneNumber, title, JSON.stringify(lines), isWide ? 1 : 0, isFinale ? 1 : 0, position, session.user.id, now, now)
      .run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "mappamondo",
      eventType: "content_created",
      metadata: { sceneId: id }
    }));

    const created = await env.DB.prepare("SELECT * FROM mappamondo_scenes WHERE id = ?").bind(id).first();
    return json(toSceneView(created), 201);
  } catch (error) {
    console.error(JSON.stringify({ event: "mappamondo_scenes_create_error", message: error.message }));
    return json({ error: "Non è stato possibile creare la scena." }, 500);
  }
}

export function toSceneView(row) {
  return {
    id: row.id,
    sceneNumber: row.scene_number,
    title: row.title,
    lines: JSON.parse(row.lines),
    isWide: row.is_wide === 1,
    isFinale: row.is_finale === 1,
    position: row.position,
    updatedAt: row.updated_at
  };
}
