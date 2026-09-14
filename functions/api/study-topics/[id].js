import { getAuthenticatedSession, json, readJson } from "../auth/_shared.js";
import { recordEvent } from "../_shared/events.js";
import {
  cardsForInsert,
  normalizeCards,
  normalizeTitle,
  normalizeTopicId,
} from "./_shared.js";

export async function onRequestPut(context) {
  const { request, env, params } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const topicId = normalizeTopicId(params.id);
    if (!topicId) return json({ error: "Argomento non valido." }, 400);
    const ownedTopic = await env.DB.prepare(
      "SELECT id FROM study_topics WHERE id = ? AND user_id = ?",
    )
      .bind(topicId, session.user.id)
      .first();
    if (!ownedTopic) return json({ error: "Argomento non trovato." }, 404);

    const payload = await readJson(request);
    const title = normalizeTitle(payload?.title);
    const cards = normalizeCards(payload?.cards);
    if (!title) return json({ error: "Il titolo non è valido." }, 400);
    if (!cards) return json({ error: "Le flash card non sono valide." }, 400);

    const now = new Date().toISOString();
    await env.DB.batch([
      env.DB.prepare(
        "UPDATE study_topics SET title = ?, updated_at = ? WHERE id = ? AND user_id = ?",
      ).bind(title, now, topicId, session.user.id),
      env.DB.prepare("DELETE FROM study_cards WHERE topic_id = ?").bind(
        topicId,
      ),
      ...cardsForInsert(env, topicId, cards, now),
    ]);

    context.waitUntil(
      recordEvent(
        env,
        { userId: session.user.id, sessionId: session.sessionId },
        {
          section: "aula-studio",
          eventType: "content_updated",
          metadata: { topicId, cardCount: cards.length },
        },
      ),
    );

    return json({ id: topicId, title, cards, updatedAt: now });
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "study_topics_update_error",
        message: error.message,
      }),
    );
    return json({ error: "Non è stato possibile salvare l'argomento." }, 500);
  }
}

export async function onRequestDelete(context) {
  const { request, env, params } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const topicId = normalizeTopicId(params.id);
    if (!topicId) return json({ error: "Argomento non valido." }, 400);
    const result = await env.DB.prepare(
      "DELETE FROM study_topics WHERE id = ? AND user_id = ?",
    )
      .bind(topicId, session.user.id)
      .run();
    if (Number(result.meta.changes || 0) === 0) {
      return json({ error: "Argomento non trovato." }, 404);
    }

    context.waitUntil(
      recordEvent(
        env,
        { userId: session.user.id, sessionId: session.sessionId },
        {
          section: "aula-studio",
          eventType: "content_deleted",
          metadata: { topicId },
        },
      ),
    );

    return json({ deleted: true });
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "study_topics_delete_error",
        message: error.message,
      }),
    );
    return json({ error: "Non è stato possibile eliminare l'argomento." }, 500);
  }
}
