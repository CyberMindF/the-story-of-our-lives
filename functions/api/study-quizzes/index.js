import { getAuthenticatedSession, json } from "../auth/_shared.js";

export async function onRequestGet({ request, env }) {
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    const { results } = await env.DB.prepare(
      `
      SELECT q.id, q.folder_id, q.title, q.correction_mode, q.shuffle_questions,
        q.shuffle_options, q.created_at, q.updated_at, COUNT(question.id) AS question_count,
        attempt.id AS active_attempt_id
      FROM study_quizzes q
      LEFT JOIN study_quiz_questions question ON question.quiz_id = q.id
      LEFT JOIN study_quiz_attempts attempt ON attempt.quiz_id = q.id
        AND attempt.user_id = ? AND attempt.status = 'in_progress'
      WHERE q.deleted_at IS NULL
      GROUP BY q.id ORDER BY q.updated_at DESC, q.id DESC
    `,
    )
      .bind(session.user.id)
      .all();
    return json({
      quizzes: results.map((row) => ({
        id: row.id,
        folderId: row.folder_id,
        title: row.title,
        correctionMode: row.correction_mode,
        shuffleQuestions: row.shuffle_questions === 1,
        shuffleOptions: row.shuffle_options === 1,
        questionCount: Number(row.question_count),
        activeAttemptId: row.active_attempt_id ?? null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "study_quizzes_list_error",
        message: error.message,
      }),
    );
    return json({ error: "Non è stato possibile caricare i quiz." }, 500);
  }
}
