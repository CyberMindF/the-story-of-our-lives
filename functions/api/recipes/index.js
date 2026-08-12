import { getAuthenticatedSession, json, readJson } from "../auth/_shared.js";
import { hasPermission } from "../_shared/permissions.js";
import { recordEvent } from "../_shared/events.js";
import { isValidKind, normalizeList, normalizeNote, normalizeSource, normalizeTitle } from "./_shared.js";

// Editor dedicato del Ricettario (documentazione/cms/planning-editor-contenuti.md, Fase 7). A differenza del
// Calendario, qui l'ordine (position) è significativo e va gestito esplicitamente.
export async function onRequestGet(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.read")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const { results } = await context.env.DB
      .prepare("SELECT * FROM recipes ORDER BY position")
      .all();

    return json({ recipes: results.map(toRecipeView) });
  } catch (error) {
    console.error(JSON.stringify({ event: "recipes_list_error", message: error.message }));
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
    const kind = payload?.kind;
    const note = normalizeNote(payload?.note);
    const placeholder = payload?.placeholder === true;
    const source = normalizeSource(payload?.source);
    const ingredients = normalizeList(payload?.ingredients);
    const steps = normalizeList(payload?.steps);

    if (!/^[a-z][a-z0-9-]{0,63}$/.test(id)) {
      return json({ error: "ID non valido." }, 400);
    }
    if (!title) {
      return json({ error: "Titolo non valido." }, 400);
    }
    if (!isValidKind(kind)) {
      return json({ error: "Categoria non valida." }, 400);
    }
    if (!ingredients) {
      return json({ error: "Ingredienti non validi." }, 400);
    }
    if (!steps) {
      return json({ error: "Procedimento non valido." }, 400);
    }

    const existing = await env.DB.prepare("SELECT id FROM recipes WHERE id = ?").bind(id).first();
    if (existing) {
      return json({ error: "Esiste già una ricetta con questo ID." }, 409);
    }

    const maxPosition = await env.DB.prepare("SELECT MAX(position) AS max FROM recipes").first();
    const position = (maxPosition?.max ?? -1) + 1;
    const now = new Date().toISOString();

    await env.DB
      .prepare(`
        INSERT INTO recipes
          (id, title, kind, note, placeholder, source_label, source_href, ingredients, steps, position, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        id, title, kind, note, placeholder ? 1 : 0, source.label, source.href,
        JSON.stringify(ingredients), JSON.stringify(steps), position,
        session.user.id, now, now
      )
      .run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "ricettario",
      eventType: "content_created",
      metadata: { recipeId: id }
    }));

    const created = await env.DB.prepare("SELECT * FROM recipes WHERE id = ?").bind(id).first();
    return json(toRecipeView(created), 201);
  } catch (error) {
    console.error(JSON.stringify({ event: "recipes_create_error", message: error.message }));
    return json({ error: "Non è stato possibile creare la ricetta." }, 500);
  }
}

export function toRecipeView(row) {
  return {
    id: row.id,
    title: row.title,
    kind: row.kind,
    note: row.note,
    placeholder: row.placeholder === 1,
    source: row.source_label && row.source_href ? { label: row.source_label, href: row.source_href } : null,
    ingredients: JSON.parse(row.ingredients),
    steps: JSON.parse(row.steps),
    position: row.position,
    updatedAt: row.updated_at
  };
}
