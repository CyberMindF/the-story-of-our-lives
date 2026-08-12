import { getAuthenticatedSession, json, readJson } from "../auth/_shared.js";
import { hasPermission } from "../_shared/permissions.js";
import { recordEvent } from "../_shared/events.js";
import {
  isValidContentKey,
  isValidContentType,
  isValidVersioningMode,
  normalizeBody,
  normalizeLabel
} from "./_shared.js";

// Indice dei contenuti modificabili, per il futuro pannello admin (Fase 6 del piano). Richiede
// content.edit: chi può soltanto leggere non ha bisogno dell'elenco grezzo delle chiavi.
export async function onRequestGet(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.edit")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const { results } = await context.env.DB
      .prepare(`
        SELECT id, content_key, label, content_type, versioning_mode, updated_at
        FROM content_entries
        ORDER BY label
      `)
      .all();

    return json({
      entries: results.map((row) => ({
        id: row.id,
        contentKey: row.content_key,
        label: row.label,
        contentType: row.content_type,
        versioningMode: row.versioning_mode,
        updatedAt: row.updated_at
      }))
    });
  } catch (error) {
    console.error(JSON.stringify({ event: "content_list_error", message: error.message }));
    return json({ error: "Errore interno del server." }, 500);
  }
}

// Crea un nuovo contenuto editoriale. Il testo iniziale è obbligatorio: non esistono voci vuote
// in attesa di redazione, coerente con l'assenza di bozze decisa nel piano.
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.create")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const payload = await readJson(request);
    const contentKey = typeof payload?.contentKey === "string" ? payload.contentKey.trim().toLowerCase() : "";
    const label = normalizeLabel(payload?.label);
    const contentType = payload?.contentType;
    const versioningMode = payload?.versioningMode;
    const body = normalizeBody(payload?.body);

    if (!isValidContentKey(contentKey)) {
      return json({ error: "Chiave del contenuto non valida." }, 400);
    }
    if (!label) {
      return json({ error: "Etichetta non valida." }, 400);
    }
    if (!isValidContentType(contentType)) {
      return json({ error: "Tipo di contenuto non valido." }, 400);
    }
    if (!isValidVersioningMode(versioningMode)) {
      return json({ error: "Modalità di versionamento non valida." }, 400);
    }
    if (!body) {
      return json({ error: "Testo non valido." }, 400);
    }

    const existing = await env.DB
      .prepare("SELECT id FROM content_entries WHERE content_key = ?")
      .bind(contentKey)
      .first();
    if (existing) {
      return json({ error: "Esiste già un contenuto con questa chiave." }, 409);
    }

    const now = new Date().toISOString();
    const isHistory = versioningMode === "history";

    const insertedEntry = await env.DB
      .prepare(`
        INSERT INTO content_entries
          (content_key, label, content_type, versioning_mode, body, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(contentKey, label, contentType, versioningMode, isHistory ? null : body, session.user.id, now, now)
      .run();
    const entryId = insertedEntry.meta.last_row_id;

    let currentVersionId = null;
    if (isHistory) {
      const insertedVersion = await env.DB
        .prepare("INSERT INTO content_versions (entry_id, body, author_id, created_at) VALUES (?, ?, ?, ?)")
        .bind(entryId, body, session.user.id, now)
        .run();
      currentVersionId = insertedVersion.meta.last_row_id;

      await env.DB
        .prepare("UPDATE content_entries SET current_version_id = ? WHERE id = ?")
        .bind(currentVersionId, entryId)
        .run();
    }

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "content",
      eventType: "content_created",
      metadata: { entryId, contentKey }
    }));

    return json({
      id: entryId,
      contentKey,
      label,
      contentType,
      versioningMode,
      body,
      currentVersionId
    }, 201);
  } catch (error) {
    console.error(JSON.stringify({ event: "content_create_error", message: error.message }));
    return json({ error: "Non è stato possibile creare il contenuto." }, 500);
  }
}
