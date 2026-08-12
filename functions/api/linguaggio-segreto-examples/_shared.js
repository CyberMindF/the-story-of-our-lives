const MAX_CODE_LENGTH = 40;
const MAX_MEANING_LENGTH = 300;

export function normalizeCode(value) {
  const code = typeof value === "string" ? value.trim() : "";
  return code && code.length <= MAX_CODE_LENGTH ? code : null;
}

export function normalizeMeaning(value) {
  const meaning = typeof value === "string" ? value.trim() : "";
  return meaning && meaning.length <= MAX_MEANING_LENGTH ? meaning : null;
}
