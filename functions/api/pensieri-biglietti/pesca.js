import { getAuthenticatedSession, json } from "../auth/_shared.js";
import { recordEvent } from "../_shared/events.js";

// Pesca dal proprio barattolo (jar_identity = identità della sessione, non si può scegliere).
// Coda mobile di esclusione: le ultime min(10, attivi-1) estrazioni per quel barattolo sono
// escluse dai candidati, così l'ultima manciata pescata non ricompare subito. Se il barattolo
// ha meno di 11 biglietti attivi la coda si riduce automaticamente, per lasciare sempre almeno
// un candidato. Tra i candidati, casualità pesata verso i meno pescati (mai deterministica).
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const jarIdentity = session.user.identity;

    const { results: active } = await env.DB
      .prepare("SELECT id, draw_count FROM pensieri_biglietti WHERE jar_identity = ? AND is_active = 1")
      .bind(jarIdentity)
      .all();

    if (active.length === 0) {
      return json({ error: "Il barattolo è vuoto." }, 409);
    }

    const queueLen = Math.min(10, active.length - 1);
    let excludedIds = new Set();
    if (queueLen > 0) {
      const { results: recent } = await env.DB
        .prepare("SELECT biglietto_id FROM pensieri_estrazioni WHERE jar_identity = ? ORDER BY id DESC LIMIT ?")
        .bind(jarIdentity, queueLen)
        .all();
      excludedIds = new Set(recent.map((row) => row.biglietto_id));
    }

    let candidates = active.filter((row) => !excludedIds.has(row.id));
    if (candidates.length === 0) {
      candidates = active;
    }

    const weights = candidates.map((row) => 1 / Math.sqrt(row.draw_count + 1));
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let roll = Math.random() * totalWeight;
    let picked = candidates[candidates.length - 1];
    for (let i = 0; i < candidates.length; i++) {
      roll -= weights[i];
      if (roll <= 0) {
        picked = candidates[i];
        break;
      }
    }

    const now = new Date().toISOString();
    await env.DB.batch([
      env.DB
        .prepare("INSERT INTO pensieri_estrazioni (jar_identity, biglietto_id, drawn_by, drawn_at) VALUES (?, ?, ?, ?)")
        .bind(jarIdentity, picked.id, session.user.id, now),
      env.DB
        .prepare("UPDATE pensieri_biglietti SET draw_count = draw_count + 1, updated_at = ? WHERE id = ?")
        .bind(now, picked.id)
    ]);

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "barattolo-dei-pensieri",
      eventType: "barattolo_biglietto_pescato",
      metadata: { biglioId: picked.id }
    }));

    const biglietto = await env.DB.prepare("SELECT id, text, title FROM pensieri_biglietti WHERE id = ?").bind(picked.id).first();
    return json({ id: String(biglietto.id), text: biglietto.text, title: biglietto.title });
  } catch (error) {
    console.error(JSON.stringify({ event: "pensieri_biglietti_pesca_error", message: error.message }));
    return json({ error: "Non è stato possibile pescare un biglietto." }, 500);
  }
}
