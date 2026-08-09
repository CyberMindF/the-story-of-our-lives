import sharp from "sharp";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Converte le immagini hero/decorative (non media personali) in WebP, per alleggerire il
// caricamento. Gli originali PNG/JPG restano intatti accanto al file ottimizzato: non li
// sostituisce, aggiunge solo la versione leggera da usare al posto loro nelle pagine.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const targets = [
  "assets/images/world",
  "assets/images/gdr/il-prezzo-della-verita"
];

const QUALITY = 82;

async function optimizeDir(relDir) {
  const dir = path.join(root, relDir);
  const files = await readdir(dir);
  for (const file of files) {
    if (!/\.(png|jpe?g)$/i.test(file)) continue;
    const inputPath = path.join(dir, file);
    const outputPath = inputPath.replace(/\.(png|jpe?g)$/i, ".webp");
    const before = (await stat(inputPath)).size;
    await sharp(inputPath).webp({ quality: QUALITY }).toFile(outputPath);
    const after = (await stat(outputPath)).size;
    const saved = (100 - (after / before) * 100).toFixed(0);
    console.log(`${relDir}/${file} -> ${path.basename(outputPath)}  ${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB (-${saved}%)`);
  }
}

for (const dir of targets) {
  await optimizeDir(dir);
}
