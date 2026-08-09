import { readFile, writeFile, mkdtemp, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

// Genera una miniatura (larghezza massima 480px) per ogni foto del manifest e la carica
// su R2 nella stessa posizione dell'originale ma sotto "thumb" invece di "original".
// Aggiorna il JSON pubblico della Bacheca aggiungendo "thumbKey" a ogni foto corrispondente.

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(projectRoot, "sources", "manifests", "bacheca-media-manifest.json");
const contentPath = path.join(projectRoot, "web", "public", "content", "bacheca.json");
const bucketName = "the-white-world-media";
const maxWidth = 480;
const scopeFlag = process.argv.includes("--local") ? "--local" : "--remote";

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const tempDir = await mkdtemp(path.join(os.tmpdir(), "bacheca-thumbs-"));

let done = 0;
const failures = [];
const thumbKeyByOriginalKey = new Map();

for (const [index, entry] of manifest.entries()) {
  const thumbKey = entry.key.replace("/original/", "/thumb/");
  thumbKeyByOriginalKey.set(entry.key, thumbKey);
  const extension = path.extname(entry.key).toLowerCase();
  const tempFile = path.join(tempDir, `${index}${extension}`);
  const contentType = extension === ".png" ? "image/png" : "image/jpeg";

  try {
    const pipeline = sharp(entry.source).resize({ width: maxWidth, withoutEnlargement: true });
    await (extension === ".png" ? pipeline.png({ quality: 80 }) : pipeline.jpeg({ quality: 78 })).toFile(tempFile);

    const result = spawnSync(
      "npx",
      ["wrangler", "r2", "object", "put", `${bucketName}/${thumbKey}`, scopeFlag, "--file", tempFile, "--content-type", contentType],
      { encoding: "utf8" }
    );
    if (result.status !== 0) throw new Error(result.stderr?.slice(-400) || "upload fallito");
    done += 1;
  } catch (error) {
    failures.push({ key: entry.key, error: error.message });
  }

  if ((index + 1) % 10 === 0 || index === manifest.length - 1) {
    console.log(`  ${index + 1}/${manifest.length}`);
  }
}

await rm(tempDir, { recursive: true, force: true });

// Aggiunge thumbKey a ogni foto nel JSON pubblico, mantenendo tutto il resto invariato.
const content = JSON.parse(await readFile(contentPath, "utf8"));
for (const period of content.periods) {
  for (const day of period.days) {
    for (const item of day.items) {
      if (item.type === "photo" && thumbKeyByOriginalKey.has(item.key)) {
        item.thumbKey = thumbKeyByOriginalKey.get(item.key);
      }
    }
  }
}
await writeFile(contentPath, `${JSON.stringify(content, null, 2)}\n`, "utf8");

console.log(`Completato: ${done}/${manifest.length} miniature create e caricate.`);
if (failures.length > 0) {
  console.log(`Falliti: ${failures.length}`);
  console.log(JSON.stringify(failures, null, 2));
  process.exitCode = 1;
}
