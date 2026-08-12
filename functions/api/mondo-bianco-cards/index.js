import { getAuthenticatedSession, json } from "../auth/_shared.js";
import { hasPermission } from "../_shared/permissions.js";

// Nomi/descrizioni delle card del Mondo Bianco (documentazione/cms/planning-editor-contenuti.md, Fase 7, decisione
// #2 dell'inventario). Solo GET qui: l'insieme delle 14 card è fisso (rotta/emoji/ordine
// restano nel codice), la modifica del singolo campo vive in [id].js.
export async function onRequestGet(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.read")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const { results } = await context.env.DB
      .prepare("SELECT id, name, description, updated_at FROM mondo_bianco_cards")
      .all();

    return json({
      cards: results.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        updatedAt: row.updated_at
      }))
    });
  } catch (error) {
    console.error(JSON.stringify({ event: "mondo_bianco_cards_list_error", message: error.message }));
    return json({ error: "Errore interno del server." }, 500);
  }
}
