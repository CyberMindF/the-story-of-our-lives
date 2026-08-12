const MAX_TITLE_LENGTH = 120;
const MAX_NOTE_LENGTH = 500;
const MAX_LIST_ITEMS = 60;
const MAX_ITEM_LENGTH = 500;
const KINDS = ["Fatta insieme", "Da provare"];

export function isValidKind(value) {
  return KINDS.includes(value);
}

export function normalizeTitle(value) {
  const title = typeof value === "string" ? value.trim() : "";
  return title && title.length <= MAX_TITLE_LENGTH ? title : null;
}

// Facoltativa: null esplicito è un valore valido (nessuna nota), stringa vuota anche.
export function normalizeNote(value) {
  if (value === undefined || value === null) {
    return null;
  }
  const note = typeof value === "string" ? value.trim() : "";
  if (!note) {
    return null;
  }
  return note.length <= MAX_NOTE_LENGTH ? note : null;
}

export function normalizeSource(value) {
  if (!value || typeof value !== "object") {
    return { label: null, href: null };
  }
  const label = typeof value.label === "string" ? value.label.trim() : "";
  const href = typeof value.href === "string" ? value.href.trim() : "";
  if (!label || !href) {
    return { label: null, href: null };
  }
  try {
    // eslint-disable-next-line no-new
    new URL(href);
  } catch {
    return { label: null, href: null };
  }
  return { label: label.slice(0, MAX_TITLE_LENGTH), href };
}

// Ingredienti e passaggi arrivano dal frontend come testo multi-riga: una riga per elemento,
// righe vuote scartate. Qui si valida e si riserializza in JSON per la colonna.
export function normalizeList(value) {
  if (!Array.isArray(value)) {
    return null;
  }
  const items = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .slice(0, MAX_LIST_ITEMS);

  if (items.length === 0 || items.some((item) => item.length > MAX_ITEM_LENGTH)) {
    return null;
  }
  return items;
}
