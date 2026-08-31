import { getAuthenticatedSession, json } from "../auth/_shared.js";

const MAX_BODY_LENGTH = 20000;

export async function onRequestGet(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const draft = await context.env.DB
      .prepare("SELECT body, updated_at FROM letter_drafts WHERE user_id = ?")
      .bind(session.user.id)
      .first();
    return json({ body: draft?.body ?? "", updatedAt: draft?.updated_at ?? null });
  } catch (error) {
    console.error(JSON.stringify({ event: "letter_draft_get_error", message: error.message }));
    return json({ error: "Non è stato possibile recuperare la bozza." }, 500);
  }
}

export async function onRequestPut(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const form = await context.request.formData();
    const value = form.get("body");
    if (typeof value !== "string" || value.length > MAX_BODY_LENGTH) {
      return json({ error: "Bozza non valida." }, 400);
    }

    if (!value) {
      await context.env.DB.prepare("DELETE FROM letter_drafts WHERE user_id = ?").bind(session.user.id).run();
      return json({ saved: true, updatedAt: null });
    }

    const updatedAt = new Date().toISOString();
    await context.env.DB
      .prepare(`
        INSERT INTO letter_drafts (user_id, body, updated_at) VALUES (?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET body = excluded.body, updated_at = excluded.updated_at
      `)
      .bind(session.user.id, value, updatedAt)
      .run();
    return json({ saved: true, updatedAt });
  } catch (error) {
    console.error(JSON.stringify({ event: "letter_draft_put_error", message: error.message }));
    return json({ error: "Non è stato possibile salvare la bozza." }, 500);
  }
}
