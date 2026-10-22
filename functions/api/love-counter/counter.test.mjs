import test from 'node:test';
import assert from 'node:assert/strict';
import { createCounterHarness } from '../../../scripts/love-counter-test-harness.mjs';
import { timeline, scoreColor, statistics, localDateTime } from '../../../web/src/app/pages/contatore-amore/counter-model.ts';

const setup = t => { const harness = createCounterHarness(); t.after(() => harness.sqlite.close()); return harness; };
const add = (call, user, delta = 1, id = crypto.randomUUID()) => call(user, 'POST', { id, delta });

test('tutti i metodi richiedono un admin; no cache e dati isolati anche fra admin', async t => {
  const { call } = setup(t);
  for (const method of ['GET', 'POST', 'PATCH', 'DELETE']) {
    assert.equal((await call(0, method, method === 'GET' ? undefined : {})).status, 401);
    assert.equal((await call(3, method, method === 'GET' ? undefined : {})).status, 403);
  }
  const response = await add(call, 1), state = await response.json();
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(state.settings.initialScore, 20);
  assert.equal((await (await call(2)).json()).episodes.length, 0);
  const episode = state.episodes[0];
  for (const method of ['PATCH', 'DELETE']) assert.equal((await call(2, method, { ...episode, reason: 'intrusione' })).status, 409);
  assert.equal((await (await call(1)).json()).episodes[0].reason, '');
});

test('click rapidi idempotenti, server UTC, modifica retroattiva, conflitti, eliminazione e retry', async t => {
  const { call, sqlite } = setup(t), id = crypto.randomUUID();
  const start = Date.now();
  let state = await (await add(call, 1, 1, id)).json();
  assert.ok(Date.parse(state.episodes[0].occurredAt) >= start);
  assert.ok(state.episodes[0].occurredAt.endsWith('Z'));
  await add(call, 1, 1, id);
  state = await (await add(call, 1, -1)).json();
  assert.equal(state.episodes.length, 2); assert.equal(statistics(state).current, 20);
  const episode = state.episodes.find(e => e.id === id);
  const edit = { ...episode, delta: -2, reason: '  Nota privata 💗  ', occurredAt: '2026-01-01T10:00:00.000Z' };
  state = await (await call(1, 'PATCH', edit)).json();
  assert.equal(state.episodes[0].reason, 'Nota privata 💗');
  assert.equal(statistics(state).current, 17);
  assert.equal(timeline(state)[0].total, 20); assert.ok(timeline(state)[0].time < timeline(state)[1].time);
  assert.equal((await call(1, 'PATCH', edit)).status, 409);
  state = await (await call(1, 'DELETE', { id, revision: 1 })).json();
  assert.equal(statistics(state).current, 19);
  await add(call, 1, 1, id);
  assert.equal((await (await call(1)).json()).episodes.length, 1, 'Il retry non resuscita episodi eliminati');
  assert.equal(sqlite.prepare('SELECT reason FROM love_counter_episodes WHERE id = ?').get(id).reason, '');
});

test('validazione: delta, nota, data impossibile/ambigua, base intera, JSON e metodi', async t => {
  const { call, api, db } = setup(t);
  const state = await (await add(call, 1)).json(), episode = state.episodes[0];
  for (const delta of [0, 3, '1', null, 1.5, 2]) assert.equal((await add(call, 1, delta)).status, 400);
  for (const invalid of [{ delta: 0 }, { reason: 'x'.repeat(2001) }, { reason: null }, { occurredAt: '2026-02-30T10:00:00.000Z' }, { occurredAt: '2026-01-01T10:00' }, { revision: -1 }]) {
    assert.equal((await call(1, 'PATCH', { ...episode, ...invalid })).status, 400);
  }
  for (const initialScore of [1.5, '20', null]) assert.equal((await call(1, 'PATCH', { action: 'settings', initialScore, revision: 0 })).status, 400);
  assert.equal((await api({ request: new Request('http://test', { method: 'POST', headers: { cookie: 'counter-user=1' }, body: '{' }), env: { DB: db } })).status, 400);
  assert.equal((await call(1, 'PUT', {})).status, 405);
});

test('base configurabile, totale sotto zero e sopra base senza clamp; cascata account', async t => {
  const { call, sqlite } = setup(t);
  let state = await (await add(call, 1, -1)).json();
  state = await (await call(1, 'PATCH', { action: 'settings', initialScore: 0, revision: state.settings.revision })).json();
  assert.equal(statistics(state).current, -1);
  assert.equal(state.episodes.length, 1);
  assert.equal((await call(1, 'PATCH', { action: 'settings', initialScore: 10, revision: 0 })).status, 409);
  await add(call, 1); state = await (await add(call, 1)).json();
  assert.equal(statistics(state).current, 1);
  sqlite.exec('DELETE FROM users WHERE id=1');
  assert.equal(sqlite.prepare('SELECT count(*) AS n FROM love_counter_episodes').get().n, 0);
  assert.equal(sqlite.prepare('SELECT count(*) AS n FROM love_counter_settings').get().n, 0);
});

test('grafico cronologico con orari identici, statistiche ±2 e finestra mobile 7 giorni', () => {
  const now = Date.parse('2026-10-22T15:00:00Z');
  const episode = (id, delta, time) => ({ id, delta, occurredAt: new Date(time).toISOString(), createdAt: new Date(time).toISOString(), reason: '', revision: 0 });
  const state = { settings: { initialScore: 20, createdAt: new Date(now).toISOString(), revision: 0 }, episodes: [
    episode('c', 2, now), episode('b', -2, now), episode('a', 1, now - 8 * 86400000), episode('d', 1, now + 86400000),
  ] };
  assert.deepEqual(timeline(state).map(p => p.total), [20, 21, 19, 21, 22]);
  assert.deepEqual(statistics(state, now), { current: 22, net: 2, positive: 3, negative: 1, week: 0 });
  assert.equal(timeline(state)[2].time, timeline(state)[3].time);
});

test('colori interpolati, estremi e orari locali estate/inverno', () => {
  assert.equal(scoreColor(20, 20), 'rgb(240, 91, 153)');
  assert.equal(scoreColor(15, 20), 'rgb(211, 144, 168)');
  assert.equal(scoreColor(10, 20), 'rgb(164, 118, 123)');
  assert.equal(scoreColor(5, 20), 'rgb(139, 129, 119)');
  assert.equal(scoreColor(-8, 20), scoreColor(0, 20));
  assert.equal(scoreColor(50, 20), scoreColor(20, 20));
  assert.notEqual(scoreColor(14, 20), scoreColor(15, 20));
  assert.equal(scoreColor(30, 40), scoreColor(15, 20));
  const before = process.env.TZ; process.env.TZ = 'Europe/Rome';
  try {
    assert.equal(localDateTime('2026-07-01T15:00:00.000Z'), '2026-07-01T17:00:00');
    assert.equal(localDateTime('2026-12-01T15:00:00.000Z'), '2026-12-01T16:00:00');
  } finally { if (before === undefined) delete process.env.TZ; else process.env.TZ = before; }
});

test('errori del database non espongono query o note personali', async t => {
  const { api } = setup(t);
  const response = await api({ request: new Request('http://test', { headers: { cookie: 'counter-user=1' } }),
    env: { DB: { withSession() { throw new Error('Nota personale da non divulgare'); } } } });
  assert.equal(response.status, 500);
  assert.doesNotMatch(await response.text(), /Nota personale/);
});
