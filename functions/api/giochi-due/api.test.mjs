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
    async req => req.headers.get('x-user') === 'none' ? null : { user: { id: Number(req.headers.get('x-user') || 1), nickname: 'Test', isTest: req.headers.has('x-test') } },
    (body, status = 200, headers = {}) => Response.json(body, { status, headers }),
    async (_env, user) => ({ id: user.id === 1 ? 2 : 1, nickname: 'Partner' }), initialState, applyAction, publicState, GameError);
  const call = async (kind, body, user = '1', headers = {}) => {
    const response = await handler({ env: { DB: adapter }, params: { kind }, request: new Request('https://test/api/giochi-due/' + kind, {
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
    const results = await Promise.all(['1', '2'].map(user => call('nuvola', { type: 'coccola', version: 0, requestId: crypto.randomUUID() }, user)));
    assert.deepEqual(results.map(r => r.status).sort(), [200, 409]);
    const index = results.findIndex(r => r.status === 409);
    const retry = await call('nuvola', { type: 'coccola', version: 1, requestId: crypto.randomUUID() }, String(index + 1));
    assert.equal(retry.body.affection, 2); assert.equal(retry.body.version, 2);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM giochi_due').get().n, 1);
  } finally { db.close(); }
});
