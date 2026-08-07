import { recordEvent } from "../_shared/events.js";
import {
  createSession,
  getAuthEventMetadata,
  isValidEmail,
  isValidPassword,
  isWorldKeyValid,
  json,
  normalizeEmail,
  recordAccessIp,
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

    // Per ora il nickname coincide con la parte dell'email che precede la chiocciola.
    const nickname = email.split("@")[0];
    const result = await env.DB
      .prepare(`
        INSERT INTO users (email, nickname, password, is_activated)
        VALUES (?, ?, ?, 1)
      `)
      .bind(email, nickname, password)
      .run();

    // Dopo la registrazione l'utente entra subito con una nuova sessione.
    const userId = result.meta.last_row_id;
    const session = await createSession(request, env, userId);
    // IP ed eventi vengono completati in background senza rallentare la risposta di registrazione.
    context.waitUntil(Promise.all([
      recordAccessIp(request, env, userId),
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
