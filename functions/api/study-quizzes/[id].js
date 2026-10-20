import { getAuthenticatedSession, json } from "../auth/_shared.js";
import { recordEvent } from "../_shared/events.js";
import { normalizeQuizId } from "./_shared.js";

export async function onRequestDelete(context) {
  const { request, env, params } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    const quizId = normalizeQuizId(params.id);
    if (!quizId) return json({ error: "Quiz non valido." }, 400);
    const now = new Date().toISOString();
    const result = await env.DB.prepare(
      "UPDATE study_quizzes SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL",
    )
      .bind(now, now, quizId)
      .run();
    if (!Number(result.meta.changes || 0))
      return json({ error: "Quiz non trovato." }, 404);
    context.waitUntil(
      recordEvent(
        env,
        { userId: session.user.id, sessionId: session.sessionId },
        {
          section: "aula-studio",
          eventType: "content_deleted",
          metadata: { quizId, contentType: "quiz" },
        },
      ),
    );
    return json({ id: quizId, deleted: true });
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "study_quiz_delete_error",
        message: error.message,
      }),
    );
    return json({ error: "Non è stato possibile eliminare il quiz." }, 500);
  }
}
