import { getAuthenticatedSession, json, readJson } from "../../auth/_shared.js";
import { hasPermission } from "../../_shared/permissions.js";
import { recordEvent } from "../../_shared/events.js";
import { daySlugExists, periodExists } from "../_shared.js";

// Comando "Sposta…" (requisito esplicito di Rory per "Aggiungi giorno"/riordino grande):
// sceglie periodo di destinazione ed elemento dopo cui inserire (o "in cima" se `afterId` è
// assente) — stesso schema di /api/linguaggio-segreto-symbols/:id/move-to.
export async function onRequestPost(context) {
  const { request, env, params } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.reorder")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const payload = await readJson(request);
    const periodId = typeof payload?.periodId === "string" ? payload.periodId.trim().toLowerCase() : "";
    const afterId = payload?.afterId === null || payload?.afterId === undefined ? null : String(payload.afterId);

    if (!(await periodExists(env, periodId))) {
      return json({ error: "Periodo di destinazione non valido." }, 400);
    }

    const current = await env.DB.prepare("SELECT id, period_id, slug, position FROM bacheca_days WHERE id = ?").bind(params.id).first();
    if (!current) {
      return json({ error: "Giorno non trovato." }, 404);
    }
    if (current.period_id !== periodId && await daySlugExists(env, periodId, current.slug, current.id)) {
      return json({ error: "Nel periodo di destinazione esiste già un giorno con questo slug." }, 409);
    }

    if (afterId !== null && afterId === String(current.id)) {
      return json({ error: "Un giorno non può essere spostato dopo se stesso." }, 400);
    }

    let afterDay = null;
    if (afterId !== null) {
      afterDay = await env.DB.prepare("SELECT id, period_id, position FROM bacheca_days WHERE id = ?").bind(afterId).first();
      if (!afterDay || afterDay.period_id !== periodId) {
        return json({ error: "L'elemento dopo cui inserire non appartiene al periodo scelto." }, 400);
      }
    }

    const now = new Date().toISOString();
    const samePeriod = current.period_id === periodId;

    await env.DB
      .prepare("UPDATE bacheca_days SET position = position - 1, updated_at = ? WHERE period_id = ? AND position > ?")
      .bind(now, current.period_id, current.position)
      .run();

    let targetPosition = 0;
    if (afterId !== null) {
      const freshAfter = samePeriod
        ? await env.DB.prepare("SELECT position FROM bacheca_days WHERE id = ?").bind(afterId).first()
        : afterDay;
      targetPosition = freshAfter.position + 1;
    }

    await env.DB
      .prepare("UPDATE bacheca_days SET position = position + 1, updated_at = ? WHERE period_id = ? AND position >= ? AND id != ?")
      .bind(now, periodId, targetPosition, current.id)
      .run();

    await env.DB
      .prepare("UPDATE bacheca_days SET period_id = ?, position = ?, updated_at = ? WHERE id = ?")
      .bind(periodId, targetPosition, now, current.id)
      .run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "bacheca",
      eventType: "content_updated",
      metadata: { dayId: current.id, movedToPeriod: periodId, afterId }
    }));

    return json({ id: String(current.id), periodId, position: targetPosition });
  } catch (error) {
    console.error(JSON.stringify({ event: "bacheca_days_move_to_error", message: error.message }));
    return json({ error: "Non è stato possibile spostare il giorno." }, 500);
  }
}
