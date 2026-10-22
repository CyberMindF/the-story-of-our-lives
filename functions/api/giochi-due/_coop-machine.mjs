import { check } from './_errors.mjs';

export const MACHINE_META = Object.freeze({ id: 'machine', title: 'Uno dentro, uno fuori', emoji: '🧰',
  description: 'Una scatola, una manovella e qualcuno rimasto dentro. Una stanza sperimentale, da esplorare in due.', experimental: true });

// Una stanza progettata, non un generatore che cambia soltanto i numeri.
export function createMachine() {
  return { type: 'machine', difficulty: 'prototype', solved: false, lift: 0, actor: 0,
    aboard: false, ladder: false, drive: 'lift', ball: 1, charge: 0, turns: 0,
    outsideNote: 'Dal coperchio arriva un ticchettio.', insideNote: 'C’è una porta lassù. E una bella caduta quaggiù.' };
}
const seatCheck = seat => check(seat === 0 || seat === 1, 'Giocatore non valido.', 403);
const onFloor = (p, floor) => !p.aboard && p.actor === floor;
const floorName = floor => ['in fondo', 'a metà', 'in cima'][floor];
export function applyMachine(original, action, seat) {
  seatCheck(seat);
  check(action && typeof action === 'object' && !Array.isArray(action), 'Azione non valida.');
  check(!original.solved, 'Siete già usciti.', 409);
  const outside = action.type === 'machine-crank';
  check(outside || ['machine-board', 'machine-step', 'machine-climb', 'machine-gear', 'machine-ladder', 'machine-cargo', 'machine-exit'].includes(action.type), 'Azione non valida.');
  check(seat === (outside ? 0 : 1), 'Questo comando è sull’altro lato della scatola.', 403);
  const p = structuredClone(original);
  const inside = text => { p.insideNote = text; };
  if (outside) {
    check(action.direction === 1 || action.direction === -1, 'Gira di uno scatto.');
    p.turns += action.direction;
    if (p.drive === 'lift') {
      const next = p.lift + action.direction;
      if (next < 0 || next > 2) {
        p.outsideNote = 'Clonk. Fine corsa.'; inside('La piattaforma sobbalza, ma resta qui.');
      } else {
        p.lift = next;
        p.outsideNote = 'La cinghia trascina qualcosa dentro la scatola.';
        inside(p.aboard ? 'Ooooh! Ti stai muovendo.' : 'La piattaforma si sposta ' + floorName(next) + '.');
      }
    } else if (p.ball === 0) {
      p.charge = Math.max(0, Math.min(3, p.charge + action.direction));
      p.outsideNote = p.charge === 3 ? 'Le tre spie brillano. La manovella gira a vuoto.' : action.direction > 0 ? 'Una spia si accende.' : 'Una spia si spegne.';
      inside(p.charge === 3 ? 'La sfera nella culla brilla come una lucciola.' : 'La culla ronza. La sfera cambia luminosità.');
    } else {
      p.outsideNote = 'La bobina ronza, ma le spie non si muovono.';
      inside('Scintille blu nella culla vuota, giù in fondo.');
    }
  } else if (action.type === 'machine-board') {
    if (p.aboard) inside('Sei già sulla piattaforma.');
    else if (p.actor !== p.lift) inside('Un passo nel vuoto? Meglio aspettare la piattaforma.');
    else if (p.ball === 'lift') inside('La sfera occupa tutta la piattaforma. Tu non ci stai.');
    else { p.aboard = true; inside('Sei sulla piattaforma. Da qui non ci sono comandi.'); }
  } else if (action.type === 'machine-step') {
    if (!p.aboard) inside('Hai già i piedi sul pavimento.');
    else { p.actor = p.lift; p.aboard = false; inside('Salti sul ripiano ' + floorName(p.actor) + '.'); }
  } else if (action.type === 'machine-climb') {
    check(Number.isInteger(action.to) && action.to >= 0 && action.to <= 2, 'Ripiano non valido.');
    if (p.aboard || !p.ladder) inside('Non c’è una scala da qui.');
    else if (Math.abs(action.to - p.actor) !== 1) inside('Un piolo alla volta.');
    else { p.actor = action.to; inside('Sali o scendi lungo la scala di corda.'); }
  } else if (action.type === 'machine-ladder') {
    if (!onFloor(p, 1)) inside('Il rotolo di corda è sul ripiano centrale.');
    else if (p.ladder) inside('La scala è già srotolata.');
    else { p.ladder = true; inside('Tiri il gancio. Una scala si srotola lungo tutti e tre i ripiani!'); p.outsideNote = 'Un tonfo e una pioggia di polvere. Tutto bene lì dentro?'; }
  } else if (action.type === 'machine-gear') {
    if (!onFloor(p, 1)) inside('Gli ingranaggi sono sul ripiano centrale.');
    else {
      p.drive = p.drive === 'lift' ? 'dynamo' : 'lift';
      inside(p.drive === 'dynamo' ? 'Sposti l’ingranaggio. La cinghia si ferma, un filo di rame vibra.' : 'Rimetti l’ingranaggio. La cinghia torna tesa.');
      p.outsideNote = 'Clac! Il meccanismo collegato alla tua manovella è cambiato.';
    }
  } else if (action.type === 'machine-cargo') {
    if (p.aboard) inside('Non riesci a spostare la sfera mentre sei sulla piattaforma.');
    else if (p.actor !== p.lift) inside('Fra il ripiano e la sfera c’è un bel vuoto.');
    else if (p.ball === 'lift') { p.ball = p.actor; inside(p.actor === 0 ? 'La sfera rotola nella culla di rame.' : p.actor === 2 ? 'La sfera si assesta nel piedistallo vicino alla porta.' : 'La sfera rotola sul banco.'); }
    else if (p.ball === p.actor) { p.ball = 'lift'; inside('Spingi la sfera sulla piattaforma. Occupa tutto lo spazio.'); }
    else inside('Qui non c’è una sfera da spostare.');
  } else if (action.type === 'machine-exit') {
    if (!onFloor(p, 2)) inside('La porta è sul ripiano più alto.');
    else if (p.ball !== 2 || p.charge < 3) inside('La porta vibra appena. Il piedistallo accanto ha tre piccole spie spente.');
    else { p.solved = true; inside('Aria fresca!'); p.outsideNote = 'Il coperchio si apre. Ehi, eccoti!'; }
  }
  return { puzzle: p, solved: p.solved };
}

