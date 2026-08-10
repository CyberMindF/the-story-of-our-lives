// Estratta da letters.js perché serve identica anche a questions.js (domanda/risposta e
// le loro modifiche) — vedi CLAUDE.md, zero duplicazione di codice.
export function normalizeRequiredText(value, maxLength) {
  if (typeof value !== "string") return "";
  const normalized = value.trim();
  return normalized.length <= maxLength ? normalized : "";
}
