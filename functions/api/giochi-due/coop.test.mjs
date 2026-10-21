import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, applyAction, publicState, GameError } from './_engine.mjs';
import { COOP_CATALOG } from './_coop.mjs';

const a = { id: 1, nickname: 'Rory' }, b = { id: 2, nickname: 'Desy' }, stranger = { id: 3, nickname: 'Other' };
const create = (options = {}) => applyAction('frequenze', initialState('frequenze'), { type: 'create', ...options }, a, 1000);
const act = (state, type, user = a, extra = {}, now = 2000) => applyAction('frequenze', state,
  { type, id: state.room.id, puzzleId: state.room.puzzle?.id, ...extra }, user, now);
const joined = () => act(create({ mode: 'code' }), 'join', b);
const view = (state, user = a) => publicState('frequenze', state, user.id);
const fails = (fn, status) => assert.throws(fn, error => error instanceof GameError && (!status || error.status === status));
function solveCode(state, now = 3000) {
  const explorer = state.room.round % 2 ? b : a, guide = explorer === a ? b : a;
  state = act(state, 'code-ready', guide, {}, now);
  const p = state.room.puzzle;
  return act(state, 'code-answer', explorer, { code: p.sequence.map(i => p.mapping[i]).join('') }, now + 100);
}

test('coop: scelta e difficoltà validate, mix vario e catalogo senza duplicati', () => {
  assert.equal(new Set(COOP_CATALOG.map(p => p.id)).size, COOP_CATALOG.length);
  assert.equal(COOP_CATALOG.length, 8);
  for (const mode of COOP_CATALOG.map(p => p.id)) {
    const state = create({ mode });
    assert.deepEqual(state.room.playlist, [mode]);
    assert.equal(state.room.status, 'waiting');
  }
  for (const length of [3, 5, 8]) for (let sample = 0; sample < 20; sample++) {
    const state = create({ length });
    assert.equal(state.room.playlist.length, length);
    assert.equal(new Set(state.room.playlist).size, length);
    assert.equal(state.room.playlist.includes('code'), length === 8);
    assert.equal(state.room.difficulty, 'normal');
  }
  for (const difficulty of ['easy', 'normal', 'hard']) assert.equal(create({ difficulty }).room.difficulty, difficulty);
  for (const options of [{ mode: 'invalid' }, { mode: {} }, { difficulty: 'expert' }, { difficulty: 1 },
    { length: 0 }, { length: 4 }, { length: '3' }, { length: 1000 }]) fails(() => create(options));
  const state = create();
  fails(() => act(state, 'create', a), 400);
});

test('coop: ingresso e attesa non espongono prove o soluzioni, proiezione privata per ruolo', () => {
  let state = create({ mode: 'code' });
  assert.equal(view(state).room.puzzle, null);
  assert.equal(view(state, b).room.puzzle, null);
  assert.equal(view(state).room.playlist, undefined);
  fails(() => act(state, 'join', a), 409);
  fails(() => act(state, 'hint', a), 409);
  state = act(state, 'join', b);
  fails(() => act(state, 'join', b), 409);
  fails(() => act(state, 'join', stranger), 409);
  fails(() => act(state, 'hint', stranger), 403);
  const av = view(state).room, bv = view(state, b).room;
  assert.equal(av.seat, 0); assert.equal(bv.seat, 1);
  assert.equal(av.puzzle.sequence.length, 4); assert.deepEqual(av.puzzle.legend, []);
  assert.deepEqual(bv.puzzle.sequence, []); assert.equal(bv.puzzle.legend.length, 8);
  assert.equal(av.puzzle.mapping, undefined); assert.equal(bv.puzzle.mapping, undefined);
  assert.deepEqual(av.puzzle.hints, []); assert.deepEqual(bv.puzzle.hints, []);
  assert.equal(view(state, stranger).room.puzzle, null);
  assert.equal(view(state, stranger).room.seat, -1);
  assert.equal(av.playlist, undefined); assert.equal(av.rounds, undefined);
});

test('coop: richieste obsolete, ruoli e sintassi codice non modificano lo stato', () => {
  let state = joined();
  const before = structuredClone(state);
  fails(() => act(state, 'hint', a, { id: 'old-room' }), 409);
  fails(() => act(state, 'hint', a, { puzzleId: 'old-puzzle' }), 409);
  fails(() => act(state, 'code-ready', a), 403);
  fails(() => act(state, 'code-answer', a, { code: '1234' }));
  assert.deepEqual(state, before);
  state = act(state, 'code-ready', b);
  fails(() => act(state, 'code-answer', b, { code: '1234' }), 403);
  for (const code of ['123', '12345', '1239', '12 4', 1234, null]) fails(() => act(state, 'code-answer', a, { code }));
  state = act(state, 'code-answer', a, { code: '1111', solved: true });
  assert.equal(state.room.status, 'playing'); assert.equal(state.room.errors, 1);
  assert.equal(state.room.roundErrors, 1); assert.ok(state.room.message);
  state = solveCode(state);
  assert.equal(state.room.status, 'won'); assert.equal(state.room.results[0].errors, 1);
  fails(() => act(state, 'code-answer', a, { code: '1111' }), 409);
});

