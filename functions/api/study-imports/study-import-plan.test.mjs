import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { buildImportStatements, buildStudyBulkPlan } from "./_plan.mjs";
import {
  LEGACY_IMPORT_DETAILS_SQL,
  normalizeStoredImportDetails,
} from "./_history.mjs";
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

test("aggiunge 10 flashcard alle 23 esistenti senza duplicare il gruppo", () => {
  const db = createDatabase();
  db.prepare(
    "INSERT INTO study_folders (id, user_id, name, created_at, updated_at) VALUES (1, 1, 'Chimica', ?, ?)",
  ).run(NOW, NOW);
  db.prepare(
    "INSERT INTO study_topics (id, user_id, folder_id, title, created_at, updated_at) VALUES (1, 1, 1, 'Atomo', ?, ?)",
  ).run(NOW, NOW);
  for (let position = 0; position < 23; position++) {
    db.prepare(
      "INSERT INTO study_cards (topic_id, question, answer, position, created_at) VALUES (1, ?, ?, ?, ?)",
    ).run(`Domanda ${position}`, `Risposta ${position}`, position, NOW);
  }

  const plan = planForDatabase(
    db,
    "# Chimica\n## ATOMO\n" + Array.from(
      { length: 10 }, (_, index) => `Nuova domanda ${index}\nNuova risposta ${index}`,
    ).join("\n"),
  );
  applyAtomically(
    db,
    importOperations(plan, "import-duplicate", "key-duplicate"),
  );

  assert.equal(
    value(db, "SELECT COUNT(*) FROM study_topics WHERE title = 'Atomo'"),
    1,
  );
  assert.equal(value(db, "SELECT COUNT(*) FROM study_cards WHERE topic_id = 1"), 33);
  const cards = db.prepare("SELECT * FROM study_cards ORDER BY position").all();
  assert.equal(cards[22].question, "Domanda 22");
  assert.equal(cards[22].source_import_id, null);
  assert.equal(cards[23].question, "Nuova domanda 0");
  assert.equal(cards[32].position, 32);
  assert.equal(cards[32].source_import_id, "import-duplicate");
  assert.equal(plan.preview[0].topics[0].append, true);
});

test("unisce sezioni omonime nello stesso import mantenendo l'ordine", () => {
  const db = createDatabase();
  const plan = planForDatabase(db,
    "# Chimica\n## Atomo\nD1\nR1\n# chimica\n## atomo\nD2\nR2",
  );
  applyAtomically(db, importOperations(plan, "merge-sections", "merge-sections-key"));
  assert.equal(value(db, "SELECT COUNT(*) FROM study_topics"), 1);
  assert.deepEqual(db.prepare("SELECT question, position FROM study_cards ORDER BY position").all()
    .map((row) => [row.question, row.position]), [["D1", 0], ["D2", 1]]);
});

test("non unisce gruppi omonimi in cartelle diverse e ignora i gruppi eliminati", () => {
  const db = createDatabase();
  applyAtomically(db, importOperations(planForDatabase(db,
    "# Chimica\n## Ripasso\nD1\nR1\n# Biologia\n## Ripasso\nD2\nR2",
  ), "different-folders", "different-folders-key"));
  assert.equal(value(db, "SELECT COUNT(*) FROM study_topics"), 2);
  db.prepare("UPDATE study_topics SET deleted_at = ? WHERE id = 1").run(NOW);
  const plan = planForDatabase(db, "# Chimica\n## Ripasso\nD3\nR3");
  assert.equal(plan.preview[0].topics[0].append, false);
  applyAtomically(db, importOperations(plan, "deleted-topic", "deleted-topic-key"));
  assert.equal(value(db, "SELECT COUNT(*) FROM study_topics"), 3);
});

test("tra duplicati storici riutilizza solo il primo gruppo", () => {
  const db = createDatabase();
  applyAtomically(db, importOperations(planForDatabase(db,
    "# Chimica\n## Atomo\nD1\nR1",
  ), "original", "original-key"));
  db.prepare(`INSERT INTO study_topics
    (user_id, folder_id, title, created_at, updated_at)
    VALUES (1, 1, 'Atomo', ?, ?)`).run(NOW, NOW);
  applyAtomically(db, importOperations(planForDatabase(db,
    "# Chimica\n## Atomo\nD2\nR2",
  ), "append", "append-key"));
  assert.equal(value(db, "SELECT COUNT(*) FROM study_topics"), 2);
  assert.equal(value(db, "SELECT COUNT(*) FROM study_cards WHERE topic_id = 1"), 2);
  assert.equal(value(db, "SELECT COUNT(*) FROM study_cards WHERE topic_id = 2"), 0);
});

test("calcola la posizione in coda al momento della scrittura anche con piani precedenti", () => {
  const db = createDatabase();
  applyAtomically(db, importOperations(planForDatabase(db,
    "# Chimica\n## Atomo\nD0\nR0",
  ), "initial", "initial-key"));
  const first = planForDatabase(db, "# Chimica\n## Atomo\nD1\nR1\nD2\nR2");
  const second = planForDatabase(db, "# Chimica\n## Atomo\nD3\nR3\nD4\nR4");
  applyAtomically(db, importOperations(first, "first-append", "first-append-key"));
  applyAtomically(db, importOperations(second, "second-append", "second-append-key"));
  assert.deepEqual(db.prepare("SELECT question, position FROM study_cards ORDER BY position").all()
    .map((row) => [row.question, row.position]),
    [["D0", 0], ["D1", 1], ["D2", 2], ["D3", 3], ["D4", 4]]);
});

