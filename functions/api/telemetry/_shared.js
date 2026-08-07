import { getAuthenticatedSession, json, readJson } from "../auth/_shared.js";

export { json };

// Legge il JSON e verifica la sessione senza prolungarne la durata.
export async function readAuthenticatedRequest(request, env) {
  const [body, session] = await Promise.all([
    readJson(request),
    getAuthenticatedSession(request, env)
  ]);

  if (!session) {
    return { error: json({ error: "Sessione non valida." }, 401) };
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: json({ error: "Richiesta non valida." }, 400) };
  }

  return { body, session };
}
