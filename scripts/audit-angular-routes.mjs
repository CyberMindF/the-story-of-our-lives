import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const baseUrl = process.env.ANGULAR_AUDIT_URL || 'http://localhost:4200';
const auditKind = process.env.AUDIT_KIND || 'angular';
const allowLegacyResources = auditKind === 'legacy';
const requestedViewport = process.env.AUDIT_VIEWPORT || 'all';
const chromePort = 9333;
const chromeBinary =
  process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const outputDirectory = path.join(tmpdir(), `mondo-bianco-${auditKind}-${requestedViewport}-audit`);
const protectedReadyExpression =
  auditKind === 'legacy' ? "document.querySelector('.place-shell')" : "document.querySelector('app-shell')";

const routes = [
  { path: '/mondo-bianco', bodyClass: 'world-page' },
  { path: '/ponti', bodyClass: 'ponti-page' },
  { path: '/calendario', bodyClass: 'calendar-page' },
  { path: '/cuffiette', bodyClass: 'music-page' },
  { path: '/suggerimenti', bodyClass: 'suggerimenti-page' },
  { path: '/storie', bodyClass: 'stories-page' },
  { path: '/mappa', bodyClass: 'map-page' },
  { path: '/mappamondo', bodyClass: 'globe-page' },
  { path: '/bacheca', bodyClass: 'bacheca-page' },
  { path: '/lettere', bodyClass: 'lettere-page' },
  { path: '/tavolo-da-gioco', bodyClass: 'tavolo-page' },
  { path: '/tavolo-da-gioco/gdr', bodyClass: 'tavolo-page' },
  { path: '/tavolo-da-gioco/gdr/il-prezzo-della-verita', bodyClass: 'tavolo-page' },
  { path: '/tavolo-da-gioco/gdr/il-prezzo-della-verita/avventura', bodyClass: 'tavolo-page' },
  { path: '/tavolo-da-gioco/gdr/il-prezzo-della-verita/la-tua-maga', bodyClass: 'tavolo-page' },
  { path: '/tavolo-da-gioco/gdr/il-prezzo-della-verita/i-tuoi-appunti', bodyClass: 'tavolo-page' },
  { path: '/tavolo-da-gioco/cruciverba', bodyClass: null }
];
if (auditKind === 'angular') {
  routes.push({ path: '/pagina-che-non-esiste', bodyClass: 'not-found-page', readyExpression: "document.querySelector('.not-found-main')" });
}

const devVars = await readFile('.dev.vars', 'utf8');
const worldKey = devVars.match(/^WORLD_KEY\s*=\s*["']?(.+?)["']?\s*$/m)?.[1];
if (!worldKey) throw new Error('WORLD_KEY non trovata in .dev.vars');

await mkdir(outputDirectory, { recursive: true });
const profileDirectory = await mkdtemp(path.join(tmpdir(), 'mondo-bianco-chrome-'));
const chrome = spawn(
  chromeBinary,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--remote-debugging-port=${chromePort}`,
    `--user-data-dir=${profileDirectory}`,
    'about:blank'
  ],
  { stdio: 'ignore' }
);

try {
  const tab = await waitForChromeTab();
  const socket = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });

  let sequence = 0;
  const pending = new Map();
  let activeAudit = null;

  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      message.error ? reject(new Error(message.error.message)) : resolve(message.result);
      return;
    }

    if (!activeAudit) return;
    if (message.method === 'Runtime.exceptionThrown') {
      activeAudit.exceptions.push(message.params.exceptionDetails.text || 'Runtime exception');
    }
    if (message.method === 'Log.entryAdded' && ['error', 'warning'].includes(message.params.entry.level)) {
      activeAudit.console.push(`${message.params.entry.level}: ${message.params.entry.text}`);
    }
    if (message.method === 'Network.loadingFailed' && !message.params.canceled) {
      activeAudit.network.push(`failed: ${message.params.errorText}`);
    }
    if (message.method === 'Network.responseReceived' && message.params.response.status >= 400) {
      activeAudit.network.push(`${message.params.response.status}: ${message.params.response.url}`);
    }
  });

  function send(method, params = {}) {
    const id = ++sequence;
    socket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
  }

  async function evaluate(expression) {
    const result = await send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true
    });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  }

  async function waitFor(expression, timeout = 15000) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeout) {
      if (await evaluate(`Boolean(${expression})`)) return;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error(`Timeout aspettando: ${expression}`);
  }

  async function navigate(url) {
    await send('Page.navigate', { url });
    await waitFor("document.readyState === 'complete'");
  }

  async function screenshot(fileName) {
    const result = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
    await writeFile(path.join(outputDirectory, fileName), Buffer.from(result.data, 'base64'));
  }

  await Promise.all([send('Page.enable'), send('Runtime.enable'), send('Log.enable'), send('Network.enable')]);
  await setViewport(send, { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await navigate(baseUrl);
  await waitFor("document.body.classList.contains('portone-page')");
  const portone = await collectPageState(evaluate, 'portone-page');
  await screenshot('desktop-portone.png');

  const suffix = Date.now();
  const registration = await evaluate(`(async () => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        email: 'angular-audit-${suffix}@example.test',
        password: 'AngularAudit-${suffix}',
        nickname: 'Angular Audit',
        worldKey: ${JSON.stringify(worldKey)},
        notifyEmailUpdates: false
      })
    });
    return {status: response.status, body: await response.json()};
  })()`);
  if (registration.status !== 201) throw new Error(`Registrazione locale fallita: ${registration.status}`);
  await evaluate(
    `sessionStorage.setItem('noi-crossword-access-session-v1', ${JSON.stringify(String(registration.body.user.id))})`
  );

  const report = { generatedAt: new Date().toISOString(), auditKind, baseUrl, portone, desktop: [], mobile: [] };
  const viewports = [
    { name: 'desktop', width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false },
    { name: 'mobile', width: 390, height: 844, deviceScaleFactor: 2, mobile: true }
  ].filter((viewport) => requestedViewport === 'all' || viewport.name === requestedViewport);
  for (const viewport of viewports) {
    await setViewport(send, viewport);
    for (const route of routes) {
      activeAudit = { console: [], exceptions: [], network: [] };
      await navigate(`${baseUrl}${route.path}`);
      await waitFor(route.readyExpression || protectedReadyExpression);
      await new Promise((resolve) => setTimeout(resolve, 700));
      const state = await collectPageState(evaluate, route.bodyClass);
      const slug = route.path.slice(1).replaceAll('/', '--');
      await screenshot(`${viewport.name}-${slug}.png`);
      report[viewport.name].push({ route: route.path, ...state, ...activeAudit });
      report.summary = summarize(report);
      await writeFile(path.join(outputDirectory, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
      console.log(`${viewport.name.padEnd(7)} ${route.path} ${state.ok ? 'OK' : 'FAIL'}`);
      activeAudit = null;
    }
  }

  report.summary = summarize(report);
  console.log(JSON.stringify(report.summary, null, 2));
  console.log(`Report e screenshot: ${outputDirectory}`);
  socket.close();
} finally {
  chrome.kill('SIGTERM');
}

async function waitForChromeTab() {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 15000) {
    try {
      const tabs = await fetch(`http://127.0.0.1:${chromePort}/json/list`).then((response) => response.json());
      const tab = tabs.find((entry) => entry.type === 'page');
      if (tab) return tab;
    } catch {
      // Chrome non ha ancora aperto la porta DevTools.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Chrome DevTools non disponibile');
}

