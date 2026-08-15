import { getAuthenticatedSession, json } from "../../auth/_shared.js";
import { recordEvent } from "../../_shared/events.js";
import { findInsufficientItem, toTradeView, transferStatements } from "../_shared.js";

// Solo il destinatario può accettare una proposta "proposto". Sposta davvero le carte tra i
// due possessi in un unico batch atomico (D1 non ha BEGIN/COMMIT manuale in questo progetto,
// batch() è il primitivo usato ovunque serva coerenza multi-riga, vedi carte-bustine/apri.js).
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

    const view = await toTradeView(env, trade);
    const offertaItems = view.offerta.map((item) => ({ carteDefinizioneId: Number(item.carteDefinizioneId), quantita: item.quantita }));
    const richiestaItems = view.richiesta.map((item) => ({ carteDefinizioneId: Number(item.carteDefinizioneId), quantita: item.quantita }));

    // Ri-verifica appena prima di scrivere: lo stato può essere cambiato tra la proposta e ora.
    const missingOfferta = await findInsufficientItem(env, trade.proponente_identity, offertaItems);
    const missingRichiesta = await findInsufficientItem(env, trade.destinatario_identity, richiestaItems);
    if (missingOfferta || missingRichiesta) {
      return json({ error: "Le carte coinvolte non sono più disponibili." }, 409);
    }

    const now = new Date().toISOString();
    const statements = [
      ...transferStatements(env, trade.proponente_identity, trade.destinatario_identity, offertaItems, now),
      ...transferStatements(env, trade.destinatario_identity, trade.proponente_identity, richiestaItems, now),
      env.DB
        .prepare("UPDATE carte_trade SET stato = 'accettato', risolto_at = ? WHERE id = ? AND stato = 'proposto'")
        .bind(now, tradeId)
    ];
    await env.DB.batch(statements);

    const updated = await env.DB.prepare("SELECT * FROM carte_trade WHERE id = ?").bind(tradeId).first();
    if (updated.stato !== "accettato") {
      // Un'altra richiesta ha risolto lo scambio nel frattempo (rifiuto/controproposta): le
      // carte sono già state spostate sopra, ma segnaliamo comunque il conflitto al chiamante.
      return json({ error: "Questo scambio è stato risolto nel frattempo." }, 409);
    }

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "carte",
      eventType: "carte_trade_accettato",
      metadata: { tradeId }
    }));

    return json(await toTradeView(env, updated));
  } catch (error) {
    console.error(JSON.stringify({ event: "carte_trade_accetta_error", message: error.message }));
    return json({ error: "Non è stato possibile accettare lo scambio." }, 500);
  }
}
