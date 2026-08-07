import { json, readAuthenticatedRequest } from "./_shared.js";

const ALLOWED_EVENTS = new Set([
  "crossword_opened",
  "crossword_completed",
  "word_completed",
  "theme_changed"
]);
const MAX_METADATA_LENGTH = 4096;

// Registra un evento significativo associandolo sempre all'utente e alla sessione autenticati.
export async function onRequestPost(context) {
  try {
    const parsed = await readAuthenticatedRequest(context.request, context.env);
    if (parsed.error) {
      return parsed.error;
    }

    const { body, session } = parsed;
    const section = normalizeIdentifier(body.section);
    const eventType = normalizeIdentifier(body.eventType);

    if (!section || !eventType || !ALLOWED_EVENTS.has(eventType)) {
      return json({ error: "Tipo di evento non valido." }, 400);
    }

    const metadata = normalizeMetadata(body.metadata);
    if (!metadata) {
      return json({ error: "Metadati non validi o troppo grandi." }, 400);
    }

    const result = await context.env.DB
      .prepare(`
        INSERT INTO events (user_id, session_id, section, event_type, event_version, metadata)
        VALUES (?, ?, ?, ?, 1, ?)
      `)
      .bind(session.user.id, session.sessionId, section, eventType, metadata)
      .run();

    return json({ saved: true, id: result.meta.last_row_id }, 201);
  } catch (error) {
    console.error(JSON.stringify({ event: "telemetry_event_error", message: error.message }));
    return json({ error: "Errore interno del server." }, 500);
  }
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
