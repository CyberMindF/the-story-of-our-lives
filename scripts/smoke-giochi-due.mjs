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
    const context = await browser.newContext({ viewport: { width: 1280, height: 960 }, reducedMotion: 'reduce', hasTouch: true });
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
  const clickAction = async (page, locator) => {
    const response = page.waitForResponse(r => r.url().includes('/api/giochi-due/') && r.request().method() === 'POST');
    await locator.click(); const result = await response;
    assert.equal(result.status(), 200, await result.text());
  };
  const coopState = () => JSON.parse(db.prepare("SELECT state_json FROM giochi_due WHERE pair_key='1:2' AND kind='frequenze'").get().state_json);
  const freshPuzzle = async page => {
    await page.reload(); await page.locator('.puzzle-panel').waitFor();
  };
  const coopAction = async (seat, selector) => {
    const page = pages[seat]; await freshPuzzle(page);
    await clickAction(page, selector(page));
  };
  const coordinate = (cell, size) => String.fromCharCode(65 + Math.floor(cell / size)) + (cell % size + 1);
  const checkTogether = async label => {
    for (const seat of [0, 1]) await coopAction(seat, page => page.getByRole('button', { name: label, exact: true }));
  };
  const route = (p, goal) => {
    const queue = [[p.position]], seen = new Set([p.position]);
    for (const path of queue) {
      const here = path.at(-1); if (here === goal) return path.slice(1);
      for (const edge of p.edges) if (edge.includes(here)) {
        const next = edge.find(cell => cell !== here);
        if (!seen.has(next)) { seen.add(next); queue.push([...path, next]); }
      }
    }
    throw new Error('Nessun percorso nella fixture maze');
  };
  const families = ['code', 'maze', 'circuit', 'order', 'dossier', 'mosaic', 'balance', 'pipes'];
  for (const family of families) {
    console.log('Cooperativo, prova', family);
    await go(rory, 'frequenze');
    await rory.getByLabel(/^Tipo di partita/).selectOption(family);
    if (family !== 'code') await rory.getByLabel(/^Difficoltà/).selectOption('easy');
    await clickAction(rory, rory.getByRole('button', { name: 'Apri una stanza per due' }));
    await rory.getByRole('heading', { name: 'Manca il secondo giocatore!' }).waitFor();
    await go(desy, 'frequenze');
    await clickAction(desy, desy.getByRole('button', { name: 'Entra nella partita' }));
    await freshPuzzle(rory); await freshPuzzle(desy);
    await rory.screenshot({ path: join(screenshots, `frequenze-${family}-a-desktop.png`), fullPage: true });
    await desy.setViewportSize({ width: 390, height: 844 });
    assert.equal(await desy.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${family} mobile overflow`);
    await desy.screenshot({ path: join(screenshots, `frequenze-${family}-b-mobile.png`), fullPage: true });
    await desy.setViewportSize({ width: 1280, height: 960 });
    const p = coopState().room.puzzle; // Private oracle ONLY in this in-memory harness.
    if (family === 'code') {
      const legend = await desy.locator('.legend div').evaluateAll(nodes => Object.fromEntries(nodes.map(n => [n.querySelector('span').textContent, n.querySelector('strong').textContent])));
      const symbols = await rory.locator('.symbol-strip span').allTextContents();
      assert.equal(symbols.length, 4); assert.equal(await rory.locator('.legend').count(), 0);
      assert.equal(await desy.locator('.symbol-strip').count(), 0);
      await clickAction(desy, desy.getByRole('button', { name: 'Ho la legenda, sono pronta/o' }));
      await freshPuzzle(rory);
      for (const digit of symbols.map(symbol => legend[symbol])) await rory.locator('.keypad').getByRole('button', { name: digit, exact: true }).click();
      await clickAction(rory, rory.getByRole('button', { name: 'Apri il lucchetto' }));
    } else if (family === 'maze') {
      for (const target of [...p.keys, p.goal]) {
        const path = route(coopState().room.puzzle, target);
        for (const cell of path) {
          const current = coopState().room.puzzle;
          await coopAction(current.turn, page => page.locator('.maze-cell').nth(cell));
        }
      }
    } else if (family === 'circuit') {
      for (let index = 0; index < p.solution.length; index++) if (p.solution[index]) {
        await coopAction(index % 2, page => page.locator('.switches button').filter({ hasText: `T${index + 1} ·` }));
      }
    } else if (family === 'order') {
      for (let i = 0; i < p.solution.length; i++) {
        const name = p.items.find(item => item.id === p.solution[i]).name;
        while (coopState().room.puzzle.order.indexOf(p.solution[i]) > i) {
          await coopAction(i % 2, page => page.getByRole('button', { name: 'Sposta prima ' + name, exact: true }));
        }
      }
      await checkTogether('Per me l’ordine è giusto');
    } else if (family === 'dossier') {
      const name = p.suspects.find(item => item.id === p.solution).name;
      for (const seat of [0, 1]) await coopAction(seat, page => page.getByRole('button', { name: 'Scelgo ' + name, exact: true }));
    } else if (family === 'mosaic') {
      for (let cell = 0; cell < p.solution.length; cell++) if (p.solution[cell]) {
        const seat = (Math.floor(cell / p.size) + cell % p.size) % 2;
        await coopAction(seat, page => page.locator('.mosaic-cell').nth(cell));
      }
      await checkTogether('Per me il mosaico è pronto');
    } else if (family === 'balance') {
      for (const seat of [0, 1]) for (const index of p.solution[seat]) {
        await coopAction(seat, page => page.locator('.weights button').nth(index));
      }
      await checkTogether('Controlliamo il carico');
    } else if (family === 'pipes') {
      for (let cell = 0; cell < p.cells.length; cell++) {
        let turns = 0;
        while (JSON.stringify(coopState().room.puzzle.cells[cell]) !== JSON.stringify(p.solution[cell])) {
          assert.ok(turns++ < 4, 'Orientamento irraggiungibile ' + coordinate(cell, p.size));
          const seat = (Math.floor(cell / p.size) + cell % p.size) % 2;
          await coopAction(seat, page => page.locator('.pipe-cell').nth(cell));
        }
      }
      await checkTogether('Proviamo ad accenderlo');
    }
    await rory.reload(); await desy.reload();
    await rory.getByRole('heading', { name: 'Partita completata!', exact: true }).waitFor();
    await desy.getByRole('heading', { name: 'Partita completata!', exact: true }).waitFor();
    const finished = coopState().room;
    assert.equal(finished.errors, 0, family + ' unexpected errors');
    assert.equal(finished.results.length, 1); assert.equal(finished.results[0].type, family);
  }
  // Una stanza interattiva: il percorso passa da entrambi i dispositivi, senza soluzioni nell’API.
  const machineSteps = [
    [1,'Piattaforma'],[0,'Manovella oraria'],[1,'Ripiano 1'],[1,'Rotolo di corda'],
    [1,'Leva'],[0,'Cassetto'],[0,'Ingranaggio nel cassetto','Ruota destra'],[1,'Leva'],[1,'Sfera','Piattaforma'],
    [0,'Manovella antioraria'],[1,'Ripiano 0'],[1,'Sfera','Ripiano 0'],[1,'Ripiano 1'],
    [1,'Leva'],[0,'Cinghia','Ruota destra'],[1,'Leva'],
    [0,'Manovella oraria'],[0,'Manovella oraria'],[0,'Manovella oraria'],
    [1,'Leva'],[0,'Cinghia','Ruota sinistra'],[1,'Leva'],
    [1,'Ripiano 0'],[1,'Sfera','Piattaforma'],[0,'Manovella oraria'],[0,'Manovella oraria'],
    [1,'Ripiano 1'],[1,'Ripiano 2'],[1,'Sfera','Ripiano 2'],[0,'Chiavistello'],[1,'Porticina']
  ];
  const machineAction = async (page, scope, label, destination, drag = false) => {
    const source = scope.getByRole('button',{name:label,exact:true});
    if (destination && !drag) await source.tap();
    const response = page.waitForResponse(r=>r.url().includes('/api/giochi-due/') && r.request().method()==='POST');
    const target = scope.getByRole('button',{name:destination || label,exact:true});
    if (drag && label === 'Manovella oraria') {
      const stage = scope.locator('.outer-stage'); await stage.scrollIntoViewIfNeeded(); const box = await stage.boundingBox();
      await page.mouse.move(box.x+box.width*348/620,box.y+box.height*255/430); await page.mouse.down();
      await page.mouse.move(box.x+box.width*330/620,box.y+box.height*310/430,{steps:12}); await page.mouse.up();
    } else if (destination && drag) {
      await source.scrollIntoViewIfNeeded(); const a = await source.boundingBox(), b = await target.boundingBox();
      await page.mouse.move(a.x+a.width/2,a.y+a.height/2); await page.mouse.down();
      await page.mouse.move(b.x+b.width*(destination.startsWith('Ripiano')?.85:.5),b.y+b.height/2,{steps:12}); await page.mouse.up();
    } else if ((destination || label).startsWith('Ripiano')) {
      const box=await target.boundingBox(); await target[drag?'click':'tap']({position:{x:box.width*.85,y:box.height/2}});
    } else await target[drag?'click':'tap']();
    const result=await response; assert.equal(result.status(),200,await result.text());
  };
  await go(rory,'frequenze');
  await clickAction(rory,rory.getByRole('button',{name:'Io sto fuori',exact:true}));
  await go(desy,'frequenze');
  await clickAction(desy,desy.getByRole('button',{name:'Entra nella partita',exact:true}));
  await freshPuzzle(rory); await freshPuzzle(desy);
  assert.equal(await rory.locator('.inner-stage').count(),0); assert.equal(await desy.locator('.outer-stage').count(),0);
  for (const [index,page] of pages.entries()) {
    for (const width of [1280,390,320]) {
      await page.setViewportSize({width,height:900});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`Machine ${index} ${width} overflow`);
      await page.screenshot({path:join(screenshots,`machine-${index}-${width}.png`),fullPage:true});
    }
    await page.setViewportSize({width:1280,height:960});
  }
  // Selezione da tastiera ed Escape senza inviare comandi.
  await rory.getByRole('button',{name:'Cinghia',exact:true}).focus();
  await rory.keyboard.press('Enter');
  await rory.waitForFunction(()=>document.querySelector('[aria-label="Cinghia"]')?.getAttribute('aria-pressed')==='true');
  await rory.keyboard.press('Escape');
  await rory.waitForFunction(()=>document.querySelector('[aria-label="Cinghia"]')?.getAttribute('aria-pressed')==='false');
  for (const [index,[seat,label,destination]] of machineSteps.entries()) {
    await freshPuzzle(pages[seat]);
    await machineAction(pages[seat],pages[seat],label,destination,true);
    if(index===18) {await freshPuzzle(desy);await desy.screenshot({path:join(screenshots,'machine-charged.png'),fullPage:true});}
  }
  assert.equal(coopState().room.status,'won'); assert.equal(coopState().room.errors,0);
  assert.equal(coopState().room.results[0].moves,machineSteps.length,'Un drag non deve inviare anche un click');
  await rory.reload(); await rory.getByRole('heading',{name:'Partita completata!',exact:true}).waitFor();
  const realCoop = db.prepare("SELECT state_json FROM giochi_due WHERE pair_key='1:2' AND kind='frequenze'").get().state_json;
  await rory.getByRole('link', { name: /Prova da solo/ }).click();
  const panels = rory.locator('.screens > section');
  const explorer = panels.nth(0), guide = panels.nth(1);
  await explorer.getByLabel(/^Tipo di partita/).selectOption('code');
  await clickAction(rory, explorer.getByRole('button', { name: 'Apri una stanza per due' }));
  await clickAction(rory, guide.getByRole('button', { name: 'Entra nella partita' }));
  const adminLegend = await guide.locator('.legend div').evaluateAll(nodes => Object.fromEntries(nodes.map(n => [n.querySelector('span').textContent, n.querySelector('strong').textContent])));
  const adminSymbols = await explorer.locator('.symbol-strip span').allTextContents();
  await clickAction(rory, guide.getByRole('button', { name: 'Ho la legenda, sono pronta/o' }));
  for (const digit of adminSymbols.map(symbol => adminLegend[symbol])) await explorer.locator('.keypad').getByRole('button', { name: digit, exact: true }).click();
  await clickAction(rory, explorer.getByRole('button', { name: 'Apri il lucchetto' }));
  await explorer.getByRole('heading', { name: 'Partita completata!', exact: true }).waitFor();
  await rory.screenshot({ path: join(screenshots, 'frequenze-admin.png'), fullPage: true });
  await clickAction(rory, rory.getByRole('button', { name: /Azzera la prova/ }));
  await explorer.getByRole('button', { name: 'Apri una stanza per due' }).waitFor();
  assert.equal(db.prepare("SELECT state_json FROM giochi_due WHERE pair_key='1:2' AND kind='frequenze'").get().state_json, realCoop);
  // Stessa stanza in admin con A dentro e B fuori: controlli e stato invertiti realmente.
  await clickAction(rory,explorer.getByRole('button',{name:'Io entro nella scatola',exact:true}));
  await clickAction(rory,guide.getByRole('button',{name:'Entra nella partita',exact:true}));
  await explorer.locator('.inner-stage').waitFor(); await guide.locator('.outer-stage').waitFor();
  await rory.screenshot({path:join(screenshots,'machine-admin.png'),fullPage:true});
  await rory.setViewportSize({width:390,height:844});
  for (const [seat,label,destination] of machineSteps) await machineAction(rory,panels.nth(1-seat),label,destination);
  await explorer.getByRole('heading',{name:'Partita completata!',exact:true}).waitFor();
  await clickAction(rory,rory.getByRole('button',{name:/Azzera la prova/}));
  assert.equal(db.prepare("SELECT state_json FROM giochi_due WHERE pair_key='1:2' AND kind='frequenze'").get().state_json,realCoop);
  await rory.setViewportSize({width:1280,height:960});
  // Layout più densi: tabelloni difficili, due pannelli admin e schermi stretti.
  await explorer.getByLabel(/^Tipo di partita/).selectOption('pipes');
  await explorer.getByLabel(/^Difficoltà/).selectOption('hard');
  await clickAction(rory, explorer.getByRole('button', { name: 'Apri una stanza per due' }));
  await clickAction(rory, guide.getByRole('button', { name: 'Entra nella partita' }));
  await explorer.locator('.pipe-cell').nth(24).waitFor();
  await rory.screenshot({ path: join(screenshots, 'frequenze-admin-hard-desktop.png'), fullPage: true });
  for (const width of [390, 320]) {
    await rory.setViewportSize({ width, height: 844 });
    assert.equal(await rory.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Admin hard ${width}px overflow`);
    await rory.screenshot({ path: join(screenshots, `frequenze-admin-hard-${width}.png`), fullPage: true });
  }
  await rory.setViewportSize({ width: 1280, height: 960 });
  await clickAction(rory, rory.getByRole('button', { name: /Azzera la prova/ }));
  assert.equal(db.prepare("SELECT state_json FROM giochi_due WHERE pair_key='1:2' AND kind='frequenze'").get().state_json, realCoop);
  for (const family of ['maze', 'mosaic', 'pipes']) {
    console.log('Cooperativo, layout difficile', family);
    await go(rory, 'frequenze');
    await rory.getByLabel(/^Tipo di partita/).selectOption(family);
    await rory.getByLabel(/^Difficoltà/).selectOption('hard');
    await clickAction(rory, rory.getByRole('button', { name: 'Apri una stanza per due' }));
    await go(desy, 'frequenze');
    await clickAction(desy, desy.getByRole('button', { name: 'Entra nella partita' }));
    await freshPuzzle(rory); await freshPuzzle(desy);
    await rory.screenshot({ path: join(screenshots, `frequenze-${family}-hard-desktop.png`), fullPage: true });
    for (const width of [390, 320]) {
      await desy.setViewportSize({ width, height: 844 });
      assert.equal(await desy.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${family} hard ${width}px overflow`);
      await desy.screenshot({ path: join(screenshots, `frequenze-${family}-hard-${width}.png`), fullPage: true });
    }
    await desy.setViewportSize({ width: 1280, height: 960 });
    rory.once('dialog', dialog => dialog.accept());
    await clickAction(rory, rory.getByRole('button', { name: 'Chiudi la partita', exact: true }));
  }
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
  console.log(`PASS: due sessioni, trappole e replay, 8 famiglie cooperative e marchingegno completato anche in admin a ruoli invertiti, screenshot desktop/mobile a 390/320px, prova admin isolata, uovo/schiusa, nomi condivisi, shop e memory con premio persistente. Screenshot: ${screenshots}`);
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
