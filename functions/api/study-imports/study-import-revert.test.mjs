import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { buildStudyBulkPlan, buildImportStatements } from "./_plan.mjs";
import { parseStudyBulkSource } from "./_shared.mjs";
import { preserveCardImportSources } from "../study-topics/_card-provenance.mjs";
import {
  buildImportRevertOperations,
  sortImportFoldersDeepestFirst,
} from "./_revert.mjs";

const IMPORT_ID = "11111111-1111-4111-8111-111111111111";
const NOW = "2026-10-21T15:00:00.000Z";

test("ordina le cartelle importate dalle più profonde alle radici", () => {
  const sorted = sortImportFoldersDeepestFirst([
    { id: 1, parent_id: null },
    { id: 3, parent_id: 2 },
    { id: 2, parent_id: 1 },
  ]);

  assert.deepEqual(
    sorted.map((folder) => folder.id),
    [3, 2, 1],
  );
});

test("annulla contenuti importati e rimuove le loro cartelle rimaste vuote", () => {
  const db = createDatabase();
  insertImport(db);
  db.prepare(
    `INSERT INTO study_folders
      (id, user_id, parent_id, name, created_at, updated_at, source_import_id, source_import_position)
     VALUES (1, 1, NULL, 'Biologia', ?, ?, ?, 0),
            (2, 1, 1, 'Cellula', ?, ?, ?, 1)`,
  ).run(NOW, NOW, IMPORT_ID, NOW, NOW, IMPORT_ID);
  db.prepare(
    `INSERT INTO study_topics
      (id, user_id, folder_id, title, created_at, updated_at, source_import_id, source_import_position)
     VALUES (1, 1, 2, 'Ripasso', ?, ?, ?, 0)`,
  ).run(NOW, NOW, IMPORT_ID);
  db.prepare(
    `INSERT INTO study_quizzes
      (id, user_id, folder_id, title, created_at, updated_at, source_import_id, source_import_position)
     VALUES (1, 1, 2, 'Verifica', ?, ?, ?, 0)`,
  ).run(NOW, NOW, IMPORT_ID);
  db.prepare(
    `INSERT INTO study_quiz_attempts
      (id, quiz_id, user_id, snapshot_json, answers_json, started_at, updated_at)
     VALUES ('attempt-1', 1, 1, '{}', '{}', ?, ?)`,
  ).run(NOW, NOW);

  const folders = db
    .prepare(
      "SELECT id, parent_id FROM study_folders WHERE source_import_id = ?",
    )
    .all(IMPORT_ID);
  applyAtomically(
    db,
    buildImportRevertOperations({ importId: IMPORT_ID, now: NOW, folders }),
  );

  assert.equal(
    value(db, "SELECT COUNT(*) FROM study_topics WHERE deleted_at IS NULL"),
    0,
  );
  assert.equal(
    value(db, "SELECT COUNT(*) FROM study_quizzes WHERE deleted_at IS NULL"),
    0,
  );
  assert.equal(
    value(db, "SELECT COUNT(*) FROM study_folders WHERE deleted_at IS NULL"),
    0,
  );
  assert.equal(value(db, "SELECT COUNT(*) FROM study_quiz_attempts"), 1);
});

test("conserva una cartella importata se contiene materiale aggiunto dopo", () => {
  const db = createDatabase();
  insertImport(db);
  db.prepare(
    `INSERT INTO study_folders
      (id, user_id, name, created_at, updated_at, source_import_id, source_import_position)
     VALUES (1, 1, 'Biologia', ?, ?, ?, 0)`,
  ).run(NOW, NOW, IMPORT_ID);
  db.prepare(
    `INSERT INTO study_topics
      (id, user_id, folder_id, title, created_at, updated_at, source_import_id, source_import_position)
     VALUES (1, 1, 1, 'Importato', ?, ?, ?, 0),
            (2, 1, 1, 'Aggiunto dopo', ?, ?, NULL, NULL)`,
  ).run(NOW, NOW, IMPORT_ID, NOW, NOW);

  const folders = db
    .prepare(
      "SELECT id, parent_id FROM study_folders WHERE source_import_id = ?",
    )
    .all(IMPORT_ID);
  applyAtomically(
    db,
    buildImportRevertOperations({ importId: IMPORT_ID, now: NOW, folders }),
  );

  assert.equal(
    value(db, "SELECT COUNT(*) FROM study_topics WHERE deleted_at IS NULL"),
    1,
  );
  assert.equal(
    value(db, "SELECT COUNT(*) FROM study_folders WHERE deleted_at IS NULL"),
    1,
  );
});

