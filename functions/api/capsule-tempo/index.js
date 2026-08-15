import { getAuthenticatedSession, json, readJson } from "../auth/_shared.js";
import { recordEvent } from "../_shared/events.js";
import { normalizeText, normalizeTitle, normalizeUnlockDate, toCapsulaView } from "./_shared.js";

// GET: tutte le capsule, di entrambi. Il contenuto delle non ancora sbloccate è omesso dal
// payload stesso in toCapsulaView, non solo nascosto in UI. POST: crea una nuova capsula,
// author_identity è sempre derivato dalla sessione lato server (mai dal client).
export async function onRequestGet(context) {
  const { env, request } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const { results } = await env.DB
      .prepare("SELECT * FROM capsule_tempo ORDER BY unlock_date ASC, id ASC")
      .all();

    return json({ capsule: results.map(toCapsulaView) });
  } catch (error) {
    console.error(JSON.stringify({ event: "capsule_tempo_list_error", message: error.message }));
    return json({ error: "Errore interno del server." }, 500);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const payload = await readJson(request);
    const title = normalizeTitle(payload?.title);
    const text = normalizeText(payload?.text);
    const unlockDate = normalizeUnlockDate(payload?.unlockDate);
    const mediaKey = typeof payload?.mediaKey === "string" && payload.mediaKey.startsWith("capsule-tempo/uploads/") ? payload.mediaKey : null;
    const mediaType = mediaKey && (payload?.mediaType === "photo" || payload?.mediaType === "video") ? payload.mediaType : null;

    if (!title) return json({ error: "Il titolo non è valido." }, 400);
    if (!text) return json({ error: "Il testo non è valido." }, 400);
    if (!unlockDate) return json({ error: "La data di sblocco deve essere una data futura valida." }, 400);
    if (mediaKey && !mediaType) return json({ error: "Tipo di media mancante." }, 400);

    const now = new Date().toISOString();

    const result = await env.DB
      .prepare(`
        INSERT INTO capsule_tempo
          (title, text, media_key, media_type, unlock_date, author_identity, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(title, text, mediaKey, mediaType, unlockDate, session.user.identity, session.user.id, now)
      .run();

    const created = await env.DB.prepare("SELECT * FROM capsule_tempo WHERE id = ?").bind(result.meta.last_row_id).first();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "capsula-del-tempo",
      eventType: "content_created",
      metadata: { capsulaId: created.id, unlockDate }
    }));

    return json(toCapsulaView(created), 201);
  } catch (error) {
    console.error(JSON.stringify({ event: "capsule_tempo_create_error", message: error.message }));
    return json({ error: "Non è stato possibile creare la capsula." }, 500);
  }
}
