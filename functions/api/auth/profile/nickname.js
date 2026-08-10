import { getAuthenticatedSession, json, normalizeNickname, readJson } from "../_shared.js";

// Aggiorna il nickname dell'utente autenticato. Nessun vincolo di unicità (come in register.js).
export async function onRequestPost({ request, env }) {
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) {
      return json({ error: "Sessione non valida o scaduta." }, 401);
    }

    const body = await readJson(request);
    if (!body) {
      return json({ error: "Richiesta non valida." }, 400);
    }

    const nickname = normalizeNickname(body.nickname);
    if (!nickname) {
      return json({ error: "Il nome non può essere vuoto." }, 400);
    }

    await env.DB
      .prepare("UPDATE users SET nickname = ?, updated_at = ? WHERE id = ?")
      .bind(nickname, new Date().toISOString(), session.user.id)
      .run();

    return json({ user: { id: session.user.id, email: session.user.email, nickname } });
  } catch (error) {
    console.error(JSON.stringify({ event: "auth_profile_nickname_error", message: error.message }));
    return json({ error: "Errore interno del server." }, 500);
  }
}
