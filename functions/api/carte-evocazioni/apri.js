import { getAuthenticatedSession, json } from "../auth/_shared.js";
import { recordEvent } from "../_shared/events.js";
import { ensureBustineState } from "../carte-bustine/_shared.js";
import { readOpenOffer, rollArcanoFinitura } from "./_shared.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const existing = await readOpenOffer(env, session.user.id);
    if (existing) {
      const state = await ensureBustineState(env, session.user.id);
      return json({ offerta: existing, evocazioniDisponibili: state.evocazioniDisponibili });
    }

    const state = await ensureBustineState(env, session.user.id);
    if (state.evocazioniDisponibili < 1) return json({ error: "Non hai evocazioni disponibili." }, 409);

    const { results: designs } = await env.DB
      .prepare(
        `SELECT d.id
         FROM carte_designs d
         JOIN carte_sets s ON s.id = d.set_id
         WHERE COALESCE(s.tipo, 'normale') = 'tarocchi'
         ORDER BY RANDOM()
         LIMIT 3`
      )
      .all();
    if (designs.length === 0) return json({ error: "Non ci sono ancora Tarocchi da evocare." }, 409);

    const offerId = crypto.randomUUID();
    const now = new Date().toISOString();
    const statements = [
      env.DB
        .prepare("UPDATE carte_bustine SET evocazioni_disponibili = evocazioni_disponibili - 1, updated_at = ? WHERE user_id = ?")
        .bind(now, session.user.id),
      env.DB
        .prepare("INSERT INTO carte_evocazioni_offerte (id, user_id, stato, created_at) VALUES (?, ?, 'aperta', ?)")
        .bind(offerId, session.user.id, now)
    ];
    designs.forEach((design, position) => {
      statements.push(
        env.DB
          .prepare(
            `INSERT INTO carte_evocazioni_candidati (offerta_id, design_id, finitura, position)
             VALUES (?, ?, ?, ?)`
          )
          .bind(offerId, design.id, rollArcanoFinitura(), position)
      );
    });
    await env.DB.batch(statements);

    const offerta = await readOpenOffer(env, session.user.id);
    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "carte",
      eventType: "carte_evocazione_aperta",
      metadata: { offertaId: offerId }
    }));
    return json({ offerta, evocazioniDisponibili: state.evocazioniDisponibili - 1 }, 201);
  } catch (error) {
    console.error(JSON.stringify({ event: "carte_evocazione_apri_error", message: error.message }));
    return json({ error: "Non è stato possibile aprire l'evocazione." }, 500);
  }
}
