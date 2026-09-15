import { getAuthenticatedSession, json, readJson } from "../auth/_shared.js";
import { recordEvent } from "../_shared/events.js";
import {
  TOPIC_WITH_CARDS_SELECT,
  cardsForInsert,
  normalizeCards,
  normalizeTitle,
  topicsFromRows,
} from "./_shared.js";

// L'Aula è un unico spazio condiviso: qualunque utente autenticato vede gli stessi argomenti.
export async function onRequestGet(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const { results } = await context.env.DB.prepare(
      `${TOPIC_WITH_CARDS_SELECT}
        ORDER BY topics.updated_at DESC, topics.id DESC, cards.position ASC`,
    ).all();

    return json({ topics: topicsFromRows(results) });
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "study_topics_list_error",
        message: error.message,
      }),
    );
    return json(
      { error: "Non è stato possibile caricare gli argomenti." },
      500,
    );
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const payload = await readJson(request);
    const title = normalizeTitle(payload?.title);
    const cards = normalizeCards(payload?.cards);
    if (!title) return json({ error: "Il titolo non è valido." }, 400);
    if (!cards) return json({ error: "Le flash card non sono valide." }, 400);

    const now = new Date().toISOString();
    const inserted = await env.DB.prepare(
      "INSERT INTO study_topics (user_id, title, created_at, updated_at) VALUES (?, ?, ?, ?)",
    )
      .bind(session.user.id, title, now, now)
      .run();
    const topicId = inserted.meta.last_row_id;
    await env.DB.batch(cardsForInsert(env, topicId, cards, now));

    context.waitUntil(
      recordEvent(
        env,
        { userId: session.user.id, sessionId: session.sessionId },
        {
          section: "aula-studio",
          eventType: "content_created",
          metadata: { topicId, cardCount: cards.length },
        },
      ),
    );

    return json(
      { id: topicId, title, cards, createdAt: now, updatedAt: now },
      201,
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "study_topics_create_error",
        message: error.message,
      }),
    );
    return json({ error: "Non è stato possibile creare l'argomento." }, 500);
  }
}
