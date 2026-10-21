import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { GameError } from './_errors.mjs';
import { PUZZLE_CATALOG, createPuzzle, puzzleView, applyPuzzle, binaryRank, permutations,
  matchesOrder, matchesDossier, mosaicSolutions, weightPairs } from './_coop-puzzles.mjs';

const difficulties = ['easy', 'normal', 'hard'];
const samplesPerDifficulty = 30; // 90 fresh random puzzles per family, 540 in total.
const copy = value => structuredClone(value);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function step(p, action, seat) {
  const before = copy(p), result = applyPuzzle(p, action, seat);
  assert.deepEqual(p, before, 'an action must not mutate its input');
  assert.equal(result.solved, result.puzzle.solved);
  return result;
}
function expectError(fn, status = 400) {
  assert.throws(fn, error => error instanceof GameError && error.status === status);
}
function path(p, start, goal) {
  const queue = [[start]], visited = new Set([start]);
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const route = queue[cursor], current = route.at(-1);
    if (current === goal) return route.slice(1);
    for (const [a, b] of p.edges) {
      const next = a === current ? b : b === current ? a : null;
      if (next !== null && !visited.has(next)) { visited.add(next); queue.push([...route, next]); }
    }
  }
  return null;
}
function expectedLights(p, active) {
  return p.matrix.map((row, i) => row.reduce((value, wired, j) => wired && active[j] ? !value : value, p.base[i]));
}
function owner(p, cell) { return (Math.floor(cell / p.size) + cell % p.size) % 2; }
function confirm(p, type) {
  const first = step(p, { type }, 0);
  assert.equal(first.solved, false, 'one confirmation must not solve the puzzle');
  return step(first.puzzle, { type }, 1);
}

test('catalog and generation reject unknown kinds, difficulties and seats', () => {
  assert.equal(PUZZLE_CATALOG.length, 6);
  assert.equal(new Set(PUZZLE_CATALOG.map(entry => entry.id)).size, 6);
  expectError(() => createPuzzle('missing'), 404);
  expectError(() => createPuzzle('maze', 'impossible'));
  for (const { id } of PUZZLE_CATALOG) {
    const p = createPuzzle(id);
    for (const seat of [-1, 2, '0', null, undefined]) {
      expectError(() => puzzleView(p, seat), 403);
      expectError(() => applyPuzzle(p, { type: 'invalid' }, seat), 403);
    }
    for (const action of [null, undefined, [], '', {}, { type: 42 }, { type: 'invalid' }]) {
      expectError(() => applyPuzzle(p, action, 0));
    }
    expectError(() => applyPuzzle({ ...p, solved: true }, { type: 'invalid' }, 0), 409);
    assert.doesNotThrow(() => JSON.parse(JSON.stringify(p)));
  }
});

