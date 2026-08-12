const MAX_TEXT_LENGTH = 2000;
const MAX_CATEGORY_LENGTH = 40;
const MAX_URL_LENGTH = 500;
const MAX_DATE_LABEL_LENGTH = 40;

// text e privateText sono entrambi facoltativi individualmente, ma non possono mancare
// insieme: un'attività senza testo pubblico né privato non avrebbe nulla da mostrare a nessuno.
export function normalizeOptionalText(value, maxLength = MAX_TEXT_LENGTH) {
  if (value === undefined || value === null) {
    return null;
  }
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) {
    return null;
  }
  return text.length <= maxLength ? text : undefined;
}

export function normalizeCategory(value) {
  const category = typeof value === "string" ? value.trim().toLowerCase() : "";
  return category && /^[a-z][a-z-]{0,38}$/.test(category) ? category : null;
}

export function normalizeDateLabel(value) {
  const label = typeof value === "string" ? value.trim() : "";
  return label && label.length <= MAX_DATE_LABEL_LENGTH ? label : null;
}

export { MAX_URL_LENGTH, MAX_CATEGORY_LENGTH };
