import { recordEvent } from "../../_shared/events.js";
import {
  getAuthEventMetadata,
  getAuthenticatedSession,
  isValidPassword,
  json,
  readJson
} from "../_shared.js";

// Cambia la password solo dopo aver confermato quella attuale, e registra sempre prima la
// precedente come ricordo permanente: se la memoria non si salva, il cambio non avviene.
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

    if (!isValidPassword(body.newPassword)) {
      return json({ error: "La nuova password deve contenere almeno 8 caratteri." }, 400);
    }

    const user = await env.DB
      .prepare("SELECT password FROM users WHERE id = ?")
      .bind(session.user.id)
      .first();

    if (!user || body.currentPassword !== user.password) {
      return json({ error: "La password attuale non è corretta." }, 403);
    }

    if (body.newPassword === user.password) {
      return json({ error: "La nuova password deve essere diversa da quella attuale." }, 400);
    }

    // Scritta e attesa prima dell'update: se questa fallisce, la password non cambia e il
    // ricordo non va perso in silenzio (a differenza degli eventi fire-and-forget altrove).
    const eventResult = await recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "auth",
      eventType: "password_changed",
      metadata: getAuthEventMetadata(request, { previousPassword: user.password })
    });

    if (eventResult.error || !eventResult.recorded) {
      console.error(JSON.stringify({
        event: "auth_password_change_log_error",
        message: eventResult.error || "event_not_recorded"
      }));
      return json({ error: "Impossibile registrare la memoria del cambio password." }, 500);
    }

    await env.DB
      .prepare("UPDATE users SET password = ?, updated_at = ? WHERE id = ?")
      .bind(body.newPassword, new Date().toISOString(), session.user.id)
      .run();

    return json({ success: true });
  } catch (error) {
    console.error(JSON.stringify({ event: "auth_profile_password_error", message: error.message }));
    return json({ error: "Errore interno del server." }, 500);
  }
}
