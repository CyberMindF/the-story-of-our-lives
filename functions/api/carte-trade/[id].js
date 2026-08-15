import { getAuthenticatedSession, json } from "../auth/_shared.js";
import { toTradeView } from "./_shared.js";

// Dettaglio di uno scambio: visibile solo alle due identità coinvolte, mai a terzi (qui non
// esistono terzi, ma il controllo resta esplicito come nel resto del sito).
export async function onRequestGet(context) {
  const { request, env, params } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const tradeId = Number(params.id);
    if (!Number.isInteger(tradeId)) return json({ error: "Scambio non valido." }, 400);

    const trade = await env.DB.prepare("SELECT * FROM carte_trade WHERE id = ?").bind(tradeId).first();
    if (!trade) return json({ error: "Scambio non trovato." }, 404);

    const identity = session.user.identity;
    if (trade.proponente_identity !== identity && trade.destinatario_identity !== identity) {
      return json({ error: "Non autorizzato." }, 403);
    }

    return json(await toTradeView(env, trade));
  } catch (error) {
    console.error(JSON.stringify({ event: "carte_trade_detail_error", message: error.message }));
    return json({ error: "Non è stato possibile leggere lo scambio." }, 500);
  }
}
