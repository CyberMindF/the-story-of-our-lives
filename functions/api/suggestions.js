import { getAuthenticatedSession, json } from "./auth/_shared.js";

const MAX_TITLE_LENGTH = 160;
const MAX_MESSAGE_LENGTH = 8000;

// Riceve un suggerimento libero autenticato e lo conserva come proposta privata da revisionare.
export async function onRequestPost(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const form = await context.request.formData();
    const title = normalizeOptionalText(form.get("title"), MAX_TITLE_LENGTH);
    const message = normalizeRequiredText(form.get("message"), MAX_MESSAGE_LENGTH);

    if (!message) {
      return json({ error: "Scrivi un suggerimento prima di inviare." }, 400);
    }

    const createdAt = new Date().toISOString();
    const result = await context.env.DB
      .prepare(`
        INSERT INTO world_suggestions
          (user_id, title, message, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `)
      .bind(session.user.id, title, message, createdAt, createdAt)
      .run();
    const suggestionId = result.meta.last_row_id;

    return json(
      {
        saved: true,
        suggestionId,
        author: session.user.nickname,
        createdAt
      },
      201
    );
  } catch (error) {
    console.error(JSON.stringify({ event: "world_suggestion_error", message: error.message }));
    return json({ error: "Non è stato possibile salvare il suggerimento." }, 500);
  }
}

// Normalizza un campo facoltativo e lo converte in null quando non contiene testo.
function normalizeOptionalText(value, maxLength) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized && normalized.length <= maxLength ? normalized : null;
}

// Accetta il testo obbligatorio soltanto quando rispetta il limite applicativo.
function normalizeRequiredText(value, maxLength) {
  if (typeof value !== "string") return "";
  const normalized = value.trim();
  return normalized.length <= maxLength ? normalized : "";
}
