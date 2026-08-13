const ALLOWED_EVENTS = new Set([
  "register",
  "login_success",
  "logout",
  "world_unlocked",
  "crossword_opened",
  "crossword_closed",
  "crossword_completed",
  "word_completed",
  "theme_changed",
  // Aperture di pagina nel Mondo Bianco (client, vedi assets/js/world/main.js).
  "world_page_opened",
  // Media delle Cuffiette (client, vedi assets/js/music/main.js).
  "song_played",
  "song_completed",
  "playlist_link_clicked",
  "crossword_hint_requested",
  "prova_a_dire_no_answered",
  // Azioni esplicite registrate lato server, subito dopo la scrittura riuscita in D1.
  // Gli appunti (autosalvati a ogni pausa di scrittura) restano esclusi: sarebbero rumorosi
  // quanto tracciare i tasti, l'apertura della pagina è già coperta da world_page_opened.
  "letter_sent",
  "gdr_turn_submitted",
  "gdr_character_saved",
  "suggestion_sent",
  "password_changed",
  "question_asked",
  "answer_given",
  "question_edited",
  "answer_edited",
  "together_status_changed",
  "together_nsfw_attempt",
  "letter_read",
  "nickname_changed",
  "story_suggestion_sent",
  "world_setting_changed",
  "admin_mode_enabled",
  "admin_mode_disabled",
  "content_created",
  "content_updated",
  "content_version_added",
  "content_deleted",
  "admin_log_viewed",
  "content_export_downloaded"
]);
const MAX_METADATA_LENGTH = 4096;

// Valida e registra un evento generico senza duplicare SQL nei singoli endpoint.
export async function recordEvent(env, actor, event) {
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
    .bind(actor.userId, actor.sessionId || null, section, eventType, metadata)
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
