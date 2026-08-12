const MAX_NAME_LENGTH = 120;
const MAX_PARAGRAPHS = 20;
const MAX_PARAGRAPH_LENGTH = 4000;
const MAX_IMAGES = 20;

export function normalizeName(value) {
  const name = typeof value === "string" ? value.trim() : "";
  return name && name.length <= MAX_NAME_LENGTH ? name : null;
}

// Accetta un numero, una stringa numerica o null/undefined (nessuna coordinata: la puntina
// finisce al centro della mappa, comportamento già previsto da mappa.ts).
export function normalizeCoordinate(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

export function normalizeParagraphs(value) {
  if (!Array.isArray(value)) {
    return null;
  }
  const items = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .slice(0, MAX_PARAGRAPHS);
  if (items.length === 0 || items.some((item) => item.length > MAX_PARAGRAPH_LENGTH)) {
    return null;
  }
  return items;
}

// Le immagini arrivano come JSON grezzo dal form (blocco unico, non un repeater): qui si valida
// solo la forma minima {src, alt, beforeParagraph?, position?}, senza reinventare un editor
// visuale per una struttura che cambia raramente.
export function normalizeImages(value) {
  if (value === undefined || value === null) {
    return [];
  }
  if (!Array.isArray(value) || value.length > MAX_IMAGES) {
    return null;
  }
  const images = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || typeof item.src !== "string" || !item.src.trim()) {
      return null;
    }
    const image = { src: item.src.trim(), alt: typeof item.alt === "string" ? item.alt.trim() : "" };
    if (Number.isInteger(item.beforeParagraph)) {
      image.beforeParagraph = item.beforeParagraph;
    }
    if (item.position === "before" || item.position === "after") {
      image.position = item.position;
    }
    images.push(image);
  }
  return images;
}