async function setViewport(send, viewport) {
  await send('Emulation.setDeviceMetricsOverride', viewport);
}

async function collectPageState(evaluate, expectedBodyClass) {
  return evaluate(`(() => {
    const brokenImages = [...document.images]
      .filter((image) => (image.currentSrc || image.getAttribute('src')) && image.complete && image.naturalWidth === 0)
      .map((image) => image.currentSrc || image.src);
    const legacyResources = performance.getEntriesByType('resource')
      .map((entry) => entry.name)
      .filter((url) => url.includes('/assets/js/') || url.includes('/legacy-archive/'));
    const heading = document.querySelector('h1')?.textContent?.replace(/\\s+/g, ' ').trim() || '';
    const bodyClassValid = ${JSON.stringify(expectedBodyClass)} === null || document.body.classList.contains(${JSON.stringify(expectedBodyClass)});
    const stars = document.querySelectorAll('.world-star').length;
    const horizontalOverflow = document.documentElement.scrollWidth > window.innerWidth + 2;
    const errorText = [...document.querySelectorAll('body *')]
      .filter((element) => element.children.length === 0 && /(impossibile|errore interno)/i.test(element.textContent || ''))
      .map((element) => element.textContent.trim())
      .slice(0, 10);
    const ok = Boolean(heading) && bodyClassValid && stars === 150 && brokenImages.length === 0 && (${JSON.stringify(allowLegacyResources)} || legacyResources.length === 0) && !horizontalOverflow;
    return {
      ok,
      heading,
      bodyClasses: [...document.body.classList],
      bodyClassValid,
      stars,
      brokenImages,
      legacyResources,
      horizontalOverflow,
      errorText,
      documentSize: {width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight},
      viewport: {width: innerWidth, height: innerHeight}
    };
  })()`);
}

function summarize(report) {
  const entries = [...report.desktop, ...report.mobile];
  return {
    routesChecked: entries.length,
    passed: entries.filter((entry) => entry.ok).length,
    failed: entries.filter((entry) => !entry.ok).map((entry) => `${entry.route} (${entry.viewport.width}px)`),
    consoleMessages: entries.flatMap((entry) => entry.console.map((message) => `${entry.route}: ${message}`)),
    exceptions: entries.flatMap((entry) => entry.exceptions.map((message) => `${entry.route}: ${message}`)),
    networkIssues: entries.flatMap((entry) => entry.network.map((message) => `${entry.route}: ${message}`))
  };
}
