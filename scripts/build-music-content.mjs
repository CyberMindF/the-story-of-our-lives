import { readFile, writeFile } from "node:fs/promises";

const sourcePath = new URL("../sources/notion-original/05-le-cuffiette.txt", import.meta.url);
const outputPath = new URL("../web/public/content/music.json", import.meta.url);
const lines = (await readFile(sourcePath, "utf8")).split(/\r?\n/);

// Restituisce le righe originali senza reinterpretarne o correggerne il testo.
function take(start, end = start) {
  return lines.slice(start - 1, end).join("\n").trim();
}

// Garantisce una riga per ogni sezione [Tag] già presente nel testo originale, senza toccarne le parole.
function splitLyricsBySection(text) {
  return text
    .replace(/(\[[^\]]+\])/g, "\n$1")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

const songDefinitions = [
  ["il-cerchio", "Il Cerchio", 11, 11, 12, 14, 25],
  ["cosa-restera", "Cosa Resterà?", 49, 49, 26, 28, 47],
  ["il-porno-migliore", "Il Porno Migliore", 51, 51, 52, 54, 76],
  ["dimmi-cosa-provi-adesso", "Dimmi Cosa Provi Adesso", 89, 89, 77, 79, 87],
  ["conta", "Conta", 91, 91, 92, 94, 101],
  ["cosa-sei-per-me", "Cosa Sei Per Me", 118, 118, 102, 104, 116],
  ["ti-amo-male", "Ti Amo Male", 120, 120, 121, 123, 138],
  ["resta-qui-con-me", "Resta Qui Con Me", 157, 157, 139, 141, 155],
  ["desyland", "Desyland", 159, 159, 160, 162, 162]
];

const songs = songDefinitions.map(([id, title, introStart, introEnd, urlLine, lyricsStart, lyricsEnd]) => ({
  id,
  title,
  introduction: take(introStart, introEnd),
  soundcloudUrl: take(urlLine).replaceAll("&amp;", "&"),
  lyrics: splitLyricsBySection(take(lyricsStart, lyricsEnd))
}));

const stolenWords = lines.slice(166, 194).filter(Boolean).map((line) => {
  const separator = line.lastIndexOf(" -");
  return separator === -1
    ? { quote: line.trim(), source: "" }
    : { quote: line.slice(0, separator).trim(), source: line.slice(separator + 2).trim() };
});

const content = {
  title: "Le Cuffiette",
  playlist: {
    name: take(6),
    url: "https://rsgmsfcfm.short.gy/dthc",
    introduction: take(7).replace(/^🎵 Playlist 🎶\s*/, "")
  },
  songsIntroduction: take(9),
  songs,
  bonus: { available: true, label: take(163), key: "cuffiette/bonus/bonus.mp3" },
  stolenWords: { introduction: take(166), items: stolenWords }
};

await writeFile(outputPath, `${JSON.stringify(content, null, 2)}\n`, "utf8");
console.log(`Creato web/public/content/music.json con ${songs.length} brani e ${stolenWords.length} citazioni.`);
