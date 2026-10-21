// Browser smoke con due account, API effettiva e SQLite in memoria. Non usa dati remoti.
// Eseguire dopo npm run build: node scripts/smoke-giochi-due.mjs
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdtemp } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { join, extname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import assert from 'node:assert/strict';
import { initialState, applyAction, publicState, GameError } from '../functions/api/giochi-due/_engine.mjs';

const db = new DatabaseSync(':memory:');
db.exec(readFileSync(new URL('../migrations/0124_add_giochi_due.sql', import.meta.url), 'utf8'));
const users = { 1: { id: 1, nickname: 'Rory', email: 'rory@example.test', identity: 'lui', role: 'admin', isTest: false }, 2: { id: 2, nickname: 'Desy', email: 'desy@example.test', identity: 'lei', role: 'member', isTest: false } };
const userFor = request => users[Number(request.headers.get('cookie')?.match(/smoke-user=(\d)/)?.[1] || 1)];
const adapter = { withSession() { return this; }, prepare(sql) { return { bind(...args) {
  const stmt = db.prepare(sql);
  return { async first() { return stmt.get(...args) ?? null; }, async run() { return { meta: { changes: Number(stmt.run(...args).changes) } }; } };
} }; } };
const source = readFileSync(new URL('../functions/api/giochi-due/[kind].js', import.meta.url), 'utf8').replace(/^import .*;\n/gm, '').replace('export async function', 'async function');
const api = new Function('getAuthenticatedSession', 'json', 'findTradePartner', 'initialState', 'applyAction', 'publicState', 'GameError', source + '\nreturn onRequest;')(
  async request => ({ user: userFor(request) }), (body, status = 200, headers = {}) => Response.json(body, { status, headers }),
  async (_env, user) => users[user.id === 1 ? 2 : 1], initialState, applyAction, publicState, GameError);
const root = resolve('web/dist/web/browser');
const server = createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url, 'http://test').pathname;
    if (pathname.startsWith('/api/')) {
      const chunks = []; for await (const chunk of req) chunks.push(chunk);
      const request = new Request('http://test' + req.url, { method: req.method, headers: req.headers, ...(req.method === 'POST' ? { body: Buffer.concat(chunks) } : {}) });
      let response;
      if (pathname.startsWith('/api/giochi-due/')) response = await api({ request, env: { DB: adapter }, params: { kind: pathname.split('/').at(-1) } });
      else response = Response.json(pathname === '/api/auth/session' ? { authenticated: true, user: userFor(request), adminModeEnabled: false }
        : pathname === '/api/world-settings' ? { settings: {}, values: { theme: 'white-world' } }
        : pathname === '/api/realtime' ? { enabled: false } : {});
      res.writeHead(response.status, Object.fromEntries(response.headers)); res.end(Buffer.from(await response.arrayBuffer())); return;
    }
    let file = join(root, pathname);
    let data; try { data = await readFile(file); } catch { file = join(root, 'index.html'); data = await readFile(file); }
    res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.webp': 'image/webp' })[extname(file)] || 'application/octet-stream');
    res.end(data);
  } catch (e) { res.writeHead(500); res.end(String(e)); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const screenshots = await mkdtemp(join(tmpdir(), 'giochi-due-smoke-'));
const browser = await chromium.launch();
try {
  const pages = [];
  const errors = [];
  for (const user of [1, 2]) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 960 }, reducedMotion: 'reduce' });
    await context.addCookies([{ name: 'smoke-user', value: String(user), url: base }]);
    await context.addInitScript(id => {
      sessionStorage.setItem('noi-crossword-access-session-v1', String(id));
      sessionStorage.setItem('noi-crossword-access-session-touched-at-v1', String(Date.now()));
    }, user);
    const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message)); pages.push(page);
  }
  const [rory, desy] = pages;
  const go = async (page, kind) => {
    await page.goto(`${base}/tavolo-da-gioco/piccole-avventure?gioco=${kind}`);
    await page.locator('.sync-note').waitFor();
  };
  await go(rory, 'trappole');
  for (const cell of [6, 7, 8, 11, 12, 13]) await rory.locator('.builder .tile').nth(cell).click();
  await rory.getByRole('button', { name: 'Lascia la sfida' }).click();
  await rory.getByText('Sfida pronta.', { exact: false }).waitFor();
  await go(desy, 'trappole');
  await desy.getByRole('button', { name: 'Accetto la sfida' }).click();
  await desy.locator('.score').waitFor();
  assert.equal(await desy.locator('.play-panel').nth(1).locator('.tile.trap').count(), 0);
  await desy.screenshot({ path: join(screenshots, 'trappole-desktop.png'), fullPage: true });
  let moves = 0;
  for (const cell of [1, 2, 3, 4, 9, 14, 19, 24]) {
    await desy.locator('.play-panel').nth(1).locator('.tile').nth(cell).click();
    moves++;
    await desy.waitForFunction(count => document.querySelector('.score')?.textContent.includes(`${count} passi`), moves);
  }
  await desy.getByText('Stella raggiunta!', { exact: false }).waitFor();
  await desy.reload(); await desy.getByText('Stella raggiunta!', { exact: false }).waitFor();
  await go(rory, 'frequenze');
  await rory.getByRole('button', { name: 'Apri una stanza per due' }).click();
  await rory.getByRole('heading', { name: 'Una frequenza cerca l’altra.' }).waitFor();
  await go(desy, 'frequenze');
  await desy.getByRole('button', { name: 'Entra nella partita' }).click();
  for (let turn = 0; turn < 3; turn++) {
    const explorer = pages[turn % 2], guide = pages[1 - turn % 2];
    await explorer.getByRole('heading', { name: 'Tu vedi i simboli.' }).waitFor();
    await guide.getByRole('heading', { name: 'Tu hai la legenda.' }).waitFor();
    const legend = await guide.locator('.legend div').evaluateAll(nodes => Object.fromEntries(nodes.map(n => [n.querySelector('span').textContent, n.querySelector('strong').textContent])));
    const symbols = await explorer.locator('.symbol-strip span').allTextContents();
    assert.equal(symbols.length, turn + 4);
    assert.equal(await explorer.locator('.legend').count(), 0);
    assert.equal(await guide.locator('.symbol-strip').count(), 0);
    if (!turn) {
      await explorer.screenshot({ path: join(screenshots, 'frequenze-explorer.png'), fullPage: true });
      await guide.screenshot({ path: join(screenshots, 'frequenze-guide.png'), fullPage: true });
    }
    await guide.getByRole('button', { name: 'Ho la legenda, sono pronta/o' }).click();
    const instruction = await guide.locator('.instruction').textContent();
    let digits = symbols.map(symbol => legend[symbol]);
    if (instruction.includes('al contrario')) digits.reverse();
    if (instruction.includes('fa un giro')) digits = [...digits.slice(1), digits[0]];
    for (const digit of digits) await explorer.locator('.keypad').getByRole('button', { name: digit, exact: true }).click();
    await explorer.getByRole('button', { name: 'Apri la serratura' }).click();
  }
  await rory.getByRole('heading', { name: 'Sulla stessa frequenza, davvero.' }).waitFor();
  await desy.getByRole('heading', { name: 'Sulla stessa frequenza, davvero.' }).waitFor();
  await go(rory, 'nuvola');
  await rory.getByRole('button', { name: /Una coccola/ }).click();
  await rory.getByText('1 piccoli gesti', { exact: true }).waitFor();
  await go(desy, 'nuvola');
  await desy.getByRole('button', { name: /Uno spuntino/ }).click();
  await desy.getByText('2 piccoli gesti', { exact: true }).waitFor();
  await rory.getByText('2 piccoli gesti', { exact: true }).waitFor();
  await rory.getByLabel('Come lo chiamiamo?').fill('Neve');
  await rory.getByRole('button', { name: 'Salva il nome' }).click();
  await desy.getByRole('heading', { name: 'Neve', exact: true }).waitFor();
  await rory.screenshot({ path: join(screenshots, 'rifugio-desktop.png'), fullPage: true });
  await desy.setViewportSize({ width: 390, height: 844 });
  await desy.screenshot({ path: join(screenshots, 'rifugio-mobile.png'), fullPage: true });
  for (const kind of ['trappole', 'frequenze', 'nuvola']) {
    await go(desy, kind);
    assert.equal(await desy.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${kind} mobile overflow`);
  }
  assert.deepEqual(errors, []);
  console.log(`PASS: due sessioni, trappole complete e riprese, tre round cooperativi, privacy indizi, cure e nome condivisi, mobile. Screenshot: ${screenshots}`);
} finally {
  await browser.close(); await new Promise(resolve => server.close(resolve)); db.close();
}
