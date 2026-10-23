// Maturazione bustine (#e4): 1 bustina ogni 10 minuti in cui il Mondo Bianco resta davvero
// visibile. La lettura del saldo non deve mai maturare tempo: i minuti arrivano esclusivamente
// dai tick di presenza e sono deduplicati nel database per utente + minuto UTC.
const MINUTES_PER_PACK = 10;
const ACTIVE_TICK_MIN_GAP_SECONDS = 50;

export async function ensureBustineState(env, userId) {
  const iso = new Date().toISOString();
  await env.DB
    .prepare(
      `INSERT INTO carte_bustine (user_id, quantita_disponibile, minuti_residui, updated_at)
       VALUES (?, 0, 0, ?)
       ON CONFLICT(user_id) DO NOTHING`
    )
    .bind(userId, iso)
    .run();
  return readBustineState(env, userId);
}

export async function readBustineState(env, userId) {
  const row = await env.DB
    .prepare(
      `SELECT user_id, quantita_disponibile, minuti_residui, evocazioni_disponibili,
              bustine_senza_evocazione, updated_at
       FROM carte_bustine WHERE user_id = ?`
    )
    .bind(userId)
    .first();

  if (!row) {
    return { userId, quantitaDisponibile: 0, minutiResidui: 0, evocazioniDisponibili: 0, bustineSenzaEvocazione: 0 };
  }

  return {
    userId,
    quantitaDisponibile: row.quantita_disponibile,
    minutiResidui: row.minuti_residui,
    evocazioniDisponibili: row.evocazioni_disponibili ?? 0,
    bustineSenzaEvocazione: row.bustine_senza_evocazione ?? 0
  };
}

export async function recordActiveMinute(env, userId) {
  await ensureBustineState(env, userId);

  const now = new Date();
  const iso = now.toISOString();

  // Un solo UPDATE condizionale rende la deduplicazione atomica anche con piu schede aperte.
  // La tolleranza di 10 secondi assorbe il jitter dei timer senza permettere due accrediti
  // ravvicinati quando le schede hanno intervalli sfalsati a cavallo del minuto UTC.
  const updated = await env.DB
    .prepare(
      `UPDATE carte_bustine
       SET quantita_disponibile = quantita_disponibile + CASE WHEN minuti_residui = ? - 1 THEN 1 ELSE 0 END,
           minuti_residui = (minuti_residui + 1) % ?,
           ultimo_minuto_attivo = ?,
           updated_at = ?
       WHERE user_id = ?
         AND (ultimo_minuto_attivo IS NULL OR unixepoch(?) - unixepoch(ultimo_minuto_attivo) >= ?)
         AND (ultimo_minuto_attivo IS NULL OR substr(ultimo_minuto_attivo, 1, 16) < substr(?, 1, 16))
       RETURNING quantita_disponibile, minuti_residui`
    )
    .bind(MINUTES_PER_PACK, MINUTES_PER_PACK, iso, iso, userId, iso, ACTIVE_TICK_MIN_GAP_SECONDS, iso)
    .first();

  if (updated) {
    return {
      userId,
      quantitaDisponibile: updated.quantita_disponibile,
      minutiResidui: updated.minuti_residui,
      minutoRegistrato: true
    };
  }

  return { ...(await readBustineState(env, userId)), minutoRegistrato: false };
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

export async function checkStreak(env, userId) {
  const row = await env.DB
    .prepare("SELECT streak_corrente, streak_migliore, ultimo_giorno FROM carte_streak WHERE user_id = ?")
    .bind(userId)
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
          .prepare("UPDATE carte_streak SET streak_corrente = ?, streak_migliore = ?, ultimo_giorno = ?, updated_at = ? WHERE user_id = ?")
          .bind(streakCorrente, streakMigliore, today, iso, userId)
      : env.DB
          .prepare("INSERT INTO carte_streak (user_id, streak_corrente, streak_migliore, ultimo_giorno, updated_at) VALUES (?, ?, ?, ?, ?)")
          .bind(userId, streakCorrente, streakMigliore, today, iso),
    env.DB
      .prepare("UPDATE carte_bustine SET quantita_disponibile = quantita_disponibile + ?, updated_at = ? WHERE user_id = ?")
      .bind(bustineBonus, iso, userId)
  ];
  await env.DB.batch(statements);

  return { streakCorrente, streakMigliore, bustineBonus, primaVisitaOggi: true };
}

// Le bustine maturano molto facilmente e contengono cinque carte: le finiture alte devono
// quindi essere eventi davvero rari. Pesi su 10.000 estrazioni: oltre il 98% resta tra Bianca,
// Argento e Oro; ogni gradino successivo e' strettamente piu' raro del precedente. Diamante e'
// circa 1 carta ogni 2.000 (circa 1 bustina ogni 400, in media).
const FINITURA_WEIGHTS = [
  ["flat", 8692],
  ["argento", 900],
  ["oro", 250],
  ["onice", 100],
  ["smeraldo", 30],
  ["rubino", 15],
  ["zaffiro", 8],
  ["diamante", 5]
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
