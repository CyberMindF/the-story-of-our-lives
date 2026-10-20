import { getAuthenticatedSession, json, readJson } from "../auth/_shared.js";
import { recordEvent } from "../_shared/events.js";
import {
  emptyAttemptAnswers,
  loadQuizSnapshot,
  normalizeQuizId,
  publicAttempt,
} from "../study-quizzes/_shared.js";

export async function onRequestGet({ request, env }) {
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    const params = new URL(request.url).searchParams;
    const rawQuizId = params.get("quizId");
    const quizId = rawQuizId ? normalizeQuizId(rawQuizId) : null;
    if (rawQuizId && !quizId) return json({ error: "Quiz non valido." }, 400);
    const viewAll = params.get("all") === "1" && session.user.role === "admin";
    const conditions = [viewAll ? "1 = 1" : "attempt.user_id = ?"];
    const bindings = viewAll ? [] : [session.user.id];
    if (quizId) {
      conditions.push("attempt.quiz_id = ?");
      bindings.push(quizId);
    }
    const { results } = await env.DB.prepare(
      `
      SELECT attempt.*, users.nickname FROM study_quiz_attempts attempt
      INNER JOIN users ON users.id = attempt.user_id
      WHERE ${conditions.join(" AND ")}
      ORDER BY attempt.updated_at DESC LIMIT 100
    `,
    )
      .bind(...bindings)
      .all();
    return json({ attempts: results.map(publicAttempt) });
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "study_quiz_attempts_list_error",
        message: error.message,
      }),
    );
    return json({ error: "Non è stato possibile caricare lo storico." }, 500);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    const quizId = normalizeQuizId((await readJson(request))?.quizId);
    if (!quizId) return json({ error: "Quiz non valido." }, 400);
    const active = await env.DB.prepare(
      "SELECT attempt.*, users.nickname FROM study_quiz_attempts attempt INNER JOIN users ON users.id = attempt.user_id WHERE attempt.quiz_id = ? AND attempt.user_id = ? AND attempt.status = 'in_progress'",
    )
      .bind(quizId, session.user.id)
      .first();
    if (active) return json({ attempt: publicAttempt(active), resumed: true });
    const snapshot = await loadQuizSnapshot(env, quizId);
    if (!snapshot) return json({ error: "Quiz non trovato." }, 404);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await env.DB.prepare(
      `INSERT INTO study_quiz_attempts
      (id, quiz_id, user_id, snapshot_json, answers_json, started_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        id,
        quizId,
        session.user.id,
        JSON.stringify(snapshot),
        JSON.stringify(emptyAttemptAnswers()),
        now,
        now,
      )
      .run();
    context.waitUntil(
      recordEvent(
        env,
        { userId: session.user.id, sessionId: session.sessionId },
        {
          section: "aula-studio",
          eventType: "quiz_started",
          metadata: {
            quizId,
            attemptId: id,
            questionCount: snapshot.questions.length,
          },
        },
      ),
    );
    return json(
      {
        attempt: publicAttempt({
          id,
          quiz_id: quizId,
          user_id: session.user.id,
          nickname: session.user.nickname,
          status: "in_progress",
          snapshot_json: JSON.stringify(snapshot),
          answers_json: JSON.stringify(emptyAttemptAnswers()),
          correct_count: 0,
          assessed_count: 0,
          started_at: now,
          updated_at: now,
          completed_at: null,
        }),
        resumed: false,
      },
      201,
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "study_quiz_attempt_start_error",
        message: error.message,
      }),
    );
    return json({ error: "Non è stato possibile iniziare il quiz." }, 500);
  }
}
