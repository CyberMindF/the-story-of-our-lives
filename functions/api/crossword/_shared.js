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

// Carica da data.json la definizione usando l'ID progressivo derivato dalla posizione nell'array.
export async function loadWordDefinition(context, wordId) {
  const dataUrl = new URL("/data.json", context.request.url);
  const response = await context.env.ASSETS.fetch(dataUrl);
  if (!response.ok) {
    throw new Error(`Impossibile caricare data.json: HTTP ${response.status}`);
  }

  const data = await response.json();
  const numericId = Number(wordId);
  return Number.isInteger(numericId) && numericId > 0 ? data.words?.[numericId - 1] || null : null;
}
