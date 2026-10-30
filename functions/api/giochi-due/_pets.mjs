import { check } from './_errors.mjs';

export const SPECIES = [
  { id: 'cat', name: 'Gatto', baby: 'Gattino', emoji: '🐱' },
  { id: 'dog', name: 'Cane', baby: 'Cagnolino', emoji: '🐶' },
  { id: 'fox', name: 'Volpe', baby: 'Volpacchiotto', emoji: '🦊' },
  { id: 'rabbit', name: 'Coniglio', baby: 'Coniglietto', emoji: '🐰' },
  { id: 'duck', name: 'Papera', baby: 'Paperella', emoji: '🦆' },
  { id: 'porcupine', name: 'Istrice', baby: 'Piccolo istrice', emoji: '🦔' },
  { id: 'fire', name: 'Fuochetto', baby: 'Fiammella', emoji: '🔥', hatchText: 'Crac! Dall’uovo è saltato fuori un fuochetto!' },
  { id: 'mushroom', name: 'Funghetto', baby: 'Funghetto', emoji: '🍄', hatchText: 'Crac! Dall’uovo è spuntato un funghetto!' },
  { id: 'rock', name: 'Roccia', baby: 'Sassolino', emoji: '🪨', hatchText: 'Crac! Nell’uovo c’era una piccola roccia!' },
  { id: 'water', name: 'Goccia d’acqua', baby: 'Goccina', emoji: '💧', hatchText: 'Crac! Dall’uovo è scivolata fuori una goccia d’acqua!' }
];
export const SHOP = [
  { id: 'box', name: 'Scatola', emoji: '📦', price: 12, type: 'toy', description: 'Un nascondiglio con tanto di agguato.' },
  { id: 'ball', name: 'Pallina', emoji: '⚽', price: 20, type: 'toy', description: 'Rotola, rimbalza… e parte l’inseguimento.' },
  { id: 'tunnel', name: 'Tunnel', emoji: '🌀', price: 35, type: 'toy', description: 'Entra da una parte. Chissà quando esce.' },
  { id: 'bath', name: 'Vaschetta', emoji: '🛁', price: 35, type: 'toy', description: 'Per qualcuno è una piscina. Per altri, un problema.' },
  { id: 'plant', name: 'Piantina', emoji: '🌱', price: 10, type: 'decor', description: 'Un po’ di verde vicino alla finestra.' },
  { id: 'cushion', name: 'Cuscino', emoji: '🛏️', price: 15, type: 'decor', description: 'Morbido. Molto morbido.' },
  { id: 'stars', name: 'Stelline', emoji: '🌟', price: 25, type: 'decor', description: 'Una finestra piena di stelle.' },
  { id: 'biscuit', name: 'Biscottino', emoji: '🍪', price: 3, type: 'food', description: 'Una merenda speciale. Una porzione.' },
  { id: 'carrot', name: 'Carota', emoji: '🥕', price: 3, type: 'food', description: 'Croccante! Una porzione.' },
  { id: 'fish', name: 'Pesciolino', emoji: '🐟', price: 3, type: 'food', description: 'Uno spuntino diverso. Una porzione.' }
];
function pick(values) { return values[crypto.getRandomValues(new Uint32Array(1))[0] % values.length]; }
function shuffled(values) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function day(now) { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(now)); }
export function newPets() {
  return { schema: 2, coins: 30, pets: [], owned: [], food: {}, placed: { left: null, right: null }, decor: 'base',
    careDay: '', care: {}, lastAction: {}, memory: null, events: [], requests: [] };
}
export function normalizePets(original) {
  if (original.schema === 2) return original;
  const state = newPets();
  // Conversione in memoria; viene salvata con la prima azione, senza azzerare Nuvola.
  state.requests = original.requests ?? [];
  state.pets = [{ id: 'legacy-nuvola', species: 'cat', name: original.name || 'Nuvola', xp: original.affection || 0,
    egg: false, surprise: false, incubation: [], proposals: {}, discoveries: [], favoriteToy: 'box', favoriteFood: 'fish' }];
  state.owned = SHOP.filter(item => item.type === 'decor' && (original.affection ?? 0) >= ({ plant: 3, cushion: 6, stars: 12 })[item.id]).map(item => item.id);
  state.decor = original.decor ?? 'base';
  if (state.decor !== 'base' && !state.owned.includes(state.decor)) state.owned.push(state.decor);
  state.careDay = original.day ?? '';
  for (const [user, actions] of Object.entries(original.care ?? {})) state.care[user] = { 'legacy-nuvola': actions };
  state.lastAction = original.lastCare ?? {};
  state.events = (original.events ?? []).map((e, index) => ({ ...e, id: `legacy-${index}`, text: `${e.actor}: ${e.type}`, petId: 'legacy-nuvola' }));
  return state;
}
function xp(state, pet, user, key, now) {
  if (state.careDay !== day(now)) { state.careDay = day(now); state.care = {}; }
  const actions = ((state.care[user.id] ??= {})[pet.id] ??= []);
  if (!actions.includes(key)) { actions.push(key); pet.xp++; return ' +1 XP.'; }
  return '';
}
function event(state, user, pet, type, text, now, reaction = type) {
  state.events.unshift({ id: crypto.randomUUID(), actor: user.nickname, petId: pet?.id ?? null, type, reaction, text, at: now });
  state.events = state.events.slice(0, 24);
}
export function applyPets(original, action, user, now) {
  const state = structuredClone(normalizePets(original));
  let pet = state.pets.find(p => p.id === action.petId);
  const item = SHOP.find(i => i.id === action.itemId);
  if (action.type === 'adopt') {
    const first = !state.pets.length;
    check(state.pets.length < 12, 'Per ora c’è posto per 12 animali.');
    check(!state.pets.some(p => p.egg), 'Prima facciamo schiudere l’uovo che c’è già.');
    const totalXp = state.pets.reduce((sum, p) => sum + p.xp, 0);
    check(first || totalXp >= state.pets.length * 18, `Servono ${state.pets.length * 18} XP totali per un’altra adozione.`);
    check(state.coins >= (first ? 0 : 60), 'Servono 60 monetine per un altro uovo.');
    check(action.species === 'surprise' || SPECIES.some(s => s.id === action.species), 'Scegli un animale o un uovo a sorpresa.');
    const missing = SPECIES.filter(s => !state.pets.some(p => p.species === s.id));
    const species = action.species === 'surprise' ? pick(missing.length ? missing : SPECIES).id : action.species;
    pet = { id: crypto.randomUUID(), species, name: SPECIES.find(s => s.id === species).baby, egg: true, surprise: action.species === 'surprise',
      incubation: [], xp: 0, proposals: {}, discoveries: [], favoriteToy: pick(['box', 'ball', 'tunnel', 'bath']), favoriteFood: pick(['biscuit', 'carrot', 'fish']) };
    state.coins -= first ? 0 : 60; state.pets.push(pet);
    event(state, user, pet, 'adopt', `${user.nickname} ha portato un uovo. C’è qualcuno lì dentro!`, now);
  } else if (action.type === 'buy') {
    check(item, 'Oggetto non trovato.');
    check(item.type === 'food' || !state.owned.includes(item.id), 'Questo oggetto è già nostro.');
    check(state.coins >= item.price, 'Non ci sono abbastanza monetine.');
    check(item.type !== 'food' || (state.food[item.id] ?? 0) < 50, 'Abbiamo già 50 porzioni.');
    state.coins -= item.price;
    if (item.type === 'food') state.food[item.id] = (state.food[item.id] ?? 0) + 1;
    else state.owned.push(item.id);
    event(state, user, null, 'buy', `${user.nickname} ha comprato: ${item.name}.`, now);
  } else if (action.type === 'place') {
    check(item && state.owned.includes(item.id) && item.type !== 'food', 'Prima compra questo oggetto.');
    if (item.type === 'decor') state.decor = item.id;
    else {
      check(['left', 'right'].includes(action.slot), 'Scegli un lato della stanza.');
      for (const side of ['left', 'right']) if (state.placed[side] === item.id) state.placed[side] = null;
      state.placed[action.slot] = item.id;
    }
    event(state, user, null, 'place', `${user.nickname} ha sistemato ${item.name.toLowerCase()} nella stanza.`, now);
  } else if (action.type === 'memory-flip') {
    const run = state.memory;
    check(run && run.id === action.runId && !run.done, 'Questa partita è già finita.', 409);
    check(Number.isInteger(action.cell) && action.cell >= 0 && action.cell < run.board.length && !run.matched.includes(action.cell), 'Scegli una carta ancora coperta.');
    check(now - run.lastFlip >= 200, 'Un attimo, la carta si sta girando.', 429);
    if (run.open.length === 2) { check(now - run.lastFlip >= 900, 'Guarda le due carte prima di continuare.', 429); run.open = []; }
    check(!run.open.includes(action.cell), 'Questa carta è già scoperta.');
    run.open.push(action.cell); run.lastFlip = now;
    if (run.open.length === 2) {
      run.turns++;
      if (run.board[run.open[0]] === run.board[run.open[1]]) { run.matched.push(...run.open); run.open = []; }
      if (run.matched.length === run.board.length) {
        const pairCount = run.board.length / 2;
        run.done = true; run.reward = Math.max(4, 16 - Math.max(0, run.turns - pairCount));
        state.coins += run.reward;
        pet = state.pets.find(p => p.id === run.petId); pet.xp += 3;
        event(state, user, pet, 'memory-win', `Tutte le coppie! +${run.reward} monetine e +3 XP per ${pet.name}.`, now, 'gioca');
      }
    }
  } else {
    check(pet, 'Scegli un animale.');
    if (action.type === 'incubate') {
      check(pet.egg && ['warm', 'turn', 'listen'].includes(action.care), 'Quell’uovo è già schiuso o l’azione non è valida.');
      check(!pet.incubation.includes(action.care), 'Questo l’abbiamo già fatto. Prova un’altra cosa.');
      pet.incubation.push(action.care);
      if (pet.incubation.length === 3) pet.egg = false;
      const species = SPECIES.find(s => s.id === pet.species);
      event(state, user, pet, pet.egg ? 'incubate' : 'hatch', pet.egg ? ({ warm: 'Al calduccio. Si è mosso!', turn: 'Piano piano… si sente un tic.', listen: 'Toc toc. Qualcuno risponde!' })[action.care] : species.hatchText ?? `Crac! È nato un ${species.name.toLowerCase()}!`, now);
    } else {
      check(!pet.egg, 'Prima deve uscire dall’uovo!');
      if (action.type === 'propose-name') {
        check(typeof action.name === 'string' && action.name.trim().length > 0 && action.name.trim().length <= 24, 'Scegli un nome da 1 a 24 caratteri.');
        pet.proposals[user.id] = { id: crypto.randomUUID(), name: action.name.trim(), by: user.nickname, userId: user.id };
        event(state, user, pet, 'propose-name', `${user.nickname} propone il nome ${action.name.trim()}.`, now);
      } else if (action.type === 'accept-name') {
        const proposal = Object.values(pet.proposals).find(p => p.id === action.proposalId);
        check(proposal && proposal.userId !== user.id, 'Scegli una proposta dell’altra persona ancora valida.');
        pet.name = proposal.name; pet.proposals = {};
        event(state, user, pet, 'accept-name', `D’accordo: da oggi si chiama ${pet.name}!`, now);
      } else if (action.type === 'memory-start') {
        check(!state.memory || state.memory.done, 'C’è già un memory in corso. Possiamo finirlo insieme.');
        state.memory = { id: crypto.randomUUID(), petId: pet.id, board: shuffled([...SPECIES.map(s => s.emoji), ...SPECIES.map(s => s.emoji)]),
          matched: [], open: [], turns: 0, done: false, reward: 0, lastFlip: 0 };
      } else {
        check(now - (state.lastAction[user.id] ?? 0) >= 1800, 'Un secondo, sta ancora giocando!', 429);
        let text, reaction = action.type;
        if (['coccola', 'snack', 'gioca'].includes(action.type)) {
          text = ({ coccola: `${pet.name} si mette comodo. Ancora?`, snack: `${pet.name} ha già ripulito la ciotola.`, gioca: `${pet.name} parte all’inseguimento della tua mano!` })[action.type];
          text += xp(state, pet, user, action.type, now);
        } else if (action.type === 'use-item') {
          check(item?.type === 'toy' && Object.values(state.placed).includes(item.id), 'Sistema prima il gioco nella stanza.');
          reaction = item.id;
          if (item.id === 'bath') text = ({ duck: 'Splash! Questa è ufficialmente la sua piscina.', cat: 'Una zampa dentro. Una zampa fuori. Meglio fuori.', fire: 'Psssh! Una nuvoletta di vapore e il fuochetto torna subito acceso.', water: 'Splash! Adesso è una goccia un po’ più grande.', rock: 'Bagnetto lucidante. Brilla quasi.' })[pet.species] ?? 'Zampe a mollo. Acqua dappertutto.';
          else if (item.id === 'box') text = ({ porcupine: 'Nella scatola spuntano un sacco di aculei.', mushroom: 'Dal cartone spunta soltanto il cappello.', rock: 'Mimetizzazione perfetta. Sembra una scatola con un sasso.' })[pet.species] ?? 'Sparito nella scatola. Ah no, si vede qualcosa.';
          else if (item.id === 'tunnel') text = ({ rabbit: 'Dentro, fuori, di nuovo dentro. Nuovo record!', fire: 'Una lucina corre nel tunnel e sbuca dall’altra parte.', water: 'È scivolata nel tunnel come su uno scivolo.' })[pet.species] ?? 'È entrato nel tunnel. Uscirà? Eccolo!';
          else text = ({ fox: 'Pallina rubata. La sta nascondendo.', rock: 'Ha fissato la pallina. La pallina ha perso.', mushroom: 'Un saltello sul posto. Vale come inseguimento.' })[pet.species] ?? 'Pallina lanciata. Inseguimento iniziato!';
          text += xp(state, pet, user, item.id, now);
          if (!pet.discoveries.includes(item.id)) { pet.discoveries.push(item.id); text += item.id === pet.favoriteToy ? ' Hai trovato il suo gioco preferito!' : ' Nuova reazione scoperta.'; }
        } else if (action.type === 'feed') {
          check(item?.type === 'food' && (state.food[item.id] ?? 0) > 0, 'Questo spuntino è finito.');
          state.food[item.id]--; reaction = 'snack';
          text = pet.favoriteFood === item.id ? 'Divorato! Questo è il suo spuntino preferito.' : 'Assaggiato. Un altro pezzetto?';
          if (!pet.discoveries.includes(item.id)) pet.discoveries.push(item.id);
          text += xp(state, pet, user, `food-${item.id}`, now);
        } else check(false, 'Azione non valida.');
        state.lastAction[user.id] = now;
        event(state, user, pet, action.type, text, now, reaction);
      }
    }
  }
  return state;
}
export function petsView(original, userId, now) {
  const state = normalizePets(original);
  const { requests, lastAction, care, careDay, ...safe } = state;
  return { ...safe, species: SPECIES, shop: SHOP, nextEggXp: state.pets.length * 18, eggPrice: state.pets.length ? 60 : 0,
    totalXp: state.pets.reduce((sum, p) => sum + p.xp, 0),
    pets: state.pets.map(p => {
      const { favoriteToy, favoriteFood, ...visible } = p;
      return { ...visible, species: p.egg && p.surprise ? null : p.species, name: p.egg ? 'Uovo' : p.name,
        favoriteToy: p.discoveries.includes(favoriteToy) ? favoriteToy : null, favoriteFood: p.discoveries.includes(favoriteFood) ? favoriteFood : null,
        myCare: careDay === day(now) ? care[userId]?.[p.id] ?? [] : [] };
    }),
    memory: state.memory ? { ...state.memory, board: state.memory.board.map((value, i) => state.memory.matched.includes(i) || state.memory.open.includes(i) ? value : null) } : null
  };
}