for (const difficulty of difficulties) {
  test(`maze ${difficulty}: 30 spanning trees, split information and complete playable routes`, () => {
    for (let sample = 0; sample < samplesPerDifficulty; sample++) {
      let p = createPuzzle('maze', difficulty);
      const size = { easy: 4, normal: 5, hard: 6 }[difficulty];
      assert.equal(p.size, size);
      assert.equal(p.edges.length, size * size - 1);
      assert.equal(new Set(p.keys).size, difficulty === 'easy' ? 1 : 2);
      assert.ok(p.keys.every(cell => cell > 0 && cell < p.goal));
      for (let cell = 0; cell < size * size; cell++) assert.ok(path(p, 0, cell));
      const a = puzzleView(p, 0), b = puzzleView(p, 1);
      assert.equal(a.edges.length + b.edges.length, p.edges.length);
      assert.ok(a.edges.every(([from, to]) => Math.floor(from / size) === Math.floor(to / size)));
      assert.ok(b.edges.every(([from, to]) => Math.abs(from - to) === size));
      const wall = [1, size].find(cell => !p.edges.some(edge => edge.includes(0) && edge.includes(cell)));
      assert.notEqual(wall, undefined);
      const blocked = step(p, { type: 'maze-move', cell: wall }, 0);
      assert.ok(blocked.error);
      assert.deepEqual(blocked.puzzle, p);
      expectError(() => applyPuzzle(p, { type: 'maze-move', cell: wall }, 1), 403);
      // The exit is not enough: visit it before any key, without falsely solving.
      const earlyExit = path(p, p.position, p.goal);
      let early = p;
      for (const cell of earlyExit) early = step(early, { type: 'maze-move', cell }, early.turn).puzzle;
      if (early.collected.length < early.keys.length) assert.equal(early.solved, false);
      for (const goal of [...p.keys, p.goal]) {
        if (p.solved || (goal !== p.goal && p.collected.includes(goal))) continue;
        const route = path(p, p.position, goal);
        for (const cell of route) {
          if (p.solved) break;
          const turn = p.turn;
          const result = step(p, { type: 'maze-move', cell }, turn);
          assert.equal(result.error, undefined); p = result.puzzle;
          assert.equal(p.turn, 1 - turn);
        }
      }
      assert.equal(p.solved, true);
      assert.equal(p.position, p.goal);
      assert.equal(p.collected.length, p.keys.length);
    }
  });

  test(`circuit ${difficulty}: 30 unique systems require switches from both players`, () => {
    for (let sample = 0; sample < samplesPerDifficulty; sample++) {
      let p = createPuzzle('circuit', difficulty);
      assert.equal(p.size, { easy: 4, normal: 6, hard: 8 }[difficulty]);
      assert.equal(binaryRank(p.matrix), p.size);
      for (const seat of [0, 1]) {
        assert.ok(p.solution.some((on, index) => on && index % 2 === seat));
        const view = puzzleView(p, seat);
        assert.equal(view.switches.length, p.size / 2);
        assert.ok(view.switches.every(entry => entry.index % 2 === seat));
        assert.ok(view.lights.every(entry => entry.index % 2 === seat));
        for (const entry of view.switches) assert.deepEqual(entry.lights, p.matrix.flatMap((row, i) => row[entry.index] ? [i] : []));
      }
      let solutions = 0;
      for (let mask = 0; mask < 2 ** p.size; mask++) {
        const active = Array.from({ length: p.size }, (_, i) => Boolean(mask & (1 << i)));
        if (same(expectedLights(p, active), p.target)) { solutions++; assert.deepEqual(active, p.solution); }
      }
      assert.equal(solutions, 1);
      expectError(() => applyPuzzle(p, { type: 'circuit-toggle', index: 1 }, 0), 403);
      const twice = step(step(p, { type: 'circuit-toggle', index: 0 }, 0).puzzle, { type: 'circuit-toggle', index: 0 }, 0);
      assert.deepEqual(twice.puzzle, p);
      for (let i = 0; i < p.size; i++) if (p.solution[i]) p = step(p, { type: 'circuit-toggle', index: i }, i % 2).puzzle;
      assert.equal(p.solved, true);
    }
  });

  test(`order ${difficulty}: 30 unique combined answers, ambiguous single-player clues`, () => {
    for (let sample = 0; sample < samplesPerDifficulty; sample++) {
      let p = createPuzzle('order', difficulty);
      const kinds = new Set(p.rules.flat().map(rule => rule.kind));
      if (difficulty !== 'hard') assert.ok([...kinds].every(kind => ['before', 'next'].includes(kind)));
      else if (![...kinds].every(kind => ['before', 'next'].includes(kind))) {
        assert.ok(kinds.size >= 3);
        assert.ok(p.rules.flat().length >= 4 && p.rules.flat().length <= 9);
      }
      const possibilities = permutations(p.items.map(item => item.id));
      for (const seat of [0, 1]) assert.ok(possibilities.filter(order => matchesOrder(order, p.rules[seat])).length > 1);
      const solutions = possibilities.filter(order => matchesOrder(order, p.rules.flat()));
      assert.deepEqual(solutions, [p.solution]);
      assert.notDeepEqual(p.order, p.solution);
      const incorrect = confirm(p, 'order-check');
      assert.ok(incorrect.error);
      assert.deepEqual(incorrect.puzzle.confirmed, [false, false]);
      p = step(p, { type: 'order-check' }, 0).puzzle;
      p = step(p, { type: 'order-move', from: 0, to: 1 }, 1).puzzle;
      assert.deepEqual(p.confirmed, [false, false]);
      for (let i = 0; i < p.solution.length; i++) {
        p = step(p, { type: 'order-move', from: p.order.indexOf(p.solution[i]), to: i }, i % 2).puzzle;
      }
      assert.equal(p.solved, false);
      const complete = confirm(p, 'order-check');
      assert.equal(complete.solved, true);
      assert.equal(complete.error, undefined);
    }
  });

  test(`dossier ${difficulty}: 30 joint deductions and independent votes`, () => {
    for (let sample = 0; sample < samplesPerDifficulty; sample++) {
      const p = createPuzzle('dossier', difficulty);
      const partial = [0, 1].map(seat => p.suspects.filter(s => matchesDossier(s.attributes, p.rules[seat])));
      assert.ok(partial.every(candidates => candidates.length >= 2));
      const full = p.suspects.filter(s => p.rules.every(rule => matchesDossier(s.attributes, rule)));
      assert.equal(full.length, 1); assert.equal(full[0].id, p.solution);
      const wrong = p.suspects.find(s => s.id !== p.solution).id;
      const first = step(p, { type: 'dossier-vote', candidate: wrong }, 0);
      assert.equal(first.solved, false);
      const failed = step(first.puzzle, { type: 'dossier-vote', candidate: wrong }, 1);
      assert.ok(failed.error); assert.deepEqual(failed.puzzle.votes, [null, null]);
      const mismatch = step(first.puzzle, { type: 'dossier-vote', candidate: p.solution }, 1);
      assert.equal(mismatch.solved, false); assert.equal(mismatch.error, undefined);
      const complete = step(mismatch.puzzle, { type: 'dossier-vote', candidate: p.solution }, 0);
      assert.equal(complete.solved, true);
    }
  });

  test(`mosaic ${difficulty}: 30 uniquely solvable nonograms with split controls`, () => {
    for (let sample = 0; sample < samplesPerDifficulty; sample++) {
      let p = createPuzzle('mosaic', difficulty);
      assert.equal(p.size, { easy: 3, normal: 4, hard: 5 }[difficulty]);
      const solutions = mosaicSolutions(p.rowClues, p.columnClues);
      assert.deepEqual(solutions, [p.solution]);
      for (const seat of [0, 1]) {
        const view = puzzleView(p, seat);
        assert.ok(p.solution.some((on, cell) => on && owner(p, cell) === seat));
        assert.ok(view.ownedCells.every(cell => owner(p, cell) === seat));
        assert.equal(view[seat === 0 ? 'columnClues' : 'rowClues'], null);
        expectError(() => applyPuzzle(p, { type: 'mosaic-toggle', cell: view.ownedCells[0] }, 1 - seat), 403);
      }
      const incorrect = confirm(p, 'mosaic-check');
      assert.ok(incorrect.error); assert.deepEqual(incorrect.puzzle.confirmed, [false, false]);
      p = step(p, { type: 'mosaic-check' }, 0).puzzle;
      p = step(p, { type: 'mosaic-toggle', cell: 0 }, 0).puzzle;
      assert.deepEqual(p.confirmed, [false, false]);
      p = step(p, { type: 'mosaic-toggle', cell: 0 }, 0).puzzle;
      for (let cell = 0; cell < p.grid.length; cell++) if (p.solution[cell]) {
        p = step(p, { type: 'mosaic-toggle', cell }, owner(p, cell)).puzzle;
      }
      const complete = confirm(p, 'mosaic-check');
      assert.equal(complete.solved, true);
      assert.equal(complete.error, undefined);
    }
  });

  test(`balance ${difficulty}: 30 unique four-weight solutions with private hands`, () => {
    for (let sample = 0; sample < samplesPerDifficulty; sample++) {
      let p = createPuzzle('balance', difficulty);
      assert.ok(p.weights.every(hand => hand.length === (difficulty === 'easy' ? 4 : 5)));
      const pairs = p.weights.map(weightPairs), solutions = [];
      for (const a of pairs[0]) for (const b of pairs[1]) if (a.sum + b.sum === p.target) solutions.push([a.indices, b.indices]);
      assert.deepEqual(solutions, [p.solution]);
      expectError(() => applyPuzzle(p, { type: 'balance-check' }, 0));
      const alternate = [0, 1].map(seat => pairs[seat].find(pair => !same(pair.indices, p.solution[seat])).indices);
      for (const seat of [0, 1]) for (const index of alternate[seat]) p = step(p, { type: 'balance-toggle', index }, seat).puzzle;
      const incorrect = confirm(p, 'balance-check');
      assert.ok(incorrect.error); assert.deepEqual(incorrect.puzzle.confirmed, [false, false]);
      p = step(p, { type: 'balance-check' }, 0).puzzle;
      p = step(p, { type: 'balance-toggle', index: alternate[0][0] }, 0).puzzle;
      assert.deepEqual(p.confirmed, [false, false]);
      for (const seat of [0, 1]) {
        for (const index of [...p.selections[seat]]) p = step(p, { type: 'balance-toggle', index }, seat).puzzle;
        for (const index of p.solution[seat]) p = step(p, { type: 'balance-toggle', index }, seat).puzzle;
      }
      const complete = confirm(p, 'balance-check');
      assert.equal(complete.solved, true);
      assert.equal(complete.error, undefined);
    }
  });
}

