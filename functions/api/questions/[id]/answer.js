import { getAuthenticatedSession, json } from "../../auth/_shared.js";
import { recordEvent } from "../../_shared/events.js";
import { normalizeRequiredText } from "../../_shared/text.js";

const MAX_TEXT_LENGTH = 1500;

// Dà la prima risposta a una domanda, solo se non è già stata risposta e non è la propria.
export async function onRequestPost(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const questionId = Number(context.params.id);
    if (!Number.isInteger(questionId)) {
      return json({ error: "Domanda non valida." }, 400);
    }

    const question = await context.env.DB
      .prepare("SELECT id, asker_id, answerer_id FROM questions WHERE id = ?")
      .bind(questionId)
      .first();

    if (!question) {
      return json({ error: "Domanda non trovata." }, 404);
    }

    if (question.answerer_id !== null) {
      return json({ error: "Questa domanda ha già una risposta." }, 400);
    }

    if (question.asker_id === session.user.id) {
      return json({ error: "Non puoi rispondere alla tua stessa domanda." }, 403);
    }

    const body = await context.request.formData();
    const text = normalizeRequiredText(body.get("answerText"), MAX_TEXT_LENGTH);
    if (!text) {
      return json({ error: "Scrivi una risposta prima di inviare." }, 400);
    }

    const answeredAt = new Date().toISOString();
    await context.env.DB
      .prepare("UPDATE questions SET answerer_id = ?, answer_text = ?, answered_at = ? WHERE id = ?")
      .bind(session.user.id, text, answeredAt, questionId)
      .run();

    context.waitUntil(recordEvent(
      context.env,
      { userId: session.user.id, sessionId: session.sessionId },
      { section: "domande", eventType: "answer_given", metadata: { questionId, length: text.length } }
    ));

    return json({ saved: true, questionId, answer: text, answerAuthor: session.user.nickname, answeredAt });
  } catch (error) {
    console.error(JSON.stringify({ event: "questions_answer_error", message: error.message }));
    return json({ error: "Errore interno del server." }, 500);
  }
}
