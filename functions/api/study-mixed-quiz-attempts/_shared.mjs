import {
  emptyAttemptAnswers,
  publicAttempt,
} from "../study-quizzes/_shared.js";
import { MIXED_QUIZ_SOURCE_SQL } from "./_query.mjs";
export {
  buildMixedQuizSnapshot,
  normalizeMixedQuizConfig,
} from "./_selection.mjs";

export async function loadMixedQuizSource(env, folderId) {
  const [folder, rowsResult] = await Promise.all([
    env.DB.prepare(
      "SELECT id, name FROM study_folders WHERE id = ? AND deleted_at IS NULL",
    )
      .bind(folderId)
      .first(),
    env.DB.prepare(MIXED_QUIZ_SOURCE_SQL).bind(folderId).all(),
  ]);
  if (!folder) return null;

  const byQuestion = new Map();
  for (const row of rowsResult.results) {
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
        position: row.question_position,
        options: [],
        sourceQuizId: row.quiz_id,
        sourceQuizTitle: row.quiz_title,
        sourceUnitId: row.unit_id,
        sourceUnitTitle: row.unit_title,
        sourcePath: row.source_path,
        shuffleOptions: row.shuffle_options === 1,
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
  return {
    folder: { id: folder.id, name: folder.name },
    questions: [...byQuestion.values()],
  };
}

export function publicMixedAttempt(row) {
  return {
    ...publicAttempt({ ...row, quiz_id: null }),
    quizId: null,
    folderId: row.folder_id,
    selectionMode: row.selection_mode,
    requestedCount: row.requested_count,
    includeOpen: row.include_open === 1,
    shuffleQuestions: row.shuffle_questions === 1,
    correctionMode: row.correction_mode,
  };
}

export function mixedAttemptRow({ id, folderId, user, config, snapshot, now }) {
  return {
    id,
    quiz_id: null,
    folder_id: folderId,
    user_id: user.id,
    nickname: user.nickname,
    selection_mode: config.selectionMode,
    requested_count: config.questionCount,
    include_open: config.includeOpen ? 1 : 0,
    shuffle_questions: config.shuffleQuestions ? 1 : 0,
    correction_mode: config.correctionMode,
    question_count: snapshot.questions.length,
    status: "in_progress",
    snapshot_json: JSON.stringify(snapshot),
    answers_json: JSON.stringify(emptyAttemptAnswers()),
    correct_count: 0,
    assessed_count: 0,
    started_at: now,
    updated_at: now,
    completed_at: null,
  };
}
