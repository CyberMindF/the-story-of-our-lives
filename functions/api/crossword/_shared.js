import { getAuthenticatedSession, json, readJson } from "../auth/_shared.js";

export { json };

// Verifica la sessione senza rinnovarla e restituisce il corpo JSON quando richiesto.
export async function authenticateCrosswordRequest(context, options = {}) {
  const session = await getAuthenticatedSession(context.request, context.env);
  if (!session) {
    return { error: json({ error: "Sessione non valida." }, 401) };
  }

  if (!options.readBody) {
    return { session };
  }

  const body = await readJson(context.request);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: json({ error: "Richiesta non valida." }, 400) };
  }

  return { session, body };
}

// Carica da crossword_words la definizione usando l'ID progressivo che il client assegna per
// posizione (documentazione/cms/planning-editor-contenuti.md, Fase 7): la griglia non usa più l'id stabile della
// riga DB come identificativo di parola, ma l'indice 1-based nell'ordine di `position` — lo
// stesso schema di data.json quando era un array ordinato a mano.
export async function loadWordDefinition(context, wordId) {
  const numericId = Number(wordId);
  if (!Number.isInteger(numericId) || numericId < 1) {
    return null;
  }

  const row = await context.env.DB
    .prepare("SELECT solution, clue, grid_row, grid_col, direction FROM crossword_words ORDER BY position LIMIT 1 OFFSET ?")
    .bind(numericId - 1)
    .first();

  return row ? { word: row.solution, clue: row.clue, row: row.grid_row, col: row.grid_col, direction: row.direction } : null;
}
