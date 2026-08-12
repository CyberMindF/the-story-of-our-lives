import { getAuthenticatedSession, json, readJson } from "../auth/_shared.js";
import { hasPermission } from "../_shared/permissions.js";
import { recordEvent } from "../_shared/events.js";
import { normalizeExplanation, normalizeMeaning, normalizeSymbol } from "./_shared.js";
import { toSymbolView } from "./index.js";

// Modifica solo il testo del simbolo (categoria e posizione restano invariate: per spostarlo
// altrove ci sono move.js e move-to.js, non questo endpoint).
export async function onRequestPut(context) {
  const { request, env, params } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.edit")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const existing = await env.DB.prepare("SELECT id FROM linguaggio_segreto_symbols WHERE id = ?").bind(params.id).first();
    if (!existing) {
      return json({ error: "Simbolo non trovato." }, 404);
    }

    const payload = await readJson(request);
    const symbol = normalizeSymbol(payload?.symbol);
    const meaning = normalizeMeaning(payload?.meaning);
    const explanation = normalizeExplanation(payload?.explanation);

    if (!symbol) return json({ error: "Simbolo non valido." }, 400);
    if (!meaning) return json({ error: "Significato non valido." }, 400);
    if (explanation === undefined) return json({ error: "Spiegazione non valida." }, 400);

    const now = new Date().toISOString();
    await env.DB
      .prepare("UPDATE linguaggio_segreto_symbols SET symbol = ?, meaning = ?, explanation = ?, updated_at = ? WHERE id = ?")
      .bind(symbol, meaning, explanation, now, params.id)
      .run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "linguaggio-segreto",
      eventType: "content_updated",
      metadata: { symbolId: params.id }
    }));

    const updated = await env.DB.prepare("SELECT * FROM linguaggio_segreto_symbols WHERE id = ?").bind(params.id).first();
    return json(toSymbolView(updated));
  } catch (error) {
    console.error(JSON.stringify({ event: "linguaggio_segreto_symbols_update_error", message: error.message }));
    return json({ error: "Non è stato possibile salvare il simbolo." }, 500);
  }
}

export async function onRequestDelete(context) {
  const { env, params } = context;
  try {
    const session = await getAuthenticatedSession(context.request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.delete")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const existing = await env.DB.prepare("SELECT id FROM linguaggio_segreto_symbols WHERE id = ?").bind(params.id).first();
    if (!existing) {
      return json({ error: "Simbolo non trovato." }, 404);
    }

    await env.DB.prepare("DELETE FROM linguaggio_segreto_symbols WHERE id = ?").bind(params.id).run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "linguaggio-segreto",
      eventType: "content_deleted",
      metadata: { symbolId: params.id }
    }));

    return json({ id: params.id, deleted: true });
  } catch (error) {
    console.error(JSON.stringify({ event: "linguaggio_segreto_symbols_delete_error", message: error.message }));
    return json({ error: "Non è stato possibile eliminare il simbolo." }, 500);
  }
}
