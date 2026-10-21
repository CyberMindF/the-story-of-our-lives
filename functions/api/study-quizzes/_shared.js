export function normalizeQuizId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function loadQuizSnapshot(env, quizId) {
  const { results } = await env.DB.prepare(
    `
    SELECT q.id AS quiz_id, q.title, q.folder_id, q.correction_mode, q.shuffle_questions,
      q.shuffle_options, question.id AS question_id, question.type, question.prompt,
      question.difficulty_level, question.image_url, question.image_alt, question.reference_answer,
      question.position AS question_position,
      option_row.id AS option_id, option_row.text AS option_text, option_row.is_correct,
      option_row.position AS option_position
    FROM study_quizzes q
    LEFT JOIN study_quiz_questions question ON question.quiz_id = q.id
    LEFT JOIN study_quiz_options option_row ON option_row.question_id = question.id
    WHERE q.id = ? AND q.deleted_at IS NULL
    ORDER BY question.position, option_row.position
  `,
  )
    .bind(quizId)
    .all();
  if (!results.length) return null;
  const first = results[0];
  const byQuestion = new Map();
  for (const row of results) {
    if (row.question_id === null) continue;
    let question = byQuestion.get(row.question_id);
    if (!question) {
      question = {
        id: row.question_id,
        type: row.type,
        prompt: row.prompt,
        difficultyLevel: row.difficulty_level,
        imageUrl: row.image_url,
        imageAlt: row.image_alt,
        referenceAnswer: row.reference_answer,
        options: [],
        position: row.question_position,
      };
      byQuestion.set(row.question_id, question);
    }
    if (row.option_id !== null)
      question.options.push({
        id: row.option_id,
        text: row.option_text,
        correct: row.is_correct === 1,
        position: row.option_position,
      });
  }
  let questions = [...byQuestion.values()];
  if (first.shuffle_questions === 1) questions = shuffled(questions);
  if (first.shuffle_options === 1)
    questions = questions.map((question) => ({
      ...question,
      options: shuffled(question.options),
    }));
  return {
    quizId: first.quiz_id,
    title: first.title,
    folderId: first.folder_id,
    correctionMode: first.correction_mode,
    shuffleQuestions: first.shuffle_questions === 1,
    shuffleOptions: first.shuffle_options === 1,
    questions,
  };
}

export function emptyAttemptAnswers() {
  return { finalCorrectionShown: false, byQuestion: {} };
}

export function parseAttemptJson(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function normalizeAttemptAnswers(
  snapshot,
  incoming,
  previous = emptyAttemptAnswers(),
) {
  const result = {
    finalCorrectionShown: previous.finalCorrectionShown === true,
    byQuestion: {},
  };
  const raw =
    incoming?.byQuestion && typeof incoming.byQuestion === "object"
      ? incoming.byQuestion
      : {};
  for (const question of snapshot.questions) {
    const oldAnswer = previous.byQuestion?.[question.id] ?? {};
    const incomingAnswer = raw[question.id] ?? oldAnswer;
    // Dopo la correzione la risposta è immutabile anche per chiamate API costruite a mano.
    const candidate =
      question.type === "open"
        ? oldAnswer.revealed
          ? oldAnswer
          : incomingAnswer
        : oldAnswer.corrected
          ? oldAnswer
          : incomingAnswer;
    if (question.type === "open") {
      result.byQuestion[question.id] = {
        text:
          typeof candidate.text === "string"
            ? candidate.text.slice(0, 10000)
            : "",
        revealed: oldAnswer.revealed === true,
        assessment: ["correct", "incorrect"].includes(oldAnswer.assessment)
          ? oldAnswer.assessment
          : null,
      };
    } else {
      const validIds = new Set(question.options.map((option) => option.id));
      let selectedOptionIds = Array.isArray(candidate.selectedOptionIds)
        ? [
            ...new Set(
              candidate.selectedOptionIds
                .map(Number)
                .filter((id) => validIds.has(id)),
            ),
          ]
        : [];
      if (question.type === "single")
        selectedOptionIds = selectedOptionIds.slice(0, 1);
      result.byQuestion[question.id] = {
        selectedOptionIds,
        corrected: oldAnswer.corrected === true,
      };
    }
  }
  return result;
}

export function scoreAttempt(snapshot, answers) {
  let correctCount = 0;
  let assessedCount = 0;
  for (const question of snapshot.questions) {
    const answer = answers.byQuestion?.[question.id] ?? {};
    if (question.type === "open") {
      if (answer.assessment) {
        assessedCount += 1;
        if (answer.assessment === "correct") correctCount += 1;
      }
    } else if (answer.corrected) {
      assessedCount += 1;
      const selected = [...(answer.selectedOptionIds ?? [])].sort(
        (a, b) => a - b,
      );
      const correct = question.options
        .filter((option) => option.correct)
        .map((option) => option.id)
        .sort((a, b) => a - b);
      if (
        selected.length === correct.length &&
        selected.every((id, index) => id === correct[index])
      )
        correctCount += 1;
    }
  }
  return { correctCount, assessedCount, totalCount: snapshot.questions.length };
}

export function publicAttempt(row) {
  const snapshot = parseAttemptJson(row.snapshot_json, null);
  const answers = parseAttemptJson(row.answers_json, emptyAttemptAnswers());
  const publicSnapshot = snapshot
    ? {
        ...snapshot,
        questions: snapshot.questions.map((question) => {
          const answer = answers.byQuestion?.[question.id] ?? {};
          return {
            ...question,
            referenceAnswer:
              question.type === "open" && answer.revealed
                ? question.referenceAnswer
                : null,
            options: question.options.map((option) => ({
              ...option,
              correct:
                question.type !== "open" && answer.corrected
                  ? option.correct
                  : false,
            })),
          };
        }),
      }
    : null;
  return {
    id: row.id,
    quizId: row.quiz_id,
    userId: row.user_id,
    nickname: row.nickname,
    status: row.status,
    snapshot: publicSnapshot,
    answers,
    correctCount: row.correct_count,
    assessedCount: row.assessed_count,
    startedAt: row.started_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  };
}

function shuffled(values) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
}
