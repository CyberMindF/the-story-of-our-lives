import { getAuthenticatedSession, json } from "../auth/_shared.js";
import { hasPermission } from "../_shared/permissions.js";

// Numeri mostrati sopra i due barattoli in home pagina: quanti biglietti attivi contiene
// ciascuno. Niente dettaglio del contenuto, solo il conteggio.
export async function onRequestGet(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.read")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const { results } = await context.env.DB
      .prepare("SELECT jar_identity, COUNT(*) AS count FROM pensieri_biglietti WHERE is_active = 1 GROUP BY jar_identity")
      .all();

    const counts = { lui: 0, lei: 0 };
    for (const row of results) {
      counts[row.jar_identity] = row.count;
    }

    return json(counts);
  } catch (error) {
    console.error(JSON.stringify({ event: "pensieri_biglietti_conteggi_error", message: error.message }));
    return json({ error: "Errore interno del server." }, 500);
  }
}
