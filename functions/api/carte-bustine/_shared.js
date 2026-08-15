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

// Piramide ripida (scelta esplicita di Rory tra le opzioni proposte), estesa con argento
// (metallo, subito sotto l'oro) e zaffiro (gemma, subito sopra il diamante) quando le due
// finiture sono state aggiunte. Pesi di argento/zaffiro scelti di default, non discussi
// esplicitamente con Rory: da aggiustare se la piramide risulta troppo/poco generosa.
const FINITURA_WEIGHTS = [
  ["flat", 45],
  ["argento", 20],
  ["oro", 15],
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
