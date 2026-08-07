import { authenticateCrosswordRequest, json } from "./_shared.js";

// Restituisce tutto lo stato persistente del cruciverba per l'utente autenticato.
export async function onRequestGet(context) {
  try {
    const authenticated = await authenticateCrosswordRequest(context);
    if (authenticated.error) {
      return authenticated.error;
    }

    const result = await context.env.DB
      .prepare(`
        SELECT word_id, current_answer, is_completed, completed_at, created_at, updated_at
        FROM crossword_answers
        WHERE user_id = ?
        ORDER BY updated_at ASC, id ASC
      `)
      .bind(authenticated.session.user.id)
      .all();

    const answers = result.results.map((row) => ({
      wordId: row.word_id,
      currentAnswer: row.current_answer,
      isCompleted: row.is_completed === 1,
      completedAt: row.completed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    return json({ answers });
  } catch (error) {
    console.error(JSON.stringify({ event: "crossword_answers_get_error", message: error.message }));
    return json({ error: "Errore interno del server." }, 500);
  }
}
