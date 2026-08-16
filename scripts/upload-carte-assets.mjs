import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const remote = process.argv.includes('--remote');
const review = JSON.parse(await readFile(path.join(root, 'sources', 'carte-image-review.json'), 'utf8'));
const images = Object.entries(review.images).filter(([, item]) => item.status === 'includi');

let uploaded = 0;
for (const [file, item] of images) {
  const extension = path.extname(file).toLowerCase();
  const setSlug = slug(item.setName);
  const key = `carte/designs/${setSlug}/${slug(path.basename(file, extension))}${extension}`;
  const result = spawnSync('npx', [
    'wrangler', 'r2', 'object', 'put', `the-white-world-media/${key}`,
    '--file', path.join(root, 'Immagini per carte', file),
    '--content-type', contentType(extension),
    remote ? '--remote' : '--local'
  ], { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || `Upload fallito: ${file}`);
  uploaded += 1;
  console.log(`${uploaded}/${images.length} ${key}`);
}
console.log(`${uploaded} asset caricati su R2 ${remote ? 'remoto' : 'locale'}.`);

function slug(value) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'carta';
}

function contentType(extension) {
  if (extension === '.png') return 'image/png';
  if (extension === '.webp') return 'image/webp';
  return 'image/jpeg';
}
