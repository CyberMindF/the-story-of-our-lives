const MAX_TITLE_LENGTH = 160;
const MAX_TEXT_LENGTH = 20000;
const MAX_KEY_LENGTH = 300;

export function normalizeTitle(value) {
  const title = typeof value === "string" ? value.trim() : "";
  return title && title.length <= MAX_TITLE_LENGTH ? title : null;
}

export function normalizeText(value) {
  const text = typeof value === "string" ? value.trim() : "";
  return text && text.length <= MAX_TEXT_LENGTH ? text : null;
}

export function normalizeMediaKey(value) {
  const key = typeof value === "string" ? value.trim() : "";
  return key && key.length <= MAX_KEY_LENGTH ? key : null;
}
