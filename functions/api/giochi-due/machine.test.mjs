import test from 'node:test';
import assert from 'node:assert/strict';
import { createMachine, applyMachine, machineView } from './_coop-machine.mjs';
import { initialState, applyAction, publicState, GameError } from './_engine.mjs';

const actions = [
  [0, {type: 'machine-crank', direction: 1}], [0, {type: 'machine-crank', direction: -1}],
  ...['drawer','cog','latch'].map(t => [0, {type: 'machine-' + t}]),
  ...['lift','dynamo'].map(drive => [0, {type: 'machine-belt', drive}]),
  ...['board', 'step', 'gear', 'ladder', 'cargo', 'exit'].map(t => [1, {type: 'machine-' + t}]),
  ...[0, 1, 2].map(to => [1, {type: 'machine-climb', to}])
];
const key = p => JSON.stringify([p.lift, p.aboard ? -1 : p.actor, p.aboard, p.ladder, p.drive, p.ball, p.charge, p.solved, p.clutch, p.drawer, p.cog, p.unlatched]);
const step = (p, type, extra = {}, seat = 1) => applyMachine(p, {type: 'machine-' + type, ...extra}, seat).puzzle;

const legacyWalkthrough = [
  [1,'board'], [0,'crank',{direction:1}], [1,'step'], [1,'ladder'], [1,'cargo'],
  [0,'crank',{direction:-1}], [1,'climb',{to:0}], [1,'cargo'], [1,'climb',{to:1}], [1,'gear'],
  [0,'crank',{direction:1}], [0,'crank',{direction:1}], [0,'crank',{direction:1}], [1,'gear'],
  [1,'climb',{to:0}], [1,'cargo'], [0,'crank',{direction:1}], [0,'crank',{direction:1}],
  [1,'climb',{to:1}], [1,'climb',{to:2}], [1,'cargo'], [1,'exit']
];
export const walkthrough = [
  [1,'board'], [0,'crank',{direction:1}], [1,'step'], [1,'ladder'],
  [1,'gear'], [0,'drawer'], [0,'cog'], [1,'gear'], [1,'cargo'],
  [0,'crank',{direction:-1}], [1,'climb',{to:0}], [1,'cargo'], [1,'climb',{to:1}],
  [1,'gear'], [0,'belt',{drive:'dynamo'}], [1,'gear'],
  [0,'crank',{direction:1}], [0,'crank',{direction:1}], [0,'crank',{direction:1}],
  [1,'gear'], [0,'belt',{drive:'lift'}], [1,'gear'],
  [1,'climb',{to:0}], [1,'cargo'], [0,'crank',{direction:1}], [0,'crank',{direction:1}],
  [1,'climb',{to:1}], [1,'climb',{to:2}], [1,'cargo'], [0,'latch'], [1,'exit']
];

test('machine: stanza completabile con strumenti complementari, non con un solo ruolo', () => {
  let p = createMachine();
  for (const [seat, action, extra] of walkthrough) {
    const before = structuredClone(p); const next = step(p, action, extra, seat);
    assert.deepEqual(p, before); p = next;
    assert.ok(!p.aboard || p.ball !== 'lift', 'Pip e sfera non condividono la piattaforma');
  }
  assert.equal(p.solved, true); assert.equal(p.charge, 3); assert.equal(p.ball, 2);
  assert.throws(() => step(p, 'exit'), GameError);
  for (const seat of [0, 1]) {
    const queue = [createMachine()], seen = new Set([key(queue[0])]);
    for (let i = 0; i < queue.length; i++) for (const [owner, action] of actions.filter(a => a[0] === seat)) {
      const next = applyMachine(queue[i], action, owner).puzzle;
      assert.equal(next.solved, false);
      if (!seen.has(key(next))) { seen.add(key(next)); queue.push(next); }
    }
  }
});

test('machine: tutti gli stati raggiungibili hanno una strada verso l’uscita, senza reset', () => {
  const start = createMachine(), queue = [start], seen = new Set([key(start)]), parents = new Map(), wins = [];
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i], current = key(p);
    if (p.solved) { wins.push(current); continue; }
    for (const [seat, action] of actions) {
      const next = applyMachine(p, action, seat).puzzle, id = key(next);
      if (id === current) continue;
      if (!parents.has(id)) parents.set(id, new Set()); parents.get(id).add(current);
      if (!seen.has(id)) { seen.add(id); queue.push(next); }
    }
  }
  assert.ok(seen.size > 100); assert.ok(seen.size < 50000);
  const recoverable = new Set(wins);
  for (let i = 0; i < wins.length; i++) for (const parent of parents.get(wins[i]) ?? []) {
    if (!recoverable.has(parent)) { recoverable.add(parent); wins.push(parent); }
  }
  assert.equal(recoverable.size, seen.size, 'Esiste uno stato senza via d’uscita');
});

