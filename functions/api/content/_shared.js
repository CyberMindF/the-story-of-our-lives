// Fase 3 del CMS (planning editor contenuti.md): regole di validazione condivise tra gli
// endpoint di content_entries/content_versions. La sicurezza vive solo qui e nel backend: il
// frontend non deve mai essere l'unico a controllare tipo, chiave o dimensione del contenuto.
export const CONTENT_TYPES = ["plain_text", "paragraphs"];
export const VERSIONING_MODES = ["replace", "history"];
const MAX_BODY_LENGTH = 20000;
const MAX_LABEL_LENGTH = 120;

// Le chiavi sono identificatori stabili tipo "mondo-bianco.introduzione": segmenti minuscoli
// separati da punti, usati anche nel codice Angular per richiamare il contenuto.
export function isValidContentKey(value) {
  return typeof value === "string" && /^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)+$/.test(value) && value.length <= 128;
}

export function normalizeLabel(value) {
  const label = typeof value === "string" ? value.trim() : "";
  return label && label.length <= MAX_LABEL_LENGTH ? label : null;
}

export function normalizeBody(value) {
  if (typeof value !== "string") {
    return null;
  }

  const body = value.trim();
  return body && body.length <= MAX_BODY_LENGTH ? body : null;
}

export function isValidContentType(value) {
  return CONTENT_TYPES.includes(value);
}

export function isValidVersioningMode(value) {
  return VERSIONING_MODES.includes(value);
}
