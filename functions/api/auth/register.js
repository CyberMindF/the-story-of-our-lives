import { recordEvent } from "../_shared/events.js";
import { linkVisitToSession } from "../_shared/visits.js";
import {
  createSession,
  getAuthEventMetadata,
  isValidEmail,
  isValidPassword,
  isWorldKeyValid,
  json,
  normalizeEmail,
  normalizeNickname,
  readJson
} from "./_shared.js";

// Registra l'account, crea la sessione e conserva gli eventi permanenti di accesso.
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    // La registrazione richiede email, password e la chiave condivisa del Mondo.
    const body = await readJson(request);
    if (!body) {
      return json({ error: "Richiesta non valida." }, 400);
    }

    const email = normalizeEmail(body.email);
    const password = body.password;

    if (!isValidEmail(email)) {
      return json({ error: "Email non valida." }, 400);
    }

    if (!isValidPassword(password)) {
      return json({ error: "La password deve contenere almeno 8 caratteri." }, 400);
    }

    if (!isWorldKeyValid(body.worldKey, env.WORLD_KEY)) {
      return json({ error: "Chiave del Mondo non valida." }, 403);
    }

    // Impedisce soltanto di registrare due volte la stessa email; non limita il numero di account.
    const existingUser = await env.DB
      .prepare("SELECT id FROM users WHERE email = ?")
      .bind(email)
      .first();

    if (existingUser) {
      return json({ error: "Esiste già un account con questa email." }, 409);
    }

    // Chi si registra può scegliere come farsi chiamare; senza scelta, si usa l'email come prima.
    const requestedNickname = normalizeNickname(body.nickname);
    const nickname = requestedNickname || email.split("@")[0];
    const notifyEmailUpdates = body.notifyEmailUpdates === true ? 1 : 0;
    const result = await env.DB
      .prepare(`
        INSERT INTO users (email, nickname, password, is_activated, notify_email_updates)
        VALUES (?, ?, ?, 1, ?)
      `)
      .bind(email, nickname, password, notifyEmailUpdates)
      .run();

    // Dopo la registrazione l'utente entra subito con una nuova sessione.
    const userId = result.meta.last_row_id;
    const session = await createSession(request, env, userId);
    // Collegamento della visita ed eventi vengono completati senza rallentare la registrazione.
    context.waitUntil(Promise.all([
      linkVisitToSession(request, env, userId, session.id),
      recordEvent(env, { userId, sessionId: session.id }, {
        section: "auth",
        eventType: "register",
        metadata: getAuthEventMetadata(request, { rememberDays: 7 })
      }),
      recordEvent(env, { userId, sessionId: session.id }, {
        section: "auth",
        eventType: "world_unlocked",
        metadata: getAuthEventMetadata(request, { rememberDays: 7, source: "register" })
      })
    ]));

    return json(
      { user: { id: userId, email, nickname }, expiresAt: session.expiresAt },
      201,
      { "Set-Cookie": session.cookie }
    );
  } catch (error) {
    console.error(JSON.stringify({ event: "auth_register_error", message: error.message }));
    return json({ error: "Errore interno del server." }, 500);
  }
}
