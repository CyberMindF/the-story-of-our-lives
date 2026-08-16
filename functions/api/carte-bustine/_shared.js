// Maturazione bustine (#e4): 1 bustina ogni 10 minuti di permanenza sul sito, cumulativi anche
// a più riprese nella giornata (non serve una sessione continua), nessun tetto massimo
// all'accumulo — deciso esplicitamente da Rory. Calcolo pigro ad ogni lettura/apertura (stesso
// principio della pulizia media di ponti_chat_messages), niente Cron Trigger dedicato.
const MINUTES_PER_PACK = 10;

export async function accrueBustine(env, ownerIdentity) {
  const row = await env.DB
    .prepare("SELECT owner_identity, quantita_disponibile, minuti_residui, updated_at FROM carte_bustine WHERE owner_identity = ?")
    .bind(ownerIdentity)
    .first();

  const now = new Date();
  if (!row) {
    const iso = now.toISOString();
    await env.DB
      .prepare("INSERT INTO carte_bustine (owner_identity, quantita_disponibile, minuti_residui, updated_at) VALUES (?, 0, 0, ?)")
      .bind(ownerIdentity, iso)
      .run();
    return { ownerIdentity, quantitaDisponibile: 0, minutiResidui: 0 };
  }

  const elapsedMinutes = Math.max(0, Math.floor((now.getTime() - new Date(row.updated_at).getTime()) / 60000));
  if (elapsedMinutes === 0) {
    return { ownerIdentity, quantitaDisponibile: row.quantita_disponibile, minutiResidui: row.minuti_residui };
  }

  const totalMinutes = row.minuti_residui + elapsedMinutes;
  const newPacks = Math.floor(totalMinutes / MINUTES_PER_PACK);
  const remainingMinutes = totalMinutes % MINUTES_PER_PACK;
  const quantitaDisponibile = row.quantita_disponibile + newPacks;
  const iso = now.toISOString();

  await env.DB
    .prepare("UPDATE carte_bustine SET quantita_disponibile = ?, minuti_residui = ?, updated_at = ? WHERE owner_identity = ?")
    .bind(quantitaDisponibile, remainingMinutes, iso, ownerIdentity)
    .run();

  return { ownerIdentity, quantitaDisponibile, minutiResidui: remainingMinutes };
}

// Streak "giorni di fila" (#e4, dettagliata il 15/08/2026, rivista lo stesso giorno): premia
// OGNI visita alla pagina Carte in giorni di calendario consecutivi (UTC), non solo alcune
// soglie — versione precedente (bonus solo a 1/3/7/14/30 giorni, zero gli altri) sostituita su
// richiesta di Rory ("ogni giorno si prendono le bustine, ma più si va avanti più bustine si
// prendono"). L'importo cresce di 1 ogni 3 giorni: 1-3→+1, 4-6→+2, 7-9→+3, ecc, senza tetto —
// "man mano" implica crescita continua, non un plateau. "Giorno" = una visita in una data di
// calendario diversa dall'ultima registrata, non tempo passivo (a differenza delle bustine
// passive sopra). Il primo controllo della giornata (primaVisitaOggi) fa comparire un modale
// di riepilogo in pagina.
export function streakDayBonus(streakDay) {
  return Math.floor((streakDay - 1) / 3) + 1;
}

function todayUtc(now) {
  return now.toISOString().slice(0, 10);
}

function daysBetween(fromIso, toIso) {
  const from = new Date(`${fromIso}T00:00:00Z`);
  const to = new Date(`${toIso}T00:00:00Z`);
  return Math.round((to.getTime() - from.getTime()) / 86400000);
}

export async function checkStreak(env, ownerIdentity) {
  const row = await env.DB
    .prepare("SELECT streak_corrente, streak_migliore, ultimo_giorno FROM carte_streak WHERE owner_identity = ?")
    .bind(ownerIdentity)
    .first();

  const now = new Date();
  const today = todayUtc(now);
  const iso = now.toISOString();

  if (row && row.ultimo_giorno === today) {
    return { streakCorrente: row.streak_corrente, streakMigliore: row.streak_migliore, bustineBonus: 0, primaVisitaOggi: false };
  }

  // !row (primissima visita in assoluto) e streak riazzerata (gap di più di 1 giorno) passano
  // dallo stesso ramo: entrambe ripartono da 1.
  const gap = row?.ultimo_giorno ? daysBetween(row.ultimo_giorno, today) : null;
  const streakCorrente = gap === 1 ? row.streak_corrente + 1 : 1;
  const streakMigliore = Math.max(row?.streak_migliore ?? 0, streakCorrente);
  const bustineBonus = streakDayBonus(streakCorrente);

  const statements = [
    row
      ? env.DB
          .prepare("UPDATE carte_streak SET streak_corrente = ?, streak_migliore = ?, ultimo_giorno = ?, updated_at = ? WHERE owner_identity = ?")
          .bind(streakCorrente, streakMigliore, today, iso, ownerIdentity)
      : env.DB
          .prepare("INSERT INTO carte_streak (owner_identity, streak_corrente, streak_migliore, ultimo_giorno, updated_at) VALUES (?, ?, ?, ?, ?)")
          .bind(ownerIdentity, streakCorrente, streakMigliore, today, iso),
    env.DB
      .prepare("UPDATE carte_bustine SET quantita_disponibile = quantita_disponibile + ?, updated_at = ? WHERE owner_identity = ?")
      .bind(bustineBonus, iso, ownerIdentity)
  ];
  await env.DB.batch(statements);

  return { streakCorrente, streakMigliore, bustineBonus, primaVisitaOggi: true };
}

// Piramide ripida (scelta esplicita di Rory tra le opzioni proposte), estesa con argento
// (metallo, subito sotto l'oro), onice (prima gemma, tra oro e smeraldo) e zaffiro (gemma,
// subito sopra il diamante). Il peso 10 dell'onice mantiene la progressione tra oro (15) e
// smeraldo (8), coerente con l'ordine di rarita' richiesto.
const FINITURA_WEIGHTS = [
  ["flat", 45],
  ["argento", 20],
  ["oro", 15],
  ["onice", 10],
  ["smeraldo", 8],
  ["rubino", 6],
  ["zaffiro", 4],
  ["diamante", 2]
];
const TOTAL_WEIGHT = FINITURA_WEIGHTS.reduce((sum, [, weight]) => sum + weight, 0);

export function rollFinitura() {
  let roll = Math.random() * TOTAL_WEIGHT;
  for (const [finitura, weight] of FINITURA_WEIGHTS) {
    roll -= weight;
    if (roll <= 0) return finitura;
  }
  return FINITURA_WEIGHTS[0][0];
}
