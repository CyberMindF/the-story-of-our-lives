import { getAuthenticatedSession, json } from "../auth/_shared.js";

const MAX_BODY_LENGTH = 20000;
const DEFAULT_ADVENTURE = "il-prezzo-della-verita";

// Legge il blocco appunti personale dell'utente per una specifica avventura (uno per persona).
export async function onRequestGet(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const url = new URL(context.request.url);
    const adventure = normalizeAdventure(url.searchParams.get("adventure"));

    const note = await context.env.DB
      .prepare("SELECT body, updated_at FROM gdr_notes WHERE user_id = ? AND adventure = ?")
      .bind(session.user.id, adventure)
      .first();

    return json({ body: note?.body || "", updatedAt: note?.updated_at || null });
  } catch (error) {
    console.error(JSON.stringify({ event: "gdr_notes_get_error", message: error.message }));
    return json({ error: "Errore interno del server." }, 500);
  }
}

// Salva (o aggiorna) il blocco appunti dell'utente per una specifica avventura.
export async function onRequestPost(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const form = await context.request.formData();
    const adventure = normalizeAdventure(form.get("adventure"));
    const body = normalizeBody(form.get("body"));
    const updatedAt = new Date().toISOString();

    await context.env.DB
      .prepare(`
        INSERT INTO gdr_notes (user_id, adventure, body, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT (user_id, adventure) DO UPDATE SET body = excluded.body, updated_at = excluded.updated_at
      `)
      .bind(session.user.id, adventure, body, updatedAt)
      .run();

    return json({ saved: true, updatedAt });
  } catch (error) {
    console.error(JSON.stringify({ event: "gdr_notes_post_error", message: error.message }));
    return json({ error: "Non è stato possibile salvare gli appunti." }, 500);
  }
}

function normalizeAdventure(value) {
  if (typeof value !== "string") return DEFAULT_ADVENTURE;
  const trimmed = value.trim();
  return trimmed || DEFAULT_ADVENTURE;
}

function normalizeBody(value) {
  if (typeof value !== "string") return "";
  return value.length <= MAX_BODY_LENGTH ? value : value.slice(0, MAX_BODY_LENGTH);
}
