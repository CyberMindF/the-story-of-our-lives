import { getAuthenticatedSession, json } from "../auth/_shared.js";
import { recordEvent } from "../_shared/events.js";
import { accrueBustine, rollFinitura } from "./_shared.js";

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
    const state = await accrueBustine(env, userId);
    if (state.quantitaDisponibile < 1) {
      return json({ error: "Nessuna bustina disponibile." }, 409);
    }

    const { results: designs } = await env.DB.prepare("SELECT id FROM carte_designs").all();
    if (designs.length === 0) {
      return json({ error: "Nessuna carta disponibile al momento." }, 409);
    }

    const now = new Date().toISOString();
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
        .prepare("UPDATE carte_bustine SET quantita_disponibile = quantita_disponibile - 1, updated_at = ? WHERE user_id = ?")
        .bind(now, userId)
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
      metadata: { definizioneIds: drawn }
    }));

    const placeholders = drawn.map(() => "?").join(", ");
    const { results: cards } = await env.DB
      .prepare(
        `SELECT cd.id AS id, cd.finitura AS finitura, des.id AS design_id, des.nome AS design_nome,
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
        immagineKey: card.immagine_key
      };
    });

    return json({ carte: orderedCards, quantitaDisponibile: state.quantitaDisponibile - 1 });
  } catch (error) {
    console.error(JSON.stringify({ event: "carte_bustine_apri_error", message: error.message }));
    return json({ error: "Non è stato possibile aprire la bustina." }, 500);
  }
}
