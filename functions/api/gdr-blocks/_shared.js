const DOCUMENT_KEYS = ["avventura", "maga-regole"];
const BLOCK_TYPES = ["heading", "paragraph", "callout", "image", "npc_grid", "list", "table"];
const MAX_DATA_LENGTH = 20000;

export function normalizeDocumentKey(value) {
  return typeof value === "string" && DOCUMENT_KEYS.includes(value) ? value : null;
}

export function normalizeType(value) {
  return typeof value === "string" && BLOCK_TYPES.includes(value) ? value : null;
}

// Il contenuto di un blocco cambia forma per tipo (heading ha solo testo, npc_grid ha un
// elenco di schede, table ha intestazione+righe...): stesso principio "editor senza fronzoli"
// già usato per le immagini di map_destinations, un blob JSON validato solo nella forma
// minima (oggetto, non vuoto, dentro il limite di lunghezza), non con uno schema per tipo.
export function normalizeData(value) {
  if (value === undefined || value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const serialized = JSON.stringify(value);
  return serialized.length > 0 && serialized.length <= MAX_DATA_LENGTH ? serialized : null;
}