test('strict numeric validation, malformed actions and ownership cannot be bypassed', () => {
  const actions = {
    maze: value => ({ type: 'maze-move', cell: value }),
    circuit: value => ({ type: 'circuit-toggle', index: value }),
    order: value => ({ type: 'order-move', from: value, to: 1 }),
    mosaic: value => ({ type: 'mosaic-toggle', cell: value }),
    balance: value => ({ type: 'balance-toggle', index: value })
  };
  for (const [type, makeAction] of Object.entries(actions)) {
    const p = createPuzzle(type);
    for (const value of [-1, 999, 1.5, '1', null, undefined, NaN, Infinity, true, {}, []]) {
      expectError(() => applyPuzzle(p, makeAction(value), 0));
    }
  }
  const order = createPuzzle('order');
  expectError(() => applyPuzzle(order, { type: 'order-move', from: 0, to: '1' }, 0));
  const dossier = createPuzzle('dossier');
  for (const candidate of [null, 0, {}, [], '__proto__', 'missing']) expectError(() => applyPuzzle(dossier, { type: 'dossier-vote', candidate }, 0));
  let balance = createPuzzle('balance');
  balance = applyPuzzle(balance, { type: 'balance-toggle', index: 0 }, 0).puzzle;
  balance = applyPuzzle(balance, { type: 'balance-toggle', index: 1 }, 0).puzzle;
  expectError(() => applyPuzzle(balance, { type: 'balance-toggle', index: 2 }, 0));
});

