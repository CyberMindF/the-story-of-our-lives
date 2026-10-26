// Solo browser locale e API simulate: non legge o modifica partite/chat reali.
// Eseguire dopo npm run build: node scripts/smoke-gdr-laboratorio.mjs
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
const root = resolve('web/dist/web/browser');
const server = createServer(async (req, res) => {
  try {
    const path = new URL(req.url, 'http://test').pathname;
    if (path.startsWith('/api/')) {
      if (failContent && path === '/api/gdr-blocks') { res.writeHead(500); res.end('{}'); return; }
      const body = path === '/api/auth/session' ? {authenticated: true, user: {id: 1, nickname: 'Rory', identity: 'lui', role: 'admin', isTest: false}, adminModeEnabled: false}
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
const base = `http://127.0.0.1:${server.address().port}`;
const screenshots = await mkdtemp(join(tmpdir(),'gdr-layout-'));
const browser = await chromium.launch();
const page = await browser.newPage({reducedMotion:'reduce'});
const errors = []; page.on('pageerror', error => errors.push(error.message));
page.setDefaultTimeout(30000);
await page.addInitScript(() => {
  sessionStorage.setItem('noi-crossword-access-session-v1','1');
  sessionStorage.setItem('noi-crossword-access-session-touched-at-v1',String(Date.now()));
});
const writes = [];
page.on('request', request => { if (/\/api\/gdr(?:[/-]|$)/.test(new URL(request.url()).pathname) && request.method() !== 'GET') writes.push(request.url()); });
const editor = () => page.locator('app-gdr-source-editor').filter({has:page.locator('#lab-turn')});
try {
  await page.goto(`${base}/tavolo-da-gioco/gdr`);
  await page.getByRole('heading',{name:'Gioco di Ruolo',exact:true}).waitFor();
  assert.equal(await page.locator('app-editorial-text').count(),1,'L’introduzione resta nell’hub');
  assert.equal(await page.getByRole('heading',{name:'Il turno',exact:true}).count(),0,'L’hub non apre un’avventura');
  await page.locator('.tavolo-games-grid a').filter({hasText:'La casa che trattiene il respiro'}).click();
  await page.getByRole('heading',{name:'Il turno',exact:true}).waitFor();
  assert.equal(await page.getByLabel('Avventura',{exact:true}).inputValue(),'la-casa-che-trattiene-il-respiro');
  await page.getByText('La casa esistente trattiene il respiro.',{exact:true}).waitFor();
  await page.goto(`${base}/tavolo-da-gioco/gdr`);
  await page.locator('.tavolo-games-grid a').filter({hasText:'Il Prezzo della Verità'}).click();
  await page.getByRole('heading',{name:'Il turno',exact:true}).waitFor();
  assert.equal(await page.getByLabel('Avventura',{exact:true}).inputValue(),'il-prezzo-della-verita');
  assert.equal(await page.getByRole('link',{name:/Versione classica/}).count(),0);
  await page.goto(`${base}/tavolo-da-gioco/gdr/classico`);
  await page.getByRole('heading',{name:/Gioco di Ruolo · versione classica/}).waitFor();
  assert.equal(await page.locator('.tavolo-games-grid a').count(),2);
  assert.equal(await page.locator('.tavolo-games-grid a').first().getAttribute('href'),'/tavolo-da-gioco/gdr/il-prezzo-della-verita/avventura');
  await page.getByRole('link',{name:'Torna alle avventure · nuova esperienza',exact:true}).click();
  await page.getByRole('heading',{name:'Gioco di Ruolo',exact:true}).waitFor();
  await page.goto(`${base}/tavolo-da-gioco/gdr/laboratorio`);
  await page.getByRole('heading',{name:'Il turno',exact:true}).waitFor();
  assert.equal(await page.locator('.gdr-thread .gdr-turn-body').innerText(),legacyBody);
  assert.equal(await page.locator('.gdr-thread .dialogue').count(),0,'Nessuna reinterpretazione dei turni storici');
  await page.getByText('Il testo già presente nell’avventura.',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Modifica: Un luogo conosciuto',exact:true}).click();
  assert.equal(await page.locator('.lab-document-editor').count(),0,'La modifica rapida non apre o sposta all’editor completo');
  await page.locator('.avventura-body > app-gdr-turn .inline-editor').waitFor();
  assert.equal(await page.locator('.avventura-body > app-gdr-turn .inline-editor').count(),1,'Il blocco diventa modificabile nella posizione originale');
  await page.getByLabel('Testo del blocco selezionato',{exact:true}).fill('## Un luogo aggiornato');
  await page.locator('.avventura-body > app-gdr-turn .inline-editor').screenshot({path:join(screenshots,'modifica-sul-posto.png')});
  await page.getByRole('button',{name:'Applica al testo',exact:true}).click();
  await page.getByRole('button',{name:'Prova a modificare l’avventura',exact:true}).click();
  const documentArea = page.getByLabel('Testo completo dell’avventura',{exact:true});
  const originalSource = await documentArea.inputValue();
  assert.match(originalSource,/::: npc/); assert.match(originalSource,/Didascalia originale/); assert.match(originalSource,/Oggetto/);
  const docEditor=page.locator('app-gdr-source-editor').filter({has:page.locator('#lab-document')});
  assert.equal(await docEditor.locator('.errors').count(),0);
  await documentArea.fill(originalSource+'\n\nUn’aggiunta solo locale.');
  await page.getByRole('button',{name:'Confronta con il contenuto originale',exact:true}).click();
  await page.getByText('Stai leggendo l’originale',{exact:true}).waitFor();
  assert.equal(await page.locator('.avventura-body > app-gdr-blocks').getByText('Un’aggiunta solo locale.',{exact:true}).count(),0);
  await page.getByRole('button',{name:'Chiudi editor avventura',exact:true}).click();
  const area=page.getByLabel('Il tuo turno',{exact:true});
  await area.fill('Prima.\n\nQueste sono le mie parole.\n\nDopo.');
  await area.evaluate(el=>{const start=el.value.indexOf('Queste');el.focus();el.setSelectionRange(start,start+'Queste sono le mie parole.'.length);});
  await editor().getByLabel('Voce',{exact:true}).selectOption({label:'Valin Fajar'});
  await editor().getByRole('button',{name:'Parla il personaggio',exact:true}).click();
  await editor().locator('.dialogue').waitFor();
  const composed=await area.inputValue();
  assert.match(composed,/Prima\.[\s\S]*::: dialogo Valin Fajar.*\nQueste sono le mie parole\.\n:::[\s\S]*Dopo\./);
  assert.equal(await editor().locator('textarea').count(),1,'Un solo campo di scrittura');
  assert.match(await editor().locator('.dialogue').innerText(),/Queste sono le mie parole/);
  await page.getByRole('button',{name:'Invia turno di prova',exact:true}).click();
  await page.locator('.lab-local-turn').waitFor();
  await page.reload(); await page.locator('.lab-local-turn').waitFor();
  assert.equal(await page.locator('.gdr-turn-body').innerText(),legacyBody);
  await area.fill('::: dialogo Nome\nUna chiusura mancante');
  await editor().locator('.errors').waitFor();
  assert.equal(await page.getByRole('button',{name:'Invia turno di prova',exact:true}).isDisabled(),true);
  await area.fill('::: dialogo Nome | javascript:alert(1)\nTesto innocuo.\n:::');
  assert.equal(await editor().locator('.dialogue img').count(),0);
  await area.fill('Bozza della prima avventura');
  await page.getByLabel('Avventura',{exact:true}).selectOption('la-casa-che-trattiene-il-respiro');
  await page.getByText('La casa esistente trattiene il respiro.',{exact:true}).waitFor();
  assert.equal(await area.inputValue(),'');
  assert.equal(await page.locator('.lab-local-turn').count(),0);
  await area.fill('Bozza della casa');
  await page.getByLabel('Avventura',{exact:true}).selectOption('il-prezzo-della-verita');
  await page.locator('.lab-local-turn').waitFor();
  assert.equal(await area.inputValue(),'Bozza della prima avventura');
  assert.equal(await page.locator('.lab-tools, .lab-consultation').count(),0,'Nessuno strumento duplicato nella pagina');
  await page.getByRole('button',{name:'Scheda',exact:true}).click();
  await page.locator('.gdr-panel-sheet').waitFor();
  await page.locator('.gdr-field-input').waitFor();
  assert.equal(await page.locator('.gdr-field-input').inputValue(),'Elara');
  assert.equal(await page.locator('.gdr-field-input').evaluate(el=>el.readOnly),true);
  await page.getByRole('tab',{name:'Regole',exact:false}).click();
  await page.getByText('Regole già salvate.',{exact:true}).waitFor();
  await page.getByRole('tab',{name:'Appunti',exact:false}).click();
  await page.getByText('Appunti personali esistenti.',{exact:true}).waitFor();
  assert.equal(await page.getByLabel('I tuoi appunti',{exact:true}).getAttribute('contenteditable'),'false');
  await page.getByRole('tab',{name:'Dadi',exact:false}).click();
  await page.locator('app-gdr-dice-roller').waitFor();
  await page.getByRole('button',{name:'Chiudi la scheda',exact:true}).click();
  for (const width of [1280,768,390,320]) {
    await page.setViewportSize({width,height:900});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth > innerWidth),false,`Overflow a ${width}px`);
    await page.getByRole('button',{name:'Scheda',exact:true}).click();
    const panel=await page.locator('.gdr-panel-sheet').boundingBox();
    const chat=await page.locator('.global-chat-trigger').boundingBox();
    assert.ok(panel && chat && panel.y + panel.height + 10 <= chat.y, 'Il pannello resta separato dalla chat');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth > innerWidth),false,`Overflow con pannello a ${width}px`);
    await page.screenshot({path:join(screenshots,`laboratorio-${width}.png`),fullPage:true});

    await page.getByRole('button',{name:'Chiudi la scheda',exact:true}).click();
    if(width===1280 || width===390)await page.locator('.lab-composer').screenshot({path:join(screenshots,`editor-${width}.png`)});
  }
  failContent=true;
  await page.reload();
  await page.getByRole('alert').filter({hasText:'Non è stato possibile caricare i contenuti esistenti'}).waitFor();
  failContent=false;
  await page.getByRole('button',{name:'Riprova il caricamento',exact:true}).click();
  await page.getByRole('button',{name:'Prova a modificare l’avventura',exact:true}).waitFor();
  assert.deepEqual(writes,[], 'Il laboratorio non scrive nelle API GDR');
  assert.deepEqual(errors,[]);
  console.log(`PASS: contenuti originali (tutti i tipi), turni storici letterali, editor unico e selezione, anteprima, errori sintassi, persistenza separata per avventura, scheda/appunti reali, errori caricamento e 4 viewport; nessuna scrittura GDR. Screenshot: ${screenshots}`);
} catch(error) {
  await page.screenshot({path:join(screenshots,'errore.png'),fullPage:true});
  console.error('Screenshot:',screenshots); throw error;
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
