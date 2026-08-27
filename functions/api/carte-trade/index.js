import { getAuthenticatedSession, json, readJson } from "../auth/_shared.js";
import { recordEvent } from "../_shared/events.js";
import { notifyOtherIdentity } from "../_shared/email.js";
import { notifyRealtime } from "../_shared/realtime.js";
import {
  definizioniExist,
  findInsufficientItem,
  itemInsertStatements,
  normalizeMessaggio,
  parseItems,
  toTradeView
} from "./_shared.js";
import { findTradePartner } from "./_users.js";

const VALID_STATI = new Set(["proposto", "accettato", "rifiutato", "controproposto"]);

// Elenco degli scambi che coinvolgono l'identità della sessione (come proponente o
// destinatario), più recenti prima. Filtro opzionale ?stato= per la lista "in sospeso".
export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const url = new URL(request.url);
    const stato = url.searchParams.get("stato");
    if (stato && !VALID_STATI.has(stato)) {
      return json({ error: "Stato non valido." }, 400);
    }

    const userId = session.user.id;
    const { results } = await env.DB
      .prepare(
        `SELECT * FROM carte_trade
         WHERE (proponente_user_id = ? OR destinatario_user_id = ?)
         ${stato ? "AND stato = ?" : ""}
         ORDER BY created_at DESC`
      )
      .bind(...(stato ? [userId, userId, stato] : [userId, userId]))
      .all();

    const trades = await Promise.all(results.map((trade) => toTradeView(env, trade)));
    return json({ trades });
  } catch (error) {
    console.error(JSON.stringify({ event: "carte_trade_list_error", message: error.message }));
    return json({ error: "Non è stato possibile leggere gli scambi." }, 500);
  }
}

// Propone uno scambio N-per-N (N può essere 0 da un lato) con messaggio libero opzionale.
// Il destinatario è sempre "l'altra identità": mai un valore fidato dal client.
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const payload = await readJson(request);
    const offerta = parseItems(payload?.offerta ?? []);
    const richiesta = parseItems(payload?.richiesta ?? []);
    const messaggio = normalizeMessaggio(payload?.messaggio);

    if (!offerta || !richiesta) return json({ error: "Le carte selezionate non sono valide." }, 400);
    if (offerta.length === 0 && richiesta.length === 0) {
      return json({ error: "Seleziona almeno una carta da offrire o richiedere." }, 400);
    }
    if (messaggio === undefined) return json({ error: "Il messaggio non è valido." }, 400);

    const partner = await findTradePartner(env, session.user);
    if (!partner) {
      return json({ error: "Non esiste ancora un altro account a cui proporre lo scambio." }, 409);
    }

    const allItems = [...offerta, ...richiesta];
    if (!(await definizioniExist(env, allItems))) {
      return json({ error: "Una delle carte selezionate non esiste più." }, 400);
    }

    const missing = await findInsufficientItem(env, session.user.id, offerta);
    if (missing) {
      return json({ error: "Non possiedi abbastanza copie di una delle carte offerte." }, 409);
    }

    const now = new Date().toISOString();
    const trade = await env.DB
      .prepare(
        `INSERT INTO carte_trade (proponente_user_id, destinatario_user_id, stato, messaggio, created_at)
         VALUES (?, ?, 'proposto', ?, ?) RETURNING *`
      )
      .bind(session.user.id, partner.id, messaggio, now)
      .first();

    const itemStatements = [
      ...itemInsertStatements(env, trade.id, "offerta", offerta),
      ...itemInsertStatements(env, trade.id, "richiesta", richiesta)
    ];
    if (itemStatements.length > 0) {
      await env.DB.batch(itemStatements);
    }

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "carte",
      eventType: "carte_trade_proposto",
      metadata: { tradeId: trade.id }
    }));
    context.waitUntil(notifyOtherIdentity(env, session.user.id, {
      subject: `${session.user.nickname} ti ha proposto uno scambio di carte`,
      html: `<p>${session.user.nickname} ti ha proposto uno scambio nel gioco di carte.</p><p><a href="https://il-mondo-bianco.com">Vai al Mondo Bianco</a></p>`
    }));
    context.waitUntil(notifyRealtime(env, {
      type: "carte-trade:changed",
      action: "created",
      actorUserId: session.user.id,
      tradeId: trade.id
    }));

    return json(await toTradeView(env, trade), 201);
  } catch (error) {
    console.error(JSON.stringify({ event: "carte_trade_create_error", message: error.message }));
    return json({ error: "Non è stato possibile proporre lo scambio." }, 500);
  }
}
