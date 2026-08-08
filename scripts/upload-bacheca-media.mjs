import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Carica i 130 media della Bacheca sul bucket R2 remoto reale, secondo il manifest
// generato da build-bacheca-content.mjs. Idempotente: puoi rilanciarlo se si interrompe,
// wrangler sovrascrive semplicemente l'oggetto già caricato con lo stesso contenuto.

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(projectRoot, "reports", "export", "bacheca-media-manifest.json");
const bucketName = "the-white-world-media";
const scopeFlag = process.argv.includes("--local") ? "--local" : "--remote";

const contentTypes = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png" };

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
console.log(`Carico ${manifest.length} file su ${bucketName} (${scopeFlag === "--local" ? "locale" : "remoto"})...`);

let uploaded = 0;
const failures = [];

for (const [index, entry] of manifest.entries()) {
  const extension = path.extname(entry.key).toLowerCase();
  const contentType = contentTypes[extension] || "application/octet-stream";

  const result = spawnSync(
    "npx",
    [
      "wrangler",
      "r2",
      "object",
      "put",
      `${bucketName}/${entry.key}`,
      scopeFlag,
      "--file",
      entry.source,
      "--content-type",
      contentType
    ],
    { encoding: "utf8" }
  );

  if (result.status === 0) {
    uploaded += 1;
  } else {
    failures.push({ key: entry.key, error: result.stderr?.slice(-400) || result.error?.message });
  }

  if ((index + 1) % 10 === 0 || index === manifest.length - 1) {
    console.log(`  ${index + 1}/${manifest.length}`);
  }
}

console.log(`Completato: ${uploaded}/${manifest.length} caricati.`);
if (failures.length > 0) {
  console.log(`Falliti: ${failures.length}`);
  console.log(JSON.stringify(failures, null, 2));
  process.exitCode = 1;
}
