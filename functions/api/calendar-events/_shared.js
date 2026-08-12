const MAX_BODY_LENGTH = 4000;
const MAX_LABEL_LENGTH = 40;

export function isValidDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function normalizeLabel(value) {
  const label = typeof value === "string" ? value.trim() : "";
  return label && label.length <= MAX_LABEL_LENGTH ? label : null;
}

export function normalizeBody(value) {
  const body = typeof value === "string" ? value.trim() : "";
  return body && body.length <= MAX_BODY_LENGTH ? body : null;
}
