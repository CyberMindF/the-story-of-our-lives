import { sendEmail } from "../../_shared/email.js";
import { getConnectionIp } from "../../_shared/request-context.js";
import {
  createRandomToken,
  hashToken,
  isValidEmail,
  json,
  normalizeEmail,
  readJson
} from "../_shared.js";

const TOKEN_DURATION_MS = 30 * 60 * 1000;
const REQUEST_WINDOW_MS = 15 * 60 * 1000;
const GENERIC_MESSAGE = "Se l'indirizzo è registrato, riceverai un link per reimpostare la password.";

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await readJson(request);
    const email = normalizeEmail(body?.email);
    if (!isValidEmail(email)) {
      return json({ success: true, message: GENERIC_MESSAGE });
    }

    const user = await env.DB
      .prepare("SELECT id, email FROM users WHERE email = ? AND is_activated = 1")
      .bind(email)
      .first();

    if (!user) {
      return json({ success: true, message: GENERIC_MESSAGE });
    }

    const requestedAfter = new Date(Date.now() - REQUEST_WINDOW_MS).toISOString();
    const recentRequest = await env.DB
      .prepare("SELECT id FROM password_reset_tokens WHERE user_id = ? AND created_at > ? LIMIT 1")
      .bind(user.id, requestedAfter)
      .first();

    if (recentRequest) {
      return json({ success: true, message: GENERIC_MESSAGE });
    }

    const token = createRandomToken();
    const tokenHash = await hashToken(token);
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + TOKEN_DURATION_MS).toISOString();
    const requestedIp = getConnectionIp(request);

    const insert = await env.DB
      .prepare(`
        INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, requested_ip, created_at)
        VALUES (?, ?, ?, ?, ?)
      `)
      .bind(user.id, tokenHash, expiresAt, requestedIp, createdAt)
      .run();

    const resetUrl = new URL("/login", request.url);
    resetUrl.searchParams.set("resetToken", token);
    const emailResult = await sendEmail(env, {
      to: user.email,
      subject: "Reimposta la password del Mondo Bianco",
      text: `È stata richiesta una nuova password per il tuo account. Apri questo link entro 30 minuti: ${resetUrl.toString()}\n\nSe non sei stata tu, puoi ignorare questa email.`,
      html: `
        <p>È stata richiesta una nuova password per il tuo account nel Mondo Bianco.</p>
        <p><a href="${resetUrl.toString()}">Scegli una nuova password</a></p>
        <p>Il link è monouso e scade tra 30 minuti. Se non sei stata tu, puoi ignorare questa email.</p>
      `
    });

    if (!emailResult.sent) {
      await env.DB
        .prepare("DELETE FROM password_reset_tokens WHERE id = ?")
        .bind(insert.meta.last_row_id)
        .run();
    }

    return json({ success: true, message: GENERIC_MESSAGE });
  } catch (error) {
    console.error(JSON.stringify({ event: "auth_password_reset_request_error", message: error.message }));
    return json({ success: true, message: GENERIC_MESSAGE });
  }
}
