import { getAuthenticatedSession, json, readJson } from "../auth/_shared.js";
import { hasPermission } from "../_shared/permissions.js";
import { recordEvent } from "../_shared/events.js";
import { normalizeClue, normalizeCoordinate, normalizeDirection, normalizeSolution } from "./_shared.js";
import { toWordView } from "./index.js";

export async function onRequestPut(context) {
  const { request, env, params } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.edit")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const existing = await env.DB.prepare("SELECT id FROM crossword_words WHERE id = ?").bind(params.id).first();
    if (!existing) {
      return json({ error: "Definizione non trovata." }, 404);
    }

    const payload = await readJson(request);
    const solution = normalizeSolution(payload?.word);
    const clue = normalizeClue(payload?.clue);
    const row = normalizeCoordinate(payload?.row);
    const col = normalizeCoordinate(payload?.col);
    const direction = normalizeDirection(payload?.direction);

    if (!solution) return json({ error: "Soluzione non valida." }, 400);
    if (!clue) return json({ error: "Definizione non valida." }, 400);
    if (row === undefined || col === undefined) return json({ error: "Coordinate non valide." }, 400);
    if (!direction) return json({ error: "Direzione non valida." }, 400);

    const now = new Date().toISOString();
    await env.DB
      .prepare(`
        UPDATE crossword_words
        SET solution = ?, clue = ?, grid_row = ?, grid_col = ?, direction = ?, updated_at = ?
        WHERE id = ?
      `)
      .bind(solution, clue, row, col, direction, now, params.id)
      .run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "cruciverba",
      eventType: "content_updated",
      metadata: { wordId: params.id }
    }));

    const updated = await env.DB.prepare("SELECT * FROM crossword_words WHERE id = ?").bind(params.id).first();
    return json(toWordView(updated));
  } catch (error) {
    console.error(JSON.stringify({ event: "crossword_words_update_error", message: error.message }));
    return json({ error: "Non è stato possibile salvare la definizione." }, 500);
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

    const existing = await env.DB.prepare("SELECT id FROM crossword_words WHERE id = ?").bind(params.id).first();
    if (!existing) {
      return json({ error: "Definizione non trovata." }, 404);
    }

    await env.DB.prepare("DELETE FROM crossword_words WHERE id = ?").bind(params.id).run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "cruciverba",
      eventType: "content_deleted",
      metadata: { wordId: params.id }
    }));

    return json({ id: params.id, deleted: true });
  } catch (error) {
    console.error(JSON.stringify({ event: "crossword_words_delete_error", message: error.message }));
    return json({ error: "Non è stato possibile eliminare la definizione." }, 500);
  }
}