test('public DTO allowlists hide solutions and every other player’s private data', () => {
  const common = ['type', 'title', 'emoji', 'difficulty', 'solved', 'instructions', 'objective', 'hints'];
  const extra = {
    maze: ['size', 'position', 'goal', 'keys', 'collected', 'turn', 'myTurn', 'edges'],
    circuit: ['size', 'switches', 'lights'],
    order: ['items', 'order', 'clues', 'confirmed'],
    dossier: ['suspects', 'clues', 'votes'],
    mosaic: ['size', 'grid', 'ownedCells', 'rowClues', 'columnClues', 'confirmed'],
    balance: ['weights', 'target', 'selectedCounts', 'confirmed']
  };
  for (const { id } of PUZZLE_CATALOG) {
    const p = createPuzzle(id, 'hard'), before = copy(p);
    for (const seat of [0, 1]) {
      const view = puzzleView(p, seat);
      assert.deepEqual(Object.keys(view).sort(), [...common, ...extra[id]].sort());
      assert.equal(view.hints.length, 3);
      assert.equal(view.solution, undefined);
      assert.equal(view.rules, undefined);
      assert.equal(view.matrix, undefined);
      assert.equal(view.base, undefined);
      if (id === 'balance') assert.deepEqual(view.weights.map(w => w.value), p.weights[seat]);
      // DTOs must not provide mutable references back to the server state.
      for (const value of Object.values(view)) if (Array.isArray(value)) value.push('changed by client');
      assert.deepEqual(p, before);
    }
  }
});

