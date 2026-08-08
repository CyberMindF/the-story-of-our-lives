import { getAuthenticatedSession, json } from "../auth/_shared.js";

const MAX_TITLE_LENGTH = 160;
const MAX_STORY_LENGTH = 50000;
const MAX_MUSIC_LENGTH = 2000;
const MAX_IMAGE_NOTES_LENGTH = 2000;

// Riceve una proposta autenticata e la conserva come bozza privata da revisionare.
export async function onRequestPost(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const form = await context.request.formData();
    const title = normalizeOptionalText(form.get("title"), MAX_TITLE_LENGTH);
    const storyText = normalizeRequiredText(form.get("storyText"), MAX_STORY_LENGTH);
    const musicNotes = normalizeOptionalText(form.get("musicNotes"), MAX_MUSIC_LENGTH);
    const imageNotes = normalizeOptionalText(form.get("imageNotes"), MAX_IMAGE_NOTES_LENGTH);

    if (!storyText) {
      return json({ error: "Scrivi una storia o un'idea prima di inviare." }, 400);
    }

    const createdAt = new Date().toISOString();
    const result = await context.env.DB
      .prepare(`
        INSERT INTO story_suggestions
          (user_id, title, story_text, music_notes, image_notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(session.user.id, title, storyText, musicNotes, imageNotes, createdAt, createdAt)
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
    console.error(JSON.stringify({ event: "story_suggestion_error", message: error.message }));
    return json({ error: "Non è stato possibile salvare la proposta." }, 500);
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
