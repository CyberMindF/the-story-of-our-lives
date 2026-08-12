const MAX_SYMBOL_LENGTH = 40;
const MAX_MEANING_LENGTH = 200;
const MAX_EXPLANATION_LENGTH = 2000;

export function normalizeSymbol(value) {
  const symbol = typeof value === "string" ? value.trim() : "";
  return symbol && symbol.length <= MAX_SYMBOL_LENGTH ? symbol : null;
}

export function normalizeMeaning(value) {
  const meaning = typeof value === "string" ? value.trim() : "";
  return meaning && meaning.length <= MAX_MEANING_LENGTH ? meaning : null;
}

// La spiegazione è facoltativa: non ogni simbolo ne ha una (es. "0" in Logistica).
export function normalizeExplanation(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const explanation = typeof value === "string" ? value.trim() : "";
  return explanation.length <= MAX_EXPLANATION_LENGTH ? explanation : undefined;
}

export async function categoryExists(env, categoryId) {
  if (typeof categoryId !== "string" || !categoryId) {
    return false;
  }
  const row = await env.DB.prepare("SELECT id FROM linguaggio_segreto_categories WHERE id = ?").bind(categoryId).first();
  return Boolean(row);
}
