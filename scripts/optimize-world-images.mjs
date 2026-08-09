import sharp from "sharp";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Converte le immagini hero/decorative (non media personali) in WebP, per alleggerire il
// caricamento. Gli originali restano fuori dalla build in sources/image-originals.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const targets = [
  {
    source: "sources/image-originals/world",
    output: "web/public/assets/images/world"
  },
  {
    source: "sources/image-originals/gdr/il-prezzo-della-verita",
    output: "web/public/assets/images/gdr/il-prezzo-della-verita"
  },
  {
    source: "sources/image-originals/portone",
    output: "web/public/assets/images/portone"
  }
];

const QUALITY = 82;

async function optimizeDir(target) {
  const sourceDir = path.join(root, target.source);
  const outputDir = path.join(root, target.output);
  const files = await readdir(sourceDir);
  for (const file of files) {
    if (!/\.(png|jpe?g)$/i.test(file)) continue;
    const inputPath = path.join(sourceDir, file);
    const outputPath = path.join(outputDir, file.replace(/\.(png|jpe?g)$/i, ".webp"));
    const before = (await stat(inputPath)).size;
    await sharp(inputPath).webp({ quality: QUALITY }).toFile(outputPath);
    const after = (await stat(outputPath)).size;
    const saved = (100 - (after / before) * 100).toFixed(0);
    console.log(`${target.source}/${file} -> ${target.output}/${path.basename(outputPath)}  ${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB (-${saved}%)`);
  }
}

for (const target of targets) {
  await optimizeDir(target);
}
