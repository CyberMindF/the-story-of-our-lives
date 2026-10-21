import { recordEvent } from "../_shared/events.js";
import { getAuthenticatedSession, json, readJson } from "../auth/_shared.js";
import { emptyAttemptAnswers } from "../study-quizzes/_shared.js";
import {
  buildMixedQuizSnapshot,
  loadMixedQuizSource,
  mixedAttemptRow,
  normalizeMixedQuizConfig,
  publicMixedAttempt,
} from "./_shared.mjs";

export async function onRequestGet({ request, env }) {
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    const params = new URL(request.url).searchParams;
    const folderId = Number(params.get("folderId"));
    if (!Number.isSafeInteger(folderId) || folderId < 1)
      return json({ error: "Cartella non valida." }, 400);
    const viewAll = params.get("all") === "1" && session.user.role === "admin";
    const { results } = await env.DB.prepare(
      `SELECT attempt.*, users.nickname FROM study_mixed_quiz_attempts attempt
       INNER JOIN users ON users.id = attempt.user_id
       WHERE attempt.folder_id = ? AND ${viewAll ? "1 = 1" : "attempt.user_id = ?"}
       ORDER BY attempt.updated_at DESC LIMIT 100`,
    )
      .bind(...(viewAll ? [folderId] : [folderId, session.user.id]))
      .all();
    return json({ attempts: results.map(publicMixedAttempt) });
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "study_mixed_quiz_attempts_list_error",
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
    const config = normalizeMixedQuizConfig(await readJson(request));
    if (!config)
      return json({ error: "Le impostazioni del quiz non sono valide." }, 400);

    const active = await env.DB.prepare(
      `SELECT attempt.*, users.nickname FROM study_mixed_quiz_attempts attempt
       INNER JOIN users ON users.id = attempt.user_id
       WHERE attempt.folder_id = ? AND attempt.user_id = ? AND attempt.status = 'in_progress'`,
    )
      .bind(config.folderId, session.user.id)
      .first();
    if (active)
      return json({ attempt: publicMixedAttempt(active), resumed: true });

    const source = await loadMixedQuizSource(env, config.folderId);
    if (!source) return json({ error: "Cartella non trovata." }, 404);
    const snapshot = buildMixedQuizSnapshot(source, config);
    if (!snapshot)
      return json(
        {
          error: config.includeOpen
            ? "La cartella non contiene domande di quiz."
            : "La cartella non contiene domande a scelta multipla.",
        },
        409,
      );

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const row = mixedAttemptRow({
      id,
      folderId: config.folderId,
      user: session.user,
      config,
      snapshot,
      now,
    });
    await env.DB.prepare(
      `INSERT INTO study_mixed_quiz_attempts
       (id, folder_id, user_id, selection_mode, requested_count, include_open,
        shuffle_questions, correction_mode, question_count, snapshot_json, answers_json,
        started_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        row.id,
        row.folder_id,
        row.user_id,
        row.selection_mode,
        row.requested_count,
        row.include_open,
        row.shuffle_questions,
        row.correction_mode,
        row.question_count,
        row.snapshot_json,
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
            attemptId: id,
            folderId: config.folderId,
            mixed: true,
            questionCount: snapshot.questions.length,
            selectionMode: config.selectionMode,
          },
        },
      ),
    );
    return json({ attempt: publicMixedAttempt(row), resumed: false }, 201);
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "study_mixed_quiz_attempt_start_error",
        message: error.message,
      }),
    );
    return json(
      { error: "Non è stato possibile iniziare il quiz misto." },
      500,
    );
  }
}
