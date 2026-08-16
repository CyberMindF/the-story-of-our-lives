import http from 'node:http';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const imageDir = path.join(root, 'Immagini per carte');
const reviewPath = path.join(root, 'sources', 'carte-image-review.json');
const port = 4175;

const files = (await readdir(imageDir))
  .filter((file) => /\.(?:png|jpe?g|webp)$/i.test(file))
  .sort((a, b) => a.localeCompare(b, 'it', { numeric: true }));

let review;
try {
  review = JSON.parse(await readFile(reviewPath, 'utf8'));
} catch {
  review = { updatedAt: null, images: {} };
}

for (const [index, file] of files.entries()) {
  review.images[file] ??= emptyReview(index);
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  if (url.pathname === '/') return send(response, 200, 'text/html; charset=utf-8', page());
  if (url.pathname === '/api/review' && request.method === 'GET') return json(response, review);
  if (url.pathname === '/api/review' && request.method === 'POST') {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const next = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!next || typeof next.images !== 'object') return json(response, { ok: false }, 400);
    // Una scheda rimasta aperta prima dell'aggiunta di nuovi file può inviare uno stato più
    // vecchio: non deve mai far sparire dal catalogo le immagini rilevate sul disco.
    for (const [index, file] of files.entries()) {
      next.images[file] ??= review.images[file] ?? emptyReview(index);
    }
    review = next;
    review.updatedAt = new Date().toISOString();
    await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`, 'utf8');
    return json(response, { ok: true, updatedAt: review.updatedAt });
  }
  if (url.pathname.startsWith('/image/')) {
    const file = decodeURIComponent(url.pathname.slice('/image/'.length));
    if (!files.includes(file)) return send(response, 404, 'text/plain', 'Not found');
    return send(response, 200, mime(file), await readFile(path.join(imageDir, file)));
  }
  return send(response, 404, 'text/plain', 'Not found');
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Catalogatore carte: http://127.0.0.1:${port}`);
});

function mime(file) {
  if (/\.png$/i.test(file)) return 'image/png';
  if (/\.webp$/i.test(file)) return 'image/webp';
  return 'image/jpeg';
}

function emptyReview(position) {
  return {
    status: 'includi',
    cardName: '',
    setName: 'Prima collezione',
    position,
    notes: ''
  };
}

function send(response, status, type, body) {
  response.writeHead(status, { 'content-type': type, 'cache-control': 'no-store' });
  response.end(body);
}

function json(response, value, status = 200) {
  send(response, status, 'application/json; charset=utf-8', JSON.stringify(value));
}

