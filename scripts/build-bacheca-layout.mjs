import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from '../web/node_modules/jsdom/lib/api.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const htmlPath = path.join(root, 'ExportBlock-fbd237dd-039c-4dc5-9ab4-b9f20c5dcf16-Part-1', 'Gruppo pagine', '📸 La Bacheca dei Ricordi 31479ac3576c80e2ab7cfa11d7923c60.html');
const manifestPath = path.join(root, 'sources/manifests/bacheca-media-manifest.json');
const contentPath = path.join(root, 'web/public/content/bacheca.json');
const reviewPath = path.join(root, 'sources/bacheca-new-photo-review.json');
const outputPath = path.join(root, 'web/public/content/bacheca-layout.json');
const newManifestPath = path.join(root, 'sources/manifests/bacheca-new-media-manifest.json');
const [html, manifestJson, contentJson, reviewJson] = await Promise.all([readFile(htmlPath, 'utf8'), readFile(manifestPath, 'utf8'), readFile(contentPath, 'utf8'), readFile(reviewPath, 'utf8')]);
const document = new JSDOM(html).window.document;
const manifest = JSON.parse(manifestJson), review = JSON.parse(reviewJson);
const keyByFile = new Map(manifest.map(({ source, key }) => [path.basename(source), key]));
const thumbByKey = new Map();
for (const period of JSON.parse(contentJson).periods) for (const day of period.days) for (const item of day.items) for (const photo of item.photos || []) if (photo.thumbKey) thumbByKey.set(photo.key, photo.thumbKey);
const migrated = new Map([
  ['https://youtu.be/tpSifiOnql8?si=YkLs7G46HfvGpFmH', { type: 'audio', key: 'bacheca/settembre/giorno-1/audio/oslo.mp3', label: 'Oslo (Skioffi)' }],
  ['https://youtu.be/cNGjD0VG4R8?si=RbsM4ba0ef8ETXSi', { type: 'audio', key: 'bacheca/settembre/giorno-3/audio/perfect.mp3', label: 'Perfect (Ed Sheeran)' }],
  ['https://drive.google.com/file/d/1HexZWQCdlM6XBmNG3PYbVjZeKl4LmU_I/view?usp=drive_link', { type: 'video', key: 'bacheca/settembre/giorno-6/web/altalena-1.mp4' }],
  ['https://drive.google.com/file/d/1fBFodJvE0sougquvywg5hlK2Nm3QBUAU/view?usp=drive_link', { type: 'video', key: 'bacheca/settembre/giorno-6/web/altalena-2.mp4' }],
  ['https://drive.google.com/file/d/10el25RvGS0cEjfx1B2B4FqIRt-m25xm1/view?usp=drive_link', { type: 'video', key: 'bacheca/i-video/generale/web/4-anni.mp4', label: 'Il video per i 4 anni' }],
  ['https://drive.google.com/file/d/1ASDQ85ygVw43io5zMDGDWHIyozkcQ12U/view?usp=drive_link', { type: 'video', key: 'bacheca/i-video/generale/web/natale.mp4', label: 'Gli auguri di Natale' }],
  ['https://drive.google.com/file/d/1PdOnPObHoWqi54CbtuDOjAVUui5s3gVw/view?usp=sharing', { type: 'video', key: 'bacheca/altre-cose/generale/web/quadro-casa.mp4' }]
]);
const periods=[]; let period=null,day=null,reached=false;
for (const el of document.querySelector('.page-body').children) {
  if (!reached && el.matches('h3')) { reached=true; period={title:'Settembre',slug:'settembre',days:[]}; periods.push(period); }
  if (el.matches('h2')) { if(!reached)continue; period={title:el.textContent.trim(),slug:slugify(el.textContent),days:[]};periods.push(period);day=null;continue; }
  if(!reached||!period)continue;
  if(el.matches('h3')){day={title:el.textContent.trim(),slug:slugify(el.textContent),rows:[]};period.days.push(day);continue;}
  if(!day){day={title:null,slug:'generale',rows:[]};period.days.push(day);}
  const row=parseRow(el);if(row)day.rows.push(row);
}
const videos=periods.find(x=>x.title==='I video')?.days[0];
if(videos)videos.rows.push({columns:[{width:1,blocks:[{type:'video',key:'bacheca/altre-cose/generale/web/un-pezzo-della-nostra-storia.mp4',label:'Un pezzo della nostra storia',vertical:true}]}]});
const newManifest=[];
append('maggio','Ultimo giorno','giorno-3',undefined,'Il terzo giorno');
append('luglio','primo giorno','primo-giorno');append('luglio','secondo giorno','secondo-giorno');append('luglio','terzo giorno','terzo-giorno');append('luglio','quarto giorno - ultimo','quarto-giorno-ultimo',undefined,undefined,'Quarto giorno');
append('da-identificare','giochi','giochi','Altre cose');append('da-identificare','fuochetto','fuochetto','Altre cose');
const ji=periods.findIndex(x=>x.title==='Luglio'),vi=periods.findIndex(x=>x.title==='I video');if(ji>vi&&vi>=0){const [j]=periods.splice(ji,1);periods.splice(vi,0,j);}
let pi=0,vid=0;for(const p of periods)for(const d of p.days)for(const r of d.rows)for(const c of r.columns)for(const b of c.blocks){if(b.type==='photo')b.devId=++pi;if(b.type==='video')b.devId=++vid;}
await writeFile(outputPath,JSON.stringify({periods},null,2)+'\n');await writeFile(newManifestPath,JSON.stringify(newManifest,null,2)+'\n');
console.log(`Creati layout (${pi} foto, ${vid} video) e manifest (${newManifest.length} media).`);

