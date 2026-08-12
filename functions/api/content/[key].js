import { getAuthenticatedSession, json, readJson } from "../auth/_shared.js";
import { hasPermission } from "../_shared/permissions.js";
import { recordEvent } from "../_shared/events.js";
import { normalizeBody } from "./_shared.js";

// Legge un contenuto per chiave. In modalità "history" restituisce anche l'elenco leggero delle
// versioni (id + data), così il frontend costruisce il selettore senza un muro di testo; il
// corpo di una versione specifica arriva solo passando ?versionId=.
export async function onRequestGet(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.read")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const entry = await fetchEntry(context.env, context.params.key);
    if (!entry) {
      return json({ error: "Contenuto non trovato." }, 404);
    }

    const response = {
      id: entry.id,
      contentKey: entry.content_key,
      label: entry.label,
      contentType: entry.content_type,
      versioningMode: entry.versioning_mode,
      updatedAt: entry.updated_at
    };

    if (entry.versioning_mode === "history") {
      const { results } = await context.env.DB
        .prepare("SELECT id, created_at FROM content_versions WHERE entry_id = ? ORDER BY created_at")
        .bind(entry.id)
        .all();
      response.versions = results.map((row) => ({ id: row.id, createdAt: row.created_at }));

      const requestedVersionId = Number(new URL(context.request.url).searchParams.get("versionId"));
      const versionId = Number.isInteger(requestedVersionId) && requestedVersionId > 0
        ? requestedVersionId
        : entry.current_version_id;

      const version = versionId
        ? await context.env.DB
          .prepare("SELECT id, body, created_at FROM content_versions WHERE id = ? AND entry_id = ?")
          .bind(versionId, entry.id)
          .first()
        : null;

      if (!version) {
        return json({ error: "Versione non trovata." }, 404);
      }

      response.currentVersionId = entry.current_version_id;
      response.versionId = version.id;
      response.body = version.body;
      response.versionCreatedAt = version.created_at;
    } else {
      response.body = entry.body;
    }

    return json(response);
  } catch (error) {
    console.error(JSON.stringify({ event: "content_get_error", message: error.message }));
    return json({ error: "Errore interno del server." }, 500);
  }
}

// Salva una modifica. Sui contenuti "history", createVersion=true aggiunge una nuova voce alla
// cronologia lasciando intatte le precedenti; createVersion=false corregge il testo della
// versione corrente in vigore, senza generarne una nuova (es. refuso nel testo appena salvato).
export async function onRequestPut(context) {
  const { request, env } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.edit")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const entry = await fetchEntry(env, context.params.key);
    if (!entry) {
      return json({ error: "Contenuto non trovato." }, 404);
    }

    const payload = await readJson(request);
    const body = normalizeBody(payload?.body);
    if (!body) {
      return json({ error: "Testo non valido." }, 400);
    }

    const now = new Date().toISOString();
    const createVersion = entry.versioning_mode === "history" && payload?.createVersion === true;

    let currentVersionId = entry.current_version_id;

    if (entry.versioning_mode === "replace") {
      await env.DB
        .prepare("UPDATE content_entries SET body = ?, updated_at = ? WHERE id = ?")
        .bind(body, now, entry.id)
        .run();
    } else if (createVersion || !entry.current_version_id) {
      const insertedVersion = await env.DB
        .prepare("INSERT INTO content_versions (entry_id, body, author_id, created_at) VALUES (?, ?, ?, ?)")
        .bind(entry.id, body, session.user.id, now)
        .run();
      currentVersionId = insertedVersion.meta.last_row_id;

      await env.DB
        .prepare("UPDATE content_entries SET current_version_id = ?, updated_at = ? WHERE id = ?")
        .bind(currentVersionId, now, entry.id)
        .run();
    } else {
      await env.DB
        .prepare("UPDATE content_versions SET body = ? WHERE id = ?")
        .bind(body, entry.current_version_id)
        .run();
      await env.DB
        .prepare("UPDATE content_entries SET updated_at = ? WHERE id = ?")
        .bind(now, entry.id)
        .run();
    }

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "content",
      eventType: createVersion ? "content_version_added" : "content_updated",
      metadata: { entryId: entry.id, contentKey: entry.content_key }
    }));

    return json({ contentKey: entry.content_key, body, currentVersionId, updatedAt: now });
  } catch (error) {
    console.error(JSON.stringify({ event: "content_put_error", message: error.message }));
    return json({ error: "Non è stato possibile salvare il contenuto." }, 500);
  }
}

// Elimina definitivamente un contenuto e, se presente, tutta la sua cronologia.
export async function onRequestDelete(context) {
  const { env } = context;
  try {
    const session = await getAuthenticatedSession(context.request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.delete")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const entry = await fetchEntry(env, context.params.key);
    if (!entry) {
      return json({ error: "Contenuto non trovato." }, 404);
    }

    await env.DB.prepare("UPDATE content_entries SET current_version_id = NULL WHERE id = ?").bind(entry.id).run();
    await env.DB.prepare("DELETE FROM content_versions WHERE entry_id = ?").bind(entry.id).run();
    await env.DB.prepare("DELETE FROM content_entries WHERE id = ?").bind(entry.id).run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "content",
      eventType: "content_deleted",
      metadata: { entryId: entry.id, contentKey: entry.content_key }
    }));

    return json({ contentKey: entry.content_key, deleted: true });
  } catch (error) {
    console.error(JSON.stringify({ event: "content_delete_error", message: error.message }));
    return json({ error: "Non è stato possibile eliminare il contenuto." }, 500);
  }
}

async function fetchEntry(env, contentKey) {
  return env.DB
    .prepare(`
      SELECT id, content_key, label, content_type, versioning_mode, body, current_version_id, updated_at
      FROM content_entries
      WHERE content_key = ?
    `)
    .bind(typeof contentKey === "string" ? contentKey.trim().toLowerCase() : "")
    .first();
}
