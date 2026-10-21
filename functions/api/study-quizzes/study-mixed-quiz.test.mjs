import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";
import {
  buildMixedQuizSnapshot,
  normalizeMixedQuizConfig,
} from "../study-mixed-quiz-attempts/_selection.mjs";
import { MIXED_QUIZ_SOURCE_SQL } from "../study-mixed-quiz-attempts/_query.mjs";

function question(id, unit, difficultyLevel, quiz = unit, type = "single") {
  return {
    id,
    type,
    prompt: `Domanda ${id}`,
    difficultyLevel,
    imageUrl: null,
    imageAlt: null,
    referenceAnswer: null,
    position: id,
    options: [],
    sourceQuizId: quiz,
    sourceQuizTitle: `Quiz ${quiz}`,
    sourceUnitId: unit,
    sourceUnitTitle: `Unità ${unit}`,
    sourcePath: `Materia › Unità ${unit}`,
    shuffleOptions: false,
  };
}

const source = {
  folder: { id: 1, name: "Materia" },
  questions: [
    question(1, 10, 1, 100),
    question(2, 10, 5, 101),
    question(3, 10, 1, 100),
    question(4, 20, 1, 200),
    question(5, 20, 5, 201),
    question(6, 20, null, 202, "open"),
  ],
};

test("valida le impostazioni del quiz misto e applica i default", () => {
  assert.deepEqual(
    normalizeMixedQuizConfig({
      folderId: 1,
      selectionMode: "total",
      questionCount: 10,
    }),
    {
      folderId: 1,
      selectionMode: "total",
      questionCount: 10,
      includeOpen: true,
      shuffleQuestions: true,
      correctionMode: "final",
    },
  );
  assert.equal(
    normalizeMixedQuizConfig({
      folderId: 1,
      selectionMode: "total",
      questionCount: 101,
    }),
    null,
  );
});

test("distribuisce il totale tra unità e livelli", () => {
  const snapshot = buildMixedQuizSnapshot(
    source,
    {
      selectionMode: "total",
      questionCount: 4,
      includeOpen: true,
      shuffleQuestions: false,
      correctionMode: "final",
    },
    () => 0.5,
  );
  assert.equal(snapshot.questions.length, 4);
  assert.deepEqual(
    new Set(snapshot.questions.map((item) => item.sourceUnitId)),
    new Set([10, 20]),
  );
  assert.deepEqual(
    new Set(
      snapshot.questions.map((item) => item.difficultyLevel).filter(Boolean),
    ),
    new Set([1, 5]),
  );
});

test("applica il numero richiesto a ogni unità ed esclude le aperte su richiesta", () => {
  const snapshot = buildMixedQuizSnapshot(source, {
    selectionMode: "per_unit",
    questionCount: 2,
    includeOpen: false,
    shuffleQuestions: false,
    correctionMode: "final",
  });
  assert.equal(snapshot.questions.length, 4);
  assert.equal(
    snapshot.questions.some((item) => item.type === "open"),
    false,
  );
  assert.deepEqual(
    [
      ...Map.groupBy(snapshot.questions, (item) => item.sourceUnitId).values(),
    ].map((items) => items.length),
    [2, 2],
  );
});

test("la query include i quiz discendenti e li assegna all'unità diretta", () => {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec("CREATE TABLE users (id INTEGER PRIMARY KEY)");
  db.exec("INSERT INTO users (id) VALUES (1)");
  for (const migration of [
    "migrations/0115_create_study_topics.sql",
    "migrations/0116_add_study_folders.sql",
    "migrations/0117_add_study_bulk_imports.sql",
    "migrations/0118_add_study_quizzes.sql",
    "migrations/0119_add_study_import_reverts.sql",
    "migrations/0120_add_study_quiz_question_difficulty.sql",
    "migrations/0121_add_study_mixed_quiz_attempts.sql",
  ])
    db.exec(
      fs.readFileSync(
        new URL(`../../../${migration}`, import.meta.url),
        "utf8",
      ),
    );

  db.exec(`
    INSERT INTO study_folders (id, user_id, parent_id, name, created_at, updated_at) VALUES
      (1, 1, NULL, 'Materia', 'now', 'now'),
      (2, 1, 1, 'Unità 1', 'now', 'now'),
      (3, 1, 2, 'Capitolo', 'now', 'now');
    INSERT INTO study_quizzes
      (id, user_id, folder_id, title, created_at, updated_at) VALUES
      (10, 1, 1, 'Generale', 'now', 'now'),
      (20, 1, 3, 'Dettagli', 'now', 'now');
    INSERT INTO study_quiz_questions
      (id, quiz_id, type, prompt, difficulty_level, position) VALUES
      (100, 10, 'open', 'Diretta', NULL, 0),
      (200, 20, 'open', 'Discendente', 5, 0);
  `);
  const rows = db.prepare(MIXED_QUIZ_SOURCE_SQL).all(1);
  assert.deepEqual(
    rows.map((row) => ({
      prompt: row.prompt,
      unitId: row.unit_id,
      unitTitle: row.unit_title,
      difficultyLevel: row.difficulty_level,
    })),
    [
      {
        prompt: "Diretta",
        unitId: 1,
        unitTitle: "Materia",
        difficultyLevel: null,
      },
      {
        prompt: "Discendente",
        unitId: 2,
        unitTitle: "Unità 1",
        difficultyLevel: 5,
      },
    ],
  );
});
