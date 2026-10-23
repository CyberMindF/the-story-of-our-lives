// Adapter SQLite locale usato dai test API e browser. Nessun accesso a D1 remoto.
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { counterRequest, CounterError } from '../functions/api/love-counter/_store.mjs';

export function createCounterHarness() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON; CREATE TABLE users (id INTEGER PRIMARY KEY); INSERT INTO users VALUES (1), (2), (3);');
  sqlite.exec(readFileSync(new URL('../migrations/0125_add_love_counter.sql', import.meta.url), 'utf8'));
  sqlite.exec(readFileSync(new URL('../migrations/0130_add_love_counter_psychologist_comment.sql', import.meta.url), 'utf8'));
  const users = {
    1: { id: 1, nickname: 'Admin uno', role: 'admin', identity: 'lui', isTest: false },
    2: { id: 2, nickname: 'Admin due', role: 'admin', identity: 'lei', isTest: false },
    3: { id: 3, nickname: 'Membro', role: 'member', identity: 'lei', isTest: false },
  };
  const userFor = request => users[Number(request.headers.get('cookie')?.match(/counter-user=(\d)/)?.[1] ?? 0)];
  const db = {
    withSession(mode) { if (mode !== 'first-primary') throw new Error('Sessione primaria richiesta'); return this; },
    prepare(sql) { return { bind(...args) { return { sql, args }; } }; },
    async batch(queries) {
      sqlite.exec('BEGIN');
      try {
        const results = queries.map(({ sql, args }) => {
          const statement = sqlite.prepare(sql);
          if (/^SELECT/i.test(sql.trim())) return { results: statement.all(...args), meta: {} };
          return { results: [], meta: { changes: Number(statement.run(...args).changes) } };
        });
        sqlite.exec('COMMIT'); return results;
      } catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    },
  };
  const source = readFileSync(new URL('../functions/api/love-counter/index.js', import.meta.url), 'utf8')
    .replace(/^import .*;\n/gm, '').replace('export async function', 'async function');
  const api = new Function('getAuthenticatedSession', 'json', 'counterRequest', 'CounterError', source + '\nreturn onRequest;')(
    async request => userFor(request) ? { user: userFor(request) } : null,
    (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } }), counterRequest, CounterError);
  const call = async (user, method = 'GET', body) => api({ request: new Request('http://test/api/love-counter', {
    method, headers: { Cookie: `counter-user=${user}` }, ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }), env: { DB: db } });
  return { sqlite, db, users, userFor, api, call };
}
