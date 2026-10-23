import { getAuthenticatedSession, json, readJson } from "../../auth/_shared.js";
import { recordEvent } from "../../_shared/events.js";
import { readBustineState } from "../../carte-bustine/_shared.js";

export async function onRequestPost(context) {
  const { request, env, params } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const payload = await readJson(request);
    const candidateId = Number(payload?.candidateId);
    if (!Number.isInteger(candidateId) || candidateId <= 0) return json({ error: "Carta non valida." }, 400);

    const candidate = await env.DB
      .prepare(
        `SELECT o.id AS offerta_id, c.id AS candidato_id, c.design_id, c.finitura,
                d.nome AS design_nome, d.immagine_key
         FROM carte_evocazioni_offerte o
         JOIN carte_evocazioni_candidati c ON c.offerta_id = o.id
         JOIN carte_designs d ON d.id = c.design_id
         JOIN carte_sets s ON s.id = d.set_id
         WHERE o.id = ? AND o.user_id = ? AND o.stato = 'aperta' AND c.id = ?
           AND COALESCE(s.tipo, 'normale') = 'tarocchi'`
      )
      .bind(params.id, session.user.id, candidateId)
      .first();
    if (!candidate) return json({ error: "Questa evocazione non è più disponibile." }, 409);

    // L'UPDATE condizionale prenota atomicamente la scelta: due click o richieste parallele
    // non possono assegnare due carte dalla stessa evocazione.
    const claimed = await env.DB
      .prepare(
        `UPDATE carte_evocazioni_offerte SET stato = 'scelta'
         WHERE id = ? AND user_id = ? AND stato = 'aperta'
         RETURNING id`
      )
      .bind(params.id, session.user.id)
      .first();
    if (!claimed) return json({ error: "Hai già scelto una carta da questa evocazione." }, 409);

    try {
      await env.DB
        .prepare(
          `INSERT INTO carte_definizioni (design_id, finitura)
           VALUES (?, ?) ON CONFLICT(design_id, finitura) DO NOTHING`
        )
        .bind(candidate.design_id, candidate.finitura)
        .run();
      const definition = await env.DB
        .prepare("SELECT id FROM carte_definizioni WHERE design_id = ? AND finitura = ?")
        .bind(candidate.design_id, candidate.finitura)
        .first();
      if (!definition) throw new Error("Definizione del Tarocco non disponibile.");

      const now = new Date().toISOString();
      await env.DB.batch([
        env.DB
          .prepare(
            `INSERT INTO carte_possesso (user_id, carta_definizione_id, quantita, updated_at)
             VALUES (?, ?, 1, ?)
             ON CONFLICT(user_id, carta_definizione_id)
             DO UPDATE SET quantita = quantita + 1, updated_at = excluded.updated_at`
          )
          .bind(session.user.id, definition.id, now),
        env.DB.prepare("DELETE FROM carte_evocazioni_offerte WHERE id = ?").bind(params.id)
      ]);

      context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
        section: "carte",
        eventType: "carte_arcano_scelto",
        metadata: { designId: candidate.design_id, finitura: candidate.finitura }
      }));
      const state = await readBustineState(env, session.user.id);
      return json({
        carta: {
          id: String(definition.id),
          designId: String(candidate.design_id),
          designNome: candidate.design_nome,
          immagineKey: candidate.immagine_key,
          finitura: candidate.finitura
        },
        evocazioniDisponibili: state.evocazioniDisponibili
      });
    } catch (error) {
      await env.DB
        .prepare("UPDATE carte_evocazioni_offerte SET stato = 'aperta' WHERE id = ? AND user_id = ?")
        .bind(params.id, session.user.id)
        .run();
      throw error;
    }
  } catch (error) {
    console.error(JSON.stringify({ event: "carte_evocazione_scegli_error", message: error.message }));
    return json({ error: "Non è stato possibile conservare il Tarocco." }, 500);
  }
}
