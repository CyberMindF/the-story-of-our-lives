import { recordEvent } from "./_shared/events.js";
import { hasPermission } from "./_shared/permissions.js";
import { getAuthenticatedSession, json, readJson } from "./auth/_shared.js";

const KEY_PREFIX = "page-wip:";
const MAX_PATH_LENGTH = 180;

function normalizePath(value) {
  if (typeof value !== "string") return null;
  const path = value.trim().replace(/\/+$/, "") || "/";
  if (path.length > MAX_PATH_LENGTH || !/^\/[a-z0-9/_-]*$/i.test(path)) return null;
  return path;
}

export async function onRequestGet(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const path = normalizePath(new URL(context.request.url).searchParams.get("path"));
    if (!path) return json({ error: "Pagina non valida." }, 400);

    const row = await context.env.DB
      .prepare("SELECT enabled FROM world_settings WHERE key = ?")
      .bind(`${KEY_PREFIX}${path}`)
      .first();

    return json({ path, enabled: row?.enabled === 1 });
  } catch (error) {
    console.error(JSON.stringify({ event: "page_wip_get_error", message: error.message }));
    return json({ error: "Non è stato possibile controllare lo stato della pagina." }, 500);
  }
}

export async function onRequestPost(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.edit")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const body = await readJson(context.request);
    const path = normalizePath(body?.path);
    if (!path || typeof body?.enabled !== "boolean") {
      return json({ error: "Stato della pagina non valido." }, 400);
    }

    const enabled = body.enabled ? 1 : 0;
    const updatedAt = new Date().toISOString();
    await context.env.DB
      .prepare(`
        INSERT INTO world_settings (key, enabled, updated_by, updated_at) VALUES (?, ?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET
          enabled = excluded.enabled,
          updated_by = excluded.updated_by,
          updated_at = excluded.updated_at
      `)
      .bind(`${KEY_PREFIX}${path}`, enabled, session.user.id, updatedAt)
      .run();

    context.waitUntil(recordEvent(
      context.env,
      { userId: session.user.id, sessionId: session.sessionId },
      {
        section: "contenuti",
        eventType: "page_wip_changed",
        metadata: { path, enabled: enabled === 1 }
      }
    ));

    return json({ path, enabled: enabled === 1 });
  } catch (error) {
    console.error(JSON.stringify({ event: "page_wip_post_error", message: error.message }));
    return json({ error: "Non è stato possibile salvare lo stato della pagina." }, 500);
  }
}
