import { readFile, writeFile } from "node:fs/promises";

const sourcePath = "ExportBlock-fbd237dd-039c-4dc5-9ab4-b9f20c5dcf16-Part-1/Gruppo pagine/📖 Le Storie 31479ac3576c80e9a2e1e4bccf7f1108.html";
const outputPath = "web/public/content/stories.json";

// Converte le entità usate dall'export Notion senza alterare il testo originale.
function decodeHtml(value) {
  const namedEntities = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };

  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, code) => {
    if (code.startsWith("#x")) return String.fromCodePoint(Number.parseInt(code.slice(2), 16));
    if (code.startsWith("#")) return String.fromCodePoint(Number.parseInt(code.slice(1), 10));
    return namedEntities[code.toLowerCase()] ?? entity;
  });
}

// Riduce il markup di Notion a testo semplice conservando gli a capo narrativi.
function extractText(fragment) {
  return decodeHtml(
    fragment
      .replace(/<br\s*\/?\s*>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/\r/g, "")
      .trim(),
  );
}

const html = await readFile(sourcePath, "utf8");
const storyPattern = /<details[^>]*>[\s\S]*?<summary>([\s\S]*?)<\/summary>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>([\s\S]*?)<\/details>/g;
const stories = [];

for (const match of html.matchAll(storyPattern)) {
  const heading = extractText(match[1]);
  const headingMatch = heading.match(/^(.*?) \((\d{2})\/(\d{2})\/(\d{4})\)$/);

  if (!headingMatch) throw new Error(`Titolo o data non riconosciuti: ${heading}`);

  stories.push({
    id: headingMatch[1]
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, ""),
    title: headingMatch[1],
    date: `${headingMatch[4]}-${headingMatch[3]}-${headingMatch[2]}`,
    body: extractText(match[2]),
  });
}

if (stories.length !== 4) throw new Error(`Attese 4 storie, trovate ${stories.length}`);

stories[2].videoUrl = "https://www.youtube-nocookie.com/embed/nagMxzLZfLk";
stories[2].image = "../assets/images/world/campo-erba.png";
stories[2].imageAlt = "Un campo d'erba azzurro e luminoso sotto una grande luna e un cielo stellato";

await writeFile(
  outputPath,
  `${JSON.stringify(
    {
      title: "Le Storie",
      introduction:
        "Spero che pian piano questa pagina si possa riempire delle nostre storie, speranze, sogni, anche quelli a occhi aperti. Spero tanto che qualche altra storia potremmo ancora scriverla insieme. Ovviamente sono solo storie, quindi suppongo che si possa sognare",
      stories,
    },
    null,
    2,
  )}\n`,
  "utf8",
);

console.log(`Estratte ${stories.length} storie in ${outputPath}`);
