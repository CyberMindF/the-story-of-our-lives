import { getAuthenticatedSession, json } from "./auth/_shared.js";
import { recordEvent } from "./_shared/events.js";
import { normalizeRequiredText } from "./_shared/text.js";

const MAX_TEXT_LENGTH = 1500;

// Elenca tutte le domande (sono solo in due: nessun filtro per destinatario). L'identità
// viene risolta qui, mai un id grezzo verso il frontend — stesso schema di letters.js.
export async function onRequestGet(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const result = await context.env.DB
      .prepare(`
        SELECT questions.id, questions.asker_id, askers.nickname AS asker_nickname,
               questions.question_text, questions.created_at, questions.question_edited_at,
               questions.answerer_id, answerers.nickname AS answerer_nickname,
               questions.answer_text, questions.answered_at, questions.answer_edited_at
        FROM questions
        LEFT JOIN users askers ON askers.id = questions.asker_id
        LEFT JOIN users answerers ON answerers.id = questions.answerer_id
        ORDER BY questions.created_at DESC, questions.id DESC
      `)
      .all();

    const questions = result.results.map((row) => {
      const isMyQuestion = row.asker_id === session.user.id;
      const isAnswered = row.answerer_id !== null;
      return {
        id: row.id,
        question: row.question_text,
        questionAuthor: row.asker_nickname,
        isMyQuestion,
        createdAt: row.created_at,
        questionEditedAt: row.question_edited_at,
        isAnswered,
        needsMyAnswer: !isAnswered && !isMyQuestion,
        answer: row.answer_text,
        answerAuthor: row.answerer_nickname,
        isMyAnswer: isAnswered && row.answerer_id === session.user.id,
        answeredAt: row.answered_at,
        answerEditedAt: row.answer_edited_at
      };
    });

    return json({ questions });
  } catch (error) {
    console.error(JSON.stringify({ event: "questions_get_error", message: error.message }));
    return json({ error: "Errore interno del server." }, 500);
  }
}

// Scrive una nuova domanda autenticata.
export async function onRequestPost(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const body = await context.request.formData();
    const text = normalizeRequiredText(body.get("questionText"), MAX_TEXT_LENGTH);
    if (!text) {
      return json({ error: "Scrivi una domanda prima di inviare." }, 400);
    }

    const createdAt = new Date().toISOString();
    const result = await context.env.DB
      .prepare("INSERT INTO questions (asker_id, question_text, created_at) VALUES (?, ?, ?)")
      .bind(session.user.id, text, createdAt)
      .run();

    const questionId = result.meta.last_row_id;
    context.waitUntil(recordEvent(
      context.env,
      { userId: session.user.id, sessionId: session.sessionId },
      { section: "domande", eventType: "question_asked", metadata: { questionId, length: text.length } }
    ));

    return json(
      { saved: true, questionId, question: text, author: session.user.nickname, createdAt },
      201
    );
  } catch (error) {
    console.error(JSON.stringify({ event: "questions_post_error", message: error.message }));
    return json({ error: "Non è stato possibile salvare la domanda." }, 500);
  }
}
