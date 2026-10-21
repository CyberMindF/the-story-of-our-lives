import { check } from './_errors.mjs';

export const PIPES_META = Object.freeze({
  id: 'pipes', title: 'Circuito spezzato', emoji: '🔌',
  description: 'Ognuno vede metà dei tubi: ricostruite insieme il percorso dell’energia.',
});

const SIZES = Object.freeze({ easy: 3, normal: 4, hard: 5 });
const owner = (index, size) => (Math.floor(index / size) + index % size) % 2;
const rotate = ports => ports.map(port => (port + 1) % 4).sort((a, b) => a - b);
const random = max => crypto.getRandomValues(new Uint32Array(1))[0] % max;

function adjacent(index, port, size) {
  const row = Math.floor(index / size), col = index % size;
  if (port === 0) return row > 0 ? index - size : -1;
  if (port === 1) return col < size - 1 ? index + 1 : -1;
  if (port === 2) return row < size - 1 ? index + size : -1;
  return col > 0 ? index - 1 : -1;
}

function direction(from, to, size) {
  return [0, 1, 2, 3].find(port => adjacent(from, port, size) === to);
}

// Randomized depth-first spanning traversal: at most size² cells, no retry loop.
function makePath(size) {
  const stack = [0], seen = new Set(stack), sink = size * size - 1;
  while (stack.at(-1) !== sink) {
    const current = stack.at(-1);
    const next = [0, 1, 2, 3].map(port => adjacent(current, port, size))
      .filter(index => index >= 0 && !seen.has(index));
    if (!next.length) stack.pop();
    else {
      const chosen = next[random(next.length)];
      seen.add(chosen);
      stack.push(chosen);
    }
  }
  return stack;
}

export function createPipes(difficulty = 'normal') {
  check(Object.hasOwn(SIZES, difficulty), 'Scegli una difficoltà valida.');
  const size = SIZES[difficulty], source = 0, sink = size * size - 1;
  const path = makePath(size);
  const solution = Array.from({ length: size * size }, () => random(2) ? [0, 1] : [0, 2]);
  for (let i = 0; i < path.length; i++) {
    solution[path[i]] = [
      i === 0 ? 3 : direction(path[i], path[i - 1], size),
      i === path.length - 1 ? 1 : direction(path[i], path[i + 1], size),
    ].sort((a, b) => a - b);
  }
  const cells = solution.map(ports => {
    let result = [...ports];
    for (let turns = random(4); turns > 0; turns--) result = rotate(result);
    return result;
  });
  // Neither player can solve it alone from the initial state. A must open the
  // inlet; B must reconnect at least one of its two adjacent checkerboard cells.
  while (cells[source].includes(3)) cells[source] = rotate(cells[source]);
  while (cells[1].includes(3)) cells[1] = rotate(cells[1]);
  while (cells[size].includes(0)) cells[size] = rotate(cells[size]);
  return { type: 'pipes', difficulty, size, source, sink, cells, solution,
    confirmed: [false, false], solved: false };
}

// Only the component fed from the west inlet matters. Disconnected distractor
// pipes may remain unfinished; every opening of an energized pipe must match.
function flow(puzzle) {
  const { cells, size, source, sink } = puzzle;
  const lit = new Set();
  if (!cells[source].includes(3)) return { lit, complete: false };
  const queue = [source];
  lit.add(source);
  let leak = false, outlet = false;
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const index = queue[cursor];
    for (const port of cells[index]) {
      if (index === source && port === 3) continue;
      if (index === sink && port === 1) { outlet = true; continue; }
      const next = adjacent(index, port, size);
      if (next < 0 || !cells[next].includes((port + 2) % 4)) { leak = true; continue; }
      if (!lit.has(next)) { lit.add(next); queue.push(next); }
    }
  }
  return { lit, complete: outlet && !leak };
}

function validateSeat(seat) {
  check(seat === 0 || seat === 1, 'Posto giocatore non valido.', 403);
}

export function pipesView(puzzle, seat) {
  validateSeat(seat);
  const { lit } = flow(puzzle);
  return {
    type: 'pipes', title: PIPES_META.title, emoji: PIPES_META.emoji,
    instructions: 'Tocca i tuoi tubi per ruotarli di un quarto di giro. Le caselle con 🔒 le vede e le controlla l’altro giocatore: descrivetevi le aperture usando sopra, destra, sotto e sinistra.',
    objective: 'Portate l’energia dall’ingresso a sinistra di A1 all’uscita a destra dell’ultima casella, senza interruzioni. I tubi fuori dal percorso possono restare scollegati. Quando siete pronti, confermate entrambi.',
    hints: [
      'Partite dall’ingresso: la prima casella deve avere un’apertura verso sinistra.',
      'Ogni collegamento richiede due aperture che si guardano: destra con sinistra, oppure sotto con sopra. Le caselle illuminate ricevono già energia.',
      'Seguite il percorso una casella alla volta insieme. L’ultima deve aprirsi verso destra; tutti gli altri sbocchi del percorso devono restare dentro la griglia.',
    ],
    difficulty: puzzle.difficulty, solved: puzzle.solved, size: puzzle.size,
    source: puzzle.source, sink: puzzle.sink, confirmed: [...puzzle.confirmed],
    cells: puzzle.cells.map((ports, index) => {
      const owned = owner(index, puzzle.size) === seat;
      return { index, ports: owned ? [...ports] : null, owned, lit: owned ? lit.has(index) : null };
    }),
  };
}

export function applyPipes(input, action, seat) {
  validateSeat(seat);
  check(action && typeof action === 'object' && !Array.isArray(action), 'Azione non valida.');
  check(!input.solved, 'Questo circuito è già completo.');
  check(action.type === 'pipes-rotate' || action.type === 'pipes-check', 'Azione non valida.');
  const puzzle = structuredClone(input);
  if (action.type === 'pipes-rotate') {
    check(Number.isInteger(action.cell) && action.cell >= 0 && action.cell < puzzle.cells.length, 'Casella non valida.');
    check(owner(action.cell, puzzle.size) === seat, 'Questo tubo lo controlla l’altro giocatore.', 403);
    puzzle.cells[action.cell] = rotate(puzzle.cells[action.cell]);
    puzzle.confirmed = [false, false];
    return { puzzle, solved: false };
  }
  puzzle.confirmed[seat] = true;
  if (!puzzle.confirmed.every(Boolean)) return { puzzle, solved: false };
  if (!flow(puzzle).complete) {
    puzzle.confirmed = [false, false];
    return { puzzle, solved: false, error: 'L’energia non arriva ancora all’uscita senza interruzioni. Controllate i collegamenti e poi confermate di nuovo entrambi.' };
  }
  puzzle.solved = true;
  return { puzzle, solved: true };
}
