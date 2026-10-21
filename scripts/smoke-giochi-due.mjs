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
const pages = [];
try {
  const errors = [];
  for (const user of [1, 2]) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 960 }, reducedMotion: 'reduce' });
    await context.addCookies([{ name: 'smoke-user', value: String(user), url: base }]);
    await context.addInitScript(id => {
      sessionStorage.setItem('noi-crossword-access-session-v1', String(id));
      sessionStorage.setItem('noi-crossword-access-session-touched-at-v1', String(Date.now()));
    }, user);
    const page = await context.newPage(); page.setDefaultTimeout(15000); page.on('pageerror', error => errors.push(error.message)); pages.push(page);
  }
  const [rory, desy] = pages;
  const go = async (page, kind) => {
    await page.goto(`${base}/tavolo-da-gioco/${kind === 'nuvola' ? 'animali' : kind}`);
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
  await desy.getByText('Traguardo raggiunto!', { exact: false }).waitFor();
  await desy.reload(); await desy.getByText('Traguardo raggiunto!', { exact: false }).waitFor();
  await desy.getByRole('slider').fill('0');
  assert.equal(await desy.locator('.play-panel').nth(1).locator('.tile').first().getAttribute('class').then(s => s.includes('current')), true);
  await go(rory, 'frequenze');
  await rory.getByRole('button', { name: 'Apri una stanza per due' }).click();
  await rory.getByRole('heading', { name: 'Manca il secondo giocatore!' }).waitFor();
  await go(desy, 'frequenze');
  await desy.getByRole('button', { name: 'Entra nella partita' }).click();
  for (let turn = 0; turn < 3; turn++) {
    console.log('Cooperativo, round', turn + 1);
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
  await rory.getByRole('heading', { name: 'Fatto! Tutte aperte 🎉' }).waitFor();
  await desy.getByRole('heading', { name: 'Fatto! Tutte aperte 🎉' }).waitFor();
  const realCoop = db.prepare("SELECT state_json FROM giochi_due WHERE pair_key='1:2' AND kind='frequenze'").get().state_json;
  await rory.getByRole('link', { name: /Prova da solo/ }).click();
  await rory.getByRole('button', { name: 'Apri la stanza come A' }).click();
  await rory.getByRole('button', { name: 'Entra come B' }).click();
  for (let turn = 0; turn < 3; turn++) {
    const panels = rory.locator('.screens section');
    const explorer = panels.nth(turn % 2), guide = panels.nth(1 - turn % 2);
    await explorer.getByRole('heading', { name: 'Hai la sequenza' }).waitFor();
    const legend = Object.fromEntries((await guide.locator('.legend span').allTextContents()).map(s => s.split(' = ')));
    const symbols = (await explorer.locator('.symbols').textContent()).trim().split(' ');
    let digits = symbols.map(s => legend[s]);
    if (turn === 1) digits.reverse();
    if (turn === 2) digits = [...digits.slice(1), digits[0]];
    await guide.getByRole('button', { name: 'Sono pronto' }).click();
    await explorer.getByLabel('Codice').fill(digits.join(''));
    await explorer.getByRole('button', { name: 'Prova il codice' }).click();
  }
  await rory.getByRole('heading', { name: '🎉 Prova completata' }).first().waitFor();
  await rory.screenshot({ path: join(screenshots, 'frequenze-admin.png'), fullPage: true });
  await rory.getByRole('button', { name: /Azzera la prova/ }).click();
  await rory.getByRole('button', { name: 'Apri la stanza come A' }).waitFor();
  assert.equal(db.prepare("SELECT state_json FROM giochi_due WHERE pair_key='1:2' AND kind='frequenze'").get().state_json, realCoop);
  const clickAction = async (page, locator) => {
    const response = page.waitForResponse(r => r.url().includes('/api/giochi-due/') && r.request().method() === 'POST');
    await locator.click(); const result = await response;
    assert.equal(result.status(), 200, await result.text());
  };
  await go(rory, 'nuvola');
  await rory.getByRole('button', { name: 'Scegli il primo uovo' }).click();
  await rory.getByLabel('Chi vorresti?').selectOption('cat');
  await clickAction(rory, rory.getByRole('button', { name: 'Adotta l’uovo' }));
  await rory.getByRole('button', { name: '🏠 Stanza', exact: true }).click();
  await rory.screenshot({ path: join(screenshots, 'uovo-desktop.png'), fullPage: true });
  for (const label of ['Tienilo al caldo', 'Giralo piano', 'Ascolta']) {
    await clickAction(rory, rory.getByRole('button', { name: new RegExp(label) }));
  }
  await rory.getByRole('heading', { name: 'Gattino', exact: true }).waitFor();
  await go(desy, 'nuvola');
  await rory.getByLabel('La tua proposta').fill('Neve');
  await clickAction(rory, rory.getByRole('button', { name: 'Proponi nome' }));
  await desy.getByLabel('La tua proposta').fill('Mochi');
  // Aspetta la proposta di Rory prima di inviare dal secondo account (versione condivisa).
  await desy.locator('.proposal strong').filter({ hasText: 'Neve' }).waitFor();
  await clickAction(desy, desy.getByRole('button', { name: 'Proponi nome' }));
  await clickAction(desy, desy.getByRole('button', { name: 'Mi piace, scelgo questo' }));
  await rory.getByRole('heading', { name: 'Neve', exact: true }).waitFor();
  await rory.getByRole('button', { name: '🛍️ Shop', exact: true }).click();
  await clickAction(rory, rory.locator('.shop-grid article').filter({ has: rory.getByRole('heading', { name: 'Scatola', exact: true }) }).getByRole('button'));
  await rory.screenshot({ path: join(screenshots, 'shop-desktop.png'), fullPage: true });
  await rory.getByRole('button', { name: '🏠 Stanza', exact: true }).click();
  await clickAction(rory, rory.getByRole('button', { name: 'A sinistra', exact: true }));
  await clickAction(rory, rory.getByRole('button', { name: 'Gioca con Scatola', exact: true }));
  await rory.screenshot({ path: join(screenshots, 'animali-desktop.png'), fullPage: true });
  await desy.getByRole('button', { name: 'Gioca con Scatola', exact: true }).waitFor();
  await rory.getByRole('button', { name: '🃏 Memory', exact: true }).click();
  await clickAction(rory, rory.getByRole('button', { name: 'Giochiamo!', exact: true }));
  // Oracle esclusivamente nel DB in memoria del test, mai nel browser o nell’API pubblica.
  const memory = JSON.parse(db.prepare("SELECT state_json FROM giochi_due WHERE pair_key='1:2' AND kind='nuvola'").get().state_json).memory;
  const pairs = Object.values(Object.groupBy(memory.board.map((symbol, i) => ({ symbol, i })), x => x.symbol));
  for (const pair of pairs) for (const { i } of pair) await clickAction(rory, rory.locator('.memory-board button').nth(i));
  await rory.getByText('🎉 Tutte trovate! +16 monetine e +3 XP.', { exact: true }).waitFor();
  assert.equal(await rory.locator('.wallet strong').textContent().then(s => s.trim()), '🪙 34');
  await rory.screenshot({ path: join(screenshots, 'memory-desktop.png'), fullPage: true });
  await rory.reload(); await rory.locator('.wallet strong').filter({ hasText: '34' }).waitFor();
  await rory.getByRole('button', { name: '🃏 Memory', exact: true }).click();
  await rory.getByText('🎉 Tutte trovate! +16 monetine e +3 XP.', { exact: true }).waitFor();
  await desy.setViewportSize({ width: 390, height: 844 });
  await desy.screenshot({ path: join(screenshots, 'rifugio-mobile.png'), fullPage: true });
  for (const kind of ['trappole', 'frequenze', 'nuvola']) {
    await go(desy, kind);
    assert.equal(await desy.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${kind} mobile overflow`);
  }
  for (const tab of ['🛍️ Shop', '🃏 Memory', '🥚 Adotta', '🏠 Stanza']) {
    await desy.getByRole('button', { name: tab, exact: true }).click();
    assert.equal(await desy.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${tab} mobile overflow`);
  }
  // Fixture grafica solo in memoria: tutte le specie, adulto e nome lungo su mobile.
  const petsRow = db.prepare("SELECT * FROM giochi_due WHERE pair_key='1:2' AND kind='nuvola'").get();
  const fixture = JSON.parse(petsRow.state_json);
  fixture.pets[0].xp = 18;
  for (const species of ['dog', 'fox', 'rabbit', 'duck', 'porcupine']) fixture.pets.push({
    ...structuredClone(fixture.pets[0]), id: crypto.randomUUID(), species, name: species, proposals: {}
  });
  db.prepare("UPDATE giochi_due SET state_json=?, version=version+1 WHERE pair_key='1:2' AND kind='nuvola'").run(JSON.stringify(fixture));
  await rory.reload(); await rory.locator('.pet-list button').nth(5).waitFor();
  for (let i = 0; i < 6; i++) {
    await rory.locator('.pet-list button').nth(i).click();
    await rory.locator('.scene').screenshot({ path: join(screenshots, `specie-${fixture.pets[i].species}.png`) });
  }
  fixture.pets[0].name = 'W'.repeat(24);
  db.prepare("UPDATE giochi_due SET state_json=?, version=version+1 WHERE pair_key='1:2' AND kind='nuvola'").run(JSON.stringify(fixture));
  await desy.reload(); await desy.getByRole('heading', { name: fixture.pets[0].name, exact: true }).waitFor();
  assert.equal(await desy.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'Nome lungo mobile overflow');
  await desy.goto(`${base}/tavolo-da-gioco/frequenze/prova`);
  await desy.waitForURL(base + '/');
  assert.equal(await desy.locator('app-frequenze-prova').count(), 0);
  assert.deepEqual(errors, []);
  console.log(`PASS: due sessioni, trappole e replay, tre round cooperativi e prova admin isolata, uovo/schiusa, nomi condivisi, shop e memory con premio persistente, mobile. Screenshot: ${screenshots}`);
} catch (error) {
  for (const [i, page] of pages.entries()) {
    await page.screenshot({ path: join(screenshots, `errore-${i}.png`), fullPage: true });
    console.error(page.url(), await page.locator('app-giochi-due, app-frequenze-prova').innerText().catch(() => 'Pagina non disponibile'));
  }
  console.error('Screenshot:', screenshots);
  throw error;
} finally {
  await browser.close(); await new Promise(resolve => server.close(resolve)); db.close();
}
