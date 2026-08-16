import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const review = JSON.parse(await readFile(path.join(root, 'sources', 'carte-image-review.json'), 'utf8'));
const images = Object.entries(review.images)
  .filter(([, item]) => item.status === 'includi')
  .map(([file, item]) => ({ file, ...item }));

if (images.some((item) => !item.cardName?.trim() || !item.setName?.trim())) {
  throw new Error('Nome carta e set sono obbligatori per tutte le immagini incluse.');
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

const finishes = ['flat', 'argento', 'oro', 'onice', 'smeraldo', 'rubino', 'zaffiro', 'diamante'];
const setSlugs = [...grouped.keys()].map(slug);
const targets = ['placeholder', ...setSlugs];
const targetList = targets.map(quote).join(', ');
const sql = [
  '-- Sostituisce il set segnaposto con i primi set reali scelti tramite il catalogatore locale.',
  '-- Gli asset corrispondenti vivono in R2 sotto carte/designs/<set>/<file>.',
  `DELETE FROM carte_trade_items WHERE carta_definizione_id IN (SELECT cd.id FROM carte_definizioni cd JOIN carte_designs d ON d.id = cd.design_id JOIN carte_sets s ON s.id = d.set_id WHERE s.slug IN (${targetList}));`,
  `DELETE FROM carte_possesso WHERE carta_definizione_id IN (SELECT cd.id FROM carte_definizioni cd JOIN carte_designs d ON d.id = cd.design_id JOIN carte_sets s ON s.id = d.set_id WHERE s.slug IN (${targetList}));`,
  `DELETE FROM carte_definizioni WHERE design_id IN (SELECT d.id FROM carte_designs d JOIN carte_sets s ON s.id = d.set_id WHERE s.slug IN (${targetList}));`,
  `DELETE FROM carte_designs WHERE set_id IN (SELECT id FROM carte_sets WHERE slug IN (${targetList}));`,
  `DELETE FROM carte_sets WHERE slug IN (${targetList});`
];

let setPosition = 0;
for (const [setName, items] of grouped) {
  const setSlug = slug(setName);
  sql.push(`INSERT INTO carte_sets (slug, nome, descrizione, position, created_by, created_at) VALUES (${quote(setSlug)}, ${quote(setName)}, NULL, ${setPosition}, (SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1), CURRENT_TIMESTAMP);`);
  items.forEach((item, position) => {
    const extension = path.extname(item.file).toLowerCase();
    const imageKey = `carte/designs/${setSlug}/${slug(path.basename(item.file, extension))}${extension}`;
    sql.push(`INSERT INTO carte_designs (set_id, nome, immagine_key, position, created_by, created_at) VALUES ((SELECT id FROM carte_sets WHERE slug = ${quote(setSlug)}), ${quote(item.cardName.trim())}, ${quote(imageKey)}, ${position}, (SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1), CURRENT_TIMESTAMP);`);
    for (const finish of finishes) {
      sql.push(`INSERT INTO carte_definizioni (design_id, finitura, immagine_key) VALUES ((SELECT d.id FROM carte_designs d JOIN carte_sets s ON s.id = d.set_id WHERE s.slug = ${quote(setSlug)} AND d.position = ${position}), ${quote(finish)}, NULL);`);
    }
  });
  setPosition += 1;
}

const output = path.join(root, 'migrations', '0103_seed_carte_reali.sql');
await writeFile(output, `${sql.join('\n')}\n`, 'utf8');
console.log(`Generata ${path.relative(root, output)}: ${grouped.size} set, ${images.length} design, ${images.length * finishes.length} carte.`);

function slug(value) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'carta';
}

function quote(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}
