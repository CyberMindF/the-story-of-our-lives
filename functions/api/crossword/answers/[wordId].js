import { authenticateCrosswordRequest, json, loadWordDefinition } from "../_shared.js";

// Aggiorna con UPSERT una singola parola e calcola il completamento dalla soluzione statica.
export async function onRequestPut(context) {
  try {
    const authenticated = await authenticateCrosswordRequest(context, { readBody: true });
    if (authenticated.error) {
      return authenticated.error;
    }

    const wordId = String(context.params.wordId || "").trim();
    const definition = await loadWordDefinition(context, wordId);
    if (!definition) {
      return json({ error: "Parola non trovata." }, 404);
    }

    const solution = String(definition.word).trim().toLocaleUpperCase("it");
    const currentAnswer = normalizeCurrentAnswer(authenticated.body.currentAnswer, solution.length);
    if (currentAnswer === null) {
      return json({ error: "Risposta non valida." }, 400);
    }

    const isCompleted = currentAnswer === solution;
    const now = new Date().toISOString();
    const completedAt = isCompleted ? now : null;
    const result = await context.env.DB
      .prepare(`
        INSERT INTO crossword_answers (
          user_id, word_id, current_answer, is_completed, completed_at, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (user_id, word_id) DO UPDATE SET
          current_answer = excluded.current_answer,
          is_completed = excluded.is_completed,
          completed_at = CASE
            WHEN excluded.is_completed = 0 THEN NULL
            WHEN crossword_answers.is_completed = 0 THEN excluded.completed_at
            ELSE crossword_answers.completed_at
          END,
          updated_at = excluded.updated_at
        WHERE crossword_answers.current_answer <> excluded.current_answer
      `)
      .bind(
        authenticated.session.user.id,
        wordId,
        currentAnswer,
        Number(isCompleted),
        completedAt,
        now,
        now
      )
      .run();

    return json({
      saved: result.meta.changes > 0,
      answer: { wordId, currentAnswer, isCompleted, completedAt: isCompleted ? completedAt : null, updatedAt: now }
    });
  } catch (error) {
    console.error(JSON.stringify({ event: "crossword_answer_put_error", message: error.message }));
    return json({ error: "Errore interno del server." }, 500);
  }
}

// Normalizza la risposta in maiuscolo e usa underscore per tutte le celle ancora vuote.
function normalizeCurrentAnswer(value, solutionLength) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLocaleUpperCase("it");
  if (normalized.length > solutionLength || !/^[\p{L}_]*$/u.test(normalized)) {
    return null;
  }

  return normalized.padEnd(solutionLength, "_");
}
