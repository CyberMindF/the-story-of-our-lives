// Solo browser locale e API simulate: non legge o modifica partite/chat reali.
// Eseguire dopo npm run build: node scripts/smoke-gdr-laboratorio.mjs
import { apiHarness } from './gdr-workspace-test-harness.mjs';
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdtemp } from 'node:fs/promises';
import { join, extname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import assert from 'node:assert/strict';

const image = '/assets/images/gdr/il-prezzo-della-verita/valin-fajar.webp';
const blocks = [
  {id:'intro', documentKey:'avventura', type:'paragraph', position:0, data:{text:'Il testo già presente nell’avventura.'}},
  {id:'title', documentKey:'avventura', type:'heading', position:1, data:{level:2,text:'Un luogo conosciuto'}},
  {id:'image', documentKey:'avventura', type:'image', position:2, data:{src:image,alt:'Un volto noto',caption:'Didascalia originale'}},
  {id:'npc', documentKey:'avventura', type:'npc_grid', position:3, data:{entries:[{name:'Valin Fajar',image,alt:'Valin',description:'Una descrizione già esistente.'}]}},
  {id:'callout', documentKey:'avventura', type:'callout', position:4, data:{lead:'Ricorda',text:'Un avviso originale.'}},
  {id:'list', documentKey:'avventura', type:'list', position:5, data:{items:['Uno','Due']}},
  {id:'table', documentKey:'avventura', type:'table', position:6, data:{header:['Oggetto','Effetto'],rows:[['Chiave','Apre la porta']]}},
  {id:'casa', documentKey:'casa-avventura', type:'paragraph', position:0, data:{text:'La casa esistente trattiene il respiro.'}},
  {id:'rules', documentKey:'maga-regole', type:'paragraph', position:0, data:{text:'Regole già salvate.'}},
  {id:'portrait', documentKey:'maga-personaggio', type:'image', position:0, data:{src:image,alt:'Il PG',caption:null}}
];
const legacyBody = 'Un turno storico.\n::: dialogo Questo deve restare testo letterale\nNon reinterpretare il passato.\n:::';
let failContent = false;
const harness=apiHarness();
let user=1;
const root = resolve('web/dist/web/browser');
const server = createServer(async (req, res) => {
  try {
    const path = new URL(req.url, 'http://test').pathname;
    if (path.startsWith('/api/media/gdr-workspace/')) {
      const object=harness.media.get(path.replace('/api/media/',''));
      if(!object){res.writeHead(404);res.end();return;}res.writeHead(200,{'Content-Type':object.type});res.end(object.data);return;
    }
    if (path === '/api/gdr-workspace/media') {
      const chunks=[];for await(const chunk of req)chunks.push(chunk);const url=new URL(req.url,'http://test');
      const response=await harness.upload(user,url.searchParams.get('character'),url.searchParams.get('slot'),Buffer.concat(chunks),{'Content-Type':req.headers['content-type']});
      res.writeHead(response.status,{'Content-Type':'application/json'});res.end(await response.text());return;
    }
    if (path.startsWith('/api/gdr-workspace')) {
      let payload;
      if(req.method==='POST'){let raw='';for await(const chunk of req)raw+=chunk;payload=JSON.parse(raw);}
      const response=await harness.call(user,req.method,payload,new URL(req.url,'http://test').searchParams.get('adventure') || 'il-prezzo-della-verita');
      res.writeHead(response.status,{'Content-Type':'application/json'});res.end(await response.text());return;
    }
    if (path.startsWith('/api/')) {
      if (failContent && path === '/api/gdr-blocks') { res.writeHead(500); res.end('{}'); return; }
      const body = path === '/api/auth/session' ? {authenticated: true, user: {id:user,nickname:user===1?'Master':'Giocatrice',identity:'lui',role:user===1?'admin':'member',isTest:false}, adminModeEnabled: false}
        : path === '/api/world-settings' ? {settings: {}, values: {theme: 'white-world'}}
        : path === '/api/realtime' ? {enabled: false}
        : path === '/api/ponti-chat' ? {messages: [], unreadCount: 3}
        : path === '/api/gdr/character-schema' ? {fields:[{key:'nome',label:'Nome',type:'text'}]}
        : path === '/api/gdr/character-fields' ? {values: {nome:'Elara'}}
        : path === '/api/gdr/notes' ? {body:'Appunti personali esistenti.'}
        : path === '/api/gdr-blocks' ? {blocks}
        : path === '/api/gdr/turns' ? {turns:[{id:17,author:'Giocatrice',isMine:false,createdAt:'2026-10-20T12:00:00Z',body:legacyBody}]} : {};
      res.setHeader('Content-Type','application/json'); res.end(JSON.stringify(body)); return;
    }
    let file = join(root, path), data;
    try { data = await readFile(file); } catch { file = join(root, 'index.html'); data = await readFile(file); }
    res.setHeader('Content-Type', ({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.svg':'image/svg+xml'})[extname(file)] || 'application/octet-stream');
    res.end(data);
  } catch (error) { res.writeHead(500); res.end(String(error)); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const fixtureBase = `http://127.0.0.1:${server.address().port}`;
const base=process.env.GDR_TEST_BASE || fixtureBase;
const screenshots = await mkdtemp(join(tmpdir(),'gdr-layout-'));
const browser = await chromium.launch();
const page = await browser.newPage({reducedMotion:'reduce'});
if(process.env.GDR_TEST_BASE)await page.route('**/api/**',async route=>{
  const req=route.request();const url=new URL(req.url());
  const response=await fetch(fixtureBase+url.pathname+url.search,{method:req.method(),headers:{'Content-Type':req.headers()['content-type']||'application/json'},body:req.postDataBuffer() ?? undefined});
  await route.fulfill({status:response.status,headers:{'Content-Type':response.headers.get('content-type')||'application/octet-stream'},body:Buffer.from(await response.arrayBuffer())});
});
const errors = []; page.on('pageerror', error => errors.push(error.message));
page.setDefaultTimeout(30000);
await page.addInitScript(() => {
  sessionStorage.setItem('noi-crossword-access-session-v1',sessionStorage.getItem('gdr-test-user')||'1');
  sessionStorage.setItem('noi-crossword-access-session-touched-at-v1',String(Date.now()));
});
const writes=[];
page.on('request',request=>{if(request.method()!=='GET'&&request.url().includes('/api/gdr')&&!request.url().includes('/api/gdr-workspace'))writes.push(request.url());});
const waitSaved=()=>page.getByRole('button',{name:'Gestisci PG e PNG',exact:true}).waitFor();
try {
  await page.goto(`${base}/tavolo-da-gioco/gdr/laboratorio`);
  await waitSaved();
  await page.getByRole('button',{name:'Scheda',exact:true}).click();
  const panel=page.getByRole('region',{name:'Scheda di gioco',exact:true});
  await panel.getByRole('button',{name:'+ Nuovo PG',exact:true}).click();
  await panel.getByLabel('Nome del nuovo personaggio',{exact:true}).fill('Ada');
  await panel.getByRole('button',{name:'Crea personaggio',exact:true}).click();
  await panel.getByRole('heading',{name:'Ada',exact:true}).waitFor();
  if(await panel.getByRole('button',{name:'Modifica scheda',exact:true}).isVisible())await panel.getByRole('button',{name:'Modifica scheda',exact:true}).click();
  await panel.getByText('Altri dettagli della scheda',{exact:true}).click();
  await panel.getByLabel('Scheda del personaggio',{exact:true}).fill('Una scheda già compilata.');
  await panel.getByRole('button',{name:'Salva scheda',exact:true}).click();
  await panel.getByText('Una scheda già compilata.',{exact:true}).waitFor();
  if(!await panel.getByLabel('Giocatore',{exact:true}).isVisible())await panel.getByText('Assegna il controllo',{exact:true}).click();
  await panel.getByLabel('Giocatore',{exact:true}).selectOption({label:'Giocatrice'});
  await panel.getByLabel('Può modificare la scheda',{exact:true}).check();
  await panel.getByLabel('Può modificare lo zaino',{exact:true}).check();
  await panel.getByRole('button',{name:'Salva assegnazione',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#grant-player')&&!document.querySelector('app-gdr-characters button[disabled]')?.textContent?.includes('Salva assegnazione'));
  // Secondo PG: nessun limite deciso dal giocatore.
  await panel.getByRole('button',{name:'+ Nuovo PG',exact:true}).click();
  await panel.getByLabel('Nome del nuovo personaggio',{exact:true}).fill('Bea');
  await panel.getByRole('button',{name:'Crea personaggio',exact:true}).click();
  await panel.getByRole('heading',{name:'Bea',exact:true}).waitFor();
  await panel.getByRole('button',{name:'Salva scheda',exact:true}).click();
  if(!await panel.getByLabel('Giocatore',{exact:true}).isVisible())await panel.getByText('Assegna il controllo',{exact:true}).click();
  await panel.getByLabel('Giocatore',{exact:true}).selectOption({label:'Giocatrice'});
  await panel.getByRole('button',{name:'Salva assegnazione',exact:true}).click();
  await panel.getByRole('button',{name:'+ Nuovo PNG',exact:true}).click();
  await panel.getByLabel('Nome del nuovo personaggio',{exact:true}).fill('Il custode');
  await panel.getByLabel('Tipo',{exact:true}).selectOption('png');
  await panel.getByRole('button',{name:'Crea personaggio',exact:true}).click();
  await panel.getByRole('heading',{name:'Il custode',exact:true}).waitFor();
  await panel.getByLabel('Aspetto',{exact:true}).fill('Un mantello consumato dal vento.');
  await panel.getByLabel('Storia',{exact:true}).fill('Custodisce il ponte da molti anni.');
  await panel.getByLabel('Obiettivo attuale',{exact:true}).fill('Ritrovare la chiave.');
  await panel.getByLabel('Carica foto del personaggio',{exact:true}).setInputFiles({name:'foto.webp',mimeType:'image/webp',buffer:await readFile(resolve('web/public/assets/images/gdr/il-prezzo-della-verita/valin-fajar.webp'))});
  await panel.getByAltText('Avatar del personaggio',{exact:true}).waitFor();
  await page.waitForFunction(()=>!document.querySelector('app-gdr-characters fieldset').disabled);
  await panel.getByRole('button',{name:'Salva scheda',exact:true}).click();
  await panel.getByText('Custodisce il ponte da molti anni.',{exact:true}).waitFor();
  if(!await panel.getByLabel('Giocatore',{exact:true}).isVisible())await panel.getByText('Assegna il controllo',{exact:true}).click();
  await panel.getByLabel('Giocatore',{exact:true}).selectOption({label:'Giocatrice'});
  assert.equal(await panel.getByLabel('Può modificare la scheda',{exact:true}).count(),0);
  await panel.getByLabel('Può modificare lo zaino',{exact:true}).check();
  await panel.getByRole('button',{name:'Salva assegnazione',exact:true}).click();
  await page.getByRole('button',{name:'Chiudi la scheda',exact:true}).click();
  const source=page.getByLabel('Il tuo turno',{exact:true});
  await source.fill('Una narrazione.');
  const editor=page.locator('app-gdr-source-editor').filter({has:page.locator('#lab-turn')});
  await editor.getByLabel('Voce',{exact:true}).selectOption({label:'Ada · PG'});
  await source.evaluate(el=>{el.focus();el.setSelectionRange(el.value.length,el.value.length);});
  await editor.getByRole('button',{name:'Parla il personaggio',exact:true}).click();
  await editor.locator('.dialogue').waitFor();
  await editor.getByLabel('Voce',{exact:true}).selectOption({label:'Il custode · PNG'});
  await editor.getByRole('button',{name:'Cambia voce nel dialogo',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#lab-turn').value.includes('::: dialogo Il custode'));
  assert.equal(await page.getByRole('button',{name:'Nuova avventura',exact:true}).count(),0,'La creazione è solo nell’hub');
  await page.goto(`${base}/tavolo-da-gioco/gdr`);
  await page.getByRole('button',{name:'Nuova avventura',exact:true}).click();
  await page.getByLabel('Titolo della nuova avventura',{exact:true}).fill('Una storia nuova');
  await page.getByRole('button',{name:'Crea e inizia a scrivere',exact:true}).click();
  await page.getByLabel('Testo completo dell’avventura',{exact:true}).fill('## Il primo capitolo\n\nUna nuova storia scritta dal sito.');
  const docEditor=page.locator('app-gdr-source-editor').filter({has:page.locator('#lab-document')});
  await docEditor.getByRole('button',{name:'Modifica: Il primo capitolo',exact:true}).click();
  await docEditor.getByLabel('Testo del blocco selezionato',{exact:true}).fill('## Capitolo rivisto');
  await docEditor.getByRole('button',{name:'Applica al testo',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#lab-document').value.startsWith('## Capitolo rivisto'));
  assert.equal(await page.getByLabel('Testo completo dell’avventura',{exact:true}).inputValue(),'## Capitolo rivisto\n\nUna nuova storia scritta dal sito.');
  await page.getByRole('button',{name:'Salva avventura',exact:true}).click();
  await page.getByText('Avventura salvata nel laboratorio.',{exact:true}).waitFor();
  await page.goto(`${base}/tavolo-da-gioco/gdr`);
  await page.locator('.tavolo-games-grid a').filter({hasText:'Una storia nuova'}).click();
  await page.getByRole('heading',{name:'Il turno',exact:true}).waitFor();
  await page.getByText('Una nuova storia scritta dal sito.',{exact:true}).waitFor();
  // Come giocatore: due PG + PNG, niente creazione o modifica scheda PNG.
  user=2;
  await page.evaluate(()=>sessionStorage.setItem('gdr-test-user','2'));
  await page.reload();
  await page.getByRole('button',{name:'Scheda',exact:true}).click();
  await panel.getByLabel('Personaggio attivo',{exact:true}).selectOption({label:'Il custode · PNG'});
  await panel.getByRole('heading',{name:'Il custode',exact:true}).waitFor();
  assert.equal(await panel.getByRole('button',{name:'Modifica scheda',exact:true}).count(),0);
  assert.equal(await panel.getByRole('button',{name:'+ Nuovo PNG',exact:true}).count(),0);
  assert.equal(await page.getByRole('button',{name:'Nuova avventura',exact:true}).count(),0);
  assert.equal(await page.getByLabel('Avventura',{exact:true}).getByText('Una storia nuova',{exact:true}).count(),0,'Le bozze del master sono private');
  await panel.getByRole('tab',{name:'Zaino',exact:false}).click();
  await panel.getByRole('button',{name:'+ Oggetto',exact:true}).click();
  await panel.getByLabel('Oggetto 1',{exact:true}).fill('Chiave di ferro');
  await panel.getByLabel('Quantità',{exact:true}).fill('2');
  await panel.getByRole('button',{name:'Salva zaino',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('app-gdr-characters input[id^="item-name-"]')?.value==='Chiave di ferro' && ![...document.querySelectorAll('app-gdr-characters button')].some(b=>b.textContent.includes('Annulla modifiche')));
  await page.reload();
  await page.getByRole('button',{name:'Scheda',exact:true}).click();
  await panel.getByRole('tab',{name:'Zaino',exact:false}).click();
  await panel.getByLabel('Zaino del personaggio',{exact:true}).selectOption({label:'Il custode · PNG'});
  await panel.getByLabel('Oggetto 1',{exact:true}).waitFor();
  assert.equal(await panel.getByLabel('Oggetto 1',{exact:true}).inputValue(),'Chiave di ferro');
  for(const width of [1280,390,320]){
    await page.setViewportSize({width,height:900});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`Overflow ${width}`);
    const sheet=await panel.boundingBox(),chat=await page.locator('.global-chat-trigger').boundingBox();
    assert.ok(sheet.y+sheet.height+10<=chat.y,'Pannello separato dalla chat');
    await page.screenshot({path:join(screenshots,`workspace-${width}.png`),fullPage:true});
    if(width===1280)await panel.screenshot({path:join(screenshots,'pannello.png')});
  }
  // Esportazione completa e reimportazione: foto, avatar e inventario viaggiano nel JSON.
  user=1;await page.evaluate(()=>sessionStorage.setItem('gdr-test-user','1'));await page.goto(`${base}/tavolo-da-gioco/gdr/gioca/il-prezzo-della-verita`);
  await page.getByRole('button',{name:'Gestisci PG e PNG',exact:true}).click();
  await panel.getByRole('tab',{name:'Personaggi',exact:false}).click();
  await panel.getByLabel('Personaggio attivo',{exact:true}).selectOption({label:'Il custode · PNG'});
  await panel.locator('.gdr-panel-content').evaluate(el=>el.scrollTop=0);
  await panel.screenshot({path:join(screenshots,'gestione-png.png')});
  const downloadPromise=page.waitForEvent('download');await panel.getByRole('button',{name:'Esporta personaggio',exact:true}).click();
  const downloaded=await downloadPromise;const bundle=JSON.parse(await readFile(await downloaded.path(),'utf8'));
  assert.equal(bundle.profile.history,'Custodisce il ponte da molti anni.');assert.equal(bundle.inventory[0].name,'Chiave di ferro');assert.match(bundle.images.avatar,/^data:image\/webp;base64,/);assert.match(bundle.images.photo,/^data:image\/webp;base64,/);
  bundle.grants=[{userId:2,canEditSheet:true}];
  await panel.getByLabel('Importa personaggio JSON',{exact:true}).setInputFiles({name:'png.personaggio.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(bundle))});
  await panel.getByRole('button',{name:'Conferma importazione',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#workspace-character')?.options.length===4 && !document.querySelector('app-gdr-characters fieldset').disabled);
  const importedId=await panel.getByLabel('Personaggio attivo',{exact:true}).inputValue();
  assert.equal(harness.sqlite.prepare('SELECT COUNT(*) n FROM gdr_workspace_grants WHERE character_id=?').get(importedId).n,0);
  const imported=harness.sqlite.prepare('SELECT * FROM gdr_workspace_characters WHERE id=?').get(importedId);
  assert.match(imported.portrait,/^\/api\/media\/gdr-workspace\//);assert.equal(JSON.parse(imported.inventory_json)[0].name,'Chiave di ferro');
  user=2;await page.evaluate(()=>sessionStorage.setItem('gdr-test-user','2'));
  await page.goto(`${base}/tavolo-da-gioco/gdr`);
  await page.getByRole('heading',{name:'Gioco di Ruolo',exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Nuova avventura',exact:true}).count(),0,'Il giocatore non crea dall’hub');
  assert.equal(await page.locator('.tavolo-games-grid a').filter({hasText:'Una storia nuova'}).count(),0,'La bozza privata non compare nell’hub del giocatore');
  assert.deepEqual(writes,[],'Nessuna scrittura sulle avventure originali');
  assert.deepEqual(errors,[]);
  console.log(`PASS: avventure, multi-PG/PNG, modifica nel punto selezionato, profili guidati, foto e avatar, export/import completo, permessi, inventario persistente e 3 viewport. Screenshot: ${screenshots}`);
} catch(error){await page.screenshot({path:join(screenshots,'errore.png'),fullPage:true});console.error('Screenshot:',screenshots);console.error('Browser errors:',errors);console.error((await page.locator('app-gdr-characters').innerText().catch(()=>'' )).slice(-1800));throw error;}
finally{await browser.close();await new Promise(resolve=>server.close(resolve));harness.sqlite.close();}