export function machineView(p, seat) {
  seatCheck(seat);
  const base = { type: 'machine', title: MACHINE_META.title, emoji: MACHINE_META.emoji,
    difficulty: 'prototype', solved: p.solved, objective: 'Fate uscire Pip dalla scatola.',
    instructions: seat === 0 ? 'Tu sei fuori. L’altra persona è dentro.' : 'Tu sei dentro. Tocca gli oggetti e guarda cosa succede.',
    hints: ['La manovella fuori muove ciò a cui è collegata dentro. Gli ingranaggi sul ripiano centrale cambiano il collegamento.',
      'La sfera deve passare dalla culla in basso. La scala permette a Pip di muoversi mentre la piattaforma trasporta la sfera.',
      'Lasciate la sfera nella culla, spostate l’ingranaggio sulla bobina e girate in avanti fino a tre spie. Poi riportate il collegamento sulla piattaforma e consegnate la sfera in cima.'],
    role: seat === 0 ? 'outside' : 'inside' };
  // L’esterno non riceve posizione di Pip, carico, scala o disposizione interna.
  return seat === 0 ? { ...base, outside: { drive: p.drive, turns: p.turns,
    lamps: p.ball === 0 ? p.charge : 0, note: p.outsideNote } }
    : { ...base, inside: { lift: p.lift, actor: p.aboard ? p.lift : p.actor, aboard: p.aboard,
      ladder: p.ladder, drive: p.drive, ball: p.ball, glowing: p.charge === 3,
      doorOpen: p.ball === 2 && p.charge === 3, note: p.insideNote } };
}
