import { getAuthenticatedSession, json, normalizeNickname, readJson } from "../_shared.js";
import { recordEvent } from "../../_shared/events.js";

// Aggiorna il nickname dell'utente autenticato. Nessun vincolo di unicità (come in register.js).
export async function onRequestPost(context) {
  const { request, env } = context;
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

    const currentUser = await env.DB
      .prepare("SELECT nickname FROM users WHERE id = ?")
      .bind(session.user.id)
      .first();

    await env.DB
      .prepare("UPDATE users SET nickname = ?, updated_at = ? WHERE id = ?")
      .bind(nickname, new Date().toISOString(), session.user.id)
      .run();

    context.waitUntil(recordEvent(
      env,
      { userId: session.user.id, sessionId: session.sessionId },
      {
        section: "profilo",
        eventType: "nickname_changed",
        metadata: { previousNickname: currentUser?.nickname || null, nickname }
      }
    ));

    // session.user porta già identity/role (bug corretto: la risposta precedente li ometteva,
    // e AuthService.currentUser.set() sostituisce l'intero oggetto — dopo il cambio nickname
    // isAdmin() diventava false finché non si ricaricava la pagina).
    return json({ user: { ...session.user, nickname } });
  } catch (error) {
    console.error(JSON.stringify({ event: "auth_profile_nickname_error", message: error.message }));
    return json({ error: "Errore interno del server." }, 500);
  }
}
