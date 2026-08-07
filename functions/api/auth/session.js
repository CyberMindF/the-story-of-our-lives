import { recordEvent } from "../_shared/events.js";
import {
  getAuthEventMetadata,
  getAuthenticatedSession,
  isWorldKeyValid,
  json,
  readJson,
  recordAccessIp,
  revokeCurrentSession
} from "./_shared.js";

// Controlla il cookie senza rinnovarlo e comunica se esiste ancora una sessione valida.
export async function onRequestGet({ request, env }) {
  try {
    // Il frontend usa questa rotta all'avvio per controllare il cookie esistente.
    const session = await getAuthenticatedSession(request, env);
    if (!session) {
      return json({ authenticated: false }, 401);
    }

    return json({ authenticated: true, user: session.user, expiresAt: session.expiresAt });
  } catch (error) {
    console.error(JSON.stringify({ event: "auth_session_error", message: error.message }));
    return json({ error: "Errore interno del server." }, 500);
  }
}

// Conferma nuovamente la chiave per una sessione valida e registra l'IP della connessione.
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    // Una chiave errata non deve rinnovare la durata della sessione.
    const body = await readJson(request);
    if (!body || !isWorldKeyValid(body.worldKey, env.WORLD_KEY)) {
      return json({ error: "Chiave del Mondo non valida." }, 403);
    }

    // La chiave corretta rinnova la sessione soltanto se anche il cookie è ancora valido.
    const session = await getAuthenticatedSession(request, env, { refresh: true });
    if (!session) {
      return json({ authenticated: false }, 401);
    }

    // La conferma viene conservata come evento permanente e aggiorna il contesto dell'IP.
    context.waitUntil(Promise.all([
      recordAccessIp(request, env, session.user.id),
      recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
        section: "auth",
        eventType: "world_unlocked",
        metadata: getAuthEventMetadata(request, { rememberDays: 7, source: "session" })
      })
    ]));
    return json(
      { authenticated: true, user: session.user, expiresAt: session.expiresAt },
      200,
      { "Set-Cookie": session.cookie }
    );
  } catch (error) {
    console.error(JSON.stringify({ event: "auth_unlock_error", message: error.message }));
    return json({ error: "Errore interno del server." }, 500);
  }
}

// Esegue il logout revocando logicamente la sessione e facendo scadere il cookie.
export async function onRequestDelete({ request, env }) {
  try {
    const session = await getAuthenticatedSession(request, env);
    if (session) {
      // L'evento viene scritto prima della revoca, quando la sessione è ancora verificabile.
      await recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
        section: "auth",
        eventType: "logout",
        metadata: getAuthEventMetadata(request)
      });
    }

    // Il logout revoca logicamente la sessione corrente e fa scadere il cookie del browser.
    const expiredCookie = await revokeCurrentSession(request, env);
    return json({ authenticated: false }, 200, { "Set-Cookie": expiredCookie });
  } catch (error) {
    console.error(JSON.stringify({ event: "auth_logout_error", message: error.message }));
    return json({ error: "Errore interno del server." }, 500);
  }
}