test('machine: ruoli, input, limiti e proiezioni private sono verificati dal server', () => {
  const p = createMachine();
  for (const direction of [0,2,1.5,'1',null]) assert.throws(() => step(p,'crank',{direction},0),GameError);
  for (const to of [-1,3,1.2,'1',null]) assert.throws(() => step(p,'climb',{to}),GameError);
  for (const [seat, action] of actions) assert.throws(() => applyMachine(p,action,1-seat),GameError);
  assert.throws(() => applyMachine(p,{type:'whatever'},1),GameError);
  assert.throws(() => applyMachine(p,{type:'machine-exit'},2),GameError);
  const outside = machineView({...p,secret:'hidden'},0), inside = machineView(p,1);
  assert.equal(outside.inside, undefined); assert.equal(inside.outside, undefined);
  assert.deepEqual(Object.keys(outside.outside).sort(), ['clutch','cog','drawer','drive','lamps','note','turns','unlatched']);
  assert.equal(JSON.stringify(outside).includes('hidden'),false);
  assert.equal(JSON.stringify(inside).includes('"charge"'),false);
  const missing = step(p,'board');
  assert.equal(step(missing,'cargo').ball,1);
  assert.equal(step(p,'crank',{direction:-1},0).lift,0);
  assert.equal(step(p,'exit').solved,false);
});

test('machine: trasmissione e cassetto richiedono la leva interna, la bobina richiede il pezzo esterno', () => {
  let p = createMachine();
  assert.equal(step(p,'belt',{drive:'dynamo'},0).drive,'lift');
  assert.equal(step(p,'drawer',{},0).drawer,false);
  assert.equal(step(p,'cog',{},0).cog,false);
  assert.equal(step(p,'latch',{},0).unlatched,false);
  p = {...p,actor:1}; p = step(p,'gear');
  assert.equal(p.clutch,false);
  assert.equal(step(p,'crank',{direction:1},0).lift,0);
  p = step(p,'belt',{drive:'dynamo'},0); p = step(p,'gear');
  p.ball = 0;
  assert.equal(step(p,'crank',{direction:1},0).charge,0);
  for (const drive of [null,0,'nope',{},['lift']]) assert.throws(()=>step(p,'belt',{drive},0),GameError);
  assert.throws(()=>step(p,'cargo',{from:1,to:'lift'}),GameError);
  assert.throws(()=>step(p,'cargo',{from:0,to:'lift',lift:2}),GameError);
  assert.throws(()=>step(p,'cargo',{from:0,to:2}),GameError);
  assert.equal(step({...p,actor:2,ball:2,charge:3},'exit').solved,false);
});

test('machine: le partite precedenti restano completabili con le regole originali', () => {
  let p = createMachine();
  for (const field of ['mechanics','clutch','drawer','cog','unlatched']) delete p[field];
  assert.equal(machineView(p,0).mechanics,1);
  assert.throws(()=>step(p,'belt',{drive:'dynamo'},0),GameError);
  for (const [seat,action,extra] of legacyWalkthrough) p = step(JSON.parse(JSON.stringify(p)),action,extra,seat);
  assert.equal(p.solved,true);
});

test('machine: stanza reale, scelta ruoli, salvataggio, storico e richieste obsolete', () => {
  const users = [{id:1,nickname:'A'},{id:2,nickname:'B'}];
  for (const insideFirst of [false,true]) {
    let state = applyAction('frequenze',initialState('frequenze'),{type:'create',mode:'machine',insideFirst},users[0],100);
    state = applyAction('frequenze',state,{type:'join',id:state.room.id},users[1],200);
    assert.equal(publicState('frequenze',state,1).room.puzzle.role,insideFirst?'inside':'outside');
    const id = state.room.id, puzzleId = state.room.puzzle.id;
    assert.throws(() => applyAction('frequenze',state,{type:'machine-board',id,puzzleId:'old'},users[insideFirst?0:1]),GameError);
    for (const [seat,type,extra] of walkthrough) {
      state = applyAction('frequenze',JSON.parse(JSON.stringify(state)),{id,puzzleId,type:'machine-'+type,...extra},users[(seat+Number(insideFirst))%2],300);
    }
    assert.equal(state.room.status,'won'); assert.equal(state.room.errors,0);
    assert.equal(state.room.results[0].type,'machine');
    state = applyAction('frequenze',state,{type:'create',mode:'machine'},users[0],400);
    assert.equal(state.history[0].results[0].type,'machine');
  }
});
