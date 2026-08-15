import { getAuthenticatedSession, json } from "../auth/_shared.js";
import { accrueBustine } from "./_shared.js";

// Stato bustine dell'identità della sessione: fa maturare l'accumulo pigro prima di
// rispondere, così il saldo mostrato è sempre aggiornato senza bisogno di un cron.
export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const state = await accrueBustine(env, session.user.identity);
    return json({ quantitaDisponibile: state.quantitaDisponibile, minutiResidui: state.minutiResidui });
  } catch (error) {
    console.error(JSON.stringify({ event: "carte_bustine_stato_error", message: error.message }));
    return json({ error: "Non è stato possibile leggere lo stato delle bustine." }, 500);
  }
}
