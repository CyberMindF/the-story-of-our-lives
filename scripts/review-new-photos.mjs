import http from 'node:http';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const photoDir = path.join(root, 'Nuovi media', 'roba maggio : luglio', 'photos');
const videoDir = path.join(root, 'Nuovi media', 'roba maggio : luglio', 'video_files');
const reviewPath = path.join(root, 'sources', 'bacheca-new-photo-review.json');
const port = 4174;

const photoFiles = (await readdir(photoDir))
  .filter((file) => /\.(jpe?g|png|webp|heic)$/i.test(file))
  .sort((a, b) => numberOf(a) - numberOf(b));
const videoFiles = (await readdir(videoDir))
  .filter((file) => /\.(mp4|mov|webm|m4v)$/i.test(file))
  .sort((a, b) => numberOf(a) - numberOf(b));
const files = [...photoFiles, ...videoFiles];

let review;
try {
  review = JSON.parse(await readFile(reviewPath, 'utf8'));
} catch {
  review = { updatedAt: null, photos: {} };
}
for (const file of files) {
  review.photos[file] ??= suggested(file);
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  if (url.pathname === '/') return send(response, 200, 'text/html; charset=utf-8', page());
  if (url.pathname === '/api/review' && request.method === 'GET') return json(response, review);
  if (url.pathname === '/api/review' && request.method === 'POST') {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    review = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    review.updatedAt = new Date().toISOString();
    await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`, 'utf8');
    return json(response, { ok: true, updatedAt: review.updatedAt });
  }
  if (url.pathname.startsWith('/media/')) {
    const file = decodeURIComponent(url.pathname.slice('/media/'.length));
    if (!files.includes(file)) return send(response, 404, 'text/plain', 'Not found');
    const directory = videoFiles.includes(file) ? videoDir : photoDir;
    return send(response, 200, mime(file), await readFile(path.join(directory, file)));
  }
  send(response, 404, 'text/plain', 'Not found');
});

server.listen(port, '127.0.0.1', () => console.log(`Revisione foto: http://127.0.0.1:${port}`));

function numberOf(file) { return Number(file.match(/photo_(\d+)/)?.[1] ?? 9999); }
function suggested(file) {
  const number = numberOf(file);
  const isVideo = file.startsWith('video_');
  const month = isVideo ? (number <= 2 ? 'maggio' : number <= 4 ? 'giugno' : 'da-identificare') : (number <= 52 ? 'maggio' : number <= 60 ? 'giugno' : 'da-identificare');
  return { status: 'da-rivedere', month, day: '', group: '', order: number, caption: '', notes: '' };
}
function mime(file) { return file.endsWith('.png') ? 'image/png' : file.endsWith('.webp') ? 'image/webp' : file.endsWith('.mp4') ? 'video/mp4' : file.endsWith('.webm') ? 'video/webm' : file.endsWith('.mov') ? 'video/quicktime' : 'image/jpeg'; }
function send(response, status, type, body) { response.writeHead(status, { 'content-type': type }); response.end(body); }
function json(response, value) { send(response, 200, 'application/json; charset=utf-8', JSON.stringify(value)); }

function page() { return `<!doctype html>
<html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Revisione nuove foto</title>
<style>
:root{color-scheme:dark;font-family:system-ui;background:#141f32;color:#f4f7fb}*{box-sizing:border-box}body{margin:0}header{position:sticky;top:0;z-index:3;padding:16px 24px;background:#141f32ee;border-bottom:1px solid #ffffff24;backdrop-filter:blur(12px)}h1{margin:0 0 12px;font-size:24px}.toolbar{display:flex;gap:8px;flex-wrap:wrap}button,select,input,textarea{font:inherit;color:inherit;border:1px solid #ffffff28;background:#ffffff0d;border-radius:8px}button{padding:8px 12px;cursor:pointer}.active{background:#ffffff20}.summary{margin-left:auto;color:#d1dde6}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:18px;padding:24px}.photo{overflow:hidden;border:1px solid #ffffff24;border-radius:16px;background:#ffffff0d}.photo.excluded{opacity:.45}.photo img,.photo video{display:block;width:100%;height:260px;object-fit:contain;background:#0c1422}.photo img{cursor:zoom-in}.form{display:grid;grid-template-columns:1fr 1fr;gap:9px;padding:14px}.name{grid-column:1/-1;font-weight:700}.form label{display:grid;gap:4px;color:#d1dde6;font-size:12px}.form input,.form select,.form textarea{width:100%;padding:7px}.wide{grid-column:1/-1}.saved{color:#a7dfbd}.compact .grid{grid-template-columns:repeat(auto-fill,minmax(165px,1fr));gap:10px;padding:14px}.compact .photo img,.compact .photo video{height:150px}.compact .form{display:block;padding:8px}.compact .form>*{display:none}.compact .form .name,.compact .form label:first-of-type,.compact .form label:nth-of-type(2),.compact .form label:nth-of-type(4){display:grid;margin-bottom:6px;font-size:10px}.compact .name{overflow:hidden;font-size:11px;white-space:nowrap;text-overflow:ellipsis}.board{display:flex;align-items:flex-start;gap:14px;padding:18px;overflow-x:auto}.lane{flex:0 0 250px;min-height:70vh;padding:10px;border:1px solid #ffffff24;border-radius:14px;background:#ffffff08}.lane h2{display:flex;justify-content:space-between;margin:2px 4px 10px;font-size:15px}.tile{margin-bottom:9px;overflow:hidden;border:1px solid #ffffff24;border-radius:10px;background:#ffffff0d;cursor:grab}.tile img,.tile video{display:block;width:100%;height:145px;object-fit:contain;background:#0c1422}.tile span{display:block;padding:7px;overflow:hidden;font-size:11px;white-space:nowrap;text-overflow:ellipsis}.lane.over{border-color:#e9cf9d;background:#ffffff12}@media(max-width:600px){header{padding:12px}.grid{padding:12px;grid-template-columns:1fr}}
.compact .form label:nth-of-type(3){display:grid;margin-bottom:6px;font-size:10px}
</style></head><body>
<header><h1>📸 Revisione nuove foto e video</h1><div class="toolbar"><input id="search" type="search" placeholder="Cerca foto o video…"><button data-filter="attive" class="active">Attive</button><button data-filter="maggio">Maggio</button><button data-filter="giugno">Giugno</button><button data-filter="luglio">Luglio</button><button data-filter="da-identificare">Da identificare</button><button data-filter="incluse">Incluse</button><button data-filter="escluse">Escluse</button><button id="compact">Vista compatta</button><button id="board">Gruppi</button><button id="save">Salva</button><span class="summary" id="summary"></span></div></header><main class="grid" id="grid"></main>
<script>
let state,filter='attive',mode='detail',compact=false,manualGroups=[],query='';const files=${JSON.stringify(files)},videos=new Set(${JSON.stringify(videoFiles)}),grid=document.querySelector('#grid');
fetch('/api/review').then(r=>r.json()).then(v=>{state=v;render()});
document.querySelector('#search').oninput=e=>{query=e.target.value.trim().toLowerCase();render()};
document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('active',x===b));render()});
document.querySelector('#compact').onclick=()=>{compact=!compact;document.body.classList.toggle('compact',compact);document.querySelector('#compact').classList.toggle('active',compact)};
document.querySelector('#board').onclick=()=>{mode=mode==='board'?'detail':'board';document.querySelector('#board').classList.toggle('active',mode==='board');document.querySelector('#board').textContent=mode==='board'?'Vista schede':'Gruppi';render()};
document.querySelector('#save').onclick=async()=>{const b=document.querySelector('#save');b.textContent='Salvataggio…';await fetch('/api/review',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(state)});b.textContent='Salvato ✓';b.classList.add('saved');setTimeout(()=>{b.textContent='Salva';b.classList.remove('saved')},1800)};
function visible(file){const p=state.photos[file];if(query&&!file.toLowerCase().includes(query))return false;return filter==='attive'?p.status!=='escludi':filter===p.month||(filter==='incluse'&&p.status==='includi')||(filter==='escluse'&&p.status==='escludi')}
function preview(file,controls=true){return videos.has(file)?\`<video \${controls?'controls':''} preload="metadata" src="/media/\${encodeURIComponent(file)}"></video>\`:\`<img loading="lazy" src="/media/\${encodeURIComponent(file)}">\`}
function render(){mode==='board'?renderBoard():renderDetail()}
function renderDetail(){grid.className='grid';grid.innerHTML='';let shown=0;for(const file of files){if(!visible(file))continue;shown++;const p=state.photos[file],card=document.createElement('article');card.className='photo '+(p.status==='escludi'?'excluded':'');card.innerHTML=preview(file)+\`<div class="form"><div class="name">\${file}</div>\${select('status',p.status,['da-rivedere','includi','escludi'])}\${select('month',p.month,['maggio','giugno','luglio','da-identificare'])}\${choice('day','Giorno / evento',p.day)}\${choice('group','Gruppo',p.group)}<label>Ordine<input data-k="order" type="number" value="\${p.order}"></label><label class="wide">Didascalia<textarea data-k="caption">\${esc(p.caption)}</textarea></label><label class="wide">Note<textarea data-k="notes">\${esc(p.notes)}</textarea></label></div>\`;const image=card.querySelector('img');if(image)image.onclick=()=>window.open('/media/'+encodeURIComponent(file));card.querySelectorAll('[data-k]').forEach(el=>el.onchange=()=>{p[el.dataset.k]=el.type==='number'?Number(el.value):el.value;card.classList.toggle('excluded',p.status==='escludi');refreshChoices();summary()});card.querySelectorAll('[data-choice]').forEach(el=>el.onchange=()=>{if(!el.value)return;card.querySelector('[data-k="'+el.dataset.choice+'"]').value=el.value;p[el.dataset.choice]=el.value;summary()});grid.append(card)}refreshChoices();summary(shown)}
function renderBoard(){grid.className='board';grid.innerHTML='';const shown=files.filter(visible),groups=['',...new Set([...shown.map(f=>state.photos[f].group).filter(Boolean),...manualGroups])];for(const group of groups){const lane=document.createElement('section');lane.className='lane';lane.dataset.group=group;const members=shown.filter(f=>(state.photos[f].group||'')===group);lane.innerHTML=\`<h2><span>\${esc(group||'Senza gruppo')}</span><small>\${members.length}</small></h2>\`;for(const file of members){const tile=document.createElement('article');tile.className='tile';tile.draggable=true;tile.dataset.file=file;tile.innerHTML=preview(file,false)+\`<span>\${file}</span>\`;tile.ondragstart=e=>e.dataTransfer.setData('text/plain',file);lane.append(tile)}lane.ondragover=e=>{e.preventDefault();lane.classList.add('over')};lane.ondragleave=()=>lane.classList.remove('over');lane.ondrop=e=>{e.preventDefault();state.photos[e.dataTransfer.getData('text/plain')].group=group;renderBoard()};grid.append(lane)}const add=document.createElement('button');add.textContent='+ Nuovo gruppo';add.onclick=()=>{const name=prompt('Nome del nuovo gruppo');if(name&&!groups.includes(name)){manualGroups.push(name);renderBoard()}};grid.append(add);summary(shown.length)}
function choice(key,label,value){return \`<label>\${label}<input data-k="\${key}" value="\${esc(value)}"><select data-choice="\${key}"><option value="">Scegli già usato…</option></select></label>\`}
function refreshChoices(){for(const key of ['day','group']){const values=[...new Set(Object.values(state.photos).map(x=>x[key]).filter(Boolean))].sort();document.querySelectorAll('[data-choice="'+key+'"]').forEach(el=>{el.innerHTML='<option value="">Scegli già usato…</option>'+values.map(x=>\`<option value="\${esc(x)}">\${esc(x)}</option>\`).join('')})}}
function select(k,v,opts){return \`<label>\${k==='status'?'Scelta':'Mese'}<select data-k="\${k}">\${opts.map(x=>\`<option \${x===v?'selected':''}>\${x}</option>\`).join('')}</select></label>\`}
function esc(v){return String(v??'').replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;')}
function summary(shown){const vals=Object.values(state.photos);document.querySelector('#summary').textContent=\`\${shown??grid.children.length}/\${files.length} · \${vals.filter(x=>x.status==='includi').length} incluse · \${vals.filter(x=>x.status==='escludi').length} escluse\`}
</script></body></html>`; }
