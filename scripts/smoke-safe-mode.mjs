// Eseguire dopo npm run build. API simulate; verifica accesso, filtri e preferenze separate.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, resolve } from 'node:path';
import assert from 'node:assert/strict';
const root = resolve('web/dist/web/browser');
const preferences = new Map([[1, true], [2, false]]);
const news = [
  { id:'1', kind:'mondo', title:'Novità studio', body:'Quiz disponibili', safe:true, active:true, announce:true, seen:true, publishedAt:'2026-10-30T00:00:00Z' },
  { id:'2', kind:'mondo', title:'Una lettera romantica', body:'NON SAFE', safe:false, active:true, announce:true, seen:true, publishedAt:'2026-10-30T00:00:00Z' }
];
let failSave = false;
const server = createServer(async (req, res) => {
  try {
    const path = new URL(req.url, 'http://test').pathname;
    if (path.startsWith('/api/')) {
      const id = Number(/user=(\d+)/.exec(req.headers.cookie || '')?.[1] || 1);
      const user = {id, nickname:'Test', email:'test@example.com', identity:id === 1 ? 'lui' : 'lei', role:'member', isTest:false, safeMode:preferences.get(id)};
      let body = {};
      if (path === '/api/auth/safe-mode') {
        let data=''; for await (const chunk of req) data+=chunk;
        if (failSave) { res.writeHead(500, {'Content-Type':'application/json'}); res.end('{}'); return; }
        preferences.set(id, JSON.parse(data).enabled); body={ safeMode:preferences.get(id) };
      } else if (path === '/api/auth/session') body={authenticated:true,user};
      else if (path === '/api/world-settings') body={settings:{hearts:true}, values:{theme:'love'}};
      else if (path === '/api/realtime') body={enabled:false};
      else if (path === '/api/world-updates') body={updates:news.filter(n => !preferences.get(id) || n.safe)};
      res.setHeader('Content-Type','application/json'); res.end(JSON.stringify(body)); return;
    }
    let file=join(root,path), data;
    try { data=await readFile(file); } catch { file=join(root,'index.html'); data=await readFile(file); }
    res.setHeader('Content-Type', ({'.js':'text/javascript','.html':'text/html','.css':'text/css','.svg':'image/svg+xml','.json':'application/json'})[extname(file)] || 'application/octet-stream');
    res.end(data);
  } catch(e) {res.writeHead(500);res.end(String(e));}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch();
try {
 for (const width of [390,1280]) {
  const context=await browser.newContext({viewport:{width,height:850}});
  const page=await context.newPage(); const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await context.addCookies([{name:'user',value:'1',url:base}]);
  await page.addInitScript(()=>{
    sessionStorage.setItem('noi-crossword-access-session-v1','1');
    sessionStorage.setItem('noi-crossword-access-session-touched-at-v1',String(Date.now()));
  });
  await page.goto(base+'/');
  await page.getByRole('heading',{name:'Il Mondo Bianco',exact:true}).waitFor();
  assert.equal(await page.locator('.world-music').count(),0);
  assert.equal(await page.locator('app-world-hearts').count(),0);
  assert.equal(await page.locator('app-global-chat-widget').count(),0);
  assert.equal(await page.locator('a[href="/bacheca"]').count(),0);
  assert.equal(await page.locator('a[href="/aula-studio"]').count()>0,true);
  assert.equal(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgb(245, 246, 248)');
  await page.screenshot({path:`/tmp/safe-mode-${width}.png`});
  await page.goto(base+'/bacheca');
  await page.waitForURL(base+'/');
  await page.goto(base+'/tavolo-da-gioco');
  await page.locator('.tavolo-games-grid').waitFor();
  assert.equal(await page.locator('.tavolo-game-card').count(),2);
  await page.goto(base+'/novita');
  await page.getByRole('tab',{name:'Novità del Mondo',exact:true}).click();
  await page.getByRole('heading',{name:'Novità studio'}).waitFor();
  assert.equal(await page.getByText('Una lettera romantica',{exact:true}).count(),0);
  failSave=true;
  await page.getByRole('checkbox',{name:'Safe mode',exact:true}).click();
  await page.getByRole('alert').waitFor();
  assert.equal(await page.getByRole('checkbox',{name:'Safe mode',exact:true}).isChecked(),true);
  failSave=false;
  await page.getByRole('checkbox',{name:'Safe mode',exact:true}).uncheck();
  await page.waitForFunction(()=>!document.body.classList.contains('safe-mode'));
  assert.equal(preferences.get(1),false); assert.equal(preferences.get(2),false);
  await page.goto(base+'/'); await page.locator('.world-music').waitFor();
  await page.getByRole('checkbox',{name:'Safe mode',exact:true}).check();
  await page.locator('.world-music').waitFor({state:'detached'});
  await page.reload(); await page.getByRole('checkbox',{name:'Safe mode',exact:true}).waitFor();
  assert.equal(await page.getByRole('checkbox',{name:'Safe mode',exact:true}).isChecked(),true);
  assert.equal(preferences.get(2),false);
  await page.goto(base+'/login');
  await page.getByRole('heading',{name:'Ti ricordi della chiave?'}).waitFor();
  assert.equal(await page.locator('.portone-story').count(),0);
  await page.getByRole('combobox', {name:'Safe mode',exact:true}).selectOption('false');
  await page.locator('input[name="worldKey"]').fill('chiave-test');
  await page.getByRole('button',{name:'Entra',exact:true}).click();
  await page.waitForURL(base+'/');
  await page.locator('.world-music').waitFor();
  assert.equal(preferences.get(1),false);
  await page.goto(base+'/login');
  await page.getByRole('combobox', {name:'Safe mode',exact:true}).selectOption('true');
  await page.locator('input[name="worldKey"]').fill('chiave-test');
  await page.getByRole('button',{name:'Entra',exact:true}).click();
  await page.waitForURL(base+'/');
  assert.equal(preferences.get(1),true);
  assert.equal(await page.locator('.world-music').count(),0);
  assert.deepEqual(errors,[]);
  await context.close();
 }
 news.forEach(update => update.seen = false);
 const context = await browser.newContext();
 await context.addCookies([{name:'user',value:'1',url:base}]);
 const page = await context.newPage();
 await page.addInitScript(() => {
   sessionStorage.setItem('noi-crossword-access-session-v1','1');
   sessionStorage.setItem('noi-crossword-access-session-touched-at-v1',String(Date.now()));
 });
 await page.goto(base+'/');
 const dialog = page.getByRole('dialog');
 await dialog.waitFor();
 assert.equal(await dialog.getByRole('heading',{name:'Novità studio',exact:true}).count(),1);
 assert.equal(await dialog.getByText('Una lettera romantica',{exact:true}).count(),0);
 await page.getByRole('button',{name:'Chiudi le novità',exact:true}).click();
 await dialog.waitFor({state:'detached'});
 assert.equal(await page.locator('.daily-reward,.world-promo').count(),0);
 await context.close();
 console.log('Safe mode: controlli desktop/mobile, filtri, link diretti, persistenza, separazione account e errore salvataggio superati.');
} finally {await browser.close(); await new Promise(r=>server.close(r));}
