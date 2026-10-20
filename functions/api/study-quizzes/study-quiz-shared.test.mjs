import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const sharedSource = fs.readFileSync(
  new URL("./_shared.js", import.meta.url),
  "utf8",
);
const {
  emptyAttemptAnswers,
  normalizeAttemptAnswers,
  publicAttempt,
  scoreAttempt,
} = await import(
  `data:text/javascript;base64,${Buffer.from(sharedSource).toString("base64")}`
);

const snapshot = {
  quizId: 1,
  title: "Test",
  correctionMode: "final",
  questions: [
    {
      id: 10,
      type: "single",
      prompt: "Singola",
      options: [
        { id: 1, text: "A", correct: true },
        { id: 2, text: "B", correct: false },
      ],
    },
    {
      id: 11,
      type: "multiple",
      prompt: "Multipla",
      options: [
        { id: 3, text: "A", correct: true },
        { id: 4, text: "B", correct: true },
        { id: 5, text: "C", correct: false },
      ],
    },
    {
      id: 12,
      type: "open",
      prompt: "Aperta",
      referenceAnswer: "Riferimento",
      options: [],
    },
  ],
};

test("considera corretta una multipla soltanto con tutte e sole le opzioni giuste", () => {
  const answers = normalizeAttemptAnswers(snapshot, {
    byQuestion: {
      10: { selectedOptionIds: [1] },
      11: { selectedOptionIds: [3] },
      12: { text: "Risposta" },
    },
  });
  answers.byQuestion[10].corrected = true;
  answers.byQuestion[11].corrected = true;
  answers.byQuestion[12].revealed = true;
  answers.byQuestion[12].assessment = "correct";
  assert.deepEqual(scoreAttempt(snapshot, answers), {
    correctCount: 2,
    assessedCount: 3,
    totalCount: 3,
  });
});

test("non espone soluzioni e riferimento prima della correzione", () => {
  const answers = emptyAttemptAnswers();
  const attempt = publicAttempt({
    id: "a",
    quiz_id: 1,
    user_id: 1,
    status: "in_progress",
    snapshot_json: JSON.stringify(snapshot),
    answers_json: JSON.stringify(answers),
    correct_count: 0,
    assessed_count: 0,
    started_at: "now",
    updated_at: "now",
    completed_at: null,
  });
  assert.equal(attempt.snapshot.questions[0].options[0].correct, false);
  assert.equal(attempt.snapshot.questions[2].referenceAnswer, null);
});

test("non permette di cambiare una risposta dopo la correzione", () => {
  const previous = normalizeAttemptAnswers(snapshot, {
    byQuestion: { 10: { selectedOptionIds: [1] } },
  });
  previous.byQuestion[10].corrected = true;
  const changed = normalizeAttemptAnswers(
    snapshot,
    { byQuestion: { 10: { selectedOptionIds: [2] } } },
    previous,
  );
  assert.deepEqual(changed.byQuestion[10].selectedOptionIds, [1]);
});
