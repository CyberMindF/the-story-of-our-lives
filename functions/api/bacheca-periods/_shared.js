const MAX_TITLE_LENGTH = 60;

export function normalizeTitle(value) {
  const title = typeof value === "string" ? value.trim() : "";
  return title && title.length <= MAX_TITLE_LENGTH ? title : null;
}
