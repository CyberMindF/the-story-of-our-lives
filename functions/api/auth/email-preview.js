import { hasPermission } from "../_shared/permissions.js";
import { renderEmailTemplate } from "../_shared/email.js";
import { getAuthenticatedSession, json } from "./_shared.js";

export async function onRequestGet(context) {
  const session = await getAuthenticatedSession(context.request, context.env);
  if (!session?.adminModeEnabled || !hasPermission(session.user.role, "users.manage")) {
    return json({ error: "Non autorizzato." }, 403);
  }

  const html = renderEmailTemplate({
    subject: "Rory ti ha lasciato una novità sul Mondo Bianco",
    content: `
      <p>Ci sono nuove cose da scoprire nel nostro piccolo mondo.</p>
      <p>Questa è un’anteprima: non è stata inviata alcuna email.</p>
      <p><a href="https://il-mondo-bianco.com">Vai al Mondo Bianco</a></p>
    `
  });

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
