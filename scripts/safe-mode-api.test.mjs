import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
const source = path => readFileSync(new URL('../'+path,import.meta.url),'utf8');
function setup() {
 const sql=new DatabaseSync(':memory:');
 sql.exec('CREATE TABLE users(id INTEGER PRIMARY KEY); INSERT INTO users VALUES(1),(2);');
 sql.exec(source('migrations/0132_add_world_updates_and_promos.sql').split('INSERT INTO')[0]);
 sql.exec('ALTER TABLE world_updates ADD COLUMN announce INTEGER NOT NULL DEFAULT 1;');
 sql.exec(source('migrations/0139_add_safe_mode.sql'));
 sql.exec('CREATE TABLE sessions(id INTEGER PRIMARY KEY, user_id INTEGER, admin_mode_enabled INTEGER); INSERT INTO sessions VALUES(11,1,1),(12,1,1),(21,2,1);');
 const db={async batch(statements) {
  sql.exec('BEGIN');
  try { const results=[]; for (const statement of statements) results.push(await statement.run()); sql.exec('COMMIT'); return results; }
  catch(error) { sql.exec('ROLLBACK'); throw error; }
 },prepare(query){const statement=sql.prepare(query);let args=[];return {bind(...values){args=values;return this;},async run(){return {meta:{changes:Number(statement.run(...args).changes)}};},async first(){return statement.get(...args) ?? null;},async all(){return {results:statement.all(...args)};}};}};
 const session=async request=>{const id=Number(request.headers.get('x-user'));const user=sql.prepare('SELECT * FROM users WHERE id=?').get(id);return user?{user:{id,safeMode:user.safe_mode===1,role:'admin'},sessionId:id===1?11:21,adminModeEnabled:true}:null;};
 const json=(body,status=200)=>Response.json(body,{status});
 const readJson=request=>request.json().catch(()=>null);
 const load=(path,names)=>new Function('getAuthenticatedSession','json','readJson','hasPermission','recordEvent',source(path).replace(/^import .*;\n/gm,'').replace(/export /g,'')+'\nreturn {'+names+'};')(session,json,readJson,()=>true,async()=>{});
 const safe=load('functions/api/auth/safe-mode.js','onRequestPost');
 const admin=load('functions/api/auth/admin-mode.js','onRequestPost');
 const news=load('functions/api/world-updates/index.js','onRequestGet,onRequestPost');
 const request=(user,body)=>new Request('http://test/',{method:body===undefined?'GET':'POST',headers:{'x-user':String(user)},...(body===undefined?{}:{body:JSON.stringify(body)})});
 return {sql,db,safe,news,admin,request};
}
test('preferenza persistente isolata, autenticazione e validazione',async()=>{
 const h=setup();try {
  const save=(id,body)=>h.safe.onRequestPost({request:h.request(id,body),env:{DB:h.db}});
  assert.equal((await save(0,{enabled:true})).status,401);
  assert.equal((await save(1,{enabled:'true'})).status,400);
  assert.equal((await save(1,{enabled:true})).status,200);
  assert.equal(h.sql.prepare('SELECT safe_mode FROM users WHERE id=1').get().safe_mode,1);
  assert.equal(h.sql.prepare('SELECT safe_mode FROM users WHERE id=2').get().safe_mode,0);
  await save(1,{enabled:false});
  assert.equal(h.sql.prepare('SELECT safe_mode FROM users WHERE id=1').get().safe_mode,0);
 } finally {h.sql.close();}
});
test('novità: default non safe, tag esplicito e filtro lato server anche per admin',async()=>{
 const h=setup();try {
  for (const safe of [undefined,true]) {
   const response=await h.news.onRequestPost({request:h.request(1,{kind:'mondo',title:safe?'Studio':'Ricordi',safe}),env:{DB:h.db}});
   assert.equal(response.status,201);
  }
  h.sql.prepare('UPDATE users SET safe_mode=1 WHERE id=1').run();
  const list=async id=>(await (await h.news.onRequestGet({request:h.request(id),env:{DB:h.db}})).json()).updates;
  assert.deepEqual((await list(1)).map(n=>n.title),['Studio']);
  assert.equal((await list(2)).length,2);
  assert.equal((await list(1))[0].safe,true);
 } finally {h.sql.close();}
});

test('novità automatiche richiedono una classificazione safe esplicita', async()=>{
 const h=setup();try {
  const add=new Function(source('functions/api/_shared/world-updates.js').replace('export async function','async function')+';return addWorldUpdate;')();
  await add({DB:h.db},{title:'Contenuto personale'});
  await add({DB:h.db},{title:'Nuovo quiz',safe:true});
  assert.deepEqual(h.sql.prepare('SELECT title,safe FROM world_updates ORDER BY id').all().map(r=>[r.title,r.safe]),[['Contenuto personale',0],['Nuovo quiz',1]]);
 } finally {h.sql.close();}
});

test('la classificazione storica riconosce soltanto i testi verificati',()=>{
 const h=setup();try {
  const add=h.sql.prepare(`INSERT INTO world_updates(kind,title,body,route,published_at,created_at,updated_at)
    VALUES('mondo',?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`);
  add.run('I quiz diventano misti','Si possono estrarre domande da più unità e bilanciarle per difficoltà.','/aula-studio');
  add.run('I quiz diventano misti','Un testo personale aggiunto in seguito.','/aula-studio');
  add.run('Lettere e capsule del tempo: qualche ritocco','Contenuti personali.','/novita');
  h.sql.exec(source('migrations/0140_classify_existing_safe_updates.sql'));
  assert.deepEqual(h.sql.prepare('SELECT safe FROM world_updates ORDER BY id').all().map(r=>r.safe),[1,0,0]);
 } finally {h.sql.close();}
});

test('entrare in safe spegne admin per tutte le sessioni personali e uscire non lo riaccende',async()=>{
 const h=setup();try {
  const save=enabled=>h.safe.onRequestPost({request:h.request(1,{enabled}),env:{DB:h.db}});
  assert.equal((await save(true)).status,200);
  assert.deepEqual(h.sql.prepare('SELECT admin_mode_enabled FROM sessions ORDER BY id').all().map(r=>r.admin_mode_enabled),[0,0,1]);
  const enable=()=>h.admin.onRequestPost({request:h.request(1,{enabled:true}),env:{DB:h.db},waitUntil(){}});
  assert.equal((await enable()).status,409);
  await save(false);
  assert.equal(h.sql.prepare('SELECT admin_mode_enabled FROM sessions WHERE id=11').get().admin_mode_enabled,0);
  assert.equal((await enable()).status,200);
 } finally {h.sql.close();}
});

test('un errore nello spegnimento admin annulla anche il cambio safe mode',async()=>{
 const h=setup();try {
  h.sql.exec("CREATE TRIGGER prevent_session_update BEFORE UPDATE ON sessions BEGIN SELECT RAISE(ABORT,'failure'); END;");
  const response=await h.safe.onRequestPost({request:h.request(1,{enabled:true}),env:{DB:h.db}});
  assert.equal(response.status,500);
  assert.equal(h.sql.prepare('SELECT safe_mode FROM users WHERE id=1').get().safe_mode,0);
  assert.equal(h.sql.prepare('SELECT admin_mode_enabled FROM sessions WHERE id=11').get().admin_mode_enabled,1);
 } finally {h.sql.close();}
});
