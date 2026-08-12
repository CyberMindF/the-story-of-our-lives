import { getAuthenticatedSession, json } from "../auth/_shared.js";
import { hasPermission } from "../_shared/permissions.js";
import { recordEvent } from "../_shared/events.js";

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

// Pagina amministrativa dei log (planning editor contenuti.md, Fase 6): nessun dato precaricato
// nel bundle, l'endpoint verifica events.view a ogni chiamata — il frontend nasconde solo il
// collegamento in modalità admin, non è lui la barriera.
export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "events.view")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const params = new URL(request.url).searchParams;
    const conditions = [];
    const bindings = [];

    const identity = params.get("identity");
    if (identity === "lui" || identity === "lei") {
      conditions.push("users.identity = ?");
      bindings.push(identity);
    }

    const section = normalizeFilterValue(params.get("section"));
    if (section) {
      conditions.push("events.section = ?");
      bindings.push(section);
    }

    const eventType = normalizeFilterValue(params.get("eventType"));
    if (eventType) {
      conditions.push("events.event_type = ?");
      bindings.push(eventType);
    }

    const from = normalizeDate(params.get("from"));
    if (from) {
      conditions.push("events.created_at >= ?");
      bindings.push(from);
    }

    const to = normalizeDate(params.get("to"));
    if (to) {
      conditions.push("events.created_at <= ?");
      bindings.push(to);
    }

    const page = Math.max(1, Number(params.get("page")) || 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(params.get("pageSize")) || DEFAULT_PAGE_SIZE));
    const offset = (page - 1) * pageSize;

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const totalRow = await env.DB
      .prepare(`SELECT COUNT(*) AS total FROM events INNER JOIN users ON users.id = events.user_id ${whereClause}`)
      .bind(...bindings)
      .first();

    const { results } = await env.DB
      .prepare(`
        SELECT events.id, events.section, events.event_type, events.metadata, events.created_at,
               users.id AS user_id, users.nickname, users.identity
        FROM events
        INNER JOIN users ON users.id = events.user_id
        ${whereClause}
        ORDER BY events.created_at DESC
        LIMIT ? OFFSET ?
      `)
      .bind(...bindings, pageSize, offset)
      .all();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "admin",
      eventType: "admin_log_viewed",
      metadata: {}
    }));

    return json({
      events: results.map((row) => ({
        id: row.id,
        userId: row.user_id,
        nickname: row.nickname,
        identity: row.identity,
        section: row.section,
        eventType: row.event_type,
        metadata: parseMetadata(row.metadata),
        createdAt: row.created_at
      })),
      page,
      pageSize,
      total: totalRow?.total ?? 0
    });
  } catch (error) {
    console.error(JSON.stringify({ event: "events_list_error", message: error.message }));
    return json({ error: "Errore interno del server." }, 500);
  }
}

function normalizeFilterValue(value) {
  return typeof value === "string" && /^[a-z][a-z0-9_-]{0,63}$/.test(value.trim()) ? value.trim() : null;
}

// Accetta solo date ISO (YYYY-MM-DD), estese a inizio/fine giornata dal chiamante se necessario.
function normalizeDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}(T[\d:.Z-]+)?$/.test(value.trim()) ? value.trim() : null;
}

function parseMetadata(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
