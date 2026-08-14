import { getAuthenticatedSession, json, readJson } from "../../auth/_shared.js";
import { hasPermission } from "../../_shared/permissions.js";
import { recordEvent } from "../../_shared/events.js";

// Comando "Sposta…": sceglie direttamente l'elemento dopo cui inserire il biglietto (o "in
// cima" se afterId è assente), invece di richiedere N pressioni di su/giù. Sempre dentro lo
// stesso barattolo di appartenenza — vedi move.js per il perché non esiste cambio di jar.
export async function onRequestPost(context) {
  const { request, env, params } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.reorder")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const payload = await readJson(request);
    const afterId = payload?.afterId === null || payload?.afterId === undefined ? null : String(payload.afterId);

    const current = await env.DB.prepare("SELECT id, jar_identity, position FROM pensieri_biglietti WHERE id = ?").bind(params.id).first();
    if (!current) {
      return json({ error: "Biglietto non trovato." }, 404);
    }

    if (afterId !== null && afterId === String(current.id)) {
      return json({ error: "Un biglietto non può essere spostato dopo se stesso." }, 400);
    }

    if (afterId !== null) {
      const afterBiglietto = await env.DB.prepare("SELECT id, jar_identity FROM pensieri_biglietti WHERE id = ?").bind(afterId).first();
      if (!afterBiglietto || afterBiglietto.jar_identity !== current.jar_identity) {
        return json({ error: "L'elemento dopo cui inserire non appartiene allo stesso barattolo." }, 400);
      }
    }

    const now = new Date().toISOString();

    // 1) Chiude il vuoto lasciato dalla vecchia posizione.
    await env.DB
      .prepare("UPDATE pensieri_biglietti SET position = position - 1, updated_at = ? WHERE jar_identity = ? AND position > ?")
      .bind(now, current.jar_identity, current.position)
      .run();

    // 2) La posizione dell'elemento "dopo cui" scelto va riletta ORA (potrebbe essersi
    // appena spostata di uno per lo shift qui sopra).
    let targetPosition = 0;
    if (afterId !== null) {
      const freshAfter = await env.DB.prepare("SELECT position FROM pensieri_biglietti WHERE id = ?").bind(afterId).first();
      targetPosition = freshAfter.position + 1;
    }

    // 3) Apre lo spazio alla posizione di destinazione (il biglietto stesso è escluso: la sua
    // riga viene sistemata esplicitamente al passo 4).
    await env.DB
      .prepare("UPDATE pensieri_biglietti SET position = position + 1, updated_at = ? WHERE jar_identity = ? AND position >= ? AND id != ?")
      .bind(now, current.jar_identity, targetPosition, current.id)
      .run();

    // 4) Il biglietto prende la posizione definitiva.
    await env.DB
      .prepare("UPDATE pensieri_biglietti SET position = ?, updated_at = ? WHERE id = ?")
      .bind(targetPosition, now, current.id)
      .run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "barattolo-dei-pensieri",
      eventType: "content_updated",
      metadata: { biglioId: current.id, afterId }
    }));

    return json({ id: String(current.id), position: targetPosition });
  } catch (error) {
    console.error(JSON.stringify({ event: "pensieri_biglietti_move_to_error", message: error.message }));
    return json({ error: "Non è stato possibile spostare il biglietto." }, 500);
  }
}
