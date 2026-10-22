// Incolla immagini soltanto in un browser locale con API simulate: nessun upload remoto.
// Eseguire dopo npm run build: node scripts/smoke-card-image-paste.mjs
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdtemp } from 'node:fs/promises';
import { join, extname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import assert from 'node:assert/strict';

const root = resolve('web/dist/web/browser');
const uploads = [];
const server = createServer(async (req, res) => {
  try {
    const path = new URL(req.url, 'http://test').pathname;
    if (path.startsWith('/api/')) {
      const chunks = []; for await (const chunk of req) chunks.push(chunk);
      const rawBody = Buffer.concat(chunks);
      if (path === '/api/carte-media/upload') uploads.push({ type: req.headers['content-type'], bytes: rawBody.length });
      const postedDesign = path === '/api/carte-designs' && req.method === 'POST' ? JSON.parse(rawBody.toString()) : null;
      const body = path === '/api/auth/session' ? { authenticated: true, user: { id: 1, nickname: 'Admin', identity: 'lui', role: 'admin', isTest: false }, adminModeEnabled: true }
        : path === '/api/world-settings' ? { settings: {}, values: { theme: 'white-world' } }
        : path === '/api/realtime' ? { enabled: false }
        : path === '/api/carte-sets' ? { sets: [{ id: '1', slug: 'prova', nome: 'Prova', descrizione: null, position: 0 }] }
        : path === '/api/carte-designs' && req.method === 'POST' ? { id: String(uploads.length), position: 0, ...postedDesign, setId: String(postedDesign.setId) }
        : path === '/api/carte-designs' ? { designs: [] }
        : path === '/api/carte-media/upload' ? { key: `carte/test-${uploads.length}.png` }
        : path === '/api/carte-collezione' ? { carte: [], altroNickname: 'Desy' }
        : path === '/api/carte-trade' ? { trades: [] }
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
const screenshots = await mkdtemp(join(tmpdir(), 'card-image-paste-'));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
const errors = []; page.on('pageerror', error => errors.push(error.message)); page.setDefaultTimeout(10000);
await page.addInitScript(() => {
  sessionStorage.setItem('noi-crossword-access-session-v1', '1');
  sessionStorage.setItem('noi-crossword-access-session-touched-at-v1', String(Date.now()));
});
const paste = (locator, type, content = 'image') => locator.evaluate((element, input) => {
  const transfer = new DataTransfer();
  if (input.type === 'text/plain') transfer.setData('text/plain', input.content);
  else {
    const binary = input.content === 'image'
      ? Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='), character => character.charCodeAt(0))
      : new TextEncoder().encode(input.content);
    transfer.items.add(new File([binary], input.type === 'image/png' ? 'immagine-incollata.png' : 'non-supportata.gif', { type: input.type }));
  }
  const event = new ClipboardEvent('paste', { clipboardData: transfer, bubbles: true, cancelable: true });
  element.dispatchEvent(event);
  return event.defaultPrevented;
}, { type, content });
try {
  await page.goto(base + '/tavolo-da-gioco/carte/catalogo');
  await page.getByRole('button', { name: '+ Nuova carta', exact: true }).click();
  const dialog = page.getByRole('dialog');
  assert.equal(await paste(dialog, 'text/plain', 'nome normale'), false, 'Il testo non deve essere intercettato');
  assert.equal(await paste(dialog, 'image/png'), true, 'L’immagine deve essere intercettata');
  await page.getByRole('link', { name: 'Apri immagine originale ↗', exact: true }).waitFor();
  assert.match(await page.getByRole('link', { name: 'Apri immagine originale ↗', exact: true }).getAttribute('href'), /^blob:/);
  assert.equal(await paste(dialog, 'image/gif', 'GIF89a'), true);
  await page.getByText(/Scegli o incolla un’immagine JPG, PNG o WebP/).waitFor();
  assert.match(await page.getByRole('link', { name: 'Apri immagine originale ↗', exact: true }).getAttribute('href'), /^blob:/, 'Un incolla non valido non rimuove l’immagine pronta');
  await page.getByLabel('Nome della carta').fill('Carta incollata');
  await page.getByRole('button', { name: 'Salva carta', exact: true }).click();
  await page.getByText('“Carta incollata” aggiunta al gioco.', { exact: true }).waitFor();
  assert.deepEqual(uploads[0], { type: 'image/png', bytes: 68 });
  await page.screenshot({ path: join(screenshots, 'catalogo-incolla.png'), fullPage: true });

  await page.goto(base + '/tavolo-da-gioco/carte');
  await page.getByRole('tab', { name: 'Editor', exact: true }).click();
  const editor = page.locator('.carte-editor-panel');
  assert.equal(await paste(editor, 'text/plain', 'testo'), false);
  assert.equal(await paste(editor, 'image/png'), true);
  const ready = page.locator('.carte-editor-image-ready');
  await ready.getByText('Immagine pronta: immagine-incollata.png', { exact: true }).waitFor();
  assert.match(await ready.locator('img').getAttribute('src'), /^blob:/);
  await page.locator('.carte-editor-panel select').selectOption('1');
  await page.locator('.carte-editor-panel input[type="text"]').last().fill('Altra carta incollata');
  await page.getByRole('button', { name: 'Crea carta', exact: true }).click();
  await page.waitForFunction(() => !document.querySelector('.carte-editor-image-ready'));
  assert.deepEqual(uploads[1], { type: 'image/png', bytes: 68 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Nessun overflow su mobile');
  await page.screenshot({ path: join(screenshots, 'editor-incolla.png'), fullPage: true });
  assert.deepEqual(errors, []);
  console.log(`PASS: Ctrl/Cmd+V nel catalogo e nell'Editor, anteprima immediata, testo non intercettato, GIF rifiutata e layout mobile. Screenshot: ${screenshots}`);
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
