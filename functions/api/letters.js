import { getAuthenticatedSession, json } from "./auth/_shared.js";

const MAX_BODY_LENGTH = 20000;

// Elenca tutte le lettere (sono solo in due: nessun filtro per destinatario).
export async function onRequestGet(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const result = await context.env.DB
      .prepare(`
        SELECT letters.id, letters.author_id, users.nickname AS author_nickname,
               letters.body, letters.created_at, letters.read_at
        FROM letters
        INNER JOIN users ON users.id = letters.author_id
        ORDER BY letters.created_at DESC, letters.id DESC
      `)
      .all();

    const letters = result.results.map((row) => ({
      id: row.id,
      author: row.author_nickname,
      isMine: row.author_id === session.user.id,
      body: row.body,
      createdAt: row.created_at,
      readAt: row.read_at
    }));

    return json({ letters });
  } catch (error) {
    console.error(JSON.stringify({ event: "letters_get_error", message: error.message }));
    return json({ error: "Errore interno del server." }, 500);
  }
}

// Scrive una nuova lettera autenticata.
export async function onRequestPost(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const body = await context.request.formData();
    const text = normalizeRequiredText(body.get("body"), MAX_BODY_LENGTH);
    if (!text) {
      return json({ error: "Scrivi qualcosa prima di inviare." }, 400);
    }

    const createdAt = new Date().toISOString();
    const result = await context.env.DB
      .prepare("INSERT INTO letters (author_id, body, created_at) VALUES (?, ?, ?)")
      .bind(session.user.id, text, createdAt)
      .run();

    return json(
      { saved: true, letterId: result.meta.last_row_id, author: session.user.nickname, createdAt },
      201
    );
  } catch (error) {
    console.error(JSON.stringify({ event: "letters_post_error", message: error.message }));
    return json({ error: "Non è stato possibile salvare la lettera." }, 500);
  }
}

function normalizeRequiredText(value, maxLength) {
  if (typeof value !== "string") return "";
  const normalized = value.trim();
  return normalized.length <= maxLength ? normalized : "";
}
