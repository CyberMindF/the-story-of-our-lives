import { check } from './_errors.mjs';

// State stays on the server. Views are explicit allowlists, never spreads of state.
export const PUZZLE_CATALOG = Object.freeze([
  { id: 'maze', title: 'Mappa a metà', emoji: '🧭', description: 'Metà passaggi a testa. Trovate le chiavi e raggiungete l’uscita.' },
  { id: 'circuit', title: 'Corto circuito', emoji: '💡', description: 'I vostri interruttori cambiano anche le luci dell’altro pannello.' },
  { id: 'order', title: 'Tutto in fila', emoji: '📚', description: 'Indizi diversi, un solo ordine possibile.' },
  { id: 'dossier', title: 'Il caso degli otto', emoji: '🔎', description: 'Incrociate le testimonianze e scegliete lo stesso sospetto.' },
  { id: 'mosaic', title: 'Pixel in incognito', emoji: '🎨', description: 'Uno legge le righe, l’altro le colonne. Il disegno si fa in due.' },
  { id: 'balance', title: 'Questione di peso', emoji: '⚖️', description: 'Due pesi a testa, un totale preciso. I numeri dell’altro sono segreti.' }
]);
const ITEMS = [
  { id: 'book', emoji: '📘', name: 'Libro' }, { id: 'key', emoji: '🔑', name: 'Chiave' },
  { id: 'plant', emoji: '🌱', name: 'Pianta' }, { id: 'cup', emoji: '☕', name: 'Tazza' },
  { id: 'bell', emoji: '🔔', name: 'Campanella' }, { id: 'camera', emoji: '📷', name: 'Fotocamera' }
];
const integer = (n, min, max) => Number.isInteger(n) && n >= min && n <= max;
function random(n) {
  check(integer(n, 1, 0xffffffff), 'Intervallo casuale non valido.');
  // Rejection avoids modulo bias, including for puzzle permutations.
  const limit = Math.floor(0x100000000 / n) * n;
  let value;
  do { value = crypto.getRandomValues(new Uint32Array(1))[0]; } while (value >= limit);
  return value % n;
}
function shuffled(values) {
  const out = [...values];
  for (let i = out.length - 1; i > 0; i--) { const j = random(i + 1); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}
const range = n => Array.from({ length: n }, (_, i) => i);
const equal = (a, b) => a.length === b.length && a.every((value, i) => value === b[i]);
const bit = () => random(2) === 1;
const validSeat = seat => check(seat === 0 || seat === 1, 'Giocatore non valido.', 403);
const pairKey = (a, b) => a < b ? `${a}:${b}` : `${b}:${a}`;
function adjacent(cell, size) {
  return [cell - size, cell + size, ...(cell % size ? [cell - 1] : []), ...(cell % size < size - 1 ? [cell + 1] : [])]
    .filter(value => value >= 0 && value < size * size);
}

function createMaze(difficulty) {
  const size = { easy: 4, normal: 5, hard: 6 }[difficulty];
  const visited = new Set([0]), stack = [0], edges = [];
  while (stack.length) {
    const current = stack.at(-1), next = shuffled(adjacent(current, size)).find(cell => !visited.has(cell));
    if (next === undefined) stack.pop();
    else { edges.push([current, next]); visited.add(next); stack.push(next); }
  }
  return { size, edges, position: 0, goal: size * size - 1,
    keys: shuffled(range(size * size - 2).map(n => n + 1)).slice(0, difficulty === 'easy' ? 1 : 2), collected: [], turn: 0 };
}

export function binaryRank(matrix) {
  const rows = matrix.map(row => row.map(Number));
  let pivot = 0;
  for (let col = 0; col < (rows[0]?.length ?? 0) && pivot < rows.length; col++) {
    const found = rows.findIndex((row, i) => i >= pivot && row[col]);
    if (found < 0) continue;
    [rows[pivot], rows[found]] = [rows[found], rows[pivot]];
    for (let i = 0; i < rows.length; i++) if (i !== pivot && rows[i][col]) {
      for (let j = col; j < rows[i].length; j++) rows[i][j] ^= rows[pivot][j];
    }
    pivot++;
  }
  return pivot;
}
function circuitLights(p) {
  return p.matrix.map((row, i) => row.reduce((on, wired, j) => wired && p.active[j] ? !on : on, p.base[i]));
}
function createCircuit(difficulty) {
  const size = { easy: 4, normal: 6, hard: 8 }[difficulty];
  let matrix;
  for (let attempt = 0; attempt < 96; attempt++) {
    const candidate = range(size).map(() => range(size).map(bit));
    if (binaryRank(candidate) === size && range(size).every(col => {
      const count = candidate.filter(row => row[col]).length;
      return count >= 2 && count < size;
    })) { matrix = candidate; break; }
  }
  // An invertible, non-random fallback keeps generation bounded.
  matrix ??= range(size).map(row => range(size).map(col => col === row || col === row + 1));
  const base = range(size).map(bit), solution = range(size).map(bit);
  if (!solution.some((on, i) => on && i % 2 === 0)) solution[2 * random(size / 2)] = true;
  if (!solution.some((on, i) => on && i % 2 === 1)) solution[2 * random(size / 2) + 1] = true;
  const target = circuitLights({ matrix, base, active: solution });
  return { size, matrix, base, solution, target, active: range(size).map(() => false) };
}

export function permutations(items) {
  if (!items.length) return [[]];
  return items.flatMap((item, i) => permutations(items.filter((_, j) => i !== j)).map(rest => [item, ...rest]));
}
export function matchesOrder(order, rules) {
  return rules.every(rule => {
    const a = order.indexOf(rule.a), b = rule.b === undefined ? -1 : order.indexOf(rule.b);
    if (rule.kind === 'next') return b === a + 1;
    if (rule.kind === 'before') return a < b;
    if (rule.kind === 'notAt') return a !== rule.position;
    if (rule.kind === 'distance') return Math.abs(a - b) === rule.distance;
    if (rule.kind === 'adjacent') return Math.abs(a - b) === 1;
    if (rule.kind === 'notAdjacent') return Math.abs(a - b) > 1;
    if (rule.kind === 'edge') return a === 0 || a === order.length - 1;
    return false;
  });
}
function hardOrderRules(solution) {
  const candidates = [];
  for (let i = 0; i < solution.length; i++) {
    const a = solution[i];
    for (let position = 0; position < solution.length; position++) if (position !== i) candidates.push({ kind: 'notAt', a, position });
    if (i === 0 || i === solution.length - 1) candidates.push({ kind: 'edge', a });
    for (let j = i + 1; j < solution.length; j++) {
      const b = solution[j], distance = j - i;
      candidates.push({ kind: 'before', a, b });
      candidates.push(distance === 1 ? { kind: 'adjacent', a, b } : { kind: 'notAdjacent', a, b });
      if (distance > 1) candidates.push({ kind: 'distance', a, b, distance });
    }
  }
  const possibilities = permutations(solution);
  const pool = candidates.map(rule => ({ rule, matches: new Set(possibilities.flatMap((order, index) => matchesOrder(order, [rule]) ? [index] : [])) }));
  const all = range(possibilities.length);
  // Each chosen clue must eliminate a still-possible answer. All loops are bounded.
  for (let attempt = 0; attempt < 32; attempt++) {
    let remaining = all;
    const picked = [], kinds = new Set();
    for (let round = 0; round < 9 && remaining.length > 1; round++) {
      const options = pool.filter(candidate => !picked.includes(candidate)).map(candidate => ({
        candidate, next: remaining.filter(index => candidate.matches.has(index))
      })).filter(option => option.next.length > 0 && option.next.length < remaining.length);
      if (!options.length) break;
      const novel = options.filter(option => !kinds.has(option.candidate.rule.kind));
      const choices = kinds.size < 3 && novel.length ? novel : options;
      const chosen = choices[random(choices.length)];
      picked.push(chosen.candidate); kinds.add(chosen.candidate.rule.kind); remaining = chosen.next;
    }
    if (remaining.length !== 1 || picked.length < 4 || kinds.size < 3) continue;
    // A balanced split must leave multiple answers in BOTH private views.
    for (let partition = 0; partition < 16; partition++) {
      const arranged = shuffled(picked);
      const sides = [arranged.filter((_, i) => i % 2 === 0), arranged.filter((_, i) => i % 2 === 1)];
      if (sides.every(side => all.filter(index => side.every(candidate => candidate.matches.has(index))).length > 1)) {
        return sides.map(side => side.map(candidate => candidate.rule));
      }
    }
  }
  return null;
}
function createOrder(difficulty) {
  const count = { easy: 4, normal: 5, hard: 6 }[difficulty];
  const items = shuffled(ITEMS).slice(0, count).map(item => ({ ...item })), solution = shuffled(items.map(item => item.id));
  // Every edge in a total-order chain is necessary. Either seat alone is ambiguous.
  const chain = shuffled(solution.slice(1).map((id, i) => ({ kind: bit() ? 'before' : 'next', a: solution[i], b: id })));
  const rules = (difficulty === 'hard' ? hardOrderRules(solution) : null)
    ?? [chain.filter((_, i) => i % 2 === 0), chain.filter((_, i) => i % 2 === 1)];
  let order = shuffled(solution);
  if (equal(order, solution)) order = [...order.slice(1), order[0]];
  return { items, solution, rules, order, confirmed: [false, false] };
}
function orderClue(rule, items) {
  const label = id => { const item = items.find(entry => entry.id === id); return `${item.emoji} ${item.name}`; };
  if (rule.kind === 'notAt') return `${label(rule.a)} non va al posto ${rule.position + 1}.`;
  if (rule.kind === 'distance') return `Tra ${label(rule.a)} e ${label(rule.b)} ci ${rule.distance === 2 ? 'va esattamente un oggetto' : `vanno esattamente ${rule.distance - 1} oggetti`}. L’ordine dei due è da scoprire.`;
  if (rule.kind === 'adjacent') return `${label(rule.a)} e ${label(rule.b)} stanno uno accanto all’altro, in un ordine da scoprire.`;
  if (rule.kind === 'notAdjacent') return `${label(rule.a)} e ${label(rule.b)} non stanno uno accanto all’altro.`;
  if (rule.kind === 'edge') return `${label(rule.a)} sta a una delle due estremità della fila.`;
  return `${label(rule.a)} va ${rule.kind === 'next' ? 'subito ' : ''}prima di ${label(rule.b)}.`;
}

export function matchesDossier(attributes, rule) {
  if (rule.kind === 'eq') return attributes[rule.field] === rule.value;
  if (rule.kind === 'all') return rule.rules.every(part => matchesDossier(attributes, part));
  if (rule.kind === 'any') return rule.rules.some(part => matchesDossier(attributes, part));
  return false;
}
function createDossier(difficulty) {
  const colors = shuffled(['rosso', 'blu', 'verde', 'giallo', 'viola']).slice(0, 2);
  const objects = shuffled(['chiave', 'mappa', 'ombrello', 'torcia', 'taccuino']).slice(0, 2);
  const places = shuffled(['serra', 'soffitta', 'biblioteca', 'cucina', 'garage']).slice(0, 2);
  const names = shuffled(['Ada', 'Nico', 'Lia', 'Timo', 'Mia', 'Leo', 'Zoe', 'Teo']);
  const emojis = shuffled(['🐱', '🐶', '🦊', '🐰', '🦆', '🦔', '🐼', '🐨']);
  const suspects = shuffled(range(8).map(i => ({ id: `suspect-${i}`, name: names[i], emoji: emojis[i], attributes: {
    color: colors[i & 1], item: objects[(i >> 1) & 1], place: places[(i >> 2) & 1]
  } })));
  const chosen = suspects[random(suspects.length)], fields = shuffled(['color', 'item', 'place']);
  const [a, b, c] = fields.map(field => ({ kind: 'eq', field, value: chosen.attributes[field] }));
  let rules;
  if (difficulty === 'easy') rules = [a, { kind: 'all', rules: [b, c] }];
  else if (difficulty === 'normal') rules = [{ kind: 'all', rules: [a, b] }, { kind: 'all', rules: [b, c] }];
  else rules = [{ kind: 'all', rules: [a, { kind: 'any', rules: [b, c] }] }, { kind: 'all', rules: [b, c] }];
  return { suspects, solution: chosen.id, rules: shuffled(rules), votes: [null, null] };
}
function dossierClue(rule) {
  if (rule.kind === 'eq') return `${({ color: 'colore', item: 'oggetto', place: 'luogo' })[rule.field]}: ${rule.value}`;
  const parts = rule.rules.map(dossierClue);
  return rule.kind === 'all' ? parts.join(' E ') : `(${parts.join(' O ')}; basta una delle due)`;
}

export function runLengths(values) {
  const runs = []; let current = 0;
  for (const on of [...values, false]) { if (on) current++; else if (current) { runs.push(current); current = 0; } }
  return runs;
}
export function mosaicClues(grid, size) {
  return { rows: range(size).map(r => runLengths(grid.slice(r * size, (r + 1) * size))),
    columns: range(size).map(c => runLengths(range(size).map(r => grid[r * size + c]))) };
}
// Domains are at most 32 bit-patterns; column-prefix pruning bounds 5x5 search.
export function mosaicSolutions(rows, columns, limit = 2) {
  const size = rows.length;
  check(integer(size, 1, 5) && columns.length === size && integer(limit, 1, 1000), 'Mosaico non valido.');
  const patterns = range(2 ** size).map(mask => range(size).map(i => Boolean(mask & (1 << i))));
  const rowOptions = rows.map(clue => patterns.filter(pattern => equal(runLengths(pattern), clue)));
  const columnOptions = columns.map(clue => patterns.filter(pattern => equal(runLengths(pattern), clue)));
  const answers = [];
  function visit(row, chosen, domains) {
    if (answers.length >= limit) return;
    if (row === size) { answers.push(chosen.flat()); return; }
    for (const pattern of rowOptions[row]) {
      const next = domains.map((domain, col) => domain.filter(candidate => candidate[row] === pattern[col]));
      if (next.every(domain => domain.length)) visit(row + 1, [...chosen, pattern], next);
      if (answers.length >= limit) return;
    }
  }
  visit(0, [], columnOptions);
  return answers;
}
function createMosaic(difficulty) {
  const size = { easy: 3, normal: 4, hard: 5 }[difficulty];
  let solution, clues;
  for (let attempt = 0; attempt < 64; attempt++) {
    const candidate = range(size * size).map(bit), current = mosaicClues(candidate, size);
    if (current.rows.some(row => !row.length || row[0] === size) || current.columns.some(col => !col.length || col[0] === size)) continue;
    if (![0, 1].every(seat => candidate.some((on, cell) => on && (Math.floor(cell / size) + cell % size) % 2 === seat))) continue;
    if (mosaicSolutions(current.rows, current.columns).length === 1) { solution = candidate; clues = current; break; }
  }
  if (!solution) {
    // Nested rows give a unique solution. Reflections preserve uniqueness.
    const reflectX = bit(), reflectY = bit();
    solution = range(size * size).map(cell => {
      const r = Math.floor(cell / size), c = cell % size;
      return (reflectX ? size - 1 - c : c) <= (reflectY ? size - 1 - r : r);
    });
    clues = mosaicClues(solution, size);
  }
  return { size, solution, rowClues: clues.rows, columnClues: clues.columns,
    grid: range(size * size).map(() => false), confirmed: [false, false] };
}

export function weightPairs(weights) {
  return weights.flatMap((value, a) => weights.slice(a + 1).map((other, offset) => ({ indices: [a, a + offset + 1], sum: value + other })));
}
function weightTargets(weights) {
  const pairs = weights.map(weightPairs), byTotal = new Map();
  for (const a of pairs[0]) for (const b of pairs[1]) {
    const target = a.sum + b.sum, solutions = byTotal.get(target) ?? [];
    solutions.push([a.indices, b.indices]); byTotal.set(target, solutions);
  }
  return [...byTotal.entries()].filter(([target, solutions]) => solutions.length === 1
    && pairs.every(list => list.filter(pair => pair.sum < target).length > 1))
    .map(([target, solutions]) => ({ target, solution: solutions[0] }));
}
function createBalance(difficulty) {
  const size = difficulty === 'easy' ? 4 : 5, ceiling = { easy: 14, normal: 25, hard: 40 }[difficulty];
  for (let attempt = 0; attempt < 48; attempt++) {
    const weights = [0, 1].map(() => shuffled(range(ceiling).map(n => n + 1)).slice(0, size));
    const targets = weightTargets(weights);
    if (targets.length) return { weights, ...targets[random(targets.length)], selections: [[], []], confirmed: [false, false] };
  }
  const weights = [[2, 5, 11, 23, 47].slice(0, size), [3, 7, 17, 37, 79].slice(0, size)];
  const targets = weightTargets(weights);
  return { weights, ...targets[random(targets.length)], selections: [[], []], confirmed: [false, false] };
}

export function createPuzzle(type, difficulty = 'normal') {
  check(PUZZLE_CATALOG.some(entry => entry.id === type), 'Gioco non trovato.', 404);
  check(['easy', 'normal', 'hard'].includes(difficulty), 'Difficoltà non valida.');
  const factories = { maze: createMaze, circuit: createCircuit, order: createOrder,
    dossier: createDossier, mosaic: createMosaic, balance: createBalance };
  return { type, difficulty, solved: false, ...factories[type](difficulty) };
}

const TEXT = {
  maze: {
    instructions: 'Muovete la pedina a turno. Tu vedi soltanto una parte dei passaggi: chiedi all’altra persona prima di attraversare una parete.',
    objective: 'Raccogliete tutte le chiavi, poi raggiungete l’uscita.',
    hints: ['Un giocatore vede i passaggi orizzontali, l’altro quelli verticali.', 'Si può tornare indietro: alcuni rami servono soltanto a prendere una chiave.', 'Prima di muovervi, concordate la prossima casella. Una parete non fa cambiare turno.']
  },
  circuit: {
    instructions: 'Ogni interruttore inverte tutte le luci collegate. Puoi usare solo i tuoi; alcune luci sono visibili soltanto all’altra persona.',
    objective: 'Portate tutte le luci allo stato richiesto. Ripremere un interruttore annulla il suo effetto.',
    hints: ['Comunicate i numeri delle luci ancora diverse dall’obiettivo.', 'Due interruttori collegati alla stessa luce annullano a vicenda il loro effetto su quella luce.', 'Annotate quali interruttori avete cambiato: l’ordine non conta, conta se ciascuno è acceso oppure spento.']
  },
  order: {
    instructions: 'Spostate gli oggetti nella fila e confrontate i vostri indizi. Quando siete d’accordo, confermate entrambi.',
    objective: 'Trovate l’unico ordine che rispetta tutti gli indizi.',
    hints: ['Prima non significa necessariamente subito prima: leggete bene l’indizio.', 'Unite gli indizi che parlano dello stesso oggetto.', 'Se due ordini sembrano entrambi possibili, manca un indizio dell’altro giocatore.']
  },
  dossier: {
    instructions: 'Avete testimonianze diverse sugli stessi otto sospetti. Incrociatele, poi scegliete entrambi la stessa persona.',
    objective: 'Trovate il solo sospetto compatibile con tutte e due le testimonianze.',
    hints: ['Eliminate prima chi non rispetta la vostra testimonianza.', 'Una condizione con E richiede entrambe le caratteristiche; con O ne basta una.', 'Confrontate i nomi rimasti, non scegliete soltanto in base al vostro indizio.']
  },
  mosaic: {
    instructions: 'I numeri indicano gruppi consecutivi di caselle piene, separati da almeno una vuota. Tu puoi cambiare solo le caselle evidenziate.',
    objective: 'Ricostruite il disegno usando gli indizi delle righe e delle colonne, poi confermate entrambi.',
    hints: ['2, 1 significa due piene, almeno una vuota e poi una piena.', 'Un indizio 0 indica una riga o colonna completamente vuota.', 'Partite dai gruppi più lunghi e confrontate ogni casella con il relativo indizio nell’altro schermo.']
  },
  balance: {
    instructions: 'Scegli due dei tuoi pesi. L’altra persona ne sceglie due dai suoi: parlatevi per raggiungere il totale esatto.',
    objective: 'Due pesi a testa, quattro in tutto. Confermate entrambi quando la somma è quella richiesta.',
    hints: ['Calcolate le possibili somme di due pesi diversi.', 'Comunica una somma possibile: l’altro può cercare quanto manca al totale.', 'Ogni peso può essere usato una sola volta. I quattro pesi giusti formano una sola combinazione.']
  }
};

export function puzzleView(p, seat) {
  validSeat(seat);
  const entry = PUZZLE_CATALOG.find(item => item.id === p.type);
  check(entry, 'Gioco non trovato.', 404);
  const base = { type: p.type, title: entry.title, emoji: entry.emoji, difficulty: p.difficulty, solved: p.solved,
    instructions: TEXT[p.type].instructions, objective: TEXT[p.type].objective, hints: [...TEXT[p.type].hints] };
  if (p.type === 'maze') return { ...base, size: p.size, position: p.position, goal: p.goal,
    keys: [...p.keys], collected: [...p.collected], turn: p.turn, myTurn: seat === p.turn,
    edges: p.edges.filter(([a, b]) => (Math.floor(a / p.size) === Math.floor(b / p.size) ? 0 : 1) === seat).map(edge => [...edge]) };
  if (p.type === 'circuit') {
    const lights = circuitLights(p);
    return { ...base, size: p.size,
      switches: p.active.flatMap((on, index) => index % 2 === seat ? [{ index, on, lights: range(p.size).filter(light => p.matrix[light][index]) }] : []),
      lights: lights.flatMap((on, index) => index % 2 === seat ? [{ index, on, target: p.target[index] }] : []) };
  }
  if (p.type === 'order') return { ...base, items: p.items.map(item => ({ ...item })), order: [...p.order],
    clues: p.rules[seat].map(rule => orderClue(rule, p.items)), confirmed: [...p.confirmed] };
  if (p.type === 'dossier') return { ...base, suspects: p.suspects.map(s => ({ ...s, attributes: { ...s.attributes } })),
    clues: [dossierClue(p.rules[seat])], votes: [...p.votes] };
  if (p.type === 'mosaic') return { ...base, size: p.size, grid: [...p.grid],
    ownedCells: range(p.size * p.size).filter(cell => (Math.floor(cell / p.size) + cell % p.size) % 2 === seat),
    rowClues: seat === 0 ? p.rowClues.map(row => [...row]) : null,
    columnClues: seat === 1 ? p.columnClues.map(col => [...col]) : null, confirmed: [...p.confirmed] };
  return { ...base, weights: p.weights[seat].map((value, index) => ({ index, value, selected: p.selections[seat].includes(index) })),
    target: p.target, selectedCounts: p.selections.map(selection => selection.length), confirmed: [...p.confirmed] };
}

export function applyPuzzle(original, action, seat) {
  validSeat(seat);
  check(action && typeof action === 'object' && !Array.isArray(action) && typeof action.type === 'string', 'Azione non valida.');
  check(!original.solved, 'Enigma già completato.', 409);
  const p = structuredClone(original);
  let error;
  const wrong = message => { error = message; };
  if (p.type === 'maze') {
    check(action.type === 'maze-move', 'Azione non valida.');
    check(seat === p.turn, 'Adesso tocca all’altra persona.', 403);
    check(integer(action.cell, 0, p.size * p.size - 1) && adjacent(p.position, p.size).includes(action.cell), 'Scegli una casella adiacente.');
    if (!p.edges.some(([a, b]) => pairKey(a, b) === pairKey(p.position, action.cell))) wrong('C’è una parete. Chiedi all’altra persona quale passaggio usare.');
    else {
      p.position = action.cell;
      if (p.keys.includes(action.cell) && !p.collected.includes(action.cell)) p.collected.push(action.cell);
      p.turn = 1 - p.turn;
      p.solved = p.position === p.goal && p.collected.length === p.keys.length;
    }
  } else if (p.type === 'circuit') {
    check(action.type === 'circuit-toggle', 'Azione non valida.');
    check(integer(action.index, 0, p.size - 1), 'Interruttore non valido.');
    check(action.index % 2 === seat, 'Questo interruttore è dell’altra persona.', 403);
    p.active[action.index] = !p.active[action.index];
    p.solved = equal(circuitLights(p), p.target);
  } else if (p.type === 'order') {
    if (action.type === 'order-move') {
      check(integer(action.from, 0, p.order.length - 1) && integer(action.to, 0, p.order.length - 1), 'Posizione non valida.');
      if (action.from !== action.to) {
        const [item] = p.order.splice(action.from, 1); p.order.splice(action.to, 0, item); p.confirmed = [false, false];
      }
    } else if (action.type === 'order-check') {
      p.confirmed[seat] = true;
      if (p.confirmed.every(Boolean)) {
        p.solved = equal(p.order, p.solution);
        if (!p.solved) { p.confirmed = [false, false]; wrong('La fila non rispetta tutti gli indizi. Confrontateli e riprovate.'); }
      }
    } else check(false, 'Azione non valida.');
  } else if (p.type === 'dossier') {
    check(action.type === 'dossier-vote' && typeof action.candidate === 'string' && p.suspects.some(s => s.id === action.candidate), 'Scegli un sospetto della lista.');
    p.votes[seat] = action.candidate;
    if (p.votes[0] && p.votes[0] === p.votes[1]) {
      p.solved = p.votes[0] === p.solution;
      if (!p.solved) { p.votes = [null, null]; wrong('Questa persona non corrisponde a tutte le testimonianze. Rileggetele insieme.'); }
    }
  } else if (p.type === 'mosaic') {
    if (action.type === 'mosaic-toggle') {
      check(integer(action.cell, 0, p.size * p.size - 1), 'Casella non valida.');
      check((Math.floor(action.cell / p.size) + action.cell % p.size) % 2 === seat, 'Questa casella la cambia l’altra persona.', 403);
      p.grid[action.cell] = !p.grid[action.cell]; p.confirmed = [false, false];
    } else if (action.type === 'mosaic-check') {
      p.confirmed[seat] = true;
      if (p.confirmed.every(Boolean)) {
        p.solved = equal(p.grid, p.solution);
        if (!p.solved) { p.confirmed = [false, false]; wrong('Il disegno non torna ancora. Controllate i gruppi nelle righe e nelle colonne.'); }
      }
    } else check(false, 'Azione non valida.');
  } else if (p.type === 'balance') {
    if (action.type === 'balance-toggle') {
      check(integer(action.index, 0, p.weights[seat].length - 1), 'Peso non valido.');
      const selected = p.selections[seat];
      if (selected.includes(action.index)) p.selections[seat] = selected.filter(index => index !== action.index);
      else { check(selected.length < 2, 'Puoi scegliere solo due pesi: togline uno prima.'); selected.push(action.index); }
      p.confirmed = [false, false];
    } else if (action.type === 'balance-check') {
      check(p.selections[seat].length === 2, 'Scegli prima due pesi.');
      p.confirmed[seat] = true;
      if (p.confirmed.every(Boolean)) {
        p.solved = p.selections.reduce((sum, indices, owner) => sum + indices.reduce((subtotal, index) => subtotal + p.weights[owner][index], 0), 0) === p.target;
        if (!p.solved) { p.confirmed = [false, false]; wrong('La somma non è quella richiesta. Confrontate le vostre coppie di pesi.'); }
      }
    } else check(false, 'Azione non valida.');
  } else check(false, 'Gioco non trovato.', 404);
  return { puzzle: p, solved: p.solved, ...(error ? { error } : {}) };
}
