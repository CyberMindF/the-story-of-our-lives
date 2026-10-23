// Verifica locale che la Bacheca non monti né richieda tutti i media all'apertura.
// Eseguire dopo npm run build: node scripts/smoke-bacheca-performance.mjs
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, resolve } from 'node:path';
import assert from 'node:assert/strict';

const root = resolve('web/dist/web/browser');
const transparentPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
const periods = [{ id: 'periodo', title: 'Periodo', position: 0 }];
const days = Array.from({ length: 19 }, (_, dayIndex) => ({
  id: String(dayIndex + 1),
  periodId: 'periodo',
  slug: `giorno-${dayIndex + 1}`,
  title: `Giorno ${dayIndex + 1}`,
  position: dayIndex,
  memoryDate: null,
  content: {
    rows: [
      ...Array.from({ length: 10 }, (_, rowIndex) => ({
        columns: Array.from({ length: 3 }, (_, columnIndex) => {
          const photoIndex = rowIndex * 3 + columnIndex + 1;
          return {
            width: 1 / 3,
            blocks: [{
              type: 'photo',
              key: `bacheca/giorno-${dayIndex + 1}/original/${photoIndex}.jpg`,
              thumbKey: `bacheca/giorno-${dayIndex + 1}/thumb/${photoIndex}.jpg`
            }]
          };
        })
      })),
      { columns: [{ width: 1, blocks: [{ type: 'video', key: `bacheca/giorno-${dayIndex + 1}/video.mp4` }] }] }
    ]
  }
}));

const server = createServer(async (req, res) => {
  try {
    const path = new URL(req.url, 'http://test').pathname;
    if (path.startsWith('/api/media/')) {
      res.setHeader('Content-Type', path.endsWith('.mp4') ? 'video/mp4' : 'image/png');
      res.end(path.endsWith('.mp4') ? Buffer.alloc(0) : transparentPng);
      return;
    }
    if (path.startsWith('/api/')) {
      const body = path === '/api/auth/session' ? { authenticated: true, user: { id: 1, nickname: 'Rory', identity: 'lui', role: 'user', isTest: false }, adminModeEnabled: false }
        : path === '/api/world-settings' ? { settings: {}, values: { theme: 'red-of-you' } }
        : path === '/api/realtime' ? { enabled: false }
        : path === '/api/bacheca-periods' ? { periods }
        : path === '/api/bacheca-days' ? { days }
        : path === '/api/carte-bustine' ? { quantitaDisponibile: 0, altroQuantitaDisponibile: 0, minutiResidui: 10, streakCorrente: 0, streakMigliore: 0, streakBustineBonus: 0, streakPrimaVisitaOggi: false }
        : path === '/api/ponti-chat' ? { messages: [], unreadCount: 0 }
        : {};
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(body));
      return;
    }
    let file = join(root, path);
    let data;
    try { data = await readFile(file); } catch { file = join(root, 'index.html'); data = await readFile(file); }
    res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' })[extname(file)] || 'application/octet-stream');
    res.end(data);
  } catch (error) {
    res.writeHead(500);
    res.end(String(error));
  }
});

await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const errors = [];
  const mediaRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    const path = new URL(request.url()).pathname;
    if (path.startsWith('/api/media/')) mediaRequests.push(path);
  });
  await page.addInitScript(() => {
    sessionStorage.setItem('noi-crossword-access-session-v1', '1');
    sessionStorage.setItem('noi-crossword-access-session-touched-at-v1', String(Date.now()));
  });

  await page.goto(base + '/bacheca');
  await page.getByRole('link', { name: 'Giorno 19', exact: true }).waitFor();
  await page.locator('#periodo-giorno-1').scrollIntoViewIfNeeded();
  await page.locator('#periodo-giorno-1 .memory-photo img').first().waitFor();

  const mountedPhotos = await page.locator('.memory-photo').count();
  assert.ok(mountedPhotos < 228, `Sono state montate troppe foto all'apertura: ${mountedPhotos}/228`);
  assert.equal(await page.locator('#periodo-giorno-1 video').getAttribute('preload'), 'none');
  assert.equal(mediaRequests.some(path => path.endsWith('.mp4')), false, 'I video non devono partire prima del play');
  await page.waitForTimeout(250);
  const earlyOriginals = new Set(mediaRequests.filter(path => path.includes('/original/')));
  assert.ok(earlyOriginals.size > 0, 'Le foto vicine al viewport devono iniziare a caricarsi in alta qualità');
  assert.ok(earlyOriginals.size < mountedPhotos, `Sono partiti troppi originali: ${earlyOriginals.size}/${mountedPhotos}`);
  const farPhoto = page.locator('#periodo-giorno-1 .memory-photo img').last();
  assert.equal(await farPhoto.getAttribute('src'), '/api/media/bacheca/giorno-1/thumb/30.jpg');
  assert.equal(earlyOriginals.has('/api/media/bacheca/giorno-1/original/30.jpg'), false, 'Una foto lontana non deve caricare l’originale');

  await farPhoto.scrollIntoViewIfNeeded();
  const farPhotoHandle = await farPhoto.elementHandle();
  await page.waitForFunction((image) => image?.getAttribute('src')?.includes('/original/'), farPhotoHandle);
  assert.equal(await farPhoto.getAttribute('src'), '/api/media/bacheca/giorno-1/original/30.jpg');

  await page.locator('#periodo-giorno-1 .memory-photo button').first().click();
  assert.equal(await page.locator('.memory-lightbox img').getAttribute('src'), '/api/media/bacheca/giorno-1/original/1.jpg');
  const closeButton = page.locator('.memory-lightbox-close');
  assert.equal(await closeButton.getAttribute('aria-label'), 'Chiudi foto');
  assert.equal(await closeButton.locator('svg').count(), 1);
  const closeAlignment = await closeButton.evaluate((button) => {
    const buttonRect = button.getBoundingClientRect();
    const iconRect = button.querySelector('svg').getBoundingClientRect();
    return {
      horizontal: Math.abs(buttonRect.left + buttonRect.width / 2 - (iconRect.left + iconRect.width / 2)),
      vertical: Math.abs(buttonRect.top + buttonRect.height / 2 - (iconRect.top + iconRect.height / 2)),
    };
  });
  assert.ok(closeAlignment.horizontal < 0.5, `Close icon is not horizontally centered: ${closeAlignment.horizontal}px`);
  assert.ok(closeAlignment.vertical < 0.5, `Close icon is not vertically centered: ${closeAlignment.vertical}px`);
  await closeButton.click();

  await page.getByRole('link', { name: 'Giorno 19', exact: true }).click();
  await page.locator('#periodo-giorno-19 .memory-photo img').first().waitFor();
  await page.waitForFunction(() => document.querySelector('#periodo-giorno-19 .memory-photo img')?.getAttribute('src')?.includes('/original/'));
  assert.equal(await page.locator('#periodo-giorno-19 .memory-photo img').first().getAttribute('src'), '/api/media/bacheca/giorno-19/original/1.jpg');

  await page.goto(base + '/bacheca?giorno=19&blocco=0-0-0');
  const linkedBlock = page.locator('#bacheca-blocco-19-0-0-0');
  await linkedBlock.waitFor();
  assert.equal(await linkedBlock.evaluate(element => element.classList.contains('memory-block-highlight')), true);
  assert.deepEqual(errors, []);
  console.log(`PASS: apertura progressiva (${mountedPhotos}/228 foto montate), originali solo vicino al viewport, lightbox nitido, video fermi e deep-link funzionante.`);
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