test("annullare un'aggiunta conserva le carte originali e le altre aggiunte", () => {
  const db = createDatabase();
  db.prepare(`INSERT INTO study_folders (id, user_id, name, created_at, updated_at)
    VALUES (1, 1, 'Chimica', ?, ?)`).run(NOW, NOW);
  db.prepare(`INSERT INTO study_topics (id, user_id, folder_id, title, created_at, updated_at)
    VALUES (1, 1, 1, 'Atomo', ?, ?)`).run(NOW, NOW);
  db.prepare(`INSERT INTO study_cards (topic_id, question, answer, position, created_at)
    VALUES (1, 'Originale', 'Risposta', 0, ?)`).run(NOW);
  importSource(db, "aggiunta-1", "# Chimica\n## Atomo\nD1\nR1\nD2\nR2");
  importSource(db, "aggiunta-2", "# Chimica\n## Atomo\nD3\nR3");

  revertImport(db, "aggiunta-1");
  assert.deepEqual(cardQuestions(db), ["Originale", "D3"]);
  assert.equal(value(db, "SELECT COUNT(*) FROM study_topics WHERE deleted_at IS NULL"), 1);
  importSource(db, "aggiunta-3", "# Chimica\n## Atomo\nD4\nR4");
  assert.deepEqual(cardQuestions(db), ["Originale", "D3", "D4"]);
  revertImport(db, "aggiunta-2");
  revertImport(db, "aggiunta-3");
  assert.deepEqual(cardQuestions(db), ["Originale"]);
});

test("annullare l'import originale conserva le carte delle importazioni successive", () => {
  const db = createDatabase();
  importSource(db, "originale", "# Chimica\n## Atomo\nD0\nR0");
  importSource(db, "aggiunta", "# Chimica\n## Atomo\nD1\nR1");
  revertImport(db, "originale");
  assert.deepEqual(cardQuestions(db), ["D1"]);
  assert.equal(value(db, "SELECT COUNT(*) FROM study_topics WHERE deleted_at IS NULL"), 1);
  assert.equal(value(db, "SELECT COUNT(*) FROM study_folders WHERE deleted_at IS NULL"), 1);

  revertImport(db, "aggiunta");
  assert.equal(value(db, "SELECT COUNT(*) FROM study_topics WHERE deleted_at IS NULL"), 0);
});

test("salvare il gruppo dopo un'aggiunta conserva la provenienza delle carte invariate", () => {
  const db = createDatabase();
  importSource(db, "originale", "# Chimica\n## Atomo\nD0\nR0");
  importSource(db, "aggiunta", "# Chimica\n## Atomo\nD1\nR1");
  const existing = db.prepare("SELECT * FROM study_cards ORDER BY position").all();
  const cards = preserveCardImportSources([
    { question: "D1", answer: "R1" },
    { question: "D0", answer: "R0" },
    { question: "Manuale", answer: "Risposta" },
  ], existing);
  db.exec("DELETE FROM study_cards");
  for (const [position, card] of cards.entries()) {
    db.prepare(`INSERT INTO study_cards
      (topic_id, question, answer, position, created_at, source_import_id)
      VALUES (1, ?, ?, ?, ?, ?)`
    ).run(card.question, card.answer, position, NOW, card.sourceImportId);
  }
  revertImport(db, "aggiunta");
  assert.deepEqual(cardQuestions(db), ["D0", "Manuale"]);
});

