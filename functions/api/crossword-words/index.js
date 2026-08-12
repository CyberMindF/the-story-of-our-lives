import { getAuthenticatedSession, json, readJson } from "../auth/_shared.js";
import { hasPermission } from "../_shared/permissions.js";
import { recordEvent } from "../_shared/events.js";
import { normalizeClue, normalizeCoordinate, normalizeDirection, normalizeSolution } from "./_shared.js";

// Editor dedicato del Cruciverba (planning editor contenuti.md, Fase 7). Stesso pattern CRUD +
// move.js di Mappa/Ricettario/Storie/Cuffiette. A differenza di quelle collezioni l'id resta un
// intero progressivo (non uno slug testuale): è solo il numero mostrato nella griglia, mai stato
// un identificativo leggibile.
export async function onRequestGet(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.read")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const { results } = await context.env.DB
      .prepare("SELECT * FROM crossword_words ORDER BY position")
      .all();

    return json({ words: results.map(toWordView) });
  } catch (error) {
    console.error(JSON.stringify({ event: "crossword_words_list_error", message: error.message }));
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
    const solution = normalizeSolution(payload?.word);
    const clue = normalizeClue(payload?.clue);
    const row = normalizeCoordinate(payload?.row);
    const col = normalizeCoordinate(payload?.col);
    const direction = normalizeDirection(payload?.direction);

    if (!solution) return json({ error: "Soluzione non valida." }, 400);
    if (!clue) return json({ error: "Definizione non valida." }, 400);
    if (row === undefined || col === undefined) return json({ error: "Coordinate non valide." }, 400);
    if (!direction) return json({ error: "Direzione non valida." }, 400);

    const maxId = await env.DB.prepare("SELECT MAX(id) AS max FROM crossword_words").first();
    const id = (maxId?.max ?? 0) + 1;
    const maxPosition = await env.DB.prepare("SELECT MAX(position) AS max FROM crossword_words").first();
    const position = (maxPosition?.max ?? -1) + 1;
    const now = new Date().toISOString();

    await env.DB
      .prepare(`
        INSERT INTO crossword_words
          (id, solution, clue, grid_row, grid_col, direction, position, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(id, solution, clue, row, col, direction, position, session.user.id, now, now)
      .run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "cruciverba",
      eventType: "content_created",
      metadata: { wordId: id }
    }));

    const created = await env.DB.prepare("SELECT * FROM crossword_words WHERE id = ?").bind(id).first();
    return json(toWordView(created), 201);
  } catch (error) {
    console.error(JSON.stringify({ event: "crossword_words_create_error", message: error.message }));
    return json({ error: "Non è stato possibile creare la definizione." }, 500);
  }
}

export function toWordView(dbRow) {
  return {
    id: String(dbRow.id),
    word: dbRow.solution,
    clue: dbRow.clue,
    row: dbRow.grid_row,
    col: dbRow.grid_col,
    direction: dbRow.direction,
    position: dbRow.position,
    updatedAt: dbRow.updated_at
  };
}
