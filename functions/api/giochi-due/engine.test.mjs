import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, applyAction, publicState, safeDistance, validateTraps, operatorId, romeDay } from './_engine.mjs';

const rory = { id: 1, nickname: 'Rory' }, desy = { id: 2, nickname: 'Desy' };
const traps = [6, 7, 8, 11, 12, 13];
const create = () => applyAction('trappole', initialState('trappole'), { type: 'create', traps }, rory);

test('trappole: accetta solo sei caselle uniche e un percorso sicuro', () => {
  assert.equal(safeDistance(traps), 8);
  validateTraps(traps);
  for (const invalid of [[1, 5, 6, 7, 8, 9], [0, 6, 7, 8, 9, 10], [6, 6, 7, 8, 9, 10], [1.2, 2, 3, 4, 5, 6], [], null])
    assert.throws(() => validateTraps(invalid));
});
test('trappole: informazioni nascoste, ripresa, movimento e vittoria verificati sul server', () => {
  let state = create(); const id = state.challenges[0].id;
  assert.deepEqual(publicState('trappole', state, 2).challenges[0].traps, []);
  assert.deepEqual(publicState('trappole', state, 1).challenges[0].traps, traps);
  assert.throws(() => applyAction('trappole', state, { type: 'start', id }, rory));
  state = applyAction('trappole', state, { type: 'start', id }, desy);
  assert.throws(() => applyAction('trappole', state, { type: 'move', id, cell: 24 }, desy));
  assert.throws(() => applyAction('trappole', state, { type: 'cancel', id }, rory));
  for (const cell of [1, 2, 3, 4, 9, 14, 19, 24]) state = applyAction('trappole', state, { type: 'move', id, cell }, desy);
  assert.equal(state.challenges[0].status, 'won');
  assert.equal(state.challenges[0].attempt.energy, 4);
  assert.deepEqual(publicState('trappole', state, 2).challenges[0].traps, traps);
  assert.throws(() => applyAction('trappole', state, { type: 'move', id, cell: 19 }, desy));
});
test('trappole: costi, rivelazione e perdita, senza tentativi duplicati', () => {
  let state = create(); const id = state.challenges[0].id;
  assert.throws(() => applyAction('trappole', state, { type: 'create', traps }, rory));
  state = applyAction('trappole', state, { type: 'start', id }, desy);
  assert.throws(() => applyAction('trappole', state, { type: 'start', id }, desy));
  for (const cell of [1, 6]) state = applyAction('trappole', state, { type: 'move', id, cell }, desy);
  assert.equal(state.challenges[0].attempt.energy, 8);
  assert.deepEqual(publicState('trappole', state, 2).challenges[0].traps, [6]);
  for (const cell of [7, 8, 13]) state = applyAction('trappole', state, { type: 'move', id, cell }, desy);
  assert.equal(state.challenges[0].status, 'lost');
  assert.equal(state.challenges[0].attempt.energy, 0);
});
test('trappole: conserva lo storico e permette una rivincita', () => {
  let state = create();
  state = applyAction('trappole', state, { type: 'cancel', id: state.challenges[0].id }, rory);
  state = applyAction('trappole', state, { type: 'create', traps }, rory);
  assert.equal(state.challenges.length, 2);
  assert.equal(state.challenges[1].status, 'cancelled');
});
test('frequenze legacy: completa le tre serrature esistenti e passa al nuovo formato solo alla nuova partita', () => {
  // Una partita salvata prima dell’aggiornamento non deve cambiare regole a metà.
  let state = { room: { id: 'legacy-room', owner: { id: 1, name: 'Rory' }, partner: null,
    status: 'waiting', round: 0, errors: 0, startedAt: 1000, lastWrong: false,
    rounds: Array.from({ length: 3 }, () => ({ mapping: [2, 3, 4, 5, 6, 7, 8, 1],
      sequence: [0, 1, 2, 3, 4, 5, 6, 7], ready: false })) }, history: [], requests: [] };
  const id = state.room.id;
  assert.throws(() => applyAction('frequenze', state, { type: 'join', id }, rory));
  assert.deepEqual(publicState('frequenze', state, 2).room.legend, []);
  state = applyAction('frequenze', state, { type: 'join', id }, desy);
  for (let turn = 0; turn < 3; turn++) {
    const operator = operatorId(state.room) === 1 ? rory : desy;
    const guide = operator.id === 1 ? desy : rory;
    const opView = publicState('frequenze', state, operator.id).room;
    const guideView = publicState('frequenze', state, guide.id).room;
    assert.equal(opView.sequence.length, turn + 4);
    assert.deepEqual(opView.legend, []); assert.deepEqual(guideView.sequence, []);
    assert.equal(guideView.legend.length, 8); assert.equal(opView.rounds, undefined);
    assert.equal(opView.instruction, null); assert.ok(guideView.instruction);
    assert.throws(() => applyAction('frequenze', state, { type: 'ready', id }, operator));
    assert.throws(() => applyAction('frequenze', state, { type: 'answer', id, code: '1234' }, operator));
    state = applyAction('frequenze', state, { type: 'ready', id }, guide);
    const current = state.room.rounds[turn];
    let digits = current.sequence.slice(0, turn + 4).map(i => current.mapping[i]);
    if (turn === 1) digits.reverse();
    if (turn === 2) digits = [...digits.slice(1), digits[0]];
    const code = digits.join('');
    assert.throws(() => applyAction('frequenze', state, { type: 'answer', id, code }, guide));
    state = applyAction('frequenze', state, { type: 'answer', id, code: '1'.repeat(turn + 4) }, operator);
    assert.equal(state.room.round, turn); assert.equal(state.room.lastWrong, true);
    state = applyAction('frequenze', state, { type: 'answer', id, code }, operator);
  }
  assert.equal(state.room.status, 'won'); assert.equal(state.room.errors, 3);
  state = applyAction('frequenze', state, { type: 'create' }, desy);
  assert.equal(state.history.length, 1); assert.equal(state.room.owner.id, 2);
  assert.equal(state.room.schema, 2); assert.equal(state.history[0].mode, 'legacy');
});
test('trappole: bandierine, sonda singola e ritorno su una trappola già scoperta', () => {
  let state = create(); const id = state.challenges[0].id;
  const act = (type, cell) => { state = applyAction('trappole', state, { type, id, cell }, desy); };
  act('start'); act('flag', 1);
  assert.throws(() => act('move', 1));
  act('flag', 1); act('probe', 1);
  assert.equal(state.challenges[0].attempt.energy, 12);
  assert.equal(state.challenges[0].attempt.position, 0);
  assert.equal(publicState('trappole', state, 2).challenges[0].clues[1], 1);
  assert.throws(() => act('probe', 5));
  for (const cell of [1, 6, 1, 6]) act('move', cell);
  assert.equal(state.challenges[0].attempt.energy, 6);
});
test('trappole: una sfida precedente conserva le regole e l’energia originali', () => {
  let state = create(); const id = state.challenges[0].id;
  delete state.challenges[0].rules;
  state = applyAction('trappole', state, { type: 'start', id }, desy);
  assert.equal(state.challenges[0].attempt.energy, 18);
  assert.throws(() => applyAction('trappole', state, { type: 'probe', id, cell: 1 }, desy));
  for (const cell of [1, 6, 1, 6]) state = applyAction('trappole', state, { type: 'move', id, cell }, desy);
  assert.equal(state.challenges[0].attempt.energy, 10);
});
test('giorno delle cure nel fuso italiano, anche durante il cambio stagionale', () => {
  assert.notEqual(romeDay(Date.parse('2026-10-21T21:59:00Z')), romeDay(Date.parse('2026-10-21T22:01:00Z')));
  assert.equal(romeDay(Date.parse('2026-10-26T22:30:00Z')), '2026-10-26');
});
