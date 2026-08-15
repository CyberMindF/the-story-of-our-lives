const FROM_ADDRESS = "Il Mondo Bianco <notifiche@il-mondo-bianco.com>";
const RESEND_ENDPOINT = "https://api.resend.com/emails";

// Invia una singola email tramite l'API HTTP di Resend. Non lancia mai: un fallimento nell'invio
// non deve mai far fallire l'azione che lo ha innescato (es. pubblicare una ricetta).
export async function sendEmail(env, { to, subject, html }) {
  if (!env.RESEND_API_KEY) {
    console.error(JSON.stringify({ event: "email_send_skipped", reason: "missing_api_key" }));
    return { sent: false };
  }

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ from: FROM_ADDRESS, to: [to], subject, html })
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error(JSON.stringify({ event: "email_send_failed", status: response.status, detail }));
      return { sent: false };
    }

    return { sent: true };
  } catch (error) {
    console.error(JSON.stringify({ event: "email_send_error", message: error.message }));
    return { sent: false };
  }
}

// Avvisa l'altra identità (rispetto a chi ha compiuto l'azione) di un aggiornamento sul sito,
// solo se ha attivato la preferenza `notify_email_updates` alla registrazione.
export async function notifyOtherIdentity(env, actorUserId, { subject, html }) {
  const recipient = await env.DB
    .prepare("SELECT email FROM users WHERE id != ? AND notify_email_updates = 1")
    .bind(actorUserId)
    .first();

  if (!recipient) {
    return { sent: false };
  }

  return sendEmail(env, { to: recipient.email, subject, html });
}
