import { readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const review = JSON.parse(await readFile(path.join(root, 'sources', 'carte-image-review.json'), 'utf8'));
const images = Object.entries(review.images)
  .filter(([, item]) => item.status === 'includi')
  .map(([file, item]) => ({ file, ...item }));

if (images.length === 0) throw new Error('Nessuna immagine inclusa nel catalogo.');
if (images.some((item) => !item.cardName?.trim() || !item.setName?.trim())) {
  throw new Error('Tutte le immagini incluse devono avere nome della carta e set.');
}

const grouped = new Map();
for (const item of images) {
  const setName = item.setName.trim();
  if (!grouped.has(setName)) grouped.set(setName, []);
  grouped.get(setName).push(item);
}
for (const items of grouped.values()) {
  items.sort((a, b) => a.position - b.position || a.file.localeCompare(b.file, 'it', { numeric: true }));
}

console.log(`Carico ${images.length} immagini nel bucket R2 locale…`);
let uploaded = 0;
for (const [setName, items] of grouped) {
  const setSlug = slug(setName);
  for (const item of items) {
    const extension = path.extname(item.file).toLowerCase();
    item.imageKey = `carte/designs/${setSlug}/${slug(path.basename(item.file, extension))}${extension}`;
    runWrangler([
      'r2', 'object', 'put', `the-white-world-media/${item.imageKey}`,
      '--file', path.join(root, 'Immagini per carte', item.file),
      '--content-type', contentType(extension),
      '--local'
    ], false);
    uploaded += 1;
    process.stdout.write(`\r${uploaded}/${images.length}`);
  }
}
process.stdout.write('\n');

const setSlugs = [...grouped.keys()].map(slug);
const finishes = ['flat', 'argento', 'oro', 'onice', 'smeraldo', 'rubino', 'zaffiro', 'diamante'];
const sql = [];
sql.push('PRAGMA foreign_keys = ON;');
sql.push('BEGIN TRANSACTION;');

// Questo import è deliberatamente locale e ricostruibile: elimina il vecchio set fittizio e
// le precedenti versioni dei soli set presenti nel catalogo, senza toccare altri contenuti.
const targets = ['placeholder', ...setSlugs];
const targetList = targets.map(quote).join(', ');
sql.push(`DELETE FROM carte_trade_items WHERE carta_definizione_id IN (SELECT cd.id FROM carte_definizioni cd JOIN carte_designs d ON d.id = cd.design_id JOIN carte_sets s ON s.id = d.set_id WHERE s.slug IN (${targetList}));`);
sql.push(`DELETE FROM carte_possesso WHERE carta_definizione_id IN (SELECT cd.id FROM carte_definizioni cd JOIN carte_designs d ON d.id = cd.design_id JOIN carte_sets s ON s.id = d.set_id WHERE s.slug IN (${targetList}));`);
sql.push(`DELETE FROM carte_definizioni WHERE design_id IN (SELECT d.id FROM carte_designs d JOIN carte_sets s ON s.id = d.set_id WHERE s.slug IN (${targetList}));`);
sql.push(`DELETE FROM carte_designs WHERE set_id IN (SELECT id FROM carte_sets WHERE slug IN (${targetList}));`);
sql.push(`DELETE FROM carte_sets WHERE slug IN (${targetList});`);

let setPosition = 0;
for (const [setName, items] of grouped) {
  const setSlug = slug(setName);
  sql.push(`INSERT INTO carte_sets (slug, nome, descrizione, position, created_by, created_at) VALUES (${quote(setSlug)}, ${quote(setName)}, NULL, ${setPosition}, (SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1), CURRENT_TIMESTAMP);`);
  items.forEach((item, position) => {
    sql.push(`INSERT INTO carte_designs (set_id, nome, immagine_key, position, created_by, created_at) VALUES ((SELECT id FROM carte_sets WHERE slug = ${quote(setSlug)}), ${quote(item.cardName.trim())}, ${quote(item.imageKey)}, ${position}, (SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1), CURRENT_TIMESTAMP);`);
    for (const finish of finishes) {
      sql.push(`INSERT INTO carte_definizioni (design_id, finitura, immagine_key) VALUES ((SELECT d.id FROM carte_designs d JOIN carte_sets s ON s.id = d.set_id WHERE s.slug = ${quote(setSlug)} AND d.position = ${position}), ${quote(finish)}, NULL);`);
    }
  });
  setPosition += 1;
}

// Tutte le carte sono assegnate a "lui" nel database locale per rendere immediatamente
// ispezionabili fronte, zoom e ogni finitura senza dover aprire centinaia di bustine.
sql.push(`INSERT INTO carte_possesso (owner_identity, carta_definizione_id, quantita, updated_at) SELECT 'lui', cd.id, 1, CURRENT_TIMESTAMP FROM carte_definizioni cd JOIN carte_designs d ON d.id = cd.design_id JOIN carte_sets s ON s.id = d.set_id WHERE s.slug IN (${setSlugs.map(quote).join(', ')});`);
sql.push('COMMIT;');

const sqlPath = path.join(os.tmpdir(), 'carte-local-import.sql');
await writeFile(sqlPath, `${sql.join('\n')}\n`, 'utf8');
console.log('Importo set, design, finiture e possesso nel D1 locale…');
runWrangler(['d1', 'execute', 'the-white-world-db', '--local', '--file', sqlPath]);
console.log(`Import locale completato: ${grouped.size} set, ${images.length} design, ${images.length * finishes.length} carte.`);

function runWrangler(args, printOutput = true) {
  const result = spawnSync('npx', ['wrangler', ...args], { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || `Wrangler terminato con ${result.status}`);
  if (printOutput && result.stdout) process.stdout.write(result.stdout);
}

function slug(value) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'carta';
}

function quote(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function contentType(extension) {
  if (extension === '.png') return 'image/png';
  if (extension === '.webp') return 'image/webp';
  return 'image/jpeg';
}
