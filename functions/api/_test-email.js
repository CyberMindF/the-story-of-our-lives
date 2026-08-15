import { getAuthenticatedSession, json } from "./auth/_shared.js";
import { sendEmail } from "./_shared/email.js";

// Endpoint temporaneo per verificare l'invio reale via Resend, da rimuovere dopo il test.
export async function onRequestPost(context) {
  const { request, env } = context;
  const session = await getAuthenticatedSession(request, env);
  if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

  const result = await sendEmail(env, {
    to: session.user.email,
    subject: "Test invio email — Il Mondo Bianco",
    html: "<p>Questa è un'email di prova per verificare la configurazione Resend.</p>"
  });

  return json({ ...result, envKeys: Object.keys(env) });
}
