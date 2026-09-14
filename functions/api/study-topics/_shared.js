const MAX_TITLE_LENGTH = 120;
const MAX_CARDS = 200;
const MAX_CARD_SIDE_LENGTH = 2000;

export function normalizeTitle(value) {
  const title = typeof value === "string" ? value.trim() : "";
  return title && title.length <= MAX_TITLE_LENGTH ? title : null;
}

export function normalizeCards(value) {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_CARDS) {
    return null;
  }

  const cards = value.map((card) => ({
    question: typeof card?.question === "string" ? card.question.trim() : "",
    answer: typeof card?.answer === "string" ? card.answer.trim() : "",
  }));

  if (
    cards.some(
      (card) =>
        !card.question ||
        !card.answer ||
        card.question.length > MAX_CARD_SIDE_LENGTH ||
        card.answer.length > MAX_CARD_SIDE_LENGTH,
    )
  ) {
    return null;
  }

  return cards;
}

export function normalizeTopicId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function cardsForInsert(env, topicId, cards, now) {
  return cards.map((card, position) =>
    env.DB.prepare(
      `
      INSERT INTO study_cards (topic_id, question, answer, position, created_at)
      VALUES (?, ?, ?, ?, ?)
    `,
    ).bind(topicId, card.question, card.answer, position, now),
  );
}

export function topicsFromRows(rows) {
  const topics = new Map();

  for (const row of rows) {
    let topic = topics.get(row.topic_id);
    if (!topic) {
      topic = {
        id: row.topic_id,
        title: row.title,
        cards: [],
        createdAt: row.topic_created_at,
        updatedAt: row.topic_updated_at,
      };
      topics.set(row.topic_id, topic);
    }

    if (row.card_id !== null) {
      topic.cards.push({
        id: row.card_id,
        question: row.question,
        answer: row.answer,
        position: row.position,
      });
    }
  }

  return [...topics.values()];
}

export const TOPIC_WITH_CARDS_SELECT = `
  SELECT
    topics.id AS topic_id,
    topics.title,
    topics.created_at AS topic_created_at,
    topics.updated_at AS topic_updated_at,
    cards.id AS card_id,
    cards.question,
    cards.answer,
    cards.position
  FROM study_topics AS topics
  LEFT JOIN study_cards AS cards ON cards.topic_id = topics.id
`;
