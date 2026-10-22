import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

// Recupero una tantum per il bulk storico di maggio/luglio: quel manifest contiene le foto
// originali ma, a differenza dell'editor corrente, non aveva generato le relative miniature.
// Gli output restano locali e ignorati da git; nel repository salviamo soltanto il manifest
// riproducibile che permette di rigenerarli e caricarli su R2.
const projectRoot = path.resolve(import.meta.dirname, '..');
const sourceManifestPath = path.join(projectRoot, 'sources/manifests/bacheca-new-media-manifest.json');
const outputRoot = path.join(projectRoot, '.generated/bacheca-thumbnails');
const uploadManifestPath = path.join(projectRoot, 'sources/manifests/bacheca-new-thumbnails-manifest.json');
const sourceManifest = JSON.parse(await readFile(sourceManifestPath, 'utf8'));
const photos = sourceManifest.filter(entry => /\.jpe?g$/i.test(entry.key) && entry.key.includes('/original/'));
const uploadManifest = [];

for (const [index, entry] of photos.entries()) {
  const key = entry.key.replace('/original/', '/thumb/').replace(/\.jpeg$/i, '.jpg');
  const outputPath = path.join(outputRoot, key);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await sharp(entry.source)
    .rotate()
    .resize({ width: 480, withoutEnlargement: true })
    .jpeg({ quality: 78, mozjpeg: true })
    .toFile(outputPath);
  uploadManifest.push({ key, source: path.relative(projectRoot, outputPath) });
  if ((index + 1) % 20 === 0 || index === photos.length - 1) {
    console.log(`  ${index + 1}/${photos.length}`);
  }
}

await writeFile(uploadManifestPath, `${JSON.stringify(uploadManifest, null, 2)}\n`);
console.log(`Create ${uploadManifest.length} miniature e aggiornato ${path.relative(projectRoot, uploadManifestPath)}.`);
