import { getAuthenticatedSession, json, readJson } from "../../auth/_shared.js";
import { recordEvent } from "../../_shared/events.js";
import {
  definizioniExist,
  findInsufficientItem,
  itemInsertStatements,
  normalizeMessaggio,
  parseItems,
  toTradeView
} from "../_shared.js";

// Solo il destinatario può controproporre una "proposto": chiude quella con stato
// 'controproposto' e ne crea una nuova con mittente/destinatario invertiti, incatenata via
// trade_precedente_id per ricostruire lo storico.
export async function onRequestPost(context) {
  const { request, env, params } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const tradeId = Number(params.id);
    if (!Number.isInteger(tradeId)) return json({ error: "Scambio non valido." }, 400);

    const trade = await env.DB.prepare("SELECT * FROM carte_trade WHERE id = ?").bind(tradeId).first();
    if (!trade) return json({ error: "Scambio non trovato." }, 404);
    if (trade.destinatario_identity !== session.user.identity) {
      return json({ error: "Non autorizzato." }, 403);
    }
    if (trade.stato !== "proposto") {
      return json({ error: "Questo scambio non è più in attesa di risposta." }, 409);
    }

    const payload = await readJson(request);
    const offerta = parseItems(payload?.offerta ?? []);
    const richiesta = parseItems(payload?.richiesta ?? []);
    const messaggio = normalizeMessaggio(payload?.messaggio);

    if (!offerta || !richiesta) return json({ error: "Le carte selezionate non sono valide." }, 400);
    if (offerta.length === 0 && richiesta.length === 0) {
      return json({ error: "Seleziona almeno una carta da offrire o richiedere." }, 400);
    }
    if (messaggio === undefined) return json({ error: "Il messaggio non è valido." }, 400);

    const nuovoProponente = trade.destinatario_identity;
    const nuovoDestinatario = trade.proponente_identity;

    const allItems = [...offerta, ...richiesta];
    if (!(await definizioniExist(env, allItems))) {
      return json({ error: "Una delle carte selezionate non esiste più." }, 400);
    }

    const missing = await findInsufficientItem(env, nuovoProponente, offerta);
    if (missing) {
      return json({ error: "Non possiedi abbastanza copie di una delle carte offerte." }, 409);
    }

    const now = new Date().toISOString();

    const closed = await env.DB
      .prepare("UPDATE carte_trade SET stato = 'controproposto', risolto_at = ? WHERE id = ? AND stato = 'proposto'")
      .bind(now, tradeId)
      .run();
    if (closed.meta.changes === 0) {
      return json({ error: "Questo scambio è stato risolto nel frattempo." }, 409);
    }

    const nuovoTrade = await env.DB
      .prepare(
        `INSERT INTO carte_trade
           (proponente_identity, destinatario_identity, stato, messaggio, trade_precedente_id, created_at)
         VALUES (?, ?, 'proposto', ?, ?, ?) RETURNING *`
      )
      .bind(nuovoProponente, nuovoDestinatario, messaggio, tradeId, now)
      .first();

    const itemStatements = [
      ...itemInsertStatements(env, nuovoTrade.id, "offerta", offerta),
      ...itemInsertStatements(env, nuovoTrade.id, "richiesta", richiesta)
    ];
    if (itemStatements.length > 0) {
      await env.DB.batch(itemStatements);
    }

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "carte",
      eventType: "carte_trade_controproposto",
      metadata: { tradeId: nuovoTrade.id, tradePrecedenteId: tradeId }
    }));

    return json(await toTradeView(env, nuovoTrade), 201);
  } catch (error) {
    console.error(JSON.stringify({ event: "carte_trade_controproponi_error", message: error.message }));
    return json({ error: "Non è stato possibile controproporre lo scambio." }, 500);
  }
}
