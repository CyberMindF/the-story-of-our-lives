import { getAuthenticatedSession, json } from "../auth/_shared.js";
import { recordEvent } from "../_shared/events.js";
import { notifyRealtime } from "../_shared/realtime.js";
import { normalizeRequiredText } from "../_shared/text.js";

const MAX_BODY_LENGTH = 20000;

// Segna una lettera come letta, solo se chi la apre non è chi l'ha scritta.
export async function onRequestPost(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const letterId = Number(context.params.id);
    if (!Number.isInteger(letterId)) {
      return json({ error: "Lettera non valida." }, 400);
    }

    const letter = await context.env.DB
      .prepare("SELECT id, author_id, read_at FROM letters WHERE id = ?")
      .bind(letterId)
      .first();

    if (!letter) {
      return json({ error: "Lettera non trovata." }, 404);
    }

    // L'autore non "legge" la propria lettera: la data di lettura riguarda solo l'altra persona.
    if (letter.author_id === session.user.id || letter.read_at) {
      return json({ readAt: letter.read_at });
    }

    const readAt = new Date().toISOString();
    await context.env.DB
      .prepare("UPDATE letters SET read_at = ? WHERE id = ?")
      .bind(readAt, letterId)
      .run();

    context.waitUntil(recordEvent(
      context.env,
      { userId: session.user.id, sessionId: session.sessionId },
      { section: "lettere", eventType: "letter_read", metadata: { letterId } }
    ));
    context.waitUntil(notifyRealtime(context.env, {
      type: "letters:changed",
      action: "read",
      actorUserId: session.user.id,
      letterId
    }));

    return json({ readAt });
  } catch (error) {
    console.error(JSON.stringify({ event: "letters_read_error", message: error.message }));
    return json({ error: "Errore interno del server." }, 500);
  }
}

// Modifica il testo soltanto se la lettera appartiene all'account autenticato.
export async function onRequestPut(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const letterId = Number(context.params.id);
    if (!Number.isInteger(letterId)) return json({ error: "Lettera non valida." }, 400);

    const form = await context.request.formData();
    const body = normalizeRequiredText(form.get("body"), MAX_BODY_LENGTH);
    if (!body) return json({ error: "La lettera non può essere vuota." }, 400);

    const updatedAt = new Date().toISOString();
    const result = await context.env.DB
      .prepare("UPDATE letters SET body = ?, updated_at = ? WHERE id = ? AND author_id = ?")
      .bind(body, updatedAt, letterId, session.user.id)
      .run();
    if (Number(result.meta.changes || 0) === 0) {
      const exists = await context.env.DB.prepare("SELECT id FROM letters WHERE id = ?").bind(letterId).first();
      return json({ error: exists ? "Puoi modificare soltanto le tue lettere." : "Lettera non trovata." }, exists ? 403 : 404);
    }

    context.waitUntil(recordEvent(context.env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "lettere", eventType: "letter_edited", metadata: { letterId }
    }));
    context.waitUntil(notifyRealtime(context.env, {
      type: "letters:changed", action: "updated", actorUserId: session.user.id, letterId
    }));

    return json({ saved: true, body, updatedAt });
  } catch (error) {
    console.error(JSON.stringify({ event: "letters_update_error", message: error.message }));
    return json({ error: "Non è stato possibile modificare la lettera." }, 500);
  }
}