test("un errore dopo l'aggiunta ripristina le carte preesistenti", () => {
  const db = createDatabase();
  applyAtomically(db, importOperations(planForDatabase(db,
    "# Chimica\n## Atomo\nD0\nR0",
  ), "initial", "initial-key"));
  const operations = importOperations(planForDatabase(db,
    "# Chimica\n## Atomo\nD1\nR1",
  ), "failed", "failed-key");
  operations.push({ sql: "INSERT INTO tabella_inesistente VALUES (1)", params: [] });
  assert.throws(() => applyAtomically(db, operations));
  assert.equal(value(db, "SELECT COUNT(*) FROM study_topics"), 1);
  assert.equal(value(db, "SELECT COUNT(*) FROM study_cards"), 1);
  assert.equal(value(db, "SELECT COUNT(*) FROM study_imports"), 1);
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

test("importa quiz, domande e opzioni nello stesso batch", () => {
  const db = createDatabase();
  const plan = planForDatabase(
    db,
    `# Biologia
## Quiz: Cellula
Correzione: immediata
### Singola
Domanda: Dove si trova il DNA?
Livello: 4
- [x] Nucleo
- [ ] Membrana
### Aperta
Domanda: Descrivi il nucleo.
Risposta: Contiene il DNA.`,
  );
  applyAtomically(db, importOperations(plan, "import-quiz", "key-quiz"));
  assert.equal(value(db, "SELECT COUNT(*) FROM study_quizzes"), 1);
  assert.equal(value(db, "SELECT COUNT(*) FROM study_quiz_questions"), 2);
  assert.equal(value(db, "SELECT COUNT(*) FROM study_quiz_options"), 2);
  assert.equal(
    db
      .prepare(
        "SELECT difficulty_level FROM study_quiz_questions WHERE position = 0",
      )
      .get().difficulty_level,
    4,
  );
  assert.equal(
    db
      .prepare(
        "SELECT difficulty_level FROM study_quiz_questions WHERE position = 1",
      )
      .get().difficulty_level,
    null,
  );
  assert.equal(
    db.prepare("SELECT correction_mode FROM study_quizzes").get()
      .correction_mode,
    "immediate",
  );
});

test("salva il percorso e il contenuto nel riepilogo dei nuovi import", () => {
  const plan = buildStudyBulkPlan(
    validParse("# Biologia > Unità 1\n## Ripasso\nD\nR"),
    [],
  );
  const operation = importOperations(plan, "import-summary", "key-summary")[0];
  const summary = JSON.parse(operation.params[4]);

  assert.deepEqual(normalizeStoredImportDetails(summary.details), [
    {
      path: "Biologia › Unità 1",
      kind: "flashcard",
      title: "Ripasso",
      itemCount: 1,
    },
  ]);
});

test("ricostruisce il percorso per le importazioni già esistenti", () => {
  const db = createDatabase();
  const plan = planForDatabase(db, "# Biologia > Unità 1\n## Ripasso\nD\nR");
  applyAtomically(db, importOperations(plan, "import-legacy", "key-legacy"));
  applyAtomically(db, importOperations(
    planForDatabase(db, "# Biologia > Unità 1\n## Ripasso\nNuova\nRisposta"),
    "import-later", "key-later",
  ));

  const details = db
    .prepare(LEGACY_IMPORT_DETAILS_SQL)
    .all(JSON.stringify(["import-legacy"]))
    .map((row) => ({ ...row }));

  assert.deepEqual(details, [
    {
      source_import_id: "import-legacy",
      kind: "flashcard",
      title: "Ripasso",
      item_count: 1,
      path: "Biologia › Unità 1",
    },
  ]);
});

test("la migrazione assegna la provenienza alle carte già importate", () => {
  const db = createDatabase();
  db.exec("DROP INDEX idx_study_cards_import; ALTER TABLE study_cards DROP COLUMN source_import_id");
  db.prepare(`INSERT INTO study_topics
    (id, user_id, title, created_at, updated_at, source_import_id)
    VALUES (1, 1, 'Importato', ?, ?, 'legacy'), (2, 1, 'Manuale', ?, ?, NULL)`
  ).run(NOW, NOW, NOW, NOW);
  db.prepare(`INSERT INTO study_cards (topic_id, question, answer, position, created_at)
    VALUES (1, 'D1', 'R1', 0, ?), (2, 'D2', 'R2', 0, ?)`
  ).run(NOW, NOW);
  db.exec(fs.readFileSync(new URL(
    "../../../migrations/0142_add_study_card_import_source.sql", import.meta.url,
  ), "utf8"));
  assert.deepEqual(db.prepare("SELECT source_import_id FROM study_cards ORDER BY id").all()
    .map((row) => row.source_import_id), ["legacy", null]);
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
    "migrations/0118_add_study_quizzes.sql",
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

function planForDatabase(db, source) {
  const folders = db
    .prepare(
      "SELECT id, parent_id, name FROM study_folders WHERE deleted_at IS NULL",
    )
    .all();
  const topics = db.prepare(
    "SELECT id, folder_id, title FROM study_topics WHERE deleted_at IS NULL ORDER BY id",
  ).all();
  return buildStudyBulkPlan(validParse(source), folders, topics);
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
