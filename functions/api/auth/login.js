import {
  createSession,
  isValidEmail,
  isValidPassword,
  isWorldKeyValid,
  json,
  normalizeEmail,
  recordAccessIp,
  readJson
} from "./_shared.js";

export async function onRequestPost({ request, env, waitUntil }) {
  try {
    // Anche un nuovo login richiede la chiave, oltre alle credenziali dell'account.
    const body = await readJson(request);
    if (!body) {
      return json({ error: "Richiesta non valida." }, 400);
    }

    const email = normalizeEmail(body.email);
    const password = body.password;

    if (!isValidEmail(email) || !isValidPassword(password)) {
      return json({ error: "Email o password non corretti." }, 401);
    }

    if (!isWorldKeyValid(body.worldKey, env.WORLD_KEY)) {
      return json({ error: "Chiave del Mondo non valida." }, 403);
    }

    // La password è attualmente confrontata in chiaro per rispettare l'implementazione richiesta.
    const user = await env.DB
      .prepare("SELECT id, email, nickname, password, is_activated FROM users WHERE email = ?")
      .bind(email)
      .first();

    if (!user || user.password !== password) {
      return json({ error: "Email o password non corretti." }, 401);
    }

    if (user.is_activated !== 1) {
      return json({ error: "Questo account non è attivo." }, 403);
    }

    // Le credenziali corrette producono un cookie di sessione HttpOnly.
    const session = await createSession(request, env, user.id);
    // Memorizziamo soltanto IP associati ad accessi completamente validi.
    waitUntil(recordAccessIp(request, env, user.id));
    return json(
      {
        user: { id: user.id, email: user.email, nickname: user.nickname },
        expiresAt: session.expiresAt
      },
      200,
      { "Set-Cookie": session.cookie }
    );
  } catch (error) {
    console.error(JSON.stringify({ event: "auth_login_error", message: error.message }));
    return json({ error: "Errore interno del server." }, 500);
  }
}
