import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = 'http://localhost:8788';
const output = path.resolve('documentazione/screenshots');
const worldKey = process.env.WORLD_KEY;
if (!worldKey) throw new Error('WORLD_KEY mancante');
const temporaryPassword = `Manuale-${crypto.randomUUID()}!`;

await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });

async function shot(name, route, options = {}) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(output, `${name}.png`), fullPage: options.fullPage ?? false });
}

await shot('01-portone', '/');
await page.getByRole('button', { name: 'Registrati', exact: true }).click();
await page.getByRole('textbox', { name: 'Email', exact: true }).fill(`manuale-${Date.now()}@example.test`);
await page.locator('app-password-field input').fill(temporaryPassword);
await page.getByLabel('Imposta un nome').fill('Visitatore');
await page.getByLabel('La chiave').fill(worldKey);
await page.getByRole('button', { name: 'Registrati ed entra' }).click();
await page.waitForURL('**/mondo-bianco');
await page.evaluate(() => {
  const raw = sessionStorage.getItem('noi-crossword-access-session-v1');
  if (raw) sessionStorage.setItem('noi-crossword-access-session-touched-at-v1', String(Date.now()));
});
await page.waitForTimeout(1200);
await page.screenshot({ path: path.join(output, '02-mondo-bianco.png'), fullPage: false });

const routes = [
  ['03-bacheca', '/bacheca'],
  ['04-mappa', '/mappa'],
  ['05-mappamondo', '/mappamondo'],
  ['06-cuffiette', '/cuffiette'],
  ['07-agenda', '/cose-da-fare-insieme'],
  ['08-ricettario', '/ricettario'],
  ['09-tavolo', '/tavolo-da-gioco'],
  ['10-stanza-bottoni', '/impostazioni-mondo'],
  ['11-profilo', '/profilo'],
  ['12-calendario', '/calendario'],
  ['13-storie', '/storie'],
  ['14-lettere', '/lettere'],
  ['15-domande', '/domande'],
  ['16-suggerimenti', '/suggerimenti'],
  ['17-linguaggio', '/linguaggio-segreto'],
  ['18-gdr', '/tavolo-da-gioco/gdr'],
  ['19-cruciverba', '/tavolo-da-gioco/cruciverba'],
  ['20-cielo', '/il-cielo']
];
for (const [name, route] of routes) await shot(name, route);

await browser.close();
