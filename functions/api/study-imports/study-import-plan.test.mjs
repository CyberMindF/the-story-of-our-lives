import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { parseStudyBulkSource } from "./_shared.mjs";
import {
  buildImportStatements,
  buildStudyBulkPlan,
  buildUndoStatements,
} from "./_plan.mjs";

const NOW = "2026-09-15T12:00:00.000Z";

test("riutilizza le cartelle esistenti nello stesso ramo", () => {
  const parsed = validParse("# Chimica > Unità 1\n## Atomo\nD\nR");
  const plan = buildStudyBulkPlan(
    parsed,
    [folder(1, null, "Chimica"), folder(2, 1, "Unità 1")],
    [],
    "skip",
  );
  assert.deepEqual(plan.errors, []);
  assert.equal(plan.summary.foldersCreated, 0);
  assert.equal(plan.summary.foldersReused, 2);
  assert.equal(plan.topics[0].folderRef.id, 2);
});

test("distingue cartelle omonime in rami differenti", () => {
  const parsed = validParse(
    "# Chimica > Unità 1\n## Atomo\nD\nR\n# Biologia > Unità 1\n## Cellula\nD2\nR2",
  );
  const plan = buildStudyBulkPlan(
    parsed,
    [
      folder(1, null, "Chimica"),
      folder(2, null, "Biologia"),
      folder(3, 1, "Unità 1"),
      folder(4, 2, "Unità 1"),
    ],
    [],
    "skip",
  );
  assert.equal(plan.topics[0].folderRef.id, 3);
  assert.equal(plan.topics[1].folderRef.id, 4);
});

for (const [policy, expectedAction, summaryKey, cardsInserted] of [
  ["skip", "skip", "topicsSkipped", 0],
  ["append", "append", "topicsAppended", 1],
  ["replace", "replace", "topicsReplaced", 1],
]) {
  test(`applica la politica di conflitto ${policy}`, () => {
    const parsed = validParse(
      "# Chimica\n## Atomo\nNuova domanda\nNuova risposta",
    );
    const plan = buildStudyBulkPlan(
      parsed,
      [folder(1, null, "Chimica")],
      [topic(7, 1, "Atomo")],
      policy,
    );
    assert.equal(plan.conflictCount, 1);
    assert.equal(plan.topics[0].action, expectedAction);
    assert.equal(plan.summary[summaryKey], 1);
    assert.equal(plan.summary.cardsInserted, cardsInserted);
  });
}

test("la transazione annulla ogni scrittura se una operazione fallisce", () => {
  const db = createDatabase();
  const plan = planForDatabase(
    db,
    "# Chimica > Parte A\n## Atomo\nD\nR",
    "skip",
  );
  const operations = importOperations(plan, "import-rollback", "key-rollback");
  operations.splice(2, 0, {
    sql: "INSERT INTO tabella_inesistente VALUES (1)",
    params: [],
  });

  assert.throws(() => applyAtomically(db, operations));
  assert.equal(value(db, "SELECT COUNT(*) FROM study_imports"), 0);
  assert.equal(value(db, "SELECT COUNT(*) FROM study_folders"), 0);
  assert.equal(value(db, "SELECT COUNT(*) FROM study_topics"), 0);
});

test("il doppio invio con la stessa chiave non crea duplicati", () => {
  const db = createDatabase();
  const plan = planForDatabase(db, "# Chimica\n## Atomo\nD\nR", "skip");
  const operations = importOperations(plan, "import-once", "same-key");
  applyAtomically(db, operations);
  assert.throws(() => applyAtomically(db, operations), /UNIQUE/);

  assert.equal(value(db, "SELECT COUNT(*) FROM study_imports"), 1);
  assert.equal(
    value(db, "SELECT COUNT(*) FROM study_folders WHERE deleted_at IS NULL"),
    1,
  );
  assert.equal(
    value(db, "SELECT COUNT(*) FROM study_topics WHERE deleted_at IS NULL"),
    1,
  );
  assert.equal(value(db, "SELECT COUNT(*) FROM study_cards"), 1);
});

test("aggiunge nuove carte in fondo e l'annullamento rimuove soltanto quelle importate", () => {
  const db = createDatabase();
  db.prepare(
    "INSERT INTO study_folders (id, user_id, parent_id, name, created_at, updated_at) VALUES (1, 1, NULL, 'Chimica', ?, ?)",
  ).run(NOW, NOW);
  db.prepare(
    "INSERT INTO study_topics (id, user_id, folder_id, title, created_at, updated_at) VALUES (1, 1, 1, 'Atomo', ?, ?)",
  ).run(NOW, NOW);
  db.prepare(
    "INSERT INTO study_cards (topic_id, question, answer, position, created_at) VALUES (1, 'Originale', 'Risposta', 0, ?)",
  ).run(NOW);

  const plan = planForDatabase(
    db,
    "# Chimica\n## Atomo\nNuova 1\nRisposta 1\nNuova 2\nRisposta 2",
    "append",
  );
  applyAtomically(
    db,
    importOperations(plan, "import-append", "key-append", "append"),
  );
  assert.deepEqual(
    db
      .prepare(
        "SELECT question, position FROM study_cards WHERE topic_id = 1 ORDER BY position",
      )
      .all()
      .map((row) => ({ ...row })),
    [
      { question: "Originale", position: 0 },
      { question: "Nuova 1", position: 1 },
      { question: "Nuova 2", position: 2 },
    ],
  );

  applyAtomically(
    db,
    buildUndoStatements("import-append", [], "2026-09-15T13:00:00.000Z"),
  );
  assert.deepEqual(
    db
      .prepare(
        "SELECT question, position FROM study_cards WHERE topic_id = 1 ORDER BY position",
      )
      .all()
      .map((row) => ({ ...row })),
    [{ question: "Originale", position: 0 }],
  );
});

