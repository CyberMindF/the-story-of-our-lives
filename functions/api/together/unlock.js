import { getAuthenticatedSession, json } from "../auth/_shared.js";
import { recordEvent } from "../_shared/events.js";

const MAX_ANSWER_LENGTH = 240;
const ANSWERS = new Set([
  "la mia mano sul collo",
  "mia mano sul collo",
  "la mano sul collo",
  "mano sul collo",
  "mano collo",
  "stringermi il collo",
  "quando mi stringevi il collo",
  "quando mi stringevi per il collo"
]);

function normalize(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function onRequestPost(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const body = await context.request.json();
    const answer = typeof body.answer === "string" ? body.answer.trim() : "";
    if (!answer || answer.length > MAX_ANSWER_LENGTH) {
      return json({ error: "Scrivi una risposta breve." }, 400);
    }

    const unlocked = ANSWERS.has(normalize(answer));
    await recordEvent(
      context.env,
      { userId: session.user.id, sessionId: session.sessionId },
      { section: "cose-insieme", eventType: "together_nsfw_attempt", metadata: { answer, unlocked } }
    );

    if (!unlocked) return json({ unlocked: false });

    const { results } = await context.env.DB
      .prepare("SELECT id, private_text FROM together_activities WHERE private_text IS NOT NULL ORDER BY id")
      .all();

    return json({
      unlocked: true,
      privateParts: results.map((row) => ({ id: row.id, text: row.private_text }))
    });
  } catch (error) {
    console.error(JSON.stringify({ event: "together_unlock_error", message: error.message }));
    return json({ error: "Non è stato possibile verificare la risposta." }, 500);
  }
}

