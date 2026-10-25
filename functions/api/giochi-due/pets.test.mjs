import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, applyAction, publicState, romeDay } from './_engine.mjs';
import { SPECIES } from './_pets.mjs';

const rory = { id: 1, nickname: 'Rory' }, desy = { id: 2, nickname: 'Desy' };
const epoch = Date.parse('2026-10-21T12:00:00Z');
function game(original = initialState('nuvola')) {
  let state = original, now = epoch;
  return {
    get state() { return state; },
    act(type, extra = {}, user = rory, advance = 2200) {
      now += advance;
      state = applyAction('nuvola', state, { type, petId: state.pets?.[0]?.id, ...extra }, user, now);
      return state;
    },
    view(user = rory, when = now) { return publicState('nuvola', state, user.id, when); },
    hatch(species = 'cat') {
      this.act('adopt', { species });
      for (const care of ['warm', 'turn', 'listen']) this.act('incubate', { care });
      return this;
    }
  };
}
test('animali: tutte le specie, primo uovo gratis, sorpresa nascosta e tre azioni per la schiusa', () => {
  for (const species of [...SPECIES.map(s => s.id), 'surprise']) {
    const g = game(); g.act('adopt', { species });
    assert.equal(g.state.coins, 30);
    assert.equal(g.view().pets[0].name, 'Uovo');
    assert.equal(g.view().pets[0].species, species === 'surprise' ? null : species);
    assert.equal(g.view().pets[0].favoriteToy, null);
    assert.throws(() => g.act('adopt', { species: 'cat' }));
    assert.throws(() => g.act('memory-start'));
    g.act('incubate', { care: 'warm' });
    assert.throws(() => g.act('incubate', { care: 'warm' }));
    g.act('incubate', { care: 'turn' }, desy);
    assert.equal(g.state.pets[0].egg, true);
    g.act('incubate', { care: 'listen' });
    assert.equal(g.state.pets[0].egg, false);
    assert.ok(SPECIES.some(s => s.id === g.view().pets[0].species));
    assert.throws(() => g.act('incubate', { care: 'listen' }));
  }
  assert.throws(() => game().act('adopt', { species: 'dragon', coins: 999 }));
});
test('animali: conversione del vecchio Nuvola senza perdere nome, crescita, decorazioni o cure', () => {
  const old = { name: 'Neve', affection: 12, decor: 'stars', day: romeDay(epoch), care: { 1: ['coccola'] }, lastCare: { 1: epoch }, requests: ['old'], events: [] };
  const copy = structuredClone(old), g = game(old);
  assert.equal(g.view().pets[0].name, 'Neve');
  assert.equal(g.view().pets[0].xp, 12);
  assert.deepEqual(g.view().owned, ['plant', 'cushion', 'stars']);
  assert.equal(g.view().decor, 'stars');
  assert.deepEqual(old, copy);
  g.act('coccola', { petId: 'legacy-nuvola' });
  assert.equal(g.state.schema, 2);
  assert.equal(g.state.pets[0].xp, 12);
  assert.deepEqual(g.state.requests, ['old']);
  assert.equal(g.view(rory, epoch + 86400000 * 100).pets[0].xp, 12);
});
test('animali: XP giornalieri per persona/attività e cooldown, senza monete per tempo o click ripetuti', () => {
  const g = game().hatch();
  g.act('coccola');
  assert.throws(() => g.act('snack', {}, rory, 500));
  g.act('coccola');
  assert.equal(g.state.pets[0].xp, 1);
  g.act('coccola', {}, desy);
  g.act('snack');
  assert.equal(g.state.pets[0].xp, 3);
  assert.equal(g.state.coins, 30);
  assert.deepEqual(g.view().pets[0].myCare, ['coccola', 'snack']);
  assert.deepEqual(g.view(desy).pets[0].myCare, ['coccola']);
  assert.deepEqual(g.view(rory, epoch + 86400000).pets[0].myCare, []);
  g.act('coccola', {}, rory, 86400000);
  assert.equal(g.state.pets[0].xp, 4);
  for (const key of ['requests', 'care', 'lastAction', 'careDay']) assert.equal(g.view()[key], undefined);
});
test('animali: entrambi propongono un nome, solo l’altro può approvare la proposta attuale', () => {
  const g = game().hatch();
  assert.throws(() => g.act('propose-name', { name: ' ' }));
  g.act('propose-name', { name: ' Neve ' });
  const first = g.state.pets[0].proposals[1].id;
  assert.throws(() => g.act('accept-name', { proposalId: first }));
  g.act('propose-name', { name: 'Mochi' }, desy);
  assert.equal(Object.keys(g.state.pets[0].proposals).length, 2);
  g.act('propose-name', { name: 'Nuvola' });
  assert.throws(() => g.act('accept-name', { proposalId: first }, desy));
  g.act('accept-name', { proposalId: g.state.pets[0].proposals[2].id });
  assert.equal(g.state.pets[0].name, 'Mochi');
  assert.deepEqual(g.state.pets[0].proposals, {});
});
test('animali: prezzi autorevoli, inventario, posizionamento, consumabili e gusti da scoprire', () => {
  const g = game().hatch();
  assert.throws(() => g.act('buy', { itemId: 'missing', price: -99 }));
  assert.throws(() => g.act('use-item', { itemId: 'box' }));
  assert.throws(() => g.act('feed', { itemId: 'fish' }));
  g.act('buy', { itemId: 'box', price: -999, coins: 999 });
  assert.equal(g.state.coins, 18);
  assert.throws(() => g.act('buy', { itemId: 'box' }));
  assert.throws(() => g.act('buy', { itemId: 'bath' }));
  assert.throws(() => g.act('place', { itemId: 'box', slot: 'ceiling' }));
  g.act('place', { itemId: 'box', slot: 'left' });
  g.act('place', { itemId: 'box', slot: 'right' });
  assert.deepEqual(g.state.placed, { left: null, right: 'box' });
  g.state.pets[0].favoriteToy = 'box';
  assert.equal(g.view().pets[0].favoriteToy, null);
  g.act('use-item', { itemId: 'box' });
  assert.equal(g.view().pets[0].favoriteToy, 'box');
  g.state.pets[0].favoriteFood = 'fish';
  g.act('buy', { itemId: 'fish' });
  g.act('feed', { itemId: 'fish' });
  assert.equal(g.state.food.fish, 0);
  assert.equal(g.view().pets[0].favoriteFood, 'fish');
  assert.equal(g.state.coins, 15);
  assert.throws(() => g.act('feed', { itemId: 'fish' }));
  assert.equal(g.state.events[0].reaction, 'snack');
});
test('animali: memory salvato, carte segrete, coppie validate e premio singolo calcolato dal server', () => {
  const g = game().hatch();
  g.act('memory-start');
  const id = g.state.memory.id;
  assert.deepEqual(g.view().memory.board, Array(SPECIES.length * 2).fill(null));
  assert.throws(() => g.act('memory-start'));
  assert.throws(() => g.act('memory-flip', { runId: 'fake', cell: 0 }));
  assert.throws(() => g.act('memory-flip', { runId: id, cell: 99 }));
  const board = g.state.memory.board;
  const pairs = Object.values(Object.groupBy(board.map((symbol, i) => ({ symbol, i })), x => x.symbol)).map(pair => pair.map(x => x.i));
  g.act('memory-flip', { runId: id, cell: pairs[0][0] });
  assert.equal(g.view().memory.board[pairs[0][0]], board[pairs[0][0]]);
  assert.throws(() => g.act('memory-flip', { runId: id, cell: pairs[0][0] }));
  g.act('memory-flip', { runId: id, cell: pairs[1][0] });
  assert.throws(() => g.act('memory-flip', { runId: id, cell: pairs[0][1] }, rory, 100));
  assert.equal(g.state.coins, 30);
  for (const [a, b] of pairs) {
    g.act('memory-flip', { runId: id, cell: a }, rory);
    g.act('memory-flip', { runId: id, cell: b, reward: 999999, done: true }, desy);
  }
  assert.equal(g.state.memory.done, true);
  assert.equal(g.state.memory.turns, SPECIES.length + 1);
  assert.equal(g.state.memory.reward, 15);
  assert.equal(g.state.coins, 45);
  assert.equal(g.state.pets[0].xp, 3);
  assert.throws(() => g.act('memory-flip', { runId: id, cell: 0 }));
  assert.equal(g.state.coins, 45);
  g.act('memory-start');
  assert.notEqual(g.state.memory.id, id);
  assert.equal(g.state.coins, 45);
});
test('animali: adozioni successive richiedono XP e monete, sorpresa preferisce specie mancanti', () => {
  const g = game().hatch();
  g.state.coins = 100;
  assert.throws(() => g.act('adopt', { species: 'dog' }));
  g.state.pets[0].xp = 18; g.state.coins = 59;
  assert.throws(() => g.act('adopt', { species: 'dog' }));
  g.state.coins = 60;
  g.act('adopt', { species: 'surprise' });
  assert.equal(g.state.coins, 0);
  assert.notEqual(g.state.pets[1].species, 'cat');
  assert.equal(g.view().pets[1].species, null);
  assert.equal(g.view().nextEggXp, 36);
  assert.equal(g.view().eggPrice, 60);
  assert.throws(() => g.act('adopt', { species: 'fox' }));
});