test("annulla l'ultima importazione e ripristina un argomento sostituito", () => {
  const db = createDatabase();
  db.prepare(
    "INSERT INTO study_folders (id, user_id, parent_id, name, created_at, updated_at) VALUES (1, 1, NULL, 'Chimica', ?, ?)",
  ).run(NOW, NOW);
  db.prepare(
    "INSERT INTO study_topics (id, user_id, folder_id, title, created_at, updated_at) VALUES (1, 1, 1, 'Atomo', ?, ?)",
  ).run(NOW, NOW);
  db.prepare(
    "INSERT INTO study_cards (topic_id, question, answer, position, created_at) VALUES (1, 'Vecchia domanda', 'Vecchia risposta', 0, ?)",
  ).run(NOW);

  const source =
    "# Chimica\n## Atomo\nNuova domanda\nNuova risposta\n# Chimica > Parte A\n## Legami\nD\nR";
  const plan = planForDatabase(db, source, "replace");
  applyAtomically(
    db,
    importOperations(plan, "import-undo", "key-undo", "replace"),
  );

  assert.equal(
    value(
      db,
      "SELECT COUNT(*) FROM study_topics WHERE id = 1 AND deleted_at IS NULL",
    ),
    0,
  );
  assert.equal(
    value(
      db,
      "SELECT COUNT(*) FROM study_topics WHERE source_import_id = 'import-undo' AND deleted_at IS NULL",
    ),
    2,
  );

  const depths = db
    .prepare(
      "SELECT depth FROM study_import_folder_changes WHERE import_id = ? AND action = 'created'",
    )
    .all("import-undo")
    .map((row) => row.depth);
  applyAtomically(
    db,
    buildUndoStatements("import-undo", depths, "2026-09-15T13:00:00.000Z"),
  );

  assert.equal(
    value(
      db,
      "SELECT COUNT(*) FROM study_topics WHERE id = 1 AND deleted_at IS NULL",
    ),
    1,
  );
  assert.equal(
    value(
      db,
      "SELECT COUNT(*) FROM study_topics WHERE source_import_id = 'import-undo' AND deleted_at IS NULL",
    ),
    0,
  );
  assert.equal(
    value(
      db,
      "SELECT COUNT(*) FROM study_folders WHERE source_import_id = 'import-undo' AND deleted_at IS NULL",
    ),
    0,
  );
  assert.equal(
    value(
      db,
      "SELECT COUNT(*) FROM study_imports WHERE id = 'import-undo' AND undone_at IS NOT NULL",
    ),
    1,
  );
});

function validParse(source) {
  const parsed = parseStudyBulkSource(source);
  assert.deepEqual(parsed.errors, []);
  return parsed;
}

function folder(id, parentId, name) {
  return { id, parent_id: parentId, name };
}

function topic(id, folderId, title) {
  return { id, folder_id: folderId, title, updated_at: NOW };
}

function createDatabase() {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec("CREATE TABLE users (id INTEGER PRIMARY KEY)");
  db.exec("INSERT INTO users (id) VALUES (1)");
  for (const migration of [
    "migrations/0115_create_study_topics.sql",
    "migrations/0116_add_study_folders.sql",
    "migrations/0117_add_study_bulk_imports.sql",
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

function planForDatabase(db, source, policy) {
  const folders = db
    .prepare(
      "SELECT id, parent_id, name FROM study_folders WHERE deleted_at IS NULL",
    )
    .all();
  const topics = db
    .prepare(
      "SELECT id, folder_id, title, updated_at FROM study_topics WHERE deleted_at IS NULL",
    )
    .all();
  const plan = buildStudyBulkPlan(validParse(source), folders, topics, policy);
  assert.deepEqual(plan.errors, []);
  return plan;
}

function importOperations(
  plan,
  importId,
  idempotencyKey,
  conflictPolicy = "skip",
) {
  return buildImportStatements({
    plan,
    importId,
    userId: 1,
    idempotencyKey,
    sourceHash: "hash",
    conflictPolicy,
    now: NOW,
  });
}

function applyAtomically(db, operations) {
  db.exec("BEGIN");
  try {
    for (const operation of operations)
      db.prepare(operation.sql).run(...operation.params);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function value(db, sql) {
  return db.prepare(sql).get()["COUNT(*)"];
}
