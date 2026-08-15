import { getAuthenticatedSession, json } from "./auth/_shared.js";
import { recordEvent } from "./_shared/events.js";
import { notifyOtherIdentity } from "./_shared/email.js";
import { normalizeRequiredText } from "./_shared/text.js";

const MAX_MESSAGE_LENGTH = 500;

// Notifica manuale: chi è loggato avvisa l'altra identità di un aggiornamento sul sito.
// Non invia nulla se l'altra identità non ha attivato notify_email_updates alla registrazione.
export async function onRequestPost(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const body = await context.request.json().catch(() => null);
    const message = normalizeRequiredText(body?.message, MAX_MESSAGE_LENGTH) || "Ci sono novità sul Mondo Bianco.";

    const result = await notifyOtherIdentity(context.env, session.user.id, {
      subject: `${session.user.nickname} ti ha lasciato una novità sul Mondo Bianco`,
      html: `<p>${escapeHtml(message)}</p><p><a href="https://il-mondo-bianco.com">Vai al Mondo Bianco</a></p>`
    });

    context.waitUntil(recordEvent(
      context.env,
      { userId: session.user.id, sessionId: session.sessionId },
      { section: "notifiche", eventType: "content_updated", metadata: { channel: "email_manual", sent: result.sent } }
    ));

    return json({ sent: result.sent });
  } catch (error) {
    console.error(JSON.stringify({ event: "notify_update_error", message: error.message }));
    return json({ error: "Errore interno del server." }, 500);
  }
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}
