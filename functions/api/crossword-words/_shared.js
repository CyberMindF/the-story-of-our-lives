const MAX_SOLUTION_LENGTH = 40;
const MAX_CLUE_LENGTH = 2000;

// Solo lettere (accentate incluse): la griglia normalizza comunque in maiuscolo lato client,
// qui si valida solo che non sia vuoto o assurdo, non si reinventa quel controllo.
export function normalizeSolution(value) {
  const solution = typeof value === "string" ? value.trim().toUpperCase() : "";
  return solution && solution.length <= MAX_SOLUTION_LENGTH ? solution : null;
}

export function normalizeClue(value) {
  const clue = typeof value === "string" ? value.trim() : "";
  return clue && clue.length <= MAX_CLUE_LENGTH ? clue : null;
}

// Riga/colonna possono essere negative (coordinate relative a un'origine scelta a mano nella
// griglia storica, non a partire da 0): qui si valida solo che siano interi finiti.
export function normalizeCoordinate(value) {
  const number = Number(value);
  return Number.isInteger(number) ? number : undefined;
}

export function normalizeDirection(value) {
  return value === "O" || value === "V" ? value : null;
}