function parseRow(el){if(el.matches('hr'))return null;if(el.matches('.column-list')){const columns=[...el.children].filter(x=>x.matches('.column')).map(x=>({width:Number(x.dataset.notionColumnRatio||1),blocks:[...x.children].map(parseBlock).filter(Boolean)})).filter(x=>x.blocks.length);return columns.length?{columns}:null;}const block=parseBlock(el);return block?{columns:[{width:1,blocks:[block]}]}:null;}
function parseBlock(el){if(el.matches('p')){const text=el.textContent.replace(/\s+/g,' ').trim();if(!text)return null;const a=el.querySelector('a[href]');return{type:'text',text,...(a?{link:{href:a.href,label:a.textContent.trim()}}:{})};}if(!el.matches('figure'))return null;if(el.matches('.image')){const file=decodeURIComponent(el.dataset.notionImage||'').split('/').pop(),key=keyByFile.get(file);if(!key)throw new Error(`Foto senza chiave: ${file}`);const caption=el.querySelector('figcaption')?.textContent.replace(/\s+/g,' ').trim(),thumbKey=thumbByKey.get(key);return{type:'photo',key,...(thumbKey?{thumbKey}:{}),...(caption?{caption}:{})};}const href=el.querySelector('.source a')?.href,caption=el.querySelector('figcaption')?.textContent.replace(/\s+/g,' ').trim();if(!href)return null;const media=migrated.get(href);return media?{...media,...(caption&&!media.label?{label:caption}:{})}:{type:'external',href,...(caption?{caption}:{})};}
function append(month,dayName,daySlug,forcedTitle,mergeTitle,displayTitle){const entries=Object.entries(review.photos).filter(([,x])=>x.status==='includi'&&x.month===month&&x.day.toLowerCase()===dayName.toLowerCase()).sort(([,a],[,b])=>a.order-b.order);if(!entries.length)return;const title=forcedTitle||month[0].toUpperCase()+month.slice(1);let p=periods.find(x=>x.title===title);if(!p){p={title,slug:slugify(title),days:[]};const i=periods.findIndex(x=>x.title==='Altre cose');periods.splice(i<0?periods.length:i,0,p);}const units=[],seen=new Set();for(const e of entries){const g=e[1].group?.trim();if(!g)units.push({order:e[1].order,entries:[e]});else if(!seen.has(g)){seen.add(g);const members=entries.filter(([,x])=>x.group?.trim()===g);for(let i=0;i<members.length;i+=3)units.push({order:members[i][1].order,entries:members.slice(i,i+3)});}}units.sort((a,b)=>a.order-b.order);const rows=units.map(u=>({columns:u.entries.map(([f,x])=>({width:1/u.entries.length,blocks:[reviewBlock(f,x,title,daySlug)]}))}));const existing=mergeTitle?p.days.find(x=>x.title?.toLowerCase()===mergeTitle.toLowerCase()):null;if(existing)existing.rows.push(...rows);else p.days.push({title:displayTitle||dayName[0].toUpperCase()+dayName.slice(1),slug:daySlug,rows});}
function reviewBlock(file,item,title,daySlug){const video=file.startsWith('video_'),ext=path.extname(file).toLowerCase(),n=Number(file.match(/_(\d+)/)?.[1]||item.order),key=`bacheca/${slugify(title)}/${daySlug}/${video?'web':'original'}/${String(n).padStart(3,'0')}-${video?'video':'photo'}${ext}`,source=path.join(root,'Nuovi media','roba maggio : luglio',video?'video_files':'photos',file);newManifest.push({key,source});return video?{type:'video',key,...(item.caption?{label:item.caption}:{})}:{type:'photo',key,...(item.caption?{caption:item.caption}:{})};}
function slugify(v){return v.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'sezione';}
