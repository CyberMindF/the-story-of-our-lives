import test from 'node:test';
import assert from 'node:assert/strict';
import { applyPipes, createPipes, pipesView, PIPES_META } from './_coop-pipes.mjs';
import { GameError } from './_errors.mjs';

const owner = (cell, size) => (Math.floor(cell / size) + cell % size) % 2;
const samePorts = (a, b) => [...a].sort().join(',') === [...b].sort().join(',');

function align(input, seats = [0, 1]) {
  let puzzle = input;
  for (let cell = 0; cell < puzzle.cells.length; cell++) {
    if (!seats.includes(owner(cell, puzzle.size))) continue;
    for (let turn = 0; turn < 4 && !samePorts(puzzle.cells[cell], puzzle.solution[cell]); turn++)
      puzzle = applyPipes(puzzle, { type: 'pipes-rotate', cell }, owner(cell, puzzle.size)).puzzle;
    assert.ok(samePorts(puzzle.cells[cell], puzzle.solution[cell]));
  }
  return puzzle;
}

function verify(input) {
  const first = applyPipes(input, { type: 'pipes-check' }, 0);
  assert.equal(first.solved, false);
  return applyPipes(first.puzzle, { type: 'pipes-check' }, 1);
}

for (const [difficulty, size] of [['easy', 3], ['normal', 4], ['hard', 5]]) {
  test(`pipes: 50 ${difficulty} boards solve, need both players, preserve input and hide secrets`, () => {
    const variants = new Set();
    for (let trial = 0; trial < 50; trial++) {
      const original = createPipes(difficulty), frozen = JSON.stringify(original);
      variants.add(JSON.stringify(original.cells));
      assert.equal(original.size, size);
      assert.equal(original.source, 0);
      assert.equal(original.sink, size * size - 1);
      assert.deepEqual(JSON.parse(frozen), original);
      for (const ports of original.cells) {
        assert.equal(ports.length, 2);
        assert.notEqual(ports[0], ports[1]);
        assert.ok(ports.every(port => Number.isInteger(port) && port >= 0 && port <= 3));
      }
      assert.equal(verify(original).solved, false);
      assert.equal(verify(align(original, [0])).solved, false);
      assert.equal(verify(align(original, [1])).solved, false);
      const solved = verify(align(original));
      assert.equal(solved.solved, true);
      assert.equal(solved.puzzle.solved, true);
      assert.deepEqual(solved.puzzle.confirmed, [true, true]);
      assert.equal(JSON.stringify(original), frozen);
      for (const seat of [0, 1]) {
        for (const puzzle of [original, solved.puzzle]) {
          const view = pipesView(puzzle, seat);
          assert.equal(view.solution, undefined);
          assert.equal(view.cells.length, size * size);
          assert.equal(view.hints.length, 3);
          for (const cell of view.cells) {
            assert.equal(cell.owned, owner(cell.index, size) === seat);
            if (cell.owned) {
              assert.deepEqual(cell.ports, puzzle.cells[cell.index]);
              assert.equal(typeof cell.lit, 'boolean');
            } else {
              assert.equal(cell.ports, null);
              assert.equal(cell.lit, null);
            }
          }
        }
      }
    }
    assert.ok(variants.size > 40, 'The generator should not repeat one fixed layout.');
  });
}

test('pipes: checkerboard ownership, payload and seat checks reject forged actions', () => {
  const p = createPipes('normal');
  const before = JSON.stringify(p);
  for (const seat of [-1, 2, null, '0', undefined]) {
    assert.throws(() => pipesView(p, seat), GameError);
    assert.throws(() => applyPipes(p, { type: 'pipes-check' }, seat), GameError);
  }
  for (const cell of [-1, 16, 0.1, '0', null, undefined])
    assert.throws(() => applyPipes(p, { type: 'pipes-rotate', cell }, 0), GameError);
  for (const action of [null, [], {}, { type: 'cheat' }])
    assert.throws(() => applyPipes(p, action, 0), GameError);
  for (let cell = 0; cell < p.cells.length; cell++) {
    assert.throws(() => applyPipes(p, { type: 'pipes-rotate', cell }, 1 - owner(cell, p.size)), GameError);
    const rotated = applyPipes(p, { type: 'pipes-rotate', cell, solved: true, ports: [1, 3] }, owner(cell, p.size));
    assert.deepEqual(rotated.puzzle.cells[cell], p.cells[cell].map(port => (port + 1) % 4).sort());
    assert.equal(rotated.solved, false);
  }
  assert.equal(JSON.stringify(p), before);
  for (const difficulty of ['', 'extreme', '__proto__', null]) assert.throws(() => createPipes(difficulty), GameError);
});

test('pipes: confirmation requires two different seats and any change clears both', () => {
  let p = align(createPipes('easy'));
  p = applyPipes(p, { type: 'pipes-check' }, 0).puzzle;
  assert.deepEqual(p.confirmed, [true, false]);
  const twice = applyPipes(p, { type: 'pipes-check' }, 0);
  assert.equal(twice.solved, false);
  assert.deepEqual(twice.puzzle.confirmed, [true, false]);
  const changed = applyPipes(p, { type: 'pipes-rotate', cell: 0 }, 0);
  assert.deepEqual(changed.puzzle.confirmed, [false, false]);
  assert.deepEqual(p.confirmed, [true, false]);
  const broken = verify(changed.puzzle);
  assert.equal(broken.solved, false);
  assert.equal(typeof broken.error, 'string');
  assert.deepEqual(broken.puzzle.confirmed, [false, false]);
  const done = verify(align(createPipes('hard'))).puzzle;
  for (const type of ['pipes-check', 'pipes-rotate'])
    assert.throws(() => applyPipes(done, { type, cell: 0 }, 0), GameError);
});

test('pipes: views are detached and do not expose solution via extra private fields', () => {
  const p = createPipes('easy');
  p.privateSecret = 'never-send';
  const before = JSON.stringify(p), view = pipesView(p, 0);
  view.cells[0].ports[0] = 99;
  view.confirmed[0] = true;
  assert.equal(view.privateSecret, undefined);
  assert.equal(JSON.stringify(p), before);
  assert.equal(PIPES_META.id, 'pipes');
});

test('pipes: accepts a valid path different from the stored oracle, ignores disconnected pipes', () => {
  const p = createPipes('easy');
  // Valid route 0 → 1 → 2 → 5 → 8; other cells are irrelevant distractors.
  p.cells = [[1, 3], [1, 3], [2, 3], [0, 3], [0, 3], [0, 2], [2, 3], [2, 3], [0, 1]];
  p.solution = Array.from({ length: 9 }, () => [0, 2]);
  assert.equal(verify(p).solved, true);
  const lit = pipesView(p, 0).cells.filter(cell => cell.lit).map(cell => cell.index);
  assert.deepEqual(lit, [0, 2, 8]);
  // A boundary escape at the top-right is not a successful connection.
  p.cells[2] = [0, 3];
  assert.equal(verify(p).solved, false);
  // Nor is a neighboring tile with no matching return opening.
  p.cells[2] = [2, 3];
  p.cells[5] = [1, 2];
  assert.equal(verify(p).solved, false);
});
