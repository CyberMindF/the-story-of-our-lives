import { getAuthenticatedSession, json, readJson } from "../auth/_shared.js";
import { hasPermission } from "../_shared/permissions.js";
import { recordEvent } from "../_shared/events.js";
import { normalizeCode, normalizeMeaning } from "./_shared.js";

// Editor dedicato del Linguaggio Segreto: gli esempi di frase sono una lista piatta
// indipendente dalle categorie/simboli, stesso pattern CRUD + move.js.
export async function onRequestGet(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.read")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const { results } = await context.env.DB
      .prepare("SELECT * FROM linguaggio_segreto_examples ORDER BY position")
      .all();

    return json({ examples: results.map(toExampleView) });
  } catch (error) {
    console.error(JSON.stringify({ event: "linguaggio_segreto_examples_list_error", message: error.message }));
    return json({ error: "Errore interno del server." }, 500);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.create")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const payload = await readJson(request);
    const code = normalizeCode(payload?.code);
    const meaning = normalizeMeaning(payload?.meaning);

    if (!code) return json({ error: "Codice non valido." }, 400);
    if (!meaning) return json({ error: "Significato non valido." }, 400);

    const maxId = await env.DB.prepare("SELECT MAX(id) AS max FROM linguaggio_segreto_examples").first();
    const id = (maxId?.max ?? 0) + 1;
    const maxPosition = await env.DB.prepare("SELECT MAX(position) AS max FROM linguaggio_segreto_examples").first();
    const position = (maxPosition?.max ?? -1) + 1;
    const now = new Date().toISOString();

    await env.DB
      .prepare(`
        INSERT INTO linguaggio_segreto_examples (id, code, meaning, position, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(id, code, meaning, position, session.user.id, now, now)
      .run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "linguaggio-segreto",
      eventType: "content_created",
      metadata: { exampleId: id }
    }));

    const created = await env.DB.prepare("SELECT * FROM linguaggio_segreto_examples WHERE id = ?").bind(id).first();
    return json(toExampleView(created), 201);
  } catch (error) {
    console.error(JSON.stringify({ event: "linguaggio_segreto_examples_create_error", message: error.message }));
    return json({ error: "Non è stato possibile creare l'esempio." }, 500);
  }
}

export function toExampleView(row) {
  return {
    id: String(row.id),
    code: row.code,
    meaning: row.meaning,
    position: row.position,
    updatedAt: row.updated_at
  };
}
