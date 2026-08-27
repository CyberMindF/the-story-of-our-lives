import { getAuthenticatedSession, json } from "../auth/_shared.js";
import { accrueBustine, checkStreak } from "./_shared.js";

// Stato bustine dell'identità della sessione: fa maturare l'accumulo pigro prima di
// rispondere, così il saldo mostrato è sempre aggiornato senza bisogno di un cron. Ogni
// visita alla pagina in una data diversa dall'ultima registrata aggiorna anche la streak
// "giorni di fila" (#e4) ed eventuali bustine bonus di soglia vengono già incluse nel saldo.
export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const state = await accrueBustine(env, session.user.id);
    const streak = await checkStreak(env, session.user.id);
    const quantitaDisponibile = state.quantitaDisponibile + streak.bustineBonus;
    return json({
      quantitaDisponibile,
      minutiResidui: state.minutiResidui,
      streakCorrente: streak.streakCorrente,
      streakMigliore: streak.streakMigliore,
      streakBustineBonus: streak.bustineBonus,
      streakPrimaVisitaOggi: streak.primaVisitaOggi
    });
  } catch (error) {
    console.error(JSON.stringify({ event: "carte_bustine_stato_error", message: error.message }));
    return json({ error: "Non è stato possibile leggere lo stato delle bustine." }, 500);
  }
}
