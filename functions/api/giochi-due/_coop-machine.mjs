import { check } from './_errors.mjs';

export const MACHINE_META = Object.freeze({ id: 'machine', title: 'Uno dentro, uno fuori', emoji: '🧰',
  description: 'Una scatola, una manovella e qualcuno rimasto dentro. Una stanza sperimentale, da esplorare in due.', experimental: true });

// Una stanza progettata, non un generatore che cambia soltanto i numeri.
export function createMachine() {
  return { type: 'machine', mechanics: 2, clutch: true, drawer: false, cog: false, unlatched: false,
    difficulty: 'prototype', solved: false, lift: 0, actor: 0,
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
  const modern = original.mechanics === 2;
  const outside = ['machine-crank', ...(modern ? ['machine-belt', 'machine-drawer', 'machine-cog', 'machine-latch'] : [])].includes(action.type);
  check(outside || ['machine-board', 'machine-step', 'machine-climb', 'machine-gear', 'machine-ladder', 'machine-cargo', 'machine-exit'].includes(action.type), 'Azione non valida.');
  check(seat === (outside ? 0 : 1), 'Questo comando è sull’altro lato della scatola.', 403);
  const p = structuredClone(original);
  const inside = text => { p.insideNote = text; };
  if (action.type === 'machine-belt') {
    check(['lift', 'dynamo'].includes(action.drive), 'Sede non valida.');
    if (p.clutch) p.outsideNote = 'Tesa. Non si sfila.';
    else { p.drive = action.drive; p.outsideNote = 'Flop. La cinghia si assesta.'; inside('La ruota dietro la parete si sposta.'); }
  } else if (action.type === 'machine-drawer') {
    if (p.clutch) p.outsideNote = 'Toc. Un perno trattiene il cassetto.';
    else { p.drawer = !p.drawer; p.outsideNote = p.drawer ? 'Dentro c’è qualcosa.' : 'Clac.'; }
  } else if (action.type === 'machine-cog') {
    if (!p.drawer || p.clutch) p.outsideNote = 'Il perno non lascia passare il pezzo.';
    else { p.cog = true; p.outsideNote = 'Gli ultimi denti si incastrano. Tac.'; inside('Qualcosa di metallo si incastra dietro la parete.'); }
  } else if (action.type === 'machine-latch') {
    if (p.ball !== 2 || p.charge < 3) p.outsideNote = 'Il chiavistello torna al suo posto.';
    else { p.unlatched = true; p.outsideNote = 'Scatto! Dal coperchio passa uno spiraglio.'; inside('La porticina si socchiude.'); }
  } else if (action.type === 'machine-crank') {
    check(action.direction === 1 || action.direction === -1, 'Gira di uno scatto.');
    p.turns += action.direction;
    if (modern && !p.clutch) {
      p.outsideNote = 'La ruota gira. La cinghia no.'; inside('La ruota gira a vuoto.');
    } else if (modern && p.drive === 'dynamo' && !p.cog) {
      p.outsideNote = 'Due ruote girano, quella in mezzo manca.'; inside('Un ticchettio dietro la parete.');
    } else if (p.drive === 'lift') {
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
    else if (modern) {
      p.clutch = !p.clutch;
      inside(p.clutch ? 'Clac. La leva resta in basso.' : 'La leva scatta in alto. Qualcosa si allenta.');
      p.outsideNote = p.clutch ? 'La cinghia si tende. Il perno scende.' : 'La cinghia si allenta. Il perno risale.';
    } else {
      p.drive = p.drive === 'lift' ? 'dynamo' : 'lift';
      inside(p.drive === 'dynamo' ? 'Sposti l’ingranaggio. La cinghia si ferma, un filo di rame vibra.' : 'Rimetti l’ingranaggio. La cinghia torna tesa.');
      p.outsideNote = 'Clac! Il meccanismo collegato alla tua manovella è cambiato.';
    }
  } else if (action.type === 'machine-cargo') {
    // Un trascinamento fatto su una vista vecchia non deve spostare il carico al contrario.
    if (action.from !== undefined) check(action.from === p.ball, 'La sfera si è spostata. Riprova.', 409);
    if (action.lift !== undefined) check(action.lift === p.lift, 'La piattaforma si è spostata. Riprova.', 409);
    if (action.to !== undefined) check(action.to === (p.ball === 'lift' ? p.actor : 'lift'), 'Destinazione non valida.');
    if (p.aboard) inside('Non riesci a spostare la sfera mentre sei sulla piattaforma.');
    else if (p.actor !== p.lift) inside('Fra il ripiano e la sfera c’è un bel vuoto.');
    else if (p.ball === 'lift') { p.ball = p.actor; inside(p.actor === 0 ? 'La sfera rotola nella culla di rame.' : p.actor === 2 ? 'La sfera si assesta nel piedistallo vicino alla porta.' : 'La sfera rotola sul banco.'); }
    else if (p.ball === p.actor) { p.ball = 'lift'; inside('Spingi la sfera sulla piattaforma. Occupa tutto lo spazio.'); }
    else inside('Qui non c’è una sfera da spostare.');
  } else if (action.type === 'machine-exit') {
    if (!onFloor(p, 2)) inside('La porta è sul ripiano più alto.');
    else if (p.ball !== 2 || p.charge < 3) inside('La porta vibra appena. Il piedistallo accanto ha tre piccole spie spente.');
    else if (modern && !p.unlatched) { inside('Il legno cede, ma qualcosa trattiene la porta dall’altro lato.'); p.outsideNote = 'Toc toc. Il chiavistello vibra.'; }
    else { p.solved = true; inside('Aria fresca!'); p.outsideNote = 'Il coperchio si apre. Ehi, eccoti!'; }
  }
  return { puzzle: p, solved: p.solved };
}

export function machineView(p, seat) {
  seatCheck(seat);
  const modern = p.mechanics === 2;
  const base = { type: 'machine', title: MACHINE_META.title, emoji: MACHINE_META.emoji,
    mechanics: modern ? 2 : 1,
    difficulty: 'prototype', solved: p.solved, objective: 'Fate uscire Pip dalla scatola.',
    instructions: seat === 0 ? 'Tu sei fuori. L’altra persona è dentro.' : 'Tu sei dentro. L’altra persona è fuori.',
    hints: modern ? ['La leva dentro allenta la cinghia e libera il cassetto fuori. Provate insieme, poi rimettetela in posizione per far muovere qualcosa.',
      'Fuori manca una ruota alla bobina. Cercatela nel cassetto. La cinghia può collegare la manovella a due meccanismi diversi.',
      'Portate la sfera nella culla in basso, collegate la bobina e caricatela. Poi tornate alla piattaforma per portarla in cima. Il chiavistello della porta è fuori.'] : ['La manovella fuori muove ciò a cui è collegata dentro. Gli ingranaggi sul ripiano centrale cambiano il collegamento.',
      'La sfera deve passare dalla culla in basso. La scala permette a Pip di muoversi mentre la piattaforma trasporta la sfera.',
      'Lasciate la sfera nella culla, spostate l’ingranaggio sulla bobina e girate in avanti fino a tre spie. Poi riportate il collegamento sulla piattaforma e consegnate la sfera in cima.'],
    role: seat === 0 ? 'outside' : 'inside' };
  // L’esterno non riceve posizione di Pip, carico, scala o disposizione interna.
  return seat === 0 ? { ...base, outside: { drive: p.drive, turns: p.turns,
    clutch: modern ? p.clutch : true, drawer: modern && p.drawer, cog: !modern || p.cog, unlatched: !modern || p.unlatched,
    lamps: p.ball === 0 ? p.charge : 0, note: p.outsideNote } }
    : { ...base, inside: { lift: p.lift, actor: p.aboard ? p.lift : p.actor, aboard: p.aboard,
      ladder: p.ladder, drive: p.drive, clutch: modern ? p.clutch : true, ball: p.ball, glowing: p.charge === 3,
      doorOpen: p.ball === 2 && p.charge === 3 && (!modern || p.unlatched), note: p.insideNote } };
}
