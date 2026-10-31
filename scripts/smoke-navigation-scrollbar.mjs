// Controllo visivo/funzionale locale della navigazione lunga, senza API reali.
// Eseguire dopo npm run build: node scripts/smoke-navigation-scrollbar.mjs
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdtemp } from 'node:fs/promises';
import { join, extname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import assert from 'node:assert/strict';

const root = resolve('web/dist/web/browser');
const server = createServer(async (req, res) => {
  try {
    const path = new URL(req.url, 'http://test').pathname;
    if (path.startsWith('/api/')) {
      const body = path === '/api/auth/session' ? { authenticated: true, user: { id: 1, nickname: 'Rory', identity: 'lui', role: 'admin', isTest: false }, adminModeEnabled: false }
        : path === '/api/world-settings' ? { settings: {}, values: { theme: 'red-of-you' } }
        : path === '/api/realtime' ? { enabled: false }
        : path === '/api/carte-bustine' ? { quantitaDisponibile: 0, altroQuantitaDisponibile: 0, minutiResidui: 10, streakCorrente: 0, streakMigliore: 0, streakBustineBonus: 0, streakPrimaVisitaOggi: false }
        : path === '/api/ponti-chat' ? { messages: [], unreadCount: 0 } : {};
      res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(body)); return;
    }
    let file = join(root, path), data;
    try { data = await readFile(file); } catch { file = join(root, 'index.html'); data = await readFile(file); }
    res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' })[extname(file)] || 'application/octet-stream');
    res.end(data);
  } catch (error) { res.writeHead(500); res.end(String(error)); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const screenshots = await mkdtemp(join(tmpdir(), 'navigation-scrollbar-'));
const browser = await chromium.launch();
try {
  for (const [width, height] of [[320, 700], [390, 700], [820, 900], [1280, 800]]) {
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      sessionStorage.setItem('noi-crossword-access-session-v1', '1');
      sessionStorage.setItem('noi-crossword-access-session-touched-at-v1', String(Date.now()));
    });
    await page.goto(base + '/ponti');
    if (width <= 680) {
      const trigger = page.getByRole('button', { name: 'Apri i comandi rapidi', exact: true });
      const before = await trigger.boundingBox();
      await page.evaluate(() => window.scrollBy(0, 200));
      const after = await trigger.boundingBox();
      assert.ok(Math.abs(after.y - before.y) < 1, 'I comandi devono restare disponibili durante lo scorrimento');
      await trigger.click();
      const rail = page.locator('.world-navigation-rail');
      await rail.waitFor({ state: 'visible' });
      for (const name of ["Vai all'inizio della pagina", 'Vai alla fine della pagina', 'Vai al Mondo Bianco']) {
        assert.equal(await rail.getByRole(name === 'Vai al Mondo Bianco' ? 'link' : 'button', { name, exact: true }).isVisible(), true);
      }
      await page.screenshot({ path: join(screenshots, `quick-${width}.png`) });
      await rail.getByRole('button', { name: "Vai all'inizio della pagina", exact: true }).click();
      await page.getByRole('button', { name: 'Apri i comandi rapidi', exact: true }).click();
    }
    await page.getByRole('button', { name: 'Apri il pannello con tutti i luoghi', exact: true }).click();
    const sheet = page.locator('.world-navigation-sheet');
    await page.locator('.world-navigation-sheet:not([aria-hidden])').waitFor();
    const games = sheet.locator('.world-navigation-entry').filter({ has: page.locator('a[href="/tavolo-da-gioco"]') });
    assert.equal(await games.locator('a.is-secondary').count(), 8, 'Tutti gli otto giochi devono comparire sotto il Tavolo');
    for (const game of ['trappole', 'frequenze', 'animali']) {
      assert.equal(await games.locator(`a[href="/tavolo-da-gioco/${game}"]`).count(), 1);
    }
    const gameRoutes = await games.locator('a.is-secondary').evaluateAll(links => links.map(link => link.getAttribute('href')).sort());
    assert.equal(await games.locator('a[href="/linguaggio-segreto"]').count(), 0);
    const bridges = sheet.locator('.world-navigation-entry').filter({ has: page.locator('a[href="/ponti"]') });
    assert.equal(await bridges.locator('a[href="/linguaggio-segreto"]').count(), 1, 'Il Linguaggio appartiene ai Ponti');
    const observatory = sheet.locator('.world-navigation-group').filter({ has: page.getByRole('heading', { name: /Osservatorio/ }) });
    const suggestions = observatory.locator('a[href="/suggerimenti"]');
    assert.equal(await suggestions.count(), 1, 'I Suggerimenti appartengono all’Osservatorio');
    assert.equal(await suggestions.evaluate(link => link.classList.contains('is-secondary')), false);
    for (const route of ['/capsula-del-tempo', '/aula-studio', '/novita']) {
      assert.equal(await sheet.locator(`a[href="${route}"]`).count(), 1, `${route} deve essere raggiungibile dalla sidebar`);
    }
    const initial = await sheet.evaluate(element => ({
      gutter: element.offsetWidth - element.clientWidth,
      scrollable: element.scrollHeight > element.clientHeight,
      scrollbarWidth: getComputedStyle(element).scrollbarWidth,
      scrollbarColor: getComputedStyle(element).scrollbarColor,
    }));
    assert.equal(initial.scrollable, true, `Il menu deve scorrere a ${width}px`);
    assert.ok(initial.gutter <= 12, `Scrollbar troppo larga a ${width}px: ${initial.gutter}px`);
    assert.equal(initial.scrollbarWidth, 'thin');
    assert.notEqual(initial.scrollbarColor, 'auto');
    const generic = await page.evaluate(() => {
      const scroller = document.createElement('div');
      scroller.setAttribute('data-scroll-test', '');
      scroller.style.cssText = 'position:fixed;left:0;top:0;width:100px;height:100px;overflow:auto;z-index:-1';
      const content = document.createElement('div'); content.style.height = '500px'; scroller.append(content); document.body.append(scroller);
      const style = getComputedStyle(scroller);
      const result = { scrollable: scroller.scrollHeight > scroller.clientHeight, gutter: scroller.offsetWidth - scroller.clientWidth, width: style.scrollbarWidth, color: style.scrollbarColor };
      scroller.remove(); return result;
    });
    assert.equal(generic.scrollable, true);
    assert.ok(generic.gutter <= 12, `Scrollbar generica troppo larga: ${generic.gutter}px`);
    assert.equal(generic.width, 'thin');
    assert.notEqual(generic.color, 'auto');
    await sheet.evaluate(element => element.scrollTo({ top: element.scrollHeight }));
    await page.waitForFunction(() => {
      const element = document.querySelector('.world-navigation-sheet');
      return element && element.scrollTop + element.clientHeight >= element.scrollHeight - 1;
    });
    const lastLink = page.locator('.world-navigation-links a').last();
    assert.equal(await lastLink.evaluate(element => {
      const link = element.getBoundingClientRect(), sheet = element.closest('.world-navigation-sheet').getBoundingClientRect();
      return link.bottom <= sheet.bottom && link.top >= sheet.top;
    }), true, 'L’ultima destinazione deve restare raggiungibile');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.deepEqual(errors, []);
    await page.screenshot({ path: join(screenshots, `menu-${width}.png`), fullPage: true });
    await page.goto(base + '/tavolo-da-gioco');
    await page.getByRole('heading', { name: 'Il Tavolo da Gioco' }).waitFor();
    const hubRoutes = await page.locator('.tavolo-games-grid a').evaluateAll(links => links.map(link => link.getAttribute('href')).sort());
    assert.deepEqual(hubRoutes, gameRoutes, 'Tavolo e sidebar devono mostrare gli stessi giochi');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log(`PASS: sidebar aggiornata, otto giochi coerenti con il Tavolo, Linguaggio nei Ponti, Suggerimenti nell’Osservatorio, menu scorrevole e nessun overflow a 320/390/820/1280px. Screenshot: ${screenshots}`);
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
