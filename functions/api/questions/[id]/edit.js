import { getAuthenticatedSession, json } from "../../auth/_shared.js";
import { recordEvent } from "../../_shared/events.js";
import { normalizeRequiredText } from "../../_shared/text.js";

const MAX_TEXT_LENGTH = 1500;

// Modifica il testo di una domanda, solo per chi l'ha scritta. Registra sempre prima il
// testo precedente e aggiorna solo se il log riesce — stesso schema di profile/password.js.
export async function onRequestPost(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const questionId = Number(context.params.id);
    if (!Number.isInteger(questionId)) {
      return json({ error: "Domanda non valida." }, 400);
    }

    const question = await context.env.DB
      .prepare("SELECT id, asker_id, question_text FROM questions WHERE id = ?")
      .bind(questionId)
      .first();

    if (!question) {
      return json({ error: "Domanda non trovata." }, 404);
    }

    if (question.asker_id !== session.user.id) {
      return json({ error: "Solo chi ha scritto la domanda può modificarla." }, 403);
    }

    const body = await context.request.formData();
    const text = normalizeRequiredText(body.get("questionText"), MAX_TEXT_LENGTH);
    if (!text) {
      return json({ error: "Scrivi una domanda prima di salvare." }, 400);
    }

    const eventResult = await recordEvent(
      context.env,
      { userId: session.user.id, sessionId: session.sessionId },
      { section: "domande", eventType: "question_edited", metadata: { questionId, previousText: question.question_text } }
    );

    if (eventResult.error) {
      console.error(JSON.stringify({ event: "questions_edit_log_error", message: eventResult.error }));
      return json({ error: "Impossibile registrare la domanda precedente." }, 500);
    }

    const questionEditedAt = new Date().toISOString();
    await context.env.DB
      .prepare("UPDATE questions SET question_text = ?, question_edited_at = ? WHERE id = ?")
      .bind(text, questionEditedAt, questionId)
      .run();

    return json({ saved: true, questionId, question: text, questionEditedAt });
  } catch (error) {
    console.error(JSON.stringify({ event: "questions_edit_error", message: error.message }));
    return json({ error: "Errore interno del server." }, 500);
  }
}
