import { check } from './_errors.mjs';
import { PUZZLE_CATALOG, createPuzzle, puzzleView, applyPuzzle } from './_coop-puzzles.mjs';
import { PIPES_META, createPipes, pipesView, applyPipes } from './_coop-pipes.mjs';
import { MACHINE_META, createMachine, machineView, applyMachine } from './_coop-machine.mjs';

const SYMBOLS = ['🌞', '🌙', '⭐', '🍎', '💚', '🌸', '🍕', '🎈'];
export const COOP_CATALOG = [
  { id: 'code', title: 'Il codice', emoji: '🔐', description: 'Una sequenza e una legenda separata. La prova facile per scaldarsi.' },
  ...PUZZLE_CATALOG, PIPES_META, MACHINE_META
];
const difficulties = ['easy', 'normal', 'hard'];
function shuffle(values) {
  const list = [...values];
  for (let i = list.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}
function seatOf(room, user) { return room.owner.id === user.id ? 0 : room.partner?.id === user.id ? 1 : -1; }
function makePuzzle(type, difficulty) {
  const p = type === 'code' ? {
    type, difficulty, solved: false, ready: false,
    mapping: shuffle([1, 2, 3, 4, 5, 6, 7, 8]), sequence: shuffle([0, 1, 2, 3, 4, 5, 6, 7]).slice(0, 4)
  } : type === 'machine' ? createMachine() : type === 'pipes' ? createPipes(difficulty) : createPuzzle(type, difficulty);
  return { ...p, id: crypto.randomUUID() };
}
function startRound(r, now) {
  r.puzzle = makePuzzle(r.playlist[r.round], r.difficulty);
  r.status = 'playing'; r.roundStartedAt = now;
  r.roundErrors = 0; r.roundMoves = 0; r.roundHints = 0;
  r.message = ''; r.nextReady = [false, false]; r.restartReady = [false, false];
}
function projectPuzzle(p, seat) {
  if (p.type === 'machine') return machineView(p, seat);
  if (p.type === 'pipes') return pipesView(p, seat);
  if (p.type !== 'code') return puzzleView(p, seat);
  return {
    type: 'code', title: 'Il codice', emoji: '🔐', difficulty: 'easy', solved: p.solved,
    instructions: seat === 0 ? 'Descrivi i quattro simboli, nell’ordine. L’altra persona ha i numeri.' : 'Ascolta i simboli e comunica i numeri nello stesso ordine.',
    objective: 'Traduciamo la sequenza e apriamo il lucchetto.',
    hints: ['Decidiamo un nome per ciascun simbolo.', 'La sequenza si legge da sinistra a destra, senza invertirla.', 'Facciamo una coppia simbolo-numero alla volta e ricontrolliamo i quattro numeri.'],
    role: seat === 0 ? 'explorer' : 'guide', ready: p.ready,
    sequence: seat === 0 ? p.sequence.map(i => SYMBOLS[i]) : [],
    legend: seat === 1 ? SYMBOLS.map((symbol, i) => ({ symbol, number: p.mapping[i] })) : []
  };
}
function applyCode(original, action, seat) {
  const puzzle = structuredClone(original);
  if (action.type === 'code-ready') {
    check(seat === 1, 'Solo chi ha la legenda può confermarla.', 403); puzzle.ready = true;
  } else {
    check(action.type === 'code-answer', 'Azione non valida.');
    check(seat === 0, 'Il codice va inserito da chi vede la sequenza.', 403);
    check(puzzle.ready, 'Aspetta che l’altra persona abbia letto la legenda.');
    check(typeof action.code === 'string' && /^[1-8]{4}$/.test(action.code), 'Inserisci quattro cifre da 1 a 8.');
    puzzle.solved = action.code === puzzle.sequence.map(i => puzzle.mapping[i]).join('');
    if (!puzzle.solved) return { puzzle, solved: false, error: 'Il codice non torna. Ricontrolliamo i simboli e riproviamo.' };
  }
  return { puzzle, solved: puzzle.solved };
}
export function applyCoop(original, action, user, now) {
  const state = structuredClone(original);
  if (action.type === 'create') {
    check(!state.room || ['won', 'cancelled'].includes(state.room.status), 'C’è già una partita da completare.');
    const mode = action.mode ?? 'mix', difficulty = action.difficulty ?? 'normal';
    check(mode === 'mix' || COOP_CATALOG.some(c => c.id === mode), 'Scegli una prova valida.');
    check(difficulties.includes(difficulty), 'Scegli una difficoltà valida.');
    const length = mode === 'mix' ? action.length ?? 3 : 1;
    check(mode !== 'mix' || [3, 5, 8].includes(length), 'Scegli 3, 5 oppure 8 prove.');
    if (state.room) state.history.unshift({
      id: state.room.id, status: state.room.status, errors: state.room.errors,
      at: state.room.finishedAt ?? now, mode: state.room.mode ?? 'legacy',
      difficulty: state.room.difficulty ?? 'easy', results: state.room.results ?? []
    });
    state.history = state.history.slice(0, 20);
    const varied = shuffle(COOP_CATALOG.filter(c => c.id !== 'code' && !c.experimental).map(c => c.id));
    const playlist = mode === 'mix' ? (length === 8 ? ['code', ...varied] : varied.slice(0, length)) : [mode];
    state.room = {
      schema: 2, id: crypto.randomUUID(), owner: { id: user.id, name: user.nickname }, partner: null,
      status: 'waiting', mode, difficulty, playlist, round: 0, errors: 0, results: [],
      startedAt: now, puzzle: null, nextReady: [false, false], restartReady: [false, false],
      roleOffset: mode === 'machine' && action.insideFirst === true ? 1 : 0
    };
    return state;
  }
  const r = state.room;
  check(r?.schema === 2 && r.id === action.id, 'Questa partita non è più attiva.', 409);
  check(!['won', 'cancelled'].includes(r.status), 'La partita è conclusa.', 409);
  if (action.type === 'join') {
    check(r.status === 'waiting' && r.owner.id !== user.id && !r.partner, 'Aspetta l’altra persona.', 409);
    r.partner = { id: user.id, name: user.nickname }; startRound(r, now); return state;
  }
  const userSeat = seatOf(r, user);
  check(userSeat !== -1, 'Non partecipi a questa partita.', 403);
  if (action.type === 'cancel') {
    check(userSeat === 0, 'Solo chi ha aperto la stanza può chiuderla.', 403);
    r.status = 'cancelled'; r.finishedAt = now; return state;
  }
  if (action.type === 'next') {
    check(r.status === 'between', 'Completate prima questa prova.', 409);
    check(action.round === r.round, 'Siamo già passati alla prova successiva.', 409);
    r.nextReady[userSeat] = true;
    if (r.nextReady.every(Boolean)) { r.round++; startRound(r, now); }
    return state;
  }
  check(r.status === 'playing' && r.puzzle?.id === action.puzzleId, 'La prova è cambiata. Riprova sulla schermata aggiornata.', 409);
  if (action.type === 'hint') {
    check(r.roundHints < 3, 'Abbiamo già aperto tutti i suggerimenti.'); r.roundHints++; return state;
  }
  if (action.type === 'restart-puzzle') {
    r.restartReady[userSeat] = true;
    if (r.restartReady.every(Boolean)) {
      // Nuovo esercizio della stessa famiglia; errori/suggerimenti restano nel risultato.
      r.puzzle = makePuzzle(r.playlist[r.round], r.difficulty);
      r.restartReady = [false, false]; r.message = 'Nuovo schema, stessa prova. Ripartiamo!';
    } else r.message = 'Vuoi un altro schema: aspettiamo la conferma dell’altra persona.';
    return state;
  }
  // I ruoli si scambiano a ogni prova, senza cambiare i posti A/B della stanza.
  const puzzleSeat = (userSeat + r.round + (r.roleOffset ?? 0)) % 2;
  const result = r.puzzle.type === 'code' ? applyCode(r.puzzle, action, puzzleSeat)
    : r.puzzle.type === 'machine' ? applyMachine(r.puzzle, action, puzzleSeat)
    : r.puzzle.type === 'pipes' ? applyPipes(r.puzzle, action, puzzleSeat) : applyPuzzle(r.puzzle, action, puzzleSeat);
  r.puzzle = result.puzzle; r.roundMoves++;
  r.restartReady = [false, false];
  r.message = result.error ?? '';
  if (result.error) { r.errors++; r.roundErrors++; }
  if (result.solved) {
    const meta = COOP_CATALOG.find(c => c.id === r.puzzle.type);
    r.results.push({ type: meta.id, title: meta.title, emoji: meta.emoji, errors: r.roundErrors,
      hints: r.roundHints, moves: r.roundMoves, durationMs: Math.max(0, now - r.roundStartedAt) });
    r.status = r.round === r.playlist.length - 1 ? 'won' : 'between';
    r.message = '';
    if (r.status === 'won') r.finishedAt = now;
  }
  return state;
}
export function coopView(state, userId) {
  const r = state.room;
  const common = { catalog: COOP_CATALOG, history: state.history };
  if (!r) return { ...common, room: null };
  const userSeat = seatOf(r, { id: userId });
  const seat = userSeat < 0 ? -1 : (userSeat + r.round + (r.roleOffset ?? 0)) % 2;
  let puzzle = null;
  if (r.status === 'playing' && seat >= 0) {
    const view = projectPuzzle(r.puzzle, seat);
    puzzle = { ...view, id: r.puzzle.id, hints: view.hints.slice(0, r.roundHints) };
  }
  // Allowlist: mai serializzare lo stato privato del generatore o le prove future.
  return { ...common, room: {
    schema: 2, id: r.id, owner: r.owner, partner: r.partner, status: r.status,
    mode: r.mode, difficulty: r.difficulty, round: r.round, total: r.playlist.length,
    seat, userSeat, errors: r.errors, roundErrors: r.roundErrors ?? 0, roundMoves: r.roundMoves ?? 0,
    hintsUsed: r.roundHints ?? 0, nextReady: r.nextReady, restartReady: r.restartReady,
    message: r.message ?? '', results: r.results, startedAt: r.startedAt, finishedAt: r.finishedAt ?? null, puzzle
  } };
}
