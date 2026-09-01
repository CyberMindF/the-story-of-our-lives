const FROM_ADDRESS = "Il Mondo Bianco <notifiche@il-mondo-bianco.com>";
const RESEND_ENDPOINT = "https://api.resend.com/emails";
const EVENT_NOTIFICATION_COOLDOWN_MS = 2 * 60 * 60 * 1000;

// Invia una singola email tramite l'API HTTP di Resend. Non lancia mai: un fallimento nell'invio
// non deve mai far fallire l'azione che lo ha innescato (es. pubblicare una ricetta).
export async function sendEmail(env, { to, subject, html, text }) {
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
      body: JSON.stringify({ from: FROM_ADDRESS, to: [to], subject, html, text })
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
    .prepare(`
      SELECT recipient.email
      FROM users actor
      JOIN users recipient
        ON recipient.identity = CASE actor.identity WHEN 'lui' THEN 'lei' ELSE 'lui' END
       AND recipient.is_test = 0
      WHERE actor.id = ?
        AND recipient.id != actor.id
        AND recipient.notify_email_updates = 1
      ORDER BY recipient.id
      LIMIT 1
    `)
    .bind(actorUserId)
    .first();

  if (!recipient) {
    return { sent: false };
  }

  return sendEmail(env, { to: recipient.email, subject, html });
}

// Avvisa l'admin della prima attivita di un account monitorato e silenzia gli avvisi successivi
// per due ore. Il claim in D1 e atomico, quindi eventi contemporanei non generano doppioni.
export async function notifyLoggedEvent(env, { actorUserId, section, eventType }) {
  const recipient = await env.DB
    .prepare("SELECT email FROM users WHERE role = 'admin' AND is_test = 0 ORDER BY id LIMIT 1")
    .first();
  const actor = await env.DB
    .prepare("SELECT nickname, email FROM users WHERE id = ? AND activity_logging_enabled = 1")
    .bind(actorUserId)
    .first();

  if (!recipient?.email || !actor) {
    return { sent: false, reason: "missing_recipient_or_actor" };
  }

  const claimedAt = new Date().toISOString();
  const cooldownStartedBefore = new Date(Date.now() - EVENT_NOTIFICATION_COOLDOWN_MS).toISOString();
  const claim = await env.DB
    .prepare(`
      UPDATE event_email_notification_state
      SET last_sent_at = ?
      WHERE id = 1
        AND (last_sent_at IS NULL OR last_sent_at <= ?)
    `)
    .bind(claimedAt, cooldownStartedBefore)
    .run();

  if (Number(claim.meta.changes || 0) === 0) {
    return { sent: false, reason: "cooldown" };
  }

  const result = await sendEmail(env, {
    to: recipient.email,
    subject: "Nuova attività nel Mondo Bianco",
    html: `
      <p>È stata registrata una nuova attività di ${escapeHtml(actor.nickname || actor.email)} nel Mondo Bianco.</p>
      <p><strong>Sezione:</strong> ${escapeHtml(section)}<br>
      <strong>Evento:</strong> ${escapeHtml(eventType)}</p>
      <p>Per le prossime due ore non riceverai altri avvisi, ma gli eventi continueranno a essere salvati.</p>
      <p><a href="https://il-mondo-bianco.com/log">Apri il registro eventi</a></p>
    `
  });

  if (!result.sent) {
    await env.DB
      .prepare("UPDATE event_email_notification_state SET last_sent_at = NULL WHERE id = 1 AND last_sent_at = ?")
      .bind(claimedAt)
      .run();
  }

  return result;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}
