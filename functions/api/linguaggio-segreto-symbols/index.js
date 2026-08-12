import { getAuthenticatedSession, json, readJson } from "../auth/_shared.js";
import { hasPermission } from "../_shared/permissions.js";
import { recordEvent } from "../_shared/events.js";
import { categoryExists, normalizeExplanation, normalizeMeaning, normalizeSymbol } from "./_shared.js";

// Editor dedicato del Linguaggio Segreto: i simboli sono annidati sotto una categoria
// (`category_id` + `position` scoped alla categoria, non globale). La lista arriva già ordinata
// per categoria e poi per posizione, così il client può raggrupparla senza logica aggiuntiva.
export async function onRequestGet(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.read")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const { results } = await context.env.DB
      .prepare("SELECT * FROM linguaggio_segreto_symbols ORDER BY category_id, position")
      .all();

    return json({ symbols: results.map(toSymbolView) });
  } catch (error) {
    console.error(JSON.stringify({ event: "linguaggio_segreto_symbols_list_error", message: error.message }));
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
    const categoryId = typeof payload?.categoryId === "string" ? payload.categoryId.trim().toLowerCase() : "";
    const symbol = normalizeSymbol(payload?.symbol);
    const meaning = normalizeMeaning(payload?.meaning);
    const explanation = normalizeExplanation(payload?.explanation);

    if (!(await categoryExists(env, categoryId))) return json({ error: "Categoria non valida." }, 400);
    if (!symbol) return json({ error: "Simbolo non valido." }, 400);
    if (!meaning) return json({ error: "Significato non valido." }, 400);
    if (explanation === undefined) return json({ error: "Spiegazione non valida." }, 400);

    const maxId = await env.DB.prepare("SELECT MAX(id) AS max FROM linguaggio_segreto_symbols").first();
    const id = (maxId?.max ?? 0) + 1;
    const maxPosition = await env.DB
      .prepare("SELECT MAX(position) AS max FROM linguaggio_segreto_symbols WHERE category_id = ?")
      .bind(categoryId)
      .first();
    const position = (maxPosition?.max ?? -1) + 1;
    const now = new Date().toISOString();

    await env.DB
      .prepare(`
        INSERT INTO linguaggio_segreto_symbols
          (id, category_id, symbol, meaning, explanation, position, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(id, categoryId, symbol, meaning, explanation, position, session.user.id, now, now)
      .run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "linguaggio-segreto",
      eventType: "content_created",
      metadata: { symbolId: id, categoryId }
    }));

    const created = await env.DB.prepare("SELECT * FROM linguaggio_segreto_symbols WHERE id = ?").bind(id).first();
    return json(toSymbolView(created), 201);
  } catch (error) {
    console.error(JSON.stringify({ event: "linguaggio_segreto_symbols_create_error", message: error.message }));
    return json({ error: "Non è stato possibile creare il simbolo." }, 500);
  }
}

export function toSymbolView(row) {
  return {
    id: String(row.id),
    categoryId: row.category_id,
    symbol: row.symbol,
    meaning: row.meaning,
    explanation: row.explanation,
    position: row.position,
    updatedAt: row.updated_at
  };
}
