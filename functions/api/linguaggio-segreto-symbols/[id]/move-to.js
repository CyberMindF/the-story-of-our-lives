import { getAuthenticatedSession, json, readJson } from "../../auth/_shared.js";
import { hasPermission } from "../../_shared/permissions.js";
import { recordEvent } from "../../_shared/events.js";
import { categoryExists } from "../_shared.js";

// Comando "Sposta…" (inventario contenuti CMS.md, decisione #4): sceglie direttamente la
// categoria di destinazione e l'elemento dopo cui inserire il simbolo (o "in cima" se
// `afterId` è assente), invece di richiedere N pressioni di su/giù — uno spostamento dalla
// posizione 1 alla 70 resta una sola operazione. move.js resta per le correzioni vicine.
export async function onRequestPost(context) {
  const { request, env, params } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.reorder")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const payload = await readJson(request);
    const categoryId = typeof payload?.categoryId === "string" ? payload.categoryId.trim().toLowerCase() : "";
    const afterId = payload?.afterId === null || payload?.afterId === undefined ? null : String(payload.afterId);

    if (!(await categoryExists(env, categoryId))) {
      return json({ error: "Categoria di destinazione non valida." }, 400);
    }

    const current = await env.DB.prepare("SELECT id, category_id, position FROM linguaggio_segreto_symbols WHERE id = ?").bind(params.id).first();
    if (!current) {
      return json({ error: "Simbolo non trovato." }, 404);
    }

    if (afterId !== null && afterId === String(current.id)) {
      return json({ error: "Un simbolo non può essere spostato dopo se stesso." }, 400);
    }

    let afterSymbol = null;
    if (afterId !== null) {
      afterSymbol = await env.DB.prepare("SELECT id, category_id, position FROM linguaggio_segreto_symbols WHERE id = ?").bind(afterId).first();
      if (!afterSymbol || afterSymbol.category_id !== categoryId) {
        return json({ error: "L'elemento dopo cui inserire non appartiene alla categoria scelta." }, 400);
      }
    }

    const now = new Date().toISOString();
    const sameCategory = current.category_id === categoryId;

    // 1) Chiude il vuoto lasciato dalla vecchia posizione, nella vecchia categoria.
    await env.DB
      .prepare("UPDATE linguaggio_segreto_symbols SET position = position - 1, updated_at = ? WHERE category_id = ? AND position > ?")
      .bind(now, current.category_id, current.position)
      .run();

    // 2) Calcola la posizione di destinazione: se si resta nella stessa categoria, la
    // posizione dell'elemento "dopo cui" scelto va riletta ORA (potrebbe essersi appena
    // spostata di uno per lo step 1 qui sopra).
    let targetPosition = 0;
    if (afterId !== null) {
      const freshAfter = sameCategory
        ? await env.DB.prepare("SELECT position FROM linguaggio_segreto_symbols WHERE id = ?").bind(afterId).first()
        : afterSymbol;
      targetPosition = freshAfter.position + 1;
    }

    // 3) Apre lo spazio nella categoria di destinazione (il simbolo stesso è escluso: la sua
    // riga viene sistemata esplicitamente al passo 4, non dallo shift generico).
    await env.DB
      .prepare("UPDATE linguaggio_segreto_symbols SET position = position + 1, updated_at = ? WHERE category_id = ? AND position >= ? AND id != ?")
      .bind(now, categoryId, targetPosition, current.id)
      .run();

    // 4) Il simbolo prende categoria e posizione definitive.
    await env.DB
      .prepare("UPDATE linguaggio_segreto_symbols SET category_id = ?, position = ?, updated_at = ? WHERE id = ?")
      .bind(categoryId, targetPosition, now, current.id)
      .run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "linguaggio-segreto",
      eventType: "content_updated",
      metadata: { symbolId: current.id, movedToCategory: categoryId, afterId }
    }));

    return json({ id: String(current.id), categoryId, position: targetPosition });
  } catch (error) {
    console.error(JSON.stringify({ event: "linguaggio_segreto_symbols_move_to_error", message: error.message }));
    return json({ error: "Non è stato possibile spostare il simbolo." }, 500);
  }
}
