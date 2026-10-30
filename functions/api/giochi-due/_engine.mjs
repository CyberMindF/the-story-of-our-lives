import { GameError } from './_errors.mjs';
import { newPets, applyPets, petsView } from './_pets.mjs';
import { applyCoop, coopView, COOP_CATALOG } from './_coop.mjs';
export { GameError } from './_errors.mjs';
export const SYMBOLS = ['🌞', '🌙', '⭐', '🍎', '💚', '🌸', '🍕', '🎈'];
const INSTRUCTIONS = [
  'Traduci i simboli da sinistra a destra e comunica i numeri nello stesso ordine.',
  'Questa serratura legge al contrario: traduci i simboli partendo dall’ultimo e tornando al primo.',
  'Questa serratura fa un giro: traduci i simboli da sinistra a destra, poi sposta il primo numero in fondo al codice.'
];
function requireThat(value, message, status) { if (!value) throw new GameError(message, status); }
export function initialState(kind) {
  if (kind === 'trappole') return { challenges: [], requests: [] };
  if (kind === 'frequenze') return { room: null, history: [], requests: [] };
  if (kind === 'nuvola') return newPets();
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
  requireThat(safeDistance(traps) <= 10, 'Lascia una strada senza trappole lunga al massimo 10 passi.');
}
export function operatorId(room) { return room.round % 2 === 0 ? room.owner.id : room.partner?.id; }
export function romeDay(now) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(now));
}
export function applyAction(kind, original, action, user, now = Date.now()) {
  if (kind === 'nuvola') return applyPets(original, action, user, now);
  if (kind === 'frequenze' && (action.type === 'create' || original.room?.schema === 2)) return applyCoop(original, action, user, now);
  const state = structuredClone(original);
  const actor = { id: user.id, name: user.nickname };
  if (kind === 'trappole') {
    if (action.type === 'create') {
      requireThat(!state.challenges.some(c => c.creator.id === user.id && c.status === 'open'), 'Hai già una sfida in attesa o in corso.');
      validateTraps(action.traps);
      const title = typeof action.title === 'string' ? action.title.trim().slice(0, 50) : '';
      state.challenges.unshift({ id: crypto.randomUUID(), title: title || 'Ti preparo una trappola', creator: actor,
        traps: action.traps, rules: 2, status: 'open', createdAt: now, attempt: null });
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
      c.attempt = { player: actor, position: 0, energy: c.rules === 2 ? 12 : 18, steps: [], flags: [], probed: null, startedAt: now };
    } else if (action.type === 'flag' || action.type === 'probe') {
      const a = c.attempt;
      requireThat(a && a.player.id === user.id, 'Inizia prima la sfida.', 403);
      requireThat(Number.isInteger(action.cell) && action.cell > 0 && action.cell < 24, 'Scegli una casella interna alla mappa.');
      if (action.type === 'flag') {
        a.flags ??= [];
        a.flags = a.flags.includes(action.cell) ? a.flags.filter(n => n !== action.cell) : [...a.flags, action.cell];
      } else {
        requireThat(c.rules === 2 && a.probed == null && neighbors(a.position).includes(action.cell), 'Hai una sola sonda: usala su una casella vicina.');
        a.probed = action.cell;
      }
    } else if (action.type === 'move') {
      const a = c.attempt;
      requireThat(a && a.player.id === user.id, 'Inizia prima la sfida.', 403);
      requireThat(Number.isInteger(action.cell) && neighbors(a.position).includes(action.cell), 'Scegli una casella adiacente.');
      requireThat(!a.flags?.includes(action.cell), 'Togli prima la bandierina da questa casella.');
      a.position = action.cell;
      const cost = c.traps.includes(action.cell) && (c.rules !== 2 || !a.steps.includes(action.cell)) ? 3 : 1;
      const enough = a.energy >= cost;
      a.energy = Math.max(0, a.energy - cost);
      a.steps.push(action.cell);
      // Raggiungere l’arrivo con l’ultimo passo è valido, ma non con energia insufficiente.
      if (a.position === 24 && enough) c.status = 'won';
      else if (a.energy === 0) c.status = 'lost';
      if (c.status !== 'open') a.finishedAt = now;
    } else throw new GameError('Azione non valida.');
  } else if (kind === 'frequenze') {
    // Solo compatibilità con le stanze precedenti: create usa sempre il nuovo motore.
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
    requireThat(r.status === 'playing' && [r.owner.id, r.partner?.id].includes(user.id), 'Entriamo entrambi nella partita.', 403);
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
  } else throw new GameError('Attività non trovata.', 404);
  return state;
}
// Il browser non riceve trappole nascoste, soluzioni né la metà dell’altro giocatore.
export function publicState(kind, state, userId, now = Date.now()) {
  if (kind === 'trappole') return { challenges: state.challenges.map(c => {
    const reveal = c.creator.id === userId || c.status !== 'open';
    const visited = [...new Set([0, ...(c.attempt?.steps ?? []), ...(c.attempt?.probed != null ? [c.attempt.probed] : [])])];
    return { ...c, traps: reveal ? c.traps : c.traps.filter(n => visited.includes(n)),
      clues: Object.fromEntries(visited.map(n => [n, neighbors(n).filter(k => c.traps.includes(k)).length])) };
  }) };
  if (kind === 'frequenze') {
    const r = state.room;
    if (!r || r.schema === 2) return coopView(state, userId);
    const operator = userId === operatorId(r);
    const current = r.rounds[r.round];
    const participant = [r.owner.id, r.partner?.id].includes(userId);
    const { rounds, ...safe } = r;
    return { room: { ...safe, role: operator ? 'explorer' : 'guide', ready: current.ready,
      instruction: participant && !operator && r.status === 'playing' ? INSTRUCTIONS[r.round] : null,
      sequence: participant && operator && r.status === 'playing' ? current.sequence.slice(0, r.round + 4).map(i => SYMBOLS[i]) : [],
      legend: participant && !operator && r.status === 'playing' ? SYMBOLS.map((symbol, i) => ({ symbol, number: current.mapping[i] })) : [] }, history: state.history, catalog: COOP_CATALOG };
  }
  return petsView(state, userId, now);
}
