import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { buildImportStatements, buildStudyBulkPlan } from "./_plan.mjs";
import { parseStudyBulkSource } from "./_shared.mjs";

const NOW = "2026-09-15T12:00:00.000Z";

test("riutilizza le cartelle esistenti nello stesso ramo", () => {
  const plan = buildStudyBulkPlan(
    validParse("# Chimica > Unità 1\n## Atomo\nD\nR"),
    [folder(1, null, "Chimica"), folder(2, 1, "Unità 1")],
  );

  assert.equal(plan.foldersToCreate.length, 0);
  assert.equal(plan.topics[0].folderRef.id, 2);
});

test("distingue cartelle omonime in rami differenti", () => {
  const plan = buildStudyBulkPlan(
    validParse(
      "# Chimica > Unità 1\n## Atomo\nD\nR\n# Biologia > Unità 1\n## Cellula\nD2\nR2",
    ),
    [
      folder(1, null, "Chimica"),
      folder(2, null, "Biologia"),
      folder(3, 1, "Unità 1"),
      folder(4, 2, "Unità 1"),
    ],
  );

  assert.equal(plan.topics[0].folderRef.id, 3);
  assert.equal(plan.topics[1].folderRef.id, 4);
});

test("crea un nuovo argomento anche quando esiste già lo stesso nome", () => {
  const db = createDatabase();
  db.prepare(
    "INSERT INTO study_folders (id, user_id, name, created_at, updated_at) VALUES (1, 1, 'Chimica', ?, ?)",
  ).run(NOW, NOW);
  db.prepare(
    "INSERT INTO study_topics (id, user_id, folder_id, title, created_at, updated_at) VALUES (1, 1, 1, 'Atomo', ?, ?)",
  ).run(NOW, NOW);

  const plan = planForDatabase(
    db,
    "# Chimica\n## Atomo\nNuova domanda\nNuova risposta",
  );
  applyAtomically(
    db,
    importOperations(plan, "import-duplicate", "key-duplicate"),
  );

  assert.equal(
    value(db, "SELECT COUNT(*) FROM study_topics WHERE title = 'Atomo'"),
    2,
  );
});

test("annulla ogni scrittura se una operazione del batch fallisce", () => {
  const db = createDatabase();
  const plan = planForDatabase(db, "# Chimica > Parte A\n## Atomo\nD\nR");
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
  const plan = planForDatabase(db, "# Chimica\n## Atomo\nD\nR");
  const operations = importOperations(plan, "import-once", "same-key");

  applyAtomically(db, operations);
  assert.throws(() => applyAtomically(db, operations), /UNIQUE/);
  assert.equal(value(db, "SELECT COUNT(*) FROM study_imports"), 1);
  assert.equal(value(db, "SELECT COUNT(*) FROM study_folders"), 1);
  assert.equal(value(db, "SELECT COUNT(*) FROM study_topics"), 1);
  assert.equal(value(db, "SELECT COUNT(*) FROM study_cards"), 1);
});

function validParse(source) {
  const parsed = parseStudyBulkSource(source);
  assert.deepEqual(parsed.errors, []);
  return parsed;
}

function folder(id, parentId, name) {
  return { id, parent_id: parentId, name };
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

function planForDatabase(db, source) {
  const folders = db
    .prepare(
      "SELECT id, parent_id, name FROM study_folders WHERE deleted_at IS NULL",
    )
    .all();
  return buildStudyBulkPlan(validParse(source), folders);
}

function importOperations(plan, importId, idempotencyKey) {
  return buildImportStatements({
    plan,
    importId,
    userId: 1,
    idempotencyKey,
    sourceHash: "hash",
    now: NOW,
  });
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
