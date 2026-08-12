const MAX_TITLE_LENGTH = 80;
const MAX_LINES = 40;
const MAX_SEGMENTS_PER_LINE = 4;
const MAX_SEGMENT_LENGTH = 4000;
const SPEAKERS = new Set(["r", "d"]);

export function normalizeTitle(value) {
  const title = typeof value === "string" ? value.trim() : "";
  return title && title.length <= MAX_TITLE_LENGTH ? title : null;
}

// Ogni riga è una lista di segmenti {speaker: null|"r"|"d", text}: la maggior parte delle righe
// ha un solo segmento, ma è ammesso più di uno per i (rari) paragrafi che mescolano narrazione
// e battuta (vedi 0054_create_mappamondo_scenes.sql).
export function normalizeLines(value) {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_LINES) {
    return null;
  }

  const lines = [];
  for (const line of value) {
    if (!Array.isArray(line) || line.length === 0 || line.length > MAX_SEGMENTS_PER_LINE) {
      return null;
    }
    const segments = [];
    for (const segment of line) {
      if (!segment || typeof segment !== "object") {
        return null;
      }
      const text = typeof segment.text === "string" ? segment.text.trim() : "";
      if (!text || text.length > MAX_SEGMENT_LENGTH) {
        return null;
      }
      const speaker = segment.speaker === null || segment.speaker === undefined ? null : segment.speaker;
      if (speaker !== null && !SPEAKERS.has(speaker)) {
        return null;
      }
      segments.push({ speaker, text });
    }
    lines.push(segments);
  }
  return lines;
}
