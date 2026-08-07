import { getAuthenticatedSession, json, readJson } from "../auth/_shared.js";

export { json };

const ALLOWED_EVENTS = new Set([
  "crossword_opened",
  "crossword_closed",
  "crossword_completed",
  "word_completed",
  "theme_changed"
]);
const MAX_METADATA_LENGTH = 4096;

// Legge il JSON e verifica la sessione senza prolungarne la durata.
export async function readAuthenticatedRequest(request, env) {
  const [body, session] = await Promise.all([
    readJson(request),
    getAuthenticatedSession(request, env)
  ]);

  if (!session) {
    return { error: json({ error: "Sessione non valida." }, 401) };
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: json({ error: "Richiesta non valida." }, 400) };
  }

  return { body, session };
}

// Valida e registra un evento generico senza duplicare SQL nei singoli endpoint.
export async function recordEvent(env, session, event) {
  const section = normalizeIdentifier(event.section);
  const eventType = normalizeIdentifier(event.eventType);
  const metadata = normalizeMetadata(event.metadata);

  if (!section || !eventType || !ALLOWED_EVENTS.has(eventType)) {
    return { error: "Tipo di evento non valido." };
  }

  if (!metadata) {
    return { error: "Metadati non validi o troppo grandi." };
  }

  const result = await env.DB
    .prepare(`
      INSERT INTO events (user_id, session_id, section, event_type, event_version, metadata)
      VALUES (?, ?, ?, ?, 1, ?)
    `)
    .bind(session.user.id, session.sessionId, section, eventType, metadata)
    .run();

  return { id: result.meta.last_row_id };
}

// Accetta identificatori semplici e prevedibili, adatti anche alle sezioni future.
function normalizeIdentifier(value) {
  if (typeof value !== "string") {
    return "";
  }

  const normalized = value.trim().toLowerCase();
  return /^[a-z][a-z0-9_-]{0,63}$/.test(normalized) ? normalized : "";
}

// Serializza soltanto oggetti JSON piccoli per evitare payload arbitrari nella telemetria.
function normalizeMetadata(value) {
  if (value === undefined) {
    return "{}";
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  try {
    const serialized = JSON.stringify(value);
    return serialized.length <= MAX_METADATA_LENGTH ? serialized : null;
  } catch {
    return null;
  }
}
