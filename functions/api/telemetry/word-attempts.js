import { json, readAuthenticatedRequest } from "./_shared.js";
import { calculateAttemptMetrics } from "./_word-compatibility.js";

const MAX_ATTEMPT_LENGTH = 128;

// Salva un tentativo solo quando è diverso dall'ultimo della stessa parola e dello stesso utente.
export async function onRequestPost(context) {
  try {
    const parsed = await readAuthenticatedRequest(context.request, context.env);
    if (parsed.error) {
      return parsed.error;
    }

    const { body, session } = parsed;
    const wordId = Number(body.wordId);
    const attempt = normalizeAttempt(body.attempt);

    if (!Number.isInteger(wordId) || wordId < 1 || !attempt) {
      return json({ error: "Tentativo non valido." }, 400);
    }

    const solution = await loadSolution(context, wordId);
    if (!solution) {
      return json({ error: "Parola non trovata." }, 400);
    }

    const metrics = calculateAttemptMetrics(attempt, solution);

    // L'inserimento condizionale evita duplicati consecutivi anche con più richieste ravvicinate.
    const result = await context.env.DB
      .prepare(`
        INSERT INTO crossword_word_attempts (
          user_id,
          session_id,
          word_id,
          attempt,
          compatibility_percent,
          position_accuracy_percent,
          edit_similarity_percent,
          completion_percent,
          is_correct_prefix,
          is_exact
        )
        SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        WHERE COALESCE((
          SELECT attempt
          FROM crossword_word_attempts
          WHERE user_id = ? AND word_id = ?
          ORDER BY id DESC
          LIMIT 1
        ), '') <> ?
      `)
      .bind(
        session.user.id,
        session.sessionId,
        wordId,
        attempt,
        metrics.compatibilityPercent,
        metrics.positionAccuracyPercent,
        metrics.editSimilarityPercent,
        metrics.completionPercent,
        Number(metrics.isCorrectPrefix),
        Number(metrics.isExact),
        session.user.id,
        wordId,
        attempt
      )
      .run();

    return json({ saved: result.meta.changes > 0 }, result.meta.changes > 0 ? 201 : 200);
  } catch (error) {
    console.error(JSON.stringify({ event: "telemetry_word_attempt_error", message: error.message }));
    return json({ error: "Errore interno del server." }, 500);
  }
}

// Legge data.json dagli asset Pages e trova la soluzione tramite l'ID progressivo della parola.
async function loadSolution(context, wordId) {
  const dataUrl = new URL("/data.json", context.request.url);
  const response = await context.env.ASSETS.fetch(dataUrl);
  if (!response.ok) {
    throw new Error(`Impossibile caricare data.json: HTTP ${response.status}`);
  }

  const data = await response.json();
  const word = data.words?.[wordId - 1]?.word;
  return typeof word === "string" ? word.trim().toLocaleUpperCase("it") : "";
}

// Uniforma il tentativo mantenendo gli underscore che rappresentano celle interne ancora vuote.
function normalizeAttempt(value) {
  if (typeof value !== "string") {
    return "";
  }

  const normalized = value.trim().toLocaleUpperCase("it");
  const containsLetters = normalized.replaceAll("_", "").length > 0;
  const containsOnlyAllowedCharacters = /^[\p{L}_]+$/u.test(normalized);
  return containsLetters && containsOnlyAllowedCharacters && normalized.length <= MAX_ATTEMPT_LENGTH ? normalized : "";
}
