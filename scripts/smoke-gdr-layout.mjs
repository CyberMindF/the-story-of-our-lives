// Solo browser locale e API simulate: non legge o modifica partite/chat reali.
// Eseguire dopo npm run build: node scripts/smoke-gdr-layout.mjs
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
      const body = path === '/api/auth/session' ? {authenticated: true, user: {id: 1, nickname: 'Rory', identity: 'lui', role: 'admin', isTest: false}, adminModeEnabled: false}
        : path === '/api/world-settings' ? {settings: {}, values: {theme: 'white-world'}}
        : path === '/api/realtime' ? {enabled: false}
        : path === '/api/ponti-chat' ? {messages: [], unreadCount: 3}
        : path === '/api/gdr/character-schema' ? {fields: Array.from({length: 15}, (_, i) => ({key: 'field-'+i, label: 'Caratteristica '+i, type: 'number', min: 0, max: 10}))}
        : path === '/api/gdr/character-fields' ? {values: {}}
        : path === '/api/gdr-blocks' ? {blocks: []}
        : path === '/api/gdr/turns' ? {turns: []} : {};
      res.setHeader('Content-Type','application/json'); res.end(JSON.stringify(body)); return;
    }
    let file = join(root, path), data;
    try { data = await readFile(file); } catch { file = join(root, 'index.html'); data = await readFile(file); }
    res.setHeader('Content-Type', ({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.svg':'image/svg+xml'})[extname(file)] || 'application/octet-stream');
    res.end(data);
  } catch (error) { res.writeHead(500); res.end(String(error)); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const screenshots = await mkdtemp(join(tmpdir(),'gdr-layout-'));
const browser = await chromium.launch();
const page = await browser.newPage({reducedMotion:'reduce'});
const errors = []; page.on('pageerror', error => errors.push(error.message));
page.setDefaultTimeout(10000);
await page.addInitScript(() => {
  sessionStorage.setItem('noi-crossword-access-session-v1','1');
  sessionStorage.setItem('noi-crossword-access-session-touched-at-v1',String(Date.now()));
});
const routes = ['il-prezzo-della-verita/avventura','la-casa-che-trattiene-il-respiro'];
const assertSeparate = async selector => {
  const panel = await page.locator(selector).boundingBox(), chat = await page.locator('.global-chat-trigger').boundingBox();
  assert.ok(panel && chat, 'Scheda e chat devono essere visibili');
  assert.ok(panel.y + panel.height + 12 <= chat.y, `${selector} invade lo spazio della chat`);
  assert.ok(panel.y >= 0 && panel.x >= 0, 'La scheda esce dallo schermo');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'Overflow orizzontale');
  assert.equal(await page.locator('.global-chat-trigger').evaluate(el => {
    const r = el.getBoundingClientRect(); return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));
  }),true,'Il cerchio chat deve restare raggiungibile anche con la scheda aperta');
};
try {
  for (const [index, route] of routes.entries()) {
    for (const [width,height] of [[1280,900],[768,1024],[640,800],[390,844],[320,640],[844,390]]) {
      await page.setViewportSize({width,height});
      await page.goto(`${base}/tavolo-da-gioco/gdr/${route}`);
      await page.locator('.gdr-panel-trigger').waitFor(); await page.locator('.global-chat-trigger.has-unread').waitFor();
      await assertSeparate('.gdr-panel-trigger');
      await page.getByRole('button',{name:'Scheda',exact:true}).click();
      await page.locator('.gdr-field-row').nth(14).waitFor();
      await assertSeparate('.gdr-panel-sheet');
      await page.locator('.gdr-field-row').last().scrollIntoViewIfNeeded();
      const sheet = await page.locator('.gdr-panel-sheet').boundingBox(), last = await page.locator('.gdr-field-row').last().boundingBox();
      assert.ok(last.y + last.height <= sheet.y + sheet.height, 'Ultimo campo tagliato');
      if ([1280,390,320].includes(width)) await page.screenshot({path:join(screenshots,`gdr-${index}-${width}.png`),fullPage:true});
      await page.getByRole('button',{name:'Chiudi la scheda',exact:true}).click();
      await assertSeparate('.gdr-panel-trigger');
    }
  }
  assert.deepEqual(errors,[]);
  console.log(`PASS: entrambe le avventure, 6 viewport (320–1280px e landscape), scheda chiusa/aperta, badge non letti, chat raggiungibile e ultimo campo visibile. Screenshot: ${screenshots}`);
} catch (error) {
  await page.screenshot({path:join(screenshots,'errore.png'),fullPage:true});
  console.error('Screenshot:',screenshots); throw error;
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
