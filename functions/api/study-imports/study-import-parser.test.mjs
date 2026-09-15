import test from "node:test";
import assert from "node:assert/strict";
import { parseStudyBulkSource } from "./_shared.mjs";

test("parsa un percorso con un solo livello", () => {
  const result = parseStudyBulkSource("# Chimica\n## Atomo\nDomanda\nRisposta");
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.paths[0].segments, ["Chimica"]);
  assert.equal(result.totalCards, 1);
});

test("parsa un percorso con molti livelli senza un limite applicativo", () => {
  const segments = Array.from(
    { length: 40 },
    (_, index) => `Livello ${index + 1}`,
  );
  const result = parseStudyBulkSource(
    `# ${segments.join(" > ")}\n## Tema\nD\nR`,
  );
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.paths[0].segments, segments);
});

test("conserva più percorsi e più argomenti nello stesso file", () => {
  const result = parseStudyBulkSource(
    `# Chimica > Unità 1\n## Atomo\nD1\nR1\n## Legami\nD2\nR2\n# Biologia\n## Cellula\nD3\nR3`,
  );
  assert.deepEqual(result.errors, []);
  assert.equal(result.paths.length, 2);
  assert.equal(result.totalTopics, 3);
  assert.equal(result.totalCards, 3);
});

test("ignora le righe vuote tra domande e risposte", () => {
  const result = parseStudyBulkSource(
    "# Chimica\n\n## Atomo\n\nD1\n\nR1\n\nD2\nR2\n",
  );
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.paths[0].topics[0].cards, [
    { question: "D1", answer: "R1" },
    { question: "D2", answer: "R2" },
  ]);
});

test("segnala la riga di una domanda senza risposta", () => {
  const result = parseStudyBulkSource(
    "# Chimica\n## Atomo\nDomanda senza risposta",
  );
  assert.equal(result.errors[0].line, 3);
  assert.match(result.errors[0].message, /Manca la risposta/);
});

test("rifiuta un segmento di percorso vuoto", () => {
  const result = parseStudyBulkSource("# Chimica > > Parte A\n## Atomo\nD\nR");
  assert.equal(result.errors[0].line, 1);
  assert.match(result.errors[0].message, /segmento/);
});

test("rifiuta un argomento dichiarato prima del percorso", () => {
  const result = parseStudyBulkSource(
    "## Atomo\nD\nR\n# Chimica\n## Legami\nD2\nR2",
  );
  assert.equal(result.errors[0].line, 1);
  assert.match(result.errors[0].message, /prima dell'argomento/);
});

test("rifiuta un titolo vuoto ma consente argomenti con lo stesso nome", () => {
  const result = parseStudyBulkSource(
    "# Chimica\n##\n## Atomo\nD\nR\n# Chimica\n## Atomo\nD2\nR2",
  );
  assert.ok(result.errors.some((error) => /titolo.*vuoto/.test(error.message)));
  assert.equal(result.totalTopics, 2);
});
