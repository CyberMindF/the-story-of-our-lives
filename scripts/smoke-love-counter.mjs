// Browser + handler reale + SQLite locale. Eseguire dopo npm run build.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdtemp } from 'node:fs/promises';
import { join, extname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import assert from 'node:assert/strict';
import { createCounterHarness } from './love-counter-test-harness.mjs';

const harness = createCounterHarness(), root = resolve('web/dist/web/browser');
let loseNextResponse = false;
const counterRequests = [], telemetry = [], presence = [], errors = [];
const server = createServer(async (req, res) => {
  try {
    const path = new URL(req.url, 'http://test').pathname;
    if (path.startsWith('/api/')) {
      const chunks = []; for await (const chunk of req) chunks.push(chunk);
      const request = new Request('http://test' + req.url, { method: req.method, headers: req.headers,
        ...(['GET', 'HEAD'].includes(req.method) ? {} : { body: Buffer.concat(chunks) }) });
      let response;
      if (path === '/api/love-counter') {
        counterRequests.push(harness.userFor(request)?.id);
        response = await harness.api({ request, env: { DB: harness.db } });
        if (loseNextResponse && req.method === 'POST') {
          loseNextResponse = false;
          res.writeHead(503, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Risposta persa dopo il salvataggio (simulazione).' })); return;
        }
      } else {
        if (path === '/api/telemetry/events') telemetry.push(JSON.parse(Buffer.concat(chunks).toString()));
        response = Response.json(path === '/api/auth/session' ? { authenticated: true, user: harness.userFor(request), adminModeEnabled: false }
          : path === '/api/world-settings' ? { settings: {}, values: { theme: 'white-world' } }
          : path === '/api/realtime' ? { enabled: true } : {});
      }
      res.writeHead(response.status, Object.fromEntries(response.headers)); res.end(Buffer.from(await response.arrayBuffer())); return;
    }
    let file = join(root, path), data;
    try { data = await readFile(file); } catch { file = join(root, 'index.html'); data = await readFile(file); }
    res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' })[extname(file)] || 'application/octet-stream');
    res.end(data);
  } catch (error) { res.writeHead(500); res.end(String(error)); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const screenshots = await mkdtemp(join(tmpdir(), 'love-counter-'));
const browser = await chromium.launch();
const open = async (user, width) => {
  const context = await browser.newContext({ viewport: { width, height: 900 }, timezoneId: 'Europe/Rome', reducedMotion: width === 1280 ? 'no-preference' : 'reduce', hasTouch: true });
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: base });
  await context.addCookies([{ name: 'counter-user', value: String(user), url: base }]);
  await context.addInitScript(id => {
    sessionStorage.setItem('noi-crossword-access-session-v1', String(id));
    sessionStorage.setItem('noi-crossword-access-session-touched-at-v1', String(Date.now()));
  }, user);
  const page = await context.newPage(); page.setDefaultTimeout(10000); page.on('pageerror', error => errors.push(error.message));
  await page.routeWebSocket(/\/api\/realtime/, socket => {
    presence.push(new URL(socket.url()).searchParams.get('path'));
    socket.onMessage(message => { const body = JSON.parse(message); if (body.path) presence.push(body.path); });
  });
  await page.goto(base + '/contatore-amore'); return { page, context };
};
const score = async (page, value) => page.waitForFunction(expected => document.querySelector('.score')?.textContent.trim() === String(expected), value);
const saved = page => page.waitForFunction(() => document.querySelector('.save-status')?.textContent.trim() === 'Salvato.');
try {
  for (const width of [1280, 390, 320]) {
    harness.sqlite.exec('DELETE FROM love_counter_episodes; DELETE FROM love_counter_settings;');
    const { page, context } = await open(1, width);
    await score(page, 20);
    assert.equal(await page.getByText('punti, adesso', { exact: true }).count(), 0, 'La label ridondante non deve comparire');
    assert.equal(await page.locator('.score-orb').evaluate(element => element.style.getPropertyValue('--liquid-level')), '100%');
    if (width === 1280) {
      assert.equal(await page.locator('.score-liquid').evaluate(element => getComputedStyle(element, '::before').animationName), 'none');
    }
    await page.getByRole('button', { name: 'Registra un episodio positivo, più 1', exact: true }).click(); await score(page, 21);
    await page.getByRole('button', { name: 'Registra un episodio negativo, meno 1', exact: true }).click(); await score(page, 20);
    assert.equal(await page.locator('.episode').count(), 2);
    await page.locator('.episode').first().getByRole('button', { name: 'Azioni episodio', exact: true }).click();
    await page.locator('.episode').first().getByRole('menuitem', { name: 'Modifica', exact: true }).click();
    await page.getByLabel('Motivazione (facoltativa)', { exact: true }).fill('Una nota privata 💗');
    await page.getByLabel('Punteggio', { exact: true }).selectOption({ label: '−2 · eccezionale' });
    await page.getByLabel('Data e ora locali').fill('2026-07-01T17:00');
    await page.getByRole('button', { name: 'Salva episodio', exact: true }).click(); await score(page, 19);
    assert.equal(await page.locator('.score-orb').evaluate(element => element.style.getPropertyValue('--liquid-level')), '95%');
    assert.equal(await page.locator('.score').evaluate(element => {
      const range = document.createRange();
      range.selectNodeContents(element);
      return range.getClientRects().length;
    }), 1, 'Il punteggio deve rimanere su una sola riga');
    const stored = harness.sqlite.prepare("SELECT * FROM love_counter_episodes WHERE reason <> ''").get();
    assert.equal(stored.occurred_at, '2026-07-01T15:00:00.000Z');
    await page.reload(); await score(page, 19);
    await page.getByText('Una nota privata 💗', { exact: true }).waitFor();
    const copiedEpisode = page.locator('.episode').filter({ hasText: 'Una nota privata 💗' });
    await copiedEpisode.getByRole('button', { name: 'Azioni episodio', exact: true }).click();
    const copyButton = copiedEpisode.getByRole('menuitem', { name: 'Copia', exact: true });
    await copyButton.click();
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'Data e ora: 01/07/2026 · 17:00:00\nPunteggio: −2\nMotivazione: Una nota privata 💗');
    assert.equal(await copiedEpisode.getByRole('button', { name: 'Azioni episodio', exact: true }).locator('.episode-menu-icon.success').count(), 1);
    await page.locator('summary').filter({ hasText: 'Punteggio iniziale' }).click();
    await page.getByLabel('Da quanti punti parti').fill('0');
    await page.getByRole('button', { name: 'Salva partenza', exact: true }).click(); await score(page, -1);
    assert.equal(await page.locator('.score-orb').evaluate(element => element.style.getPropertyValue('--liquid-level')), '0%');
    await page.locator('.plot g').first().tap();
    await page.waitForFunction(() => document.querySelector('.point-detail')?.textContent.includes('Punteggio iniziale: 0'));
    await page.getByRole('button', { name: 'Punto successivo', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('.point-detail')?.textContent.includes('01/07/2026 · 17:00:00'));
    const negative = page.locator('.episode').filter({ hasText: 'Una nota privata' });
    await negative.getByRole('button', { name: 'Azioni episodio', exact: true }).click();
    await negative.getByRole('menuitem', { name: 'Elimina', exact: true }).click();
    await negative.getByRole('button', { name: 'Annulla', exact: true }).click(); assert.equal(await page.locator('.episode').count(), 2);
    await negative.getByRole('button', { name: 'Azioni episodio', exact: true }).click();
    await negative.getByRole('menuitem', { name: 'Elimina', exact: true }).click();
    await negative.getByRole('button', { name: 'Sì, elimina', exact: true }).click(); await score(page, 1);
    loseNextResponse = true;
    await page.getByRole('button', { name: 'Registra un episodio positivo, più 1', exact: true }).click();
    await page.getByRole('button', { name: 'Riprova il salvataggio', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Riprova il salvataggio', exact: true }).click(); await score(page, 2);
    assert.equal(await page.locator('.episode').count(), 2, 'Retry non duplica');
    await page.locator('summary').filter({ hasText: 'Regole del gioco' }).click();
    assert.equal(await page.locator('.rules li').count(), 8);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Overflow a ${width}px`);
    await page.screenshot({ path: join(screenshots, `counter-${width}.png`), fullPage: true });
    await context.close();
  }
  const second = await open(2, 390); await score(second.page, 20);
  assert.equal(await second.page.locator('.episode').count(), 0, 'Isolamento secondo admin');
  await second.page.goto(base + '/profilo');
  await second.page.getByRole('link', { name: '💗 Contatore dell’Amore · personale', exact: true }).click();
  await score(second.page, 20);
  await second.context.close();
  const member = await open(3, 390);
  await member.page.waitForURL(base + '/');
  assert.ok(!counterRequests.includes(3), 'Il membro non carica neppure la API');
  await member.page.goto(base + '/profilo');
  await member.page.getByRole('heading', { name: 'Il tuo profilo', exact: false }).waitFor();
  assert.equal(await member.page.locator('a[href="/contatore-amore"]').count(), 0);
  await member.context.close();
  assert.ok(presence.length > 0);
  assert.ok(!presence.some(path => path?.includes('contatore-amore')));
  assert.ok(!telemetry.some(event => JSON.stringify(event).includes('contatore-amore')));
  assert.deepEqual(errors, []);
  console.log(`PASS: desktop/mobile 1280/390/320, CRUD, UTC/ora locale, grafico touch, base e punteggio negativo, persistenza, retry senza doppioni, guard admin e isolamento dati/presenza/telemetria. Screenshot: ${screenshots}`);
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); harness.sqlite.close(); }
