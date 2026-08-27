import { getAuthenticatedSession, json } from "../auth/_shared.js";
import { recordEvent } from "../_shared/events.js";
import { notifyRealtime } from "../_shared/realtime.js";

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
