import { getAuthenticatedSession, json, readJson } from "../auth/_shared.js";
import { hasPermission } from "../_shared/permissions.js";
import { recordEvent } from "../_shared/events.js";
import { normalizeIcon, normalizeNote, normalizeTitle } from "./_shared.js";

// Editor dedicato del Linguaggio Segreto (documentazione/cms/planning-editor-contenuti.md, Fase 7). Le categorie
// sono una lista piatta, stesso pattern CRUD + move.js di Mappa/Storie/Cruciverba; i simboli
// annidati sotto ognuna vivono nella collezione a sé `linguaggio-segreto-symbols`.
export async function onRequestGet(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.read")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const { results } = await context.env.DB
      .prepare("SELECT * FROM linguaggio_segreto_categories ORDER BY position")
      .all();

    return json({ categories: results.map(toCategoryView) });
  } catch (error) {
    console.error(JSON.stringify({ event: "linguaggio_segreto_categories_list_error", message: error.message }));
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
    const id = typeof payload?.id === "string" ? payload.id.trim().toLowerCase() : "";
    const title = normalizeTitle(payload?.title);
    const icon = normalizeIcon(payload?.icon);
    const note = normalizeNote(payload?.note);

    if (!/^[a-z][a-z0-9-]{0,63}$/.test(id)) return json({ error: "ID non valido." }, 400);
    if (!title) return json({ error: "Titolo non valido." }, 400);
    if (!icon) return json({ error: "Icona non valida." }, 400);
    if (note === undefined) return json({ error: "Nota non valida." }, 400);

    const existing = await env.DB.prepare("SELECT id FROM linguaggio_segreto_categories WHERE id = ?").bind(id).first();
    if (existing) {
      return json({ error: "Esiste già una categoria con questo ID." }, 409);
    }

    const maxPosition = await env.DB.prepare("SELECT MAX(position) AS max FROM linguaggio_segreto_categories").first();
    const position = (maxPosition?.max ?? -1) + 1;
    const now = new Date().toISOString();

    await env.DB
      .prepare(`
        INSERT INTO linguaggio_segreto_categories (id, title, icon, note, position, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(id, title, icon, note, position, session.user.id, now, now)
      .run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "linguaggio-segreto",
      eventType: "content_created",
      metadata: { categoryId: id }
    }));

    const created = await env.DB.prepare("SELECT * FROM linguaggio_segreto_categories WHERE id = ?").bind(id).first();
    return json(toCategoryView(created), 201);
  } catch (error) {
    console.error(JSON.stringify({ event: "linguaggio_segreto_categories_create_error", message: error.message }));
    return json({ error: "Non è stato possibile creare la categoria." }, 500);
  }
}

export function toCategoryView(row) {
  return {
    id: row.id,
    title: row.title,
    icon: row.icon,
    note: row.note,
    position: row.position,
    updatedAt: row.updated_at
  };
}
