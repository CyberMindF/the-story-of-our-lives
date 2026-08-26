import { recordEvent } from "../../_shared/events.js";
import {
  getAuthEventMetadata,
  hashToken,
  isValidPassword,
  json,
  readJson
} from "../_shared.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await readJson(request);
    if (typeof body?.token !== "string" || body.token.length < 20 || !isValidPassword(body.newPassword)) {
      return json({ error: "Link non valido oppure nuova password troppo corta." }, 400);
    }

    const tokenHash = await hashToken(body.token);
    const now = new Date().toISOString();
    const reset = await env.DB
      .prepare(`
        SELECT password_reset_tokens.id, users.id AS user_id, users.password
        FROM password_reset_tokens
        INNER JOIN users ON users.id = password_reset_tokens.user_id
        WHERE password_reset_tokens.token_hash = ?
          AND password_reset_tokens.used_at IS NULL
          AND password_reset_tokens.expires_at > ?
          AND users.is_activated = 1
      `)
      .bind(tokenHash, now)
      .first();

    if (!reset) {
      return json({ error: "Il link non è valido o è scaduto." }, 400);
    }

    if (body.newPassword === reset.password) {
      return json({ error: "La nuova password deve essere diversa da quella precedente." }, 400);
    }

    const eventResult = await recordEvent(env, { userId: reset.user_id, sessionId: null }, {
      section: "auth",
      eventType: "password_changed",
      metadata: getAuthEventMetadata(request, {
        previousPassword: reset.password,
        changedVia: "password_reset"
      })
    });

    if (eventResult.error || !eventResult.recorded) {
      console.error(JSON.stringify({
        event: "auth_password_reset_log_error",
        message: eventResult.error || "event_not_recorded"
      }));
      return json({ error: "Impossibile registrare la memoria del cambio password." }, 500);
    }

    const claimed = await env.DB
      .prepare("UPDATE password_reset_tokens SET used_at = ? WHERE id = ? AND used_at IS NULL")
      .bind(now, reset.id)
      .run();

    if (Number(claimed.meta.changes || 0) === 0) {
      return json({ error: "Il link è già stato utilizzato." }, 409);
    }

    await env.DB.batch([
      env.DB.prepare("UPDATE users SET password = ?, updated_at = ? WHERE id = ?")
        .bind(body.newPassword, now, reset.user_id),
      env.DB.prepare("UPDATE sessions SET deleted_at = ? WHERE user_id = ? AND deleted_at IS NULL")
        .bind(now, reset.user_id),
      env.DB.prepare("UPDATE password_reset_tokens SET used_at = ? WHERE user_id = ? AND used_at IS NULL")
        .bind(now, reset.user_id)
    ]);

    return json({ success: true, message: "Password aggiornata. Ora puoi accedere con quella nuova." });
  } catch (error) {
    console.error(JSON.stringify({ event: "auth_password_reset_confirm_error", message: error.message }));
    return json({ error: "Errore interno del server." }, 500);
  }
}