function page() {
  return `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Catalogatore immagini delle carte</title>
  <style>
    :root{color-scheme:dark;font-family:Inter,system-ui,sans-serif;background:#141f32;color:#f4f7fb}*{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(circle at top,#263752,#141f32 55%)}button,input,select,textarea{font:inherit;color:inherit;border:1px solid #ffffff2d;border-radius:10px;background:#ffffff0d}button{padding:.7rem 1rem;cursor:pointer}button:hover{background:#ffffff18}header{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:1rem;padding:1rem 1.4rem;border-bottom:1px solid #ffffff20;background:#141f32e8;backdrop-filter:blur(12px)}h1{margin:0;font-size:1.15rem}.progress{margin-left:auto;color:#c9d4e5}.bar{width:min(20vw,220px);height:7px;overflow:hidden;border-radius:99px;background:#ffffff18}.bar span{display:block;height:100%;background:#e9cf9d}.layout{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(310px,.65fr);gap:1.5rem;width:min(1180px,100%);margin:auto;padding:1.5rem}.preview,.form{border:1px solid #ffffff22;border-radius:20px;background:#ffffff0a;box-shadow:0 20px 60px #0005}.preview{display:grid;place-items:center;min-height:calc(100vh - 130px);padding:1.2rem}.preview img{display:block;max-width:100%;max-height:calc(100vh - 175px);border-radius:12px;object-fit:contain}.form{align-self:start;display:grid;gap:1rem;padding:1.3rem;position:sticky;top:84px}.filename{overflow-wrap:anywhere;color:#9eacc1;font-size:.78rem}.form label{display:grid;gap:.4rem;color:#c9d4e5;font-size:.82rem}.form input,.form select,.form textarea{width:100%;padding:.75rem}.form textarea{min-height:100px;resize:vertical}.actions{display:grid;grid-template-columns:1fr 1fr;gap:.7rem}.save{grid-column:1/-1;border-color:#e9cf9d88;background:#e9cf9d22}.saved{color:#b9ebc8}.hint{margin:0;color:#9eacc1;font-size:.75rem;line-height:1.5}.excluded .preview{opacity:.35}.excluded .preview img{filter:grayscale(1)}@media(max-width:760px){header{flex-wrap:wrap}.bar{width:100px}.layout{grid-template-columns:1fr;padding:.8rem}.preview{min-height:45vh}.preview img{max-height:55vh}.form{position:static}}
  </style>
</head>
<body>
  <header>
    <h1>Immagini per le carte</h1>
    <div class="bar"><span id="bar"></span></div>
    <span class="progress" id="progress"></span>
  </header>
  <main class="layout" id="layout">
    <section class="preview"><img id="image" alt=""></section>
    <form class="form" id="form">
      <strong id="title">Carta senza nome</strong>
      <span class="filename" id="filename"></span>
      <label>Scelta
        <select id="status">
          <option value="da-compilare">Da compilare</option>
          <option value="includi">Includi</option>
          <option value="escludi">Escludi</option>
        </select>
      </label>
      <label>Nome della carta
        <input id="cardName" maxlength="120" autocomplete="off" placeholder="Come si chiamerà nell'album">
      </label>
      <label>Set / collezione
        <input id="setName" maxlength="120" list="sets" placeholder="Prima collezione">
        <datalist id="sets"></datalist>
      </label>
      <label>Ordine nel set
        <input id="position" type="number" min="0">
      </label>
      <label>Note facoltative
        <textarea id="notes" placeholder="Per esempio: da ritagliare, stessa carta di un'altra immagine, dubbio sul nome…"></textarea>
      </label>
      <div class="actions">
        <button type="button" id="previous">← Precedente</button>
        <button type="button" id="next">Successiva →</button>
        <button type="submit" class="save" id="save">Salva</button>
      </div>
      <p class="hint">Le finiture non vanno scelte qui: ogni immagine inclusa potrà esistere automaticamente in Bianca, Argento, Oro, Onice e nelle rarità gemmate.</p>
    </form>
  </main>
  <script>
    const files=${JSON.stringify(files)};
    let state,index=0,dirty=false;
    const fields=['status','cardName','setName','position','notes'];
    fetch('/api/review').then(r=>r.json()).then(value=>{state=value;const pending=files.findIndex(file=>state.images[file].status==='da-compilare');index=pending<0?0:pending;render()});
    for(const key of fields){document.querySelector('#'+key).addEventListener('input',()=>{readForm();dirty=true;updateSummary()})}
    document.querySelector('#form').addEventListener('submit',async event=>{event.preventDefault();await save()});
    document.querySelector('#previous').onclick=()=>go(-1);
    document.querySelector('#next').onclick=()=>go(1);
    window.addEventListener('keydown',event=>{if(event.target.matches('input,textarea,select'))return;if(event.key==='ArrowLeft')go(-1);if(event.key==='ArrowRight')go(1)});
    window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue=''}});
    function readForm(){if(!state)return;const item=state.images[files[index]];item.status=document.querySelector('#status').value;item.cardName=document.querySelector('#cardName').value;item.setName=document.querySelector('#setName').value;item.position=Number(document.querySelector('#position').value)||0;item.notes=document.querySelector('#notes').value;document.querySelector('#title').textContent=item.cardName||'Carta senza nome';document.querySelector('#layout').classList.toggle('excluded',item.status==='escludi')}
    function render(){const file=files[index],item=state.images[file];document.querySelector('#image').src='/image/'+encodeURIComponent(file);document.querySelector('#image').alt=item.cardName||file;document.querySelector('#filename').textContent=file;for(const key of fields)document.querySelector('#'+key).value=item[key]??'';document.querySelector('#title').textContent=item.cardName||'Carta senza nome';document.querySelector('#previous').disabled=index===0;document.querySelector('#next').disabled=index===files.length-1;document.querySelector('#layout').classList.toggle('excluded',item.status==='escludi');refreshSets();updateSummary()}
    function go(delta){readForm();index=Math.max(0,Math.min(files.length-1,index+delta));render()}
    async function save(){readForm();const button=document.querySelector('#save');button.textContent='Salvataggio…';const response=await fetch('/api/review',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(state)});if(response.ok){dirty=false;button.textContent='Salvato ✓';button.classList.add('saved');setTimeout(()=>{button.textContent='Salva';button.classList.remove('saved')},1400)}else button.textContent='Errore nel salvataggio'}
    function refreshSets(){const sets=[...new Set(Object.values(state.images).map(item=>item.setName.trim()).filter(Boolean))].sort();document.querySelector('#sets').innerHTML=sets.map(set=>'<option value="'+escapeHtml(set)+'"></option>').join('')}
    function updateSummary(){const items=Object.values(state.images),done=items.filter(item=>item.status!=='da-compilare').length;document.querySelector('#progress').textContent=(index+1)+' / '+files.length+' · '+done+' decise';document.querySelector('#bar').style.width=(done/files.length*100)+'%'}
    function escapeHtml(value){return String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;')}
  </script>
</body>
</html>`;
}
