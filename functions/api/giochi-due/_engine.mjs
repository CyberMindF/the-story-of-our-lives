export const SYMBOLS = ['☀', '☾', '★', '◆', '♥', '✿', '▲', '●'];
const INSTRUCTIONS = [
  'Traduci i simboli da sinistra a destra e comunica i numeri nello stesso ordine.',
  'Questa serratura legge al contrario: traduci i simboli partendo dall’ultimo e tornando al primo.',
  'Questa serratura fa un giro: traduci i simboli da sinistra a destra, poi sposta il primo numero in fondo al codice.'
];
export class GameError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
function requireThat(value, message, status) { if (!value) throw new GameError(message, status); }
export function initialState(kind) {
  if (kind === 'trappole') return { challenges: [], requests: [] };
  if (kind === 'frequenze') return { room: null, history: [], requests: [] };
  if (kind === 'nuvola') return { name: 'Nuvola', affection: 0, decor: 'base', day: '', care: {}, lastCare: {}, events: [], requests: [] };
  throw new GameError('Attività non trovata.', 404);
}
export function neighbors(cell) {
  return [cell - 5, cell + 5, ...(cell % 5 ? [cell - 1] : []), ...(cell % 5 < 4 ? [cell + 1] : [])].filter(n => n >= 0 && n < 25);
}
export function safeDistance(traps) {
  const queue = [[0, 0]], seen = new Set([0]);
  for (let i = 0; i < queue.length; i++) {
    const [cell, distance] = queue[i];
    if (cell === 24) return distance;
    for (const next of neighbors(cell)) if (!seen.has(next) && !traps.includes(next)) {
      seen.add(next); queue.push([next, distance + 1]);
    }
  }
  return Infinity;
}
export function validateTraps(traps) {
  requireThat(Array.isArray(traps) && traps.length === 6 && new Set(traps).size === 6
    && traps.every(n => Number.isInteger(n) && n > 0 && n < 24), 'Scegli esattamente 6 caselle diverse, senza partenza e arrivo.');
  requireThat(safeDistance(traps) <= 18, 'Lascia almeno un percorso senza trappole raggiungibile in 18 passi.');
}
function shuffle(values) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function round() {
  return { mapping: shuffle([1, 2, 3, 4, 5, 6, 7, 8]), sequence: shuffle([0, 1, 2, 3, 4, 5, 6, 7]), ready: false };
}
export function operatorId(room) { return room.round % 2 === 0 ? room.owner.id : room.partner?.id; }
export function romeDay(now) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(now));
}
export function applyAction(kind, original, action, user, now = Date.now()) {
  const state = structuredClone(original);
  const actor = { id: user.id, name: user.nickname };
  if (kind === 'trappole') {
    if (action.type === 'create') {
      requireThat(!state.challenges.some(c => c.creator.id === user.id && c.status === 'open'), 'Hai già una sfida in attesa o in corso.');
      validateTraps(action.traps);
      const title = typeof action.title === 'string' ? action.title.trim().slice(0, 50) : '';
      state.challenges.unshift({ id: crypto.randomUUID(), title: title || 'Ti preparo una trappola', creator: actor,
        traps: action.traps, status: 'open', createdAt: now, attempt: null });
      state.challenges = state.challenges.slice(0, 30);
      return state;
    }
    const c = state.challenges.find(item => item.id === action.id);
    requireThat(c, 'Sfida non trovata.', 404);
    if (action.type === 'cancel') {
      requireThat(c.creator.id === user.id && c.status === 'open' && !c.attempt, 'Puoi ritirare solo una tua sfida non ancora iniziata.');
      c.status = 'cancelled'; return state;
    }
    requireThat(c.creator.id !== user.id, 'Questa sfida l’hai creata tu: aspetta l’altra persona.', 403);
    requireThat(c.status === 'open', 'La sfida è già conclusa.', 409);
    if (action.type === 'start') {
      requireThat(!c.attempt, 'La sfida è già iniziata.', 409);
      c.attempt = { player: actor, position: 0, energy: 18, steps: [], startedAt: now };
    } else if (action.type === 'move') {
      const a = c.attempt;
      requireThat(a && a.player.id === user.id, 'Inizia prima la sfida.', 403);
      requireThat(Number.isInteger(action.cell) && neighbors(a.position).includes(action.cell), 'Scegli una casella adiacente.');
      a.position = action.cell;
      a.energy = Math.max(0, a.energy - (c.traps.includes(action.cell) ? 3 : 1));
      a.steps.push(action.cell);
      // Raggiungere l’arrivo con l’ultimo passo è valido, ma non con energia insufficiente.
      const spent = a.steps.reduce((sum, cell) => sum + (c.traps.includes(cell) ? 3 : 1), 0);
      if (a.position === 24 && spent <= 18) c.status = 'won';
      else if (a.energy === 0) c.status = 'lost';
      if (c.status !== 'open') a.finishedAt = now;
    } else throw new GameError('Azione non valida.');
  } else if (kind === 'frequenze') {
    if (action.type === 'create') {
      requireThat(!state.room || ['won', 'cancelled'].includes(state.room.status), 'C’è già una partita da completare.');
      if (state.room) state.history.unshift({ id: state.room.id, status: state.room.status, errors: state.room.errors, at: state.room.finishedAt ?? now });
      state.history = state.history.slice(0, 20);
      state.room = { id: crypto.randomUUID(), owner: actor, partner: null, status: 'waiting', round: 0, rounds: [round(), round(), round()], errors: 0, startedAt: now, lastWrong: false };
      return state;
    }
    const r = state.room;
    requireThat(r && r.id === action.id && !['won', 'cancelled'].includes(r.status), 'La partita non è più attiva.', 409);
    if (action.type === 'join') {
      requireThat(r.owner.id !== user.id && !r.partner, 'Aspetta che entri l’altra persona.', 409);
      r.partner = actor; r.status = 'playing'; return state;
    }
    if (action.type === 'cancel') {
      requireThat(r.owner.id === user.id, 'Solo chi ha aperto la stanza può chiuderla.', 403);
      r.status = 'cancelled'; r.finishedAt = now; return state;
    }
    requireThat(r.status === 'playing' && [r.owner.id, r.partner?.id].includes(user.id), 'Entrate entrambi nella partita.', 403);
    const current = r.rounds[r.round];
    if (action.type === 'ready') {
      requireThat(user.id !== operatorId(r), 'Solo la guida può confermare la legenda.', 403);
      current.ready = true;
    } else if (action.type === 'answer') {
      requireThat(user.id === operatorId(r), 'Il codice va inserito dall’esploratore.', 403);
      requireThat(current.ready, 'Aspetta che la guida sia pronta.');
      requireThat(typeof action.code === 'string' && new RegExp(`^[1-8]{${r.round + 4}}$`).test(action.code), 'Completa il codice con i numeri da 1 a 8.');
      let digits = current.sequence.slice(0, r.round + 4).map(i => current.mapping[i]);
      if (r.round === 1) digits.reverse();
      if (r.round === 2) digits = [...digits.slice(1), digits[0]];
      const answer = digits.join('');
      r.lastWrong = action.code !== answer;
      if (r.lastWrong) r.errors++;
      else if (r.round === 2) { r.status = 'won'; r.finishedAt = now; }
      else r.round++;
    } else throw new GameError('Azione non valida.');
  } else if (kind === 'nuvola') {
    if (action.type === 'rename') {
      requireThat(typeof action.name === 'string' && action.name.trim().length > 0 && action.name.trim().length <= 24, 'Scegli un nome da 1 a 24 caratteri.');
      state.name = action.name.trim();
    } else if (action.type === 'decorate') {
      const cost = { base: 0, plant: 3, cushion: 6, stars: 12 };
      requireThat(Object.hasOwn(cost, action.decor) && state.affection >= cost[action.decor], 'Questa decorazione non è ancora sbloccata.');
      state.decor = action.decor;
    } else if (['coccola', 'snack', 'gioca'].includes(action.type)) {
      requireThat(now - (state.lastCare[user.id] ?? 0) >= 3000, 'Aspetta un attimo: si sta ancora godendo la coccola.', 429);
      const day = romeDay(now);
      if (state.day !== day) { state.day = day; state.care = {}; }
      const care = state.care[user.id] ?? [];
      if (!care.includes(action.type)) { state.affection++; care.push(action.type); }
      state.care[user.id] = care;
      state.lastCare[user.id] = now;
    } else throw new GameError('Azione non valida.');
    state.events.unshift({ actor: actor.name, type: action.type, at: now });
    state.events = state.events.slice(0, 12);
  } else throw new GameError('Attività non trovata.', 404);
  return state;
}
// Il browser non riceve trappole nascoste, soluzioni né la metà dell’altro giocatore.
export function publicState(kind, state, userId, now = Date.now()) {
  if (kind === 'trappole') return { challenges: state.challenges.map(c => {
    const reveal = c.creator.id === userId || c.status !== 'open';
    const visited = [...new Set([0, ...(c.attempt?.steps ?? [])])];
    return { ...c, traps: reveal ? c.traps : c.traps.filter(n => visited.includes(n)),
      clues: Object.fromEntries(visited.map(n => [n, neighbors(n).filter(k => c.traps.includes(k)).length])) };
  }) };
  if (kind === 'frequenze') {
    const r = state.room;
    if (!r) return { room: null, history: state.history };
    const operator = userId === operatorId(r);
    const current = r.rounds[r.round];
    const participant = [r.owner.id, r.partner?.id].includes(userId);
    const { rounds, ...safe } = r;
    return { room: { ...safe, role: operator ? 'explorer' : 'guide', ready: current.ready,
      instruction: participant && !operator && r.status === 'playing' ? INSTRUCTIONS[r.round] : null,
      sequence: participant && operator && r.status === 'playing' ? current.sequence.slice(0, r.round + 4).map(i => SYMBOLS[i]) : [],
      legend: participant && !operator && r.status === 'playing' ? SYMBOLS.map((symbol, i) => ({ symbol, number: current.mapping[i] })) : [] }, history: state.history };
  }
  const { requests, lastCare, ...safe } = state;
  return { ...safe, care: state.day === romeDay(now) ? state.care : {}, myCare: state.day === romeDay(now) ? state.care[userId] ?? [] : [] };
}