test('fixed uniquely solved nonogram fixtures and rank helpers are independent of randomness', () => {
  assert.equal(binaryRank([[1, 0], [1, 1]]), 2);
  assert.equal(binaryRank([[1, 1], [1, 1]]), 1);
  assert.equal(mosaicSolutions([[1], [1]], [[1], [1]]).length, 2);
  assert.deepEqual(mosaicSolutions([[2], []], [[1], [1]]), [[true, true, false, false]]);
  assert.deepEqual(mosaicSolutions([[2], [2]], [[], []]), []);
  expectError(() => mosaicSolutions(Array(6).fill([]), Array(6).fill([])));
});

test('90 reproducible random seeds keep all puzzle families valid across three difficulties', () => {
  let state = 1;
  const easyMosaics = new Set();
  let easyMosaicFallbacks = 0;
  const hardOrderKinds = new Set();
  let hardOrderFallbacks = 0;
  const rng = mock.method(globalThis.crypto, 'getRandomValues', values => {
    for (let i = 0; i < values.length; i++) {
      state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
      values[i] = state >>> 0;
    }
    return values;
  });
  try {
    for (let seed = 1; seed <= 90; seed++) {
      state = seed;
      for (const { id } of PUZZLE_CATALOG) {
        const p = createPuzzle(id, difficulties[(seed - 1) % 3]);
        if (id === 'maze') for (const cell of [...p.keys, p.goal]) assert.ok(path(p, 0, cell), `maze seed ${seed}`);
        if (id === 'circuit') assert.equal(binaryRank(p.matrix), p.size, `circuit seed ${seed}`);
        if (id === 'order') {
          const candidates = permutations(p.items.map(item => item.id));
          assert.equal(candidates.filter(order => matchesOrder(order, p.rules.flat())).length, 1, `order seed ${seed}`);
          for (const rules of p.rules) assert.ok(candidates.filter(order => matchesOrder(order, rules)).length > 1);
          if (p.difficulty === 'hard') {
            const kinds = p.rules.flat().map(rule => rule.kind);
            for (const kind of kinds) hardOrderKinds.add(kind);
            if (kinds.every(kind => ['before', 'next'].includes(kind))) hardOrderFallbacks++;
          }
        }
        if (id === 'dossier') {
          assert.equal(p.suspects.filter(s => p.rules.every(rule => matchesDossier(s.attributes, rule))).length, 1, `dossier seed ${seed}`);
          for (const rule of p.rules) assert.ok(p.suspects.filter(s => matchesDossier(s.attributes, rule)).length > 1);
        }
        if (id === 'mosaic') {
          assert.equal(mosaicSolutions(p.rowClues, p.columnClues).length, 1, `mosaic seed ${seed}`);
          if (p.difficulty === 'easy') {
            easyMosaics.add(p.solution.join(''));
            // Generated grids forbid full lines; the triangular fallback has one.
            if (p.rowClues.some(row => row[0] === p.size) || p.columnClues.some(col => col[0] === p.size)) easyMosaicFallbacks++;
          }
        }
        if (id === 'balance') {
          const [a, b] = p.weights.map(weightPairs);
          assert.equal(a.flatMap(first => b.filter(second => first.sum + second.sum === p.target)).length, 1, `balance seed ${seed}`);
        }
      }
    }
    assert.ok(easyMosaics.size >= 12, '3x3 easy mosaics must retain varied solutions');
    assert.ok(easyMosaicFallbacks < 10, '3x3 constraints must not force generation into its fallback');
    for (const kind of ['distance', 'adjacent', 'notAdjacent', 'notAt', 'edge']) assert.ok(hardOrderKinds.has(kind), `hard order must use ${kind}`);
    assert.ok(hardOrderFallbacks < 3, 'hard order should normally generate varied constraints, not use its chain fallback');
  } finally { rng.mock.restore(); }
});

