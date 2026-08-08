import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Ricostruisce, camminando l'HTML nell'ordine reale del documento, la sequenza di
// intestazioni, paragrafi e foto (con relativa didascalia se presente) della Bacheca
// dei Ricordi. Non modifica né corregge il testo originale: serve solo a produrre un
// report locale leggibile prima di decidere struttura dati e import in R2.

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(
  projectRoot,
  "ExportBlock-fbd237dd-039c-4dc5-9ab4-b9f20c5dcf16-Part-1",
  "Gruppo pagine",
  "📸 La Bacheca dei Ricordi 31479ac3576c80e2ab7cfa11d7923c60.html"
);
const outputPath = path.join(projectRoot, "reports", "export", "bacheca-structure.json");

const html = await readFile(sourcePath, "utf8");
const body = html.match(/<div class="page-body">([\s\S]*)<\/article>/i)[1];

const tokenPattern =
  /<h2[^>]*>([\s\S]*?)<\/h2>|<h3[^>]*>([\s\S]*?)<\/h3>|<figure[^>]*data-notion-image="([^"]+)"[^>]*>([\s\S]*?)<\/figure>|<figure[^>]*>((?:(?!<\/figure>)[\s\S])*<div class="source">[\s\S]*?<\/figure>)|<p[^>]*>([\s\S]*?)<\/p>/g;

const nodes = [];
for (const match of body.matchAll(tokenPattern)) {
  const [, h2, h3, imageSrc, imageInner, sourceFigure, paragraph] = match;

  if (h2 !== undefined) {
    nodes.push({ type: "h2", text: cleanText(h2) });
  } else if (h3 !== undefined) {
    nodes.push({ type: "h3", text: cleanText(h3) });
  } else if (imageSrc !== undefined) {
    const captionMatch = imageInner.match(/<figcaption>([\s\S]*?)<\/figcaption>/);
    nodes.push({
      type: "photo",
      file: decodeURIComponent(imageSrc.split("/").pop()),
      caption: captionMatch ? cleanText(captionMatch[1]) : null
    });
  } else if (sourceFigure !== undefined) {
    const hrefMatch = sourceFigure.match(/<a href="([^"]+)"/);
    nodes.push({ type: "external", href: hrefMatch ? decodeHtml(hrefMatch[1]) : null });
  } else if (paragraph !== undefined) {
    const text = cleanText(paragraph);
    if (text && !text.startsWith("➡️") && text !== "[ ⬅️ Torna al Mondo Bianco ]") {
      nodes.push({ type: "text", text });
    }
  }
}

// Raggruppa la sequenza piatta in periodo -> sezione -> blocchi, così com'è nel documento.
const periods = [];
let currentPeriod = null;
let currentSection = null;

for (const node of nodes) {
  if (node.type === "h2") {
    currentPeriod = { title: node.text, sections: [] };
    periods.push(currentPeriod);
    currentSection = null;
    continue;
  }
  if (!currentPeriod) continue; // intro prima del primo h2, non fa parte delle sezioni

  if (node.type === "h3") {
    currentSection = { title: node.text, items: [] };
    currentPeriod.sections.push(currentSection);
    continue;
  }

  const target = currentSection ?? (currentSection = { title: null, items: [] }, currentPeriod.sections.push(currentSection), currentSection);
  target.items.push(node);
}

const totalPhotos = nodes.filter((node) => node.type === "photo").length;
const totalText = nodes.filter((node) => node.type === "text").length;
const captionedPhotos = nodes.filter((node) => node.type === "photo" && node.caption).length;

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(
  outputPath,
  `${JSON.stringify({ generatedAt: new Date().toISOString(), totals: { photos: totalPhotos, captionedPhotos, textBlocks: totalText }, periods }, null, 2)}\n`,
  "utf8"
);

console.log(`Report creato: ${path.relative(projectRoot, outputPath)}`);
console.log(JSON.stringify({ totalPhotos, captionedPhotos, totalText, periods: periods.map((p) => ({ title: p.title, sections: p.sections.map((s) => ({ title: s.title, items: s.items.length })) })) }, null, 2));

function cleanText(value) {
  return decodeHtml(value.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function decodeHtml(value) {
  const named = { amp: "&", apos: "'", gt: ">", lt: "<", nbsp: " ", quot: '"' };
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, code) => {
    if (code.startsWith("#x")) return String.fromCodePoint(Number.parseInt(code.slice(2), 16));
    if (code.startsWith("#")) return String.fromCodePoint(Number.parseInt(code.slice(1), 10));
    return named[code.toLowerCase()] ?? entity;
  });
}
