import { getAuthenticatedSession, json } from "../../auth/_shared.js";
import { recordEvent } from "../../_shared/events.js";
import { normalizeRequiredText } from "../../_shared/text.js";

const MAX_TEXT_LENGTH = 1500;

// Modifica il testo di una risposta già data, solo per chi ha risposto. Stesso schema di
// edit.js: registra sempre prima il testo precedente, aggiorna solo se il log riesce.
export async function onRequestPost(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const questionId = Number(context.params.id);
    if (!Number.isInteger(questionId)) {
      return json({ error: "Domanda non valida." }, 400);
    }

    const question = await context.env.DB
      .prepare("SELECT id, answerer_id, answer_text FROM questions WHERE id = ?")
      .bind(questionId)
      .first();

    if (!question || question.answerer_id === null) {
      return json({ error: "Questa domanda non ha ancora una risposta." }, 404);
    }

    if (question.answerer_id !== session.user.id) {
      return json({ error: "Solo chi ha risposto può modificare la risposta." }, 403);
    }

    const body = await context.request.formData();
    const text = normalizeRequiredText(body.get("answerText"), MAX_TEXT_LENGTH);
    if (!text) {
      return json({ error: "Scrivi una risposta prima di salvare." }, 400);
    }

    const eventResult = await recordEvent(
      context.env,
      { userId: session.user.id, sessionId: session.sessionId },
      { section: "domande", eventType: "answer_edited", metadata: { questionId, previousText: question.answer_text } }
    );

    if (eventResult.error) {
      console.error(JSON.stringify({ event: "questions_answer_edit_log_error", message: eventResult.error }));
      return json({ error: "Impossibile registrare la risposta precedente." }, 500);
    }

    const answerEditedAt = new Date().toISOString();
    await context.env.DB
      .prepare("UPDATE questions SET answer_text = ?, answer_edited_at = ? WHERE id = ?")
      .bind(text, answerEditedAt, questionId)
      .run();

    return json({ saved: true, questionId, answer: text, answerEditedAt });
  } catch (error) {
    console.error(JSON.stringify({ event: "questions_answer_edit_error", message: error.message }));
    return json({ error: "Errore interno del server." }, 500);
  }
}