test('bounded generation fallbacks remain solvable with a pathological random stream', () => {
  const rng = mock.method(globalThis.crypto, 'getRandomValues', values => { values.fill(0); return values; });
  try {
    for (const difficulty of difficulties) {
      let circuit = createPuzzle('circuit', difficulty);
      assert.equal(binaryRank(circuit.matrix), circuit.size);
      for (let index = 0; index < circuit.size; index++) if (circuit.solution[index]) {
        circuit = applyPuzzle(circuit, { type: 'circuit-toggle', index }, index % 2).puzzle;
      }
      assert.equal(circuit.solved, true);
      const mosaic = createPuzzle('mosaic', difficulty);
      assert.deepEqual(mosaicSolutions(mosaic.rowClues, mosaic.columnClues), [mosaic.solution]);
    }
  } finally { rng.mock.restore(); }
});

test('hard-order rule meanings and human-readable clues match their solver semantics', () => {
  const order = ['a', 'b', 'c', 'd', 'e', 'f'];
  const rules = [
    { kind: 'notAt', a: 'a', position: 1 }, { kind: 'distance', a: 'a', b: 'd', distance: 3 },
    { kind: 'adjacent', a: 'c', b: 'b' }, { kind: 'notAdjacent', a: 'a', b: 'd' },
    { kind: 'edge', a: 'f' }, { kind: 'before', a: 'b', b: 'e' }
  ];
  assert.equal(matchesOrder(order, rules), true);
  for (const rule of [
    { kind: 'notAt', a: 'a', position: 0 }, { kind: 'distance', a: 'a', b: 'd', distance: 2 },
    { kind: 'adjacent', a: 'a', b: 'd' }, { kind: 'notAdjacent', a: 'a', b: 'b' },
    { kind: 'edge', a: 'b' }, { kind: 'unknown', a: 'a' }
  ]) assert.equal(matchesOrder(order, [rule]), false);
  const p = { ...createPuzzle('order', 'hard'), items: order.map(id => ({ id, emoji: '📦', name: id })), rules: [rules, []] };
  const view = puzzleView(p, 0);
  assert.match(view.clues[0], /posto 2/);
  assert.match(view.clues[1], /2 oggetti/);
  assert.match(view.clues[2], /uno accanto all’altro/);
  assert.match(view.clues[3], /non stanno/);
  assert.match(view.clues[4], /estremità/);
});

test('hard-order generator falls back to a valid split chain after bounded unsuccessful searches', () => {
  // Constant 6 repeatedly chooses a non-partitionable mixed-clue candidate.
  const rng = mock.method(globalThis.crypto, 'getRandomValues', values => { values.fill(6); return values; });
  try {
    const p = createPuzzle('order', 'hard');
    assert.ok(p.rules.flat().every(rule => ['before', 'next'].includes(rule.kind)));
    const candidates = permutations(p.items.map(item => item.id));
    assert.deepEqual(candidates.filter(order => matchesOrder(order, p.rules.flat())), [p.solution]);
    for (const side of p.rules) assert.ok(candidates.filter(order => matchesOrder(order, side)).length > 1);
  } finally { rng.mock.restore(); }
});
