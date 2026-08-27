import { getAuthenticatedSession, json } from "../../auth/_shared.js";
import { recordEvent } from "../../_shared/events.js";
import { notifyOtherIdentity } from "../../_shared/email.js";
import { notifyRealtime } from "../../_shared/realtime.js";
import { toTradeView } from "../_shared.js";

// Solo il destinatario può rifiutare una proposta "proposto". Nessuna carta si muove.
export async function onRequestPost(context) {
  const { request, env, params } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const tradeId = Number(params.id);
    if (!Number.isInteger(tradeId)) return json({ error: "Scambio non valido." }, 400);

    const trade = await env.DB.prepare("SELECT * FROM carte_trade WHERE id = ?").bind(tradeId).first();
    if (!trade) return json({ error: "Scambio non trovato." }, 404);
    if (trade.destinatario_user_id !== session.user.id) {
      return json({ error: "Non autorizzato." }, 403);
    }
    if (trade.stato !== "proposto") {
      return json({ error: "Questo scambio non è più in attesa di risposta." }, 409);
    }

    const now = new Date().toISOString();
    await env.DB
      .prepare("UPDATE carte_trade SET stato = 'rifiutato', risolto_at = ? WHERE id = ? AND stato = 'proposto'")
      .bind(now, tradeId)
      .run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "carte",
      eventType: "carte_trade_rifiutato",
      metadata: { tradeId }
    }));
    context.waitUntil(notifyOtherIdentity(env, session.user.id, {
      subject: `${session.user.nickname} ha rifiutato il tuo scambio di carte`,
      html: `<p>${session.user.nickname} ha rifiutato il tuo scambio nel gioco di carte.</p><p><a href="https://il-mondo-bianco.com">Vai al Mondo Bianco</a></p>`
    }));
    context.waitUntil(notifyRealtime(env, {
      type: "carte-trade:changed",
      action: "rejected",
      actorUserId: session.user.id,
      tradeId
    }));

    const updated = await env.DB.prepare("SELECT * FROM carte_trade WHERE id = ?").bind(tradeId).first();
    return json(await toTradeView(env, updated));
  } catch (error) {
    console.error(JSON.stringify({ event: "carte_trade_rifiuta_error", message: error.message }));
    return json({ error: "Non è stato possibile rifiutare lo scambio." }, 500);
  }
}
