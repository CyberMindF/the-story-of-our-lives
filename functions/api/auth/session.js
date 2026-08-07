import {
  getAuthenticatedUser,
  isWorldKeyValid,
  json,
  readJson,
  recordAccessIp,
  revokeCurrentSession
} from "./_shared.js";

// Controlla il cookie e comunica al frontend se esiste ancora una sessione valida.
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

// Conferma nuovamente la chiave per una sessione valida e registra l'IP della connessione.
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

// Esegue il logout revocando logicamente la sessione e facendo scadere il cookie.
export async function onRequestDelete({ request, env }) {
  try {
    // Il logout revoca logicamente la sessione corrente e fa scadere il cookie del browser.
    const expiredCookie = await revokeCurrentSession(request, env);
    return json({ authenticated: false }, 200, { "Set-Cookie": expiredCookie });
  } catch (error) {
    console.error(JSON.stringify({ event: "auth_logout_error", message: error.message }));
    return json({ error: "Errore interno del server." }, 500);
  }
}
