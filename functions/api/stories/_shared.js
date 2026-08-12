const MAX_TITLE_LENGTH = 160;
const MAX_BODY_LENGTH = 20000;
const MAX_URL_LENGTH = 500;

export function normalizeTitle(value) {
  const title = typeof value === "string" ? value.trim() : "";
  return title && title.length <= MAX_TITLE_LENGTH ? title : null;
}

export function isValidDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function normalizeBody(value) {
  const body = typeof value === "string" ? value.trim() : "";
  return body && body.length <= MAX_BODY_LENGTH ? body : null;
}

// Campi facoltativi: stringa vuota o assente diventa NULL, non un errore.
export function normalizeOptionalText(value, maxLength = MAX_URL_LENGTH) {
  if (value === undefined || value === null) {
    return null;
  }
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) {
    return null;
  }
  return text.length <= maxLength ? text : null;
}