test("coppie identiche conservano la provenienza una sola volta per occorrenza", () => {
  const cards = preserveCardImportSources([
    { question: "D", answer: "R" },
    { question: "D", answer: "R" },
    { question: "D", answer: "R" },
  ], [
    { question: "D", answer: "R", source_import_id: "primo" },
    { question: "D", answer: "R", source_import_id: "secondo" },
  ]);
  assert.deepEqual(cards.map((card) => card.sourceImportId), ["primo", "secondo", null]);
});

test("annullare prima l'aggiunta e poi l'originale rimuove gruppo e cartelle vuote", () => {
  const db = createDatabase();
  importSource(db, "originale", "# Chimica > Unità 1\n## Atomo\nD0\nR0");
  importSource(db, "aggiunta", "# Chimica > Unità 1\n## Atomo\nD1\nR1");
  revertImport(db, "aggiunta");
  assert.deepEqual(cardQuestions(db), ["D0"]);
  revertImport(db, "originale");
  assert.equal(value(db, "SELECT COUNT(*) FROM study_topics WHERE deleted_at IS NULL"), 0);
  assert.equal(value(db, "SELECT COUNT(*) FROM study_folders WHERE deleted_at IS NULL"), 0);
});

function cardQuestions(db) {
  return db.prepare(`SELECT question FROM study_cards
    JOIN study_topics ON study_topics.id = study_cards.topic_id
    WHERE study_topics.deleted_at IS NULL ORDER BY position`).all().map((row) => row.question);
}

function importSource(db, importId, source) {
  const parsed = parseStudyBulkSource(source);
  assert.deepEqual(parsed.errors, []);
  const plan = buildStudyBulkPlan(parsed,
    db.prepare("SELECT * FROM study_folders WHERE deleted_at IS NULL ORDER BY id").all(),
    db.prepare("SELECT * FROM study_topics WHERE deleted_at IS NULL ORDER BY id").all(),
  );
  applyAtomically(db, buildImportStatements({
    plan, importId, userId: 1, idempotencyKey: importId, sourceHash: "hash", now: NOW,
  }));
}

function revertImport(db, importId) {
  const folders = db.prepare("SELECT * FROM study_folders WHERE source_import_id = ?").all(importId);
  applyAtomically(db, [
    ...buildImportRevertOperations({ importId, now: NOW, folders }),
    { sql: "UPDATE study_imports SET reverted_at = ? WHERE id = ?", params: [NOW, importId] },
  ]);
}

function createDatabase() {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec(
    "CREATE TABLE users (id INTEGER PRIMARY KEY, nickname TEXT NOT NULL)",
  );
  db.exec("INSERT INTO users (id, nickname) VALUES (1, 'Admin')");
  for (const migration of [
    "migrations/0115_create_study_topics.sql",
    "migrations/0116_add_study_folders.sql",
    "migrations/0117_add_study_bulk_imports.sql",
    "migrations/0118_add_study_quizzes.sql",
    "migrations/0119_add_study_import_reverts.sql",
    "migrations/0120_add_study_quiz_question_difficulty.sql",
    "migrations/0121_add_study_mixed_quiz_attempts.sql",
    "migrations/0142_add_study_card_import_source.sql",
  ]) {
    db.exec(
      fs.readFileSync(
        new URL(`../../../${migration}`, import.meta.url),
        "utf8",
      ),
    );
  }
  return db;
}

function insertImport(db) {
  db.prepare(
    `INSERT INTO study_imports
      (id, user_id, idempotency_key, source_hash, summary_json, created_at)
     VALUES (?, 1, 'idempotency-key', 'hash', '{}', ?)`,
  ).run(IMPORT_ID, NOW);
}

function applyAtomically(db, operations) {
  db.exec("BEGIN");
  try {
    for (const operation of operations) {
      db.prepare(operation.sql).run(...operation.params);
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function value(db, sql) {
  return db.prepare(sql).get()["COUNT(*)"];
}
