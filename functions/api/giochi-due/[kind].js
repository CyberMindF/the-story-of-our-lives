import { getAuthenticatedSession, json } from '../auth/_shared.js';
import { findTradePartner } from '../carte-trade/_users.js';
import { initialState, applyAction, publicState, GameError } from './_engine.mjs';

export async function onRequest(context) {
  try {
    const { request, env, params } = context;
    if (!['GET', 'POST'].includes(request.method)) return json({ error: 'Metodo non consentito.' }, 405, { Allow: 'GET, POST' });
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: 'Accedi per giocare.' }, 401);
    if (session.user.isTest) return json({ error: 'Le attività condivise non sono disponibili per gli account di prova.' }, 403);
    const kind = params.kind;
    const empty = initialState(kind);
    const partner = await findTradePartner(env, session.user);
    if (!partner) return json({ error: 'Serve anche l’altro account per aprire le attività condivise.' }, 409);
    const pair = [session.user.id, partner.id].sort((a, b) => a - b).join(':');
    const db = env.DB.withSession('first-primary');
    const row = await db.prepare('SELECT state_json, version FROM giochi_due WHERE pair_key = ? AND kind = ?').bind(pair, kind).first();
    const state = row ? JSON.parse(row.state_json) : empty;
    const version = row?.version ?? 0;
    const view = (value, revision) => ({ ...publicState(kind, value, session.user.id), version: revision, partner: partner.nickname });
    if (request.method === 'GET') return json(view(state, version));
    // Leggi al massimo 8 KiB anche quando Content-Length non è presente.
    const reader = request.body?.getReader();
    if (!reader) return json({ error: 'Richiesta vuota.' }, 400);
    let bytes = 0, text = ''; const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 8192) { await reader.cancel(); return json({ error: 'Richiesta troppo grande.' }, 413); }
      text += decoder.decode(value, { stream: true });
    }
    let payload;
    try { payload = JSON.parse(text + decoder.decode()); } catch { return json({ error: 'Richiesta non valida.' }, 400); }
    if (!payload || typeof payload.requestId !== 'string' || !/^[a-f0-9-]{36}$/.test(payload.requestId)) return json({ error: 'Identificativo richiesta non valido.' }, 400);
    const requestKey = `${session.user.id}:${payload.requestId}`;
    if (state.requests.includes(requestKey)) return json(view(state, version));
    if (payload.version !== version) return json({ error: 'L’altra persona ha appena aggiornato la partita. Riprova sullo stato aggiornato.' }, 409);
    const next = applyAction(kind, state, payload, session.user);
    next.requests = [...state.requests, requestKey].slice(-32);
    const now = new Date().toISOString();
    // INSERT OR IGNORE + compare-and-swap: nessuna azione può sovrascriverne un’altra.
    await db.prepare('INSERT OR IGNORE INTO giochi_due (pair_key, kind, version, state_json, updated_at) VALUES (?, ?, 0, ?, ?)')
      .bind(pair, kind, JSON.stringify(empty), now).run();
    const result = await db.prepare('UPDATE giochi_due SET state_json = ?, version = version + 1, updated_at = ? WHERE pair_key = ? AND kind = ? AND version = ?')
      .bind(JSON.stringify(next), now, pair, kind, version).run();
    if (result.meta.changes !== 1) return json({ error: 'La partita è cambiata nel frattempo. Riprova.' }, 409);
    return json(view(next, version + 1));
  } catch (error) {
    if (error instanceof GameError) return json({ error: error.message }, error.status);
    console.error(JSON.stringify({ event: 'giochi_due_error', message: error.message }));
    return json({ error: 'Non riesco a caricare le attività. Riprova tra poco.' }, 500);
  }
}
