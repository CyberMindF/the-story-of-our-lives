import { getAuthenticatedSession, json, readJson } from "../auth/_shared.js";
import { hasPermission } from "../_shared/permissions.js";
import { recordEvent } from "../_shared/events.js";
import { normalizeCode, normalizeMeaning } from "./_shared.js";
import { toExampleView } from "./index.js";

export async function onRequestPut(context) {
  const { request, env, params } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.edit")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const existing = await env.DB.prepare("SELECT id FROM linguaggio_segreto_examples WHERE id = ?").bind(params.id).first();
    if (!existing) {
      return json({ error: "Esempio non trovato." }, 404);
    }

    const payload = await readJson(request);
    const code = normalizeCode(payload?.code);
    const meaning = normalizeMeaning(payload?.meaning);

    if (!code) return json({ error: "Codice non valido." }, 400);
    if (!meaning) return json({ error: "Significato non valido." }, 400);

    const now = new Date().toISOString();
    await env.DB
      .prepare("UPDATE linguaggio_segreto_examples SET code = ?, meaning = ?, updated_at = ? WHERE id = ?")
      .bind(code, meaning, now, params.id)
      .run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "linguaggio-segreto",
      eventType: "content_updated",
      metadata: { exampleId: params.id }
    }));

    const updated = await env.DB.prepare("SELECT * FROM linguaggio_segreto_examples WHERE id = ?").bind(params.id).first();
    return json(toExampleView(updated));
  } catch (error) {
    console.error(JSON.stringify({ event: "linguaggio_segreto_examples_update_error", message: error.message }));
    return json({ error: "Non è stato possibile salvare l'esempio." }, 500);
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

    const existing = await env.DB.prepare("SELECT id FROM linguaggio_segreto_examples WHERE id = ?").bind(params.id).first();
    if (!existing) {
      return json({ error: "Esempio non trovato." }, 404);
    }

    await env.DB.prepare("DELETE FROM linguaggio_segreto_examples WHERE id = ?").bind(params.id).run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "linguaggio-segreto",
      eventType: "content_deleted",
      metadata: { exampleId: params.id }
    }));

    return json({ id: params.id, deleted: true });
  } catch (error) {
    console.error(JSON.stringify({ event: "linguaggio_segreto_examples_delete_error", message: error.message }));
    return json({ error: "Non è stato possibile eliminare l'esempio." }, 500);
  }
}
