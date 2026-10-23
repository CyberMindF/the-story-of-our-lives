import { getAuthenticatedSession, json } from "../auth/_shared.js";
import { recordEvent } from "../_shared/events.js";
import { readBustineState, rollFinitura } from "./_shared.js";

// Apertura di 1 bustina = 5 carte. Il design pescato è uniforme tra tutti i design esistenti
// (in tutti i set attivi); la finitura di ciascuna carta segue la piramide ripida pesata
// (vedi rollFinitura). Logica di estrazione separata dalla presentazione (nessuna animazione
// qui, solo dati): il componente client che mostra il reveal potrà cambiare senza toccare
// questo endpoint, come da design doc.
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const userId = session.user.id;
    const state = await readBustineState(env, userId);
    if (state.quantitaDisponibile < 1) {
      return json({ error: "Nessuna bustina disponibile." }, 409);
    }

    const { results: designs } = await env.DB
      .prepare(
        `SELECT des.id
         FROM carte_designs des
         JOIN carte_sets s ON s.id = des.set_id
         WHERE COALESCE(s.tipo, 'normale') = 'normale'`
      )
      .all();
    if (designs.length === 0) {
      return json({ error: "Nessuna carta disponibile al momento." }, 409);
    }

    const now = new Date().toISOString();
    // Un'evocazione ha il 20% di probabilita per bustina. Dopo sette aperture consecutive
    // senza trovarne una, l'ottava e garantita: il contatore viene restituito alla UI, che
    // puo quindi dichiarare con precisione entro quante bustine arrivera la prossima.
    const evocazioneOttenuta = state.bustineSenzaEvocazione >= 7 || Math.random() < 0.20;
    const evocazioniDisponibili = state.evocazioniDisponibili + (evocazioneOttenuta ? 1 : 0);
    const bustineSenzaEvocazione = evocazioneOttenuta ? 0 : state.bustineSenzaEvocazione + 1;
    const drawn = [];
    for (let i = 0; i < 5; i++) {
      const design = designs[Math.floor(Math.random() * designs.length)];
      const finitura = rollFinitura();

      let definizione = await env.DB
        .prepare("SELECT id FROM carte_definizioni WHERE design_id = ? AND finitura = ?")
        .bind(design.id, finitura)
        .first();
      if (!definizione) {
        const inserted = await env.DB
          .prepare("INSERT INTO carte_definizioni (design_id, finitura) VALUES (?, ?) RETURNING id")
          .bind(design.id, finitura)
          .first();
        definizione = inserted;
      }
      drawn.push(definizione.id);
    }

    const statements = [
      env.DB
        .prepare(
          `UPDATE carte_bustine
           SET quantita_disponibile = quantita_disponibile - 1,
               evocazioni_disponibili = ?, bustine_senza_evocazione = ?, updated_at = ?
           WHERE user_id = ?`
        )
        .bind(evocazioniDisponibili, bustineSenzaEvocazione, now, userId)
    ];
    for (const definizioneId of drawn) {
      statements.push(
        env.DB
          .prepare(
            `INSERT INTO carte_possesso (user_id, carta_definizione_id, quantita, updated_at)
             VALUES (?, ?, 1, ?)
             ON CONFLICT(user_id, carta_definizione_id)
             DO UPDATE SET quantita = quantita + 1, updated_at = excluded.updated_at`
          )
          .bind(userId, definizioneId, now)
      );
    }
    await env.DB.batch(statements);

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "carte",
      eventType: "carte_bustina_aperta",
      metadata: { definizioneIds: drawn, evocazioneOttenuta }
    }));

    const placeholders = drawn.map(() => "?").join(", ");
    const { results: cards } = await env.DB
      .prepare(
        `SELECT cd.id AS id, cd.finitura AS finitura, des.id AS design_id, des.nome AS design_nome,
                des.formato AS formato,
                COALESCE(cd.immagine_key, des.immagine_key) AS immagine_key
         FROM carte_definizioni cd
         JOIN carte_designs des ON des.id = cd.design_id
         WHERE cd.id IN (${placeholders})`
      )
      .bind(...drawn)
      .all();
    const byId = new Map(cards.map((card) => [card.id, card]));
    const orderedCards = drawn.map((id) => {
      const card = byId.get(id);
      return {
        id: String(card.id),
        finitura: card.finitura,
        designId: String(card.design_id),
        designNome: card.design_nome,
        formato: card.formato ?? "classica",
        immagineKey: card.immagine_key
      };
    });

    return json({
      carte: orderedCards,
      quantitaDisponibile: state.quantitaDisponibile - 1,
      evocazioneOttenuta,
      evocazioniDisponibili,
      bustineSenzaEvocazione
    });
  } catch (error) {
    console.error(JSON.stringify({ event: "carte_bustine_apri_error", message: error.message }));
    return json({ error: "Non è stato possibile aprire la bustina." }, 500);
  }
}
