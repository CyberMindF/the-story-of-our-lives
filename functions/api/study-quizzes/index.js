import { getAuthenticatedSession, json } from "../auth/_shared.js";

export async function onRequestGet({ request, env }) {
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    const [quizResult, mixedResult] = await env.DB.batch([
      env.DB.prepare(
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
      ).bind(session.user.id),
      env.DB.prepare(
        `SELECT id, folder_id, selection_mode, requested_count, include_open,
          shuffle_questions, correction_mode, question_count, updated_at
         FROM study_mixed_quiz_attempts
         WHERE user_id = ? AND status = 'in_progress'
         ORDER BY updated_at DESC`,
      ).bind(session.user.id),
    ]);
    return json({
      quizzes: quizResult.results.map((row) => ({
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
      mixedDrafts: mixedResult.results.map((row) => ({
        id: row.id,
        folderId: row.folder_id,
        selectionMode: row.selection_mode,
        requestedCount: row.requested_count,
        includeOpen: row.include_open === 1,
        shuffleQuestions: row.shuffle_questions === 1,
        correctionMode: row.correction_mode,
        questionCount: row.question_count,
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
