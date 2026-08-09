import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Ricostruisce il contenuto pubblico della Bacheca camminando l'HTML originale nel suo ordine reale,
// senza correggerne il testo. Assegna anche la chiave R2 definitiva a ogni foto e produce
// un manifest locale (percorso sorgente -> chiave R2) usato solo per l'import, mai pubblicato.

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = path.join(
  projectRoot,
  "ExportBlock-fbd237dd-039c-4dc5-9ab4-b9f20c5dcf16-Part-1",
  "Gruppo pagine",
  "📸 La Bacheca dei Ricordi"
);
const sourcePath = path.join(
  projectRoot,
  "ExportBlock-fbd237dd-039c-4dc5-9ab4-b9f20c5dcf16-Part-1",
  "Gruppo pagine",
  "📸 La Bacheca dei Ricordi 31479ac3576c80e2ab7cfa11d7923c60.html"
);
const contentOutputPath = path.join(projectRoot, "web", "public", "content", "bacheca.json");
const manifestOutputPath = path.join(projectRoot, "reports", "export", "bacheca-media-manifest.json");

const daySlugs = {
  "Il primo giorno": "giorno-1",
  "Il secondo giorno": "giorno-2",
  "Il terzo giorno": "giorno-3",
  "Il quarto giorno": "giorno-4",
  "Il quinto giorno": "giorno-5",
  "L’ultimo giorno": "giorno-6",
  "Due fotine bonus": "bonus",
  Screenshots: "screenshots"
};

const html = await readFile(sourcePath, "utf8");
const body = html.match(/<div class="page-body">([\s\S]*)<\/article>/i)[1];

// L'originale affianca in colonne una foto (o un piccolo gruppo) e il testo che la
// descrive: "row-boundary" segna dove Notion apriva una nuova riga a colonne, così
// dopo possiamo raggruppare le foto della stessa riga invece di un'unica griglia
// per l'intera giornata, che confondeva quale didascalia si riferisse a quali foto.
const tokenPattern =
  /<div[^>]*class="column-list"[^>]*>|<h2[^>]*>([\s\S]*?)<\/h2>|<h3[^>]*>([\s\S]*?)<\/h3>|<figure[^>]*data-notion-image="([^"]+)"[^>]*>([\s\S]*?)<\/figure>|<figure[^>]*>((?:(?!<\/figure>)[\s\S])*<div class="source">[\s\S]*?<\/figure>)|<p[^>]*>([\s\S]*?)<\/p>/g;

const nodes = [];
for (const match of body.matchAll(tokenPattern)) {
  const [whole, h2, h3, imageSrc, imageInner, sourceFigure, paragraph] = match;

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
  } else if (whole.includes("column-list")) {
    nodes.push({ type: "row-boundary" });
  }
}

// La sezione d'indice in cima alla pagina usa le stesse intestazioni h2 ("Settembre",
// "Maggio", "I video", "Altre cose") ma contiene solo link di navigazione già scartati
// sopra: genera quindi periodi senza alcun contenuto reale, che filtriamo dopo.
const periods = [];
let currentPeriod = null;
let currentDay = null;
const introduction = [];

for (const node of nodes) {
  if (node.type === "h2") {
    currentPeriod = { title: node.text, slug: slugify(node.text), days: [] };
    periods.push(currentPeriod);
    currentDay = null;
    continue;
  }
  if (!currentPeriod) {
    if (node.type === "text") introduction.push(node.text);
    continue;
  }
  if (node.type === "h3") {
    currentDay = { title: node.text, slug: daySlugs[node.text] || slugify(node.text), items: [] };
    currentPeriod.days.push(currentDay);
    continue;
  }
  if (!currentDay) {
    currentDay = { title: null, slug: "generale", items: [] };
    currentPeriod.days.push(currentDay);
  }

  if (node.type === "row-boundary") {
    // Chiude il gruppo di foto in corso: la prossima foto apre una riga nuova.
    currentDay.openPhotoGroup = null;
    continue;
  }

  if (node.type === "photo") {
    if (!currentDay.openPhotoGroup) {
      currentDay.openPhotoGroup = { type: "photo-group", photos: [] };
      currentDay.items.push(currentDay.openPhotoGroup);
    }
    currentDay.openPhotoGroup.photos.push(node);
    continue;
  }

  currentDay.openPhotoGroup = null;
  currentDay.items.push(node);
}

// La proprietà di appoggio usata solo per costruire i gruppi non deve finire nel JSON.
for (const period of periods) {
  for (const day of period.days) {
    delete day.openPhotoGroup;
  }
}

// Le voci d'indice generano un periodo con zero foto/testo: le rimuoviamo.
const realPeriods = periods.filter((period) => period.days.some((day) => day.items.length > 0));

// Assegna la chiave R2 definitiva a ogni foto, in ordine, dentro ciascuna giornata.
const manifest = [];
for (const period of realPeriods) {
  for (const day of period.days) {
    let counter = 0;
    for (const item of day.items) {
      if (item.type !== "photo-group") continue;
      for (const photo of item.photos) {
        counter += 1;
        const extension = path.extname(photo.file) || ".jpg";
        const key = `bacheca/${period.slug}/${day.slug}/original/${String(counter).padStart(2, "0")}${extension}`;
        photo.key = key;
        manifest.push({ key, source: path.join(sourceDir, photo.file) });
        delete photo.file;
      }
    }
  }
}

await mkdir(path.dirname(contentOutputPath), { recursive: true });
await writeFile(
  contentOutputPath,
  `${JSON.stringify({ title: "La Bacheca dei Ricordi", introduction, periods: realPeriods }, null, 2)}\n`,
  "utf8"
);
await mkdir(path.dirname(manifestOutputPath), { recursive: true });
await writeFile(manifestOutputPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

console.log(`web/public/content/bacheca.json creato con ${realPeriods.length} periodi e ${manifest.length} foto.`);
console.log(`Manifest di import creato: ${path.relative(projectRoot, manifestOutputPath)}`);

function cleanText(value) {
  return decodeHtml(value.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "sezione";
}

function decodeHtml(value) {
  const named = { amp: "&", apos: "'", gt: ">", lt: "<", nbsp: " ", quot: '"' };
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, code) => {
    if (code.startsWith("#x")) return String.fromCodePoint(Number.parseInt(code.slice(2), 16));
    if (code.startsWith("#")) return String.fromCodePoint(Number.parseInt(code.slice(1), 10));
    return named[code.toLowerCase()] ?? entity;
  });
}
