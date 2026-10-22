// Regressione della chat flottante: rete lenta e refresh realtime, solo dati locali simulati.
// Eseguire dopo npm run build: node scripts/smoke-chat-layout.mjs
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdtemp } from 'node:fs/promises';
import { join, extname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import assert from 'node:assert/strict';

const root = resolve('web/dist/web/browser'), pending = [];
const message = i => ({id:String(i),senderUserId:i%2?1:2,senderIdentity:i%2?'lui':'lei',body:`Messaggio di prova ${i}`,mediaKey:null,mediaType:null,readAt:null,createdAt:'2026-10-22T12:00:00Z'});
const messages = Array.from({length:30},(_,i)=>message(i));
const server = createServer(async (req,res) => {
  try {
    const path = new URL(req.url,'http://test').pathname;
    if(path.startsWith('/api/')) {
      res.setHeader('Content-Type','application/json');
      if(path==='/api/ponti-chat' && req.method==='GET') { pending.push(res); return; }
      const body = path==='/api/auth/session' ? {authenticated:true,user:{id:1,nickname:'Rory',identity:'lui',role:'admin',isTest:false},adminModeEnabled:false}
        : path==='/api/world-settings' ? {settings:{},values:{theme:'white-world'}}
        : path==='/api/realtime' ? {enabled:true}
        : path==='/api/ponti-chat' ? {...message(31),body:'Invio di prova'} : {};
      res.end(JSON.stringify(body)); return;
    }
    let file=join(root,path),data;
    try {data=await readFile(file);} catch {file=join(root,'index.html');data=await readFile(file);}
    res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.svg':'image/svg+xml'})[extname(file)]||'application/octet-stream');
    res.end(data);
  } catch(error) {res.writeHead(500);res.end(String(error));}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
const screenshots=await mkdtemp(join(tmpdir(),'chat-layout-'));
const browser=await chromium.launch();
const reply = async (items=messages) => {
  for(let i=0;pending.length===0 && i<100;i++) await new Promise(resolve=>setTimeout(resolve,10));
  assert.ok(pending.length,'Richiesta chat non ricevuta');
  pending.shift().end(JSON.stringify({messages:items,unreadCount:0}));
};
try {
  for(const width of [1280,390,320]) {
    const page=await browser.newPage({viewport:{width,height:844},reducedMotion:'reduce'});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(10000);
    let onConnected;const connected=new Promise(resolve=>{onConnected=resolve;});
    await page.routeWebSocket(/\/api\/realtime/,ws=>onConnected(ws));
    await page.addInitScript(()=>{
      sessionStorage.setItem('noi-crossword-access-session-v1','1');
      sessionStorage.setItem('noi-crossword-access-session-touched-at-v1',String(Date.now()));
    });
    await page.goto(base+'/tavolo-da-gioco/gdr');
    const socket=await connected;
    await page.getByRole('button',{name:'Apri la chat globale',exact:true}).click();
    await page.getByText('Caricamento…',{exact:true}).waitFor();
    const geometry = () => page.evaluate(()=>{
      const box=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return [r.x,r.y,r.width,r.height];};
      const log=document.querySelector('.global-chat-log');
      return {panel:box('.global-chat-panel'),header:box('.global-chat-header'),compose:box('.global-chat-compose'),log:box('.global-chat-log'),scroll:log.scrollTop,height:log.scrollHeight,first:document.querySelector('.global-chat-message')?.getBoundingClientRect().y};
    });
    const initial=await geometry();
    await reply();
    await page.waitForFunction(()=>document.querySelectorAll('.global-chat-message').length===30);
    const atBottom=()=>page.waitForFunction(()=>{const el=document.querySelector('.global-chat-log');return el && el.scrollHeight-el.clientHeight-el.scrollTop<2;});
    await atBottom();
    const loaded=await geometry();
    for(const part of ['panel','header','compose','log']) assert.deepEqual(loaded[part],initial[part],`Primo caricamento sposta ${part}, ${width}px`);
    const refresh = async (before, items=messages) => {
      socket.send(JSON.stringify({type:'ponti-chat:changed',occurredAt:new Date().toISOString()}));
      await page.waitForFunction(()=>document.querySelector('.global-chat-log')?.getAttribute('aria-busy')==='true');
      assert.equal(await page.getByText('Caricamento…',{exact:true}).count(),0,'Nessun loader fra i messaggi già presenti');
      assert.deepEqual(await geometry(),before,`Refresh in corso sposta la chat, ${width}px`);
      await reply(items);
      await page.waitForFunction(()=>document.querySelector('.global-chat-log')?.getAttribute('aria-busy')==='false');
    };
    await refresh(loaded);assert.deepEqual(await geometry(),loaded,'Refresh completato sposta la chat');
    await page.locator('.global-chat-log').evaluate(el=>{el.scrollTop=150;});
    const reading=await geometry();await refresh(reading);assert.deepEqual(await geometry(),reading,'Refresh interrompe la lettura');
    await refresh(reading,[...messages,message(30)]);
    const appended=await geometry();assert.equal(appended.scroll,reading.scroll);assert.equal(appended.first,reading.first);
    await page.getByRole('button',{name:'Chiudi chat',exact:true}).click();
    socket.send(JSON.stringify({type:'ponti-chat:changed',occurredAt:new Date().toISOString()}));
    await page.getByRole('button',{name:'Apri la chat globale',exact:true}).click();
    assert.equal(await page.getByText('Caricamento…',{exact:true}).count(),0,'Riapertura con cache senza loader');
    await reply([...messages,message(30)]);await atBottom();
    await page.getByRole('textbox',{name:'Messaggio',exact:true}).fill('Invio di prova');
    await page.getByRole('button',{name:'Invia messaggio',exact:true}).click();
    await page.getByText('Invio di prova',{exact:true}).waitFor();await atBottom();
    assert.deepEqual(errors,[]);
    await page.screenshot({path:join(screenshots,`chat-${width}.png`),fullPage:true});
    await page.close();
  }
  console.log(`PASS: chat 1280/390/320px, primo caricamento lento, refresh identico e nuovo messaggio, scroll di lettura preservato, riapertura durante refresh e invio. Screenshot: ${screenshots}`);
} finally {
  for(const response of pending) response.end('{}');
  await browser.close();await new Promise(resolve=>server.close(resolve));
}
