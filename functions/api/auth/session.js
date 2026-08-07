import { getAuthenticatedUser, isWorldKeyValid, json, readJson, recordAccessIp } from "./_shared.js";

export async function onRequestGet({ request, env }) {
  try {
    // Il frontend usa questa rotta all'avvio per controllare il cookie esistente.
    const user = await getAuthenticatedUser(request, env);
    if (!user) {
      return json({ authenticated: false }, 401);
    }

    return json({ authenticated: true, user });
  } catch (error) {
    console.error(JSON.stringify({ event: "auth_session_error", message: error.message }));
    return json({ error: "Errore interno del server." }, 500);
  }
}

export async function onRequestPost({ request, env, waitUntil }) {
  try {
    // Una sessione valida non basta: in una nuova scheda va confermata anche la chiave.
    const user = await getAuthenticatedUser(request, env);
    if (!user) {
      return json({ authenticated: false }, 401);
    }

    const body = await readJson(request);
    if (!body || !isWorldKeyValid(body.worldKey, env.WORLD_KEY)) {
      return json({ error: "Chiave del Mondo non valida." }, 403);
    }

    // Anche una nuova conferma della chiave segnala un accesso valido dalla connessione corrente.
    waitUntil(recordAccessIp(request, env, user.id));
    return json({ authenticated: true, user });
  } catch (error) {
    console.error(JSON.stringify({ event: "auth_unlock_error", message: error.message }));
    return json({ error: "Errore interno del server." }, 500);
  }
}
