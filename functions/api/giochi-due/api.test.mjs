import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { initialState, applyAction, publicState, GameError } from './_engine.mjs';

function harness() {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(new URL('../../../migrations/0124_add_giochi_due.sql', import.meta.url), 'utf8'));
  const adapter = { withSession() { return this; }, prepare(sql) { return { bind(...args) {
    const stmt = db.prepare(sql);
    return { async first() { return stmt.get(...args) ?? null; }, async run() { return { meta: { changes: Number(stmt.run(...args).changes) } }; } };
  } }; } };
  const source = readFileSync(new URL('./[kind].js', import.meta.url), 'utf8').replace(/^import .*;\n/gm, '').replace('export async function', 'async function');
  const handler = new Function('getAuthenticatedSession', 'json', 'findTradePartner', 'initialState', 'applyAction', 'publicState', 'GameError', source + '\nreturn onRequest;')(
    async req => req.headers.get('x-user') === 'none' ? null : { user: { id: Number(req.headers.get('x-user') || 1), role: req.headers.get('x-user') === '2' ? 'member' : 'admin', nickname: 'Test', isTest: req.headers.has('x-test') } },
    (body, status = 200, headers = {}) => Response.json(body, { status, headers }),
    async (_env, user) => ({ id: user.id === 1 ? 2 : 1, nickname: 'Partner' }), initialState, applyAction, publicState, GameError);
  const call = async (kind, body, user = '1', headers = {}) => {
    const response = await handler({ env: { DB: adapter }, params: { kind: kind.split('?')[0] }, request: new Request('https://test/api/giochi-due/' + kind, {
      method: body === undefined ? 'GET' : 'POST', headers: { 'x-user': user, ...headers }, body: body === undefined ? undefined : JSON.stringify(body)
    }) });
    return { status: response.status, body: await response.json() };
  };
  return { call, db };
}
test('API: autenticazione, account di prova, isolamento degli indizi e idempotenza', async () => {
  const { call, db } = harness();
  try {
    assert.equal((await call('nuvola', undefined, 'none')).status, 401);
    assert.equal((await call('nuvola', undefined, '1', { 'x-test': '1' })).status, 403);
    assert.equal((await call('unknown')).status, 404);
    const action = { type: 'create', version: 0, requestId: crypto.randomUUID(), traps: [6, 7, 8, 11, 12, 13] };
    assert.equal((await call('trappole', action)).status, 200);
    assert.equal((await call('trappole', action)).body.version, 1);
    const other = await call('trappole', undefined, '2');
    assert.deepEqual(other.body.challenges[0].traps, []);
    assert.equal((await call('trappole', { ...action, requestId: crypto.randomUUID() })).status, 409);
    assert.equal((await call('nuvola', { type: 'rename', requestId: 'bad', version: 0 })).status, 400);
    assert.equal((await call('nuvola', { type: 'rename', requestId: crypto.randomUUID(), version: 0, name: 'x'.repeat(9000) })).status, 413);
  } finally { db.close(); }
});
test('API: due azioni simultanee non sovrascrivono lo stato e il nuovo tentativo preserva entrambe', async () => {
  const { call, db } = harness();
  try {
    const items = ['box', 'plant'];
    const results = await Promise.all(['1', '2'].map((user, i) => call('nuvola', { type: 'buy', itemId: items[i], version: 0, requestId: crypto.randomUUID() }, user)));
    assert.deepEqual(results.map(r => r.status).sort(), [200, 409]);
    const index = results.findIndex(r => r.status === 409);
    const action = { type: 'buy', itemId: items[index], version: 1, requestId: crypto.randomUUID() };
    const retry = await call('nuvola', action, String(index + 1));
    assert.equal(retry.body.coins, 8); assert.equal(retry.body.version, 2);
    assert.deepEqual(retry.body.owned.sort(), items.sort());
    const duplicate = await call('nuvola', action, String(index + 1));
    assert.equal(duplicate.body.coins, 8); assert.equal(duplicate.body.version, 2);
    const insufficient = await call('nuvola', { type: 'buy', itemId: 'ball', version: 2, requestId: crypto.randomUUID() });
    assert.equal(insufficient.status, 400);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM giochi_due').get().n, 1);
  } finally { db.close(); }
});
test('API: prova admin con due ruoli, isolata dalla partita reale e dagli altri admin', async () => {
  const { call, db } = harness();
  const action = (type, version, extra = {}) => ({ type, version, requestId: crypto.randomUUID(), ...extra });
  try {
    assert.equal((await call('frequenze?practice=1', undefined, '2')).status, 403);
    assert.equal((await call('nuvola?practice=1')).status, 403);
    const real = await call('frequenze', action('create', 0));
    const practice = await call('frequenze?practice=1&seat=A', action('create', 0));
    const joined = await call('frequenze?practice=1&seat=B', action('join', 1, { id: practice.body.room.id }));
    assert.equal(joined.status, 200);
    assert.equal(joined.body.room.role, 'guide');
    assert.equal(joined.body.room.legend.length, 8);
    const a = await call('frequenze?practice=1&seat=A');
    assert.equal(a.body.room.role, 'explorer');
    assert.equal(a.body.room.sequence.length, 4);
    assert.equal((await call('frequenze?practice=1', undefined, '3')).body.room, null);
    assert.equal((await call('frequenze', action('practice-reset', 1))).status, 409);
    assert.equal((await call('frequenze?practice=1', action('practice-reset', 2))).body.room, null);
    assert.deepEqual((await call('frequenze')).body, real.body);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM giochi_due').get().n, 2);
  } finally { db.close(); }
});
test('API: completamento simultaneo del memory e reinvio non duplicano il premio', async () => {
  const { call, db } = harness();
  try {
    const user = { id: 1, nickname: 'Rory' };
    let now = Date.now(), state = initialState('nuvola');
    const act = (type, extra = {}) => {
      state = applyAction('nuvola', state, { type, petId: state.pets[0]?.id, ...extra }, user, now += 2000);
    };
    act('adopt', { species: 'cat' });
    for (const care of ['warm', 'turn', 'listen']) act('incubate', { care });
    act('memory-start');
    const order = Object.values(Object.groupBy(state.memory.board.map((s, i) => ({ s, i })), c => c.s)).flat().map(c => c.i);
    for (const cell of order.slice(0, -1)) act('memory-flip', { cell, runId: state.memory.id });
    // Il clock dei test engine avanza virtualmente; l’handler usa l’orologio reale.
    state.memory.lastFlip = Date.now() - 2000;
    db.prepare('INSERT INTO giochi_due (pair_key,kind,version,state_json,updated_at) VALUES (?,?,?,?,?)')
      .run('1:2', 'nuvola', 1, JSON.stringify(state), new Date().toISOString());
    const actions = ['1', '2'].map(() => ({ type: 'memory-flip', runId: state.memory.id, cell: order.at(-1), version: 1, requestId: crypto.randomUUID(), reward: 99999 }));
    const results = await Promise.all(actions.map((action, i) => call('nuvola', action, String(i + 1))));
    assert.deepEqual(results.map(r => r.status).sort(), [200, 409]);
    const winner = results.findIndex(r => r.status === 200);
    assert.equal(results[winner].body.coins, 46);
    assert.equal(results[winner].body.pets[0].xp, 3);
    assert.equal((await call('nuvola', actions[winner], String(winner + 1))).body.coins, 46);
    assert.equal((await call('nuvola', { ...actions[0], version: 2, requestId: crypto.randomUUID() })).status, 409);
    assert.equal((await call('nuvola')).body.coins, 46);
  } finally { db.close(); }
});
