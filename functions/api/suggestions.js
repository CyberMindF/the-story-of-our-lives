import { getAuthenticatedSession, json } from "./auth/_shared.js";
import { recordEvent } from "./_shared/events.js";

const MAX_TITLE_LENGTH = 160;
const MAX_MESSAGE_LENGTH = 8000;
const CATEGORIES = new Set([
  "calendario",
  "mappa",
  "storie",
  "cuffiette",
  "bacheca",
  "ponti",
  "lettere",
  "tavolo-da-gioco",
  "cose-da-fare-insieme",
  "altro"
]);

// Riceve un suggerimento libero autenticato e lo conserva come proposta privata da revisionare.
export async function onRequestPost(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const form = await context.request.formData();
    const title = normalizeOptionalText(form.get("title"), MAX_TITLE_LENGTH);
    const message = normalizeRequiredText(form.get("message"), MAX_MESSAGE_LENGTH);
    const category = normalizeCategory(form.get("category"));

    if (!message) {
      return json({ error: "Scrivi un suggerimento prima di inviare." }, 400);
    }
    if (!category) {
      return json({ error: "Scegli dove vorresti applicare il suggerimento." }, 400);
    }

    const createdAt = new Date().toISOString();
    const result = await context.env.DB
      .prepare(`
        INSERT INTO world_suggestions
          (user_id, title, message, category, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .bind(session.user.id, title, message, category, createdAt, createdAt)
      .run();
    const suggestionId = result.meta.last_row_id;

    context.waitUntil(recordEvent(
      context.env,
      { userId: session.user.id, sessionId: session.sessionId },
      { section: "suggerimenti", eventType: "suggestion_sent", metadata: { category } }
    ));

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

// Accetta solo una delle categorie note, per evitare valori arbitrari dal client.
function normalizeCategory(value) {
  return typeof value === "string" && CATEGORIES.has(value) ? value : "";
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
