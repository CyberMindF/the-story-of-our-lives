import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const exportRoot = path.join(projectRoot, "ExportBlock-fbd237dd-039c-4dc5-9ab4-b9f20c5dcf16-Part-1");
const reportDirectory = path.join(projectRoot, "sources", "migration-reports");
const reportPath = path.join(reportDirectory, "notion-export-analysis.json");
const textDirectory = path.join(projectRoot, "sources", "notion-original");

// Analizza l'export senza modificarlo e salva un inventario dettagliato ripetibile.
async function main() {
  const files = await listFiles(exportRoot);
  const htmlFiles = files.filter((file) => file.endsWith(".html"));
  const pages = [];

  for (const htmlPath of htmlFiles) {
    const html = await readFile(htmlPath, "utf8");
    pages.push(await analyzePage(htmlPath, html));
  }

  const externalLinks = pages.flatMap((page) =>
    page.links.filter((link) => link.external).map((link) => ({ ...link, page: page.title }))
  );
  const externalResources = pages.flatMap((page) =>
    page.externalResources.map((resource) => ({ ...resource, page: page.title }))
  );
  const report = {
    generatedAt: new Date().toISOString(),
    source: path.relative(projectRoot, exportRoot),
    totals: {
      pages: pages.length,
      files: files.length,
      mediaReferences: pages.reduce((total, page) => total + page.media.length, 0),
      externalLinks: externalLinks.length,
      externalResources: externalResources.length
    },
    externalDomains: countBy([...externalLinks, ...externalResources], (item) => new URL(item.href).hostname),
    pages
  };

  await mkdir(reportDirectory, { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeExtractedTexts(pages);
  console.log(`Report creato: ${path.relative(projectRoot, reportPath)}`);
  console.log(`Testi estratti: ${path.relative(projectRoot, textDirectory)}`);
  console.log(JSON.stringify(report.totals));
}

// Salva ogni pagina come file di testo autonomo, leggibile e pronto per il confronto manuale.
async function writeExtractedTexts(pages) {
  await mkdir(textDirectory, { recursive: true });
  for (const [index, page] of pages.entries()) {
    const number = String(index + 1).padStart(2, "0");
    const fileName = `${number}-${slugify(page.title)}.txt`;
    const content = `${page.title}\n${"=".repeat(page.title.length)}\n\n${page.text}\n`;
    await writeFile(path.join(textDirectory, fileName), content, "utf8");
  }
}

// Raccoglie ricorsivamente tutti i file mantenendo un ordinamento stabile.
async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name, "it"))) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(entryPath));
    } else {
      files.push(entryPath);
    }
  }
  return files;
}

// Estrae testo pulito, collegamenti e riferimenti ai media da una pagina Notion.
async function analyzePage(htmlPath, html) {
  const title = decodeHtml(matchFirst(html, /<title[^>]*>([\s\S]*?)<\/title>/i) || path.basename(htmlPath));
  const body = matchFirst(html, /<body[^>]*>([\s\S]*?)<\/body>/i) || html;
  const links = extractLinks(body);
  const externalResources = extractExternalResources(html);
  const media = await extractMedia(body, htmlPath);

  return {
    title: cleanInlineText(title),
    sourceFile: path.relative(exportRoot, htmlPath),
    sourceSha256: sha256(html),
    text: extractCleanText(body),
    links,
    externalResources,
    media
  };
}

// Raccoglie risorse tecniche esterne come stylesheet, script e iframe.
function extractExternalResources(html) {
  const resources = [];
  const expression = /<(link|script|iframe)\b[^>]*(?:href|src)=["'](https?:\/\/[^"']+)["'][^>]*>/gi;
  for (const match of html.matchAll(expression)) {
    resources.push({ type: match[1].toLowerCase(), href: decodeHtml(match[2]) });
  }
  return resources;
}

// Estrae i link conservando il testo visibile e distinguendo URL esterni e locali.
function extractLinks(html) {
  return [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)].map((match) => ({
    label: cleanInlineText(stripTags(match[2])) || "(senza etichetta)",
    href: decodeHtml(match[1]),
    external: /^https?:\/\//i.test(decodeHtml(match[1]))
  }));
}

// Controlla se ogni riferimento locale a immagini, audio o video esiste nell'export.
async function extractMedia(html, htmlPath) {
  const media = [];
  for (const match of html.matchAll(/<(img|audio|video|source)\b[^>]*src=["']([^"']+)["'][^>]*>/gi)) {
    const src = decodeHtml(match[2]);
    const localPath = /^https?:\/\//i.test(src) ? null : path.resolve(path.dirname(htmlPath), decodeURIComponent(src));
    let exists = null;
    if (localPath) {
      try {
        exists = (await stat(localPath)).isFile();
      } catch {
        exists = false;
      }
    }
    media.push({ type: match[1].toLowerCase(), src, localExists: exists });
  }
  return media;
}

// Converte l'HTML in testo leggibile mantenendo soltanto separazioni semantiche essenziali.
function extractCleanText(html) {
  return decodeHtml(
    html
      .replace(/<(script|style|svg)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
      .replace(/<(br|\/p|\/h[1-6]|\/li|\/blockquote|\/summary|\/div)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  )
    .split(/\n+/)
    .map(cleanInlineText)
    .filter(Boolean)
    .join("\n");
}

// Rimuove i tag residui da frammenti usati come etichette.
function stripTags(value) {
  return value.replace(/<[^>]+>/g, " ");
}

// Normalizza spazi e ritorni a capo senza correggere il contenuto originale.
function cleanInlineText(value) {
  return value.replace(/\s+/g, " ").trim();
}

// Crea nomi file stabili eliminando emoji e caratteri non adatti ai percorsi.
function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "pagina";
}

// Decodifica le entità HTML più comuni e quelle numeriche presenti nell'export Notion.
function decodeHtml(value) {
  const named = { amp: "&", apos: "'", gt: ">", lt: "<", nbsp: " ", quot: '"' };
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, code) => {
    if (code.startsWith("#x")) return String.fromCodePoint(Number.parseInt(code.slice(2), 16));
    if (code.startsWith("#")) return String.fromCodePoint(Number.parseInt(code.slice(1), 10));
    return named[code.toLowerCase()] ?? entity;
  });
}

// Restituisce il primo gruppo catturato oppure null.
function matchFirst(value, expression) {
  return value.match(expression)?.[1] ?? null;
}

// Calcola un'impronta per poter rilevare cambiamenti della fonte originale.
function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

// Conta gli elementi per una chiave, ordinando il risultato per nome.
function countBy(items, getKey) {
  return Object.fromEntries(
    [...items.reduce((counts, item) => {
      const key = getKey(item);
      counts.set(key, (counts.get(key) || 0) + 1);
      return counts;
    }, new Map())].sort(([left], [right]) => left.localeCompare(right))
  );
}

await main();