test('coop: suggerimenti graduali condivisi e nuovo schema richiede entrambi senza cancellare le penalità', () => {
  let state = joined();
  for (let i = 1; i <= 3; i++) {
    state = act(state, 'hint', i % 2 ? a : b);
    assert.equal(view(state).room.puzzle.hints.length, i);
    assert.equal(view(state, b).room.puzzle.hints.length, i);
  }
  fails(() => act(state, 'hint'));
  state = act(state, 'code-ready', b);
  state = act(state, 'code-answer', a, { code: '1111' });
  const old = state.room.puzzle.id, moves = state.room.roundMoves;
  state = act(state, 'restart-puzzle');
  assert.equal(state.room.puzzle.id, old); assert.deepEqual(state.room.restartReady, [true, false]);
  state = act(state, 'restart-puzzle');
  assert.equal(state.room.puzzle.id, old);
  state = act(state, 'restart-puzzle', b);
  assert.notEqual(state.room.puzzle.id, old); assert.equal(state.room.puzzle.type, 'code');
  assert.equal(state.room.roundHints, 3); assert.equal(state.room.roundErrors, 1);
  assert.equal(state.room.roundMoves, moves); assert.equal(state.room.errors, 1);
  assert.deepEqual(state.room.restartReady, [false, false]); assert.equal(state.room.puzzle.ready, false);
  fails(() => act(state, 'code-ready', b, { puzzleId: old }), 409);
  state = solveCode(state);
  assert.equal(state.room.results[0].hints, 3); assert.equal(state.room.results[0].errors, 1);
});

test('coop: una mossa dopo la richiesta di riavvio annulla il consenso precedente', () => {
  let state = act(joined(), 'restart-puzzle');
  state = act(state, 'code-ready', b);
  assert.deepEqual(state.room.restartReady, [false, false]);
});

test('coop: intervallo fra prove, consenso di entrambi, ruoli alternati e risultati completi', () => {
  let state = create({ mode: 'mix' });
  // Fixture solo test: tre codici consentono un oracolo minimale indipendente dai generatori.
  state.room.playlist = ['code', 'code', 'code'];
  state = act(state, 'join', b);
  for (let round = 0; round < 3; round++) {
    assert.equal(view(state).room.seat, round % 2);
    assert.equal(view(state, b).room.seat, (round + 1) % 2);
    assert.equal(state.room.round, round);
    fails(() => act(state, 'next', a, { round }), 409);
    if (round === 1) state = act(state, 'hint');
    state = solveCode(state, 3000 + round * 2000);
    assert.equal(state.room.results.length, round + 1);
    assert.equal(state.room.results[round].type, 'code');
    assert.equal(state.room.results[round].hints, round === 1 ? 1 : 0);
    assert.equal(state.room.results[round].moves, 2);
    assert.ok(state.room.results[round].durationMs >= 0);
    assert.equal(view(state).room.puzzle, null);
    if (round < 2) {
      assert.equal(state.room.status, 'between');
      fails(() => act(state, 'next', a, { round: round - 1 }), 409);
      state = act(state, 'next', a, { round });
      state = act(state, 'next', a, { round });
      assert.equal(state.room.round, round);
      assert.deepEqual(state.room.nextReady, [true, false]);
      state = act(state, 'next', b, { round }, 4000 + round * 2000);
      assert.equal(state.room.status, 'playing'); assert.equal(state.room.roundHints, 0);
      assert.deepEqual(state.room.nextReady, [false, false]);
      fails(() => act(state, 'next', b, { round }), 409);
    }
  }
  assert.equal(state.room.status, 'won'); assert.ok(state.room.finishedAt);
  const completed = structuredClone(state.room.results);
  state = act(state, 'create', b, { mode: 'code' });
  assert.equal(state.history[0].status, 'won'); assert.deepEqual(state.history[0].results, completed);
  assert.equal(state.history[0].mode, 'mix'); assert.equal(state.history[0].difficulty, 'normal');
});

test('coop: annullamento riservato al creatore, storico limitato e nessuno stato privato nello storico', () => {
  let state = joined();
  fails(() => act(state, 'cancel', b), 403);
  fails(() => act(state, 'cancel', stranger), 403);
  for (let i = 0; i < 25; i++) {
    state = act(state, 'cancel');
    state = act(state, 'create', a, { mode: 'code' });
  }
  assert.equal(state.history.length, 20);
  assert.ok(state.history.every(h => h.status === 'cancelled' && h.mode === 'code'));
  assert.ok(state.history.every(h => !('puzzle' in h) && !('rounds' in h) && !('playlist' in h)));
  state = act(state, 'cancel');
  fails(() => act(state, 'join', b), 409);
});
