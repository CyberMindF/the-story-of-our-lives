import { getAuthenticatedSession, json, readJson } from "../auth/_shared.js";
import { hasPermission } from "../_shared/permissions.js";
import { recordEvent } from "../_shared/events.js";
import { normalizeMediaKey, normalizeText, normalizeTitle } from "./_shared.js";

// Editor dedicato delle canzoni delle Cuffiette (planning editor contenuti.md, Fase 7). Stesso
// pattern di Ricettario/Storie: 'position' esplicito, riordino su move.js.
export async function onRequestGet(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.read")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const { results } = await context.env.DB
      .prepare("SELECT * FROM cuffiette_songs ORDER BY position")
      .all();

    return json({ songs: results.map(toSongView) });
  } catch (error) {
    console.error(JSON.stringify({ event: "cuffiette_songs_list_error", message: error.message }));
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
    const introduction = normalizeText(payload?.introduction);
    const lyrics = normalizeText(payload?.lyrics);
    const mediaKey = normalizeMediaKey(payload?.mediaKey);

    if (!/^[a-z][a-z0-9-]{0,63}$/.test(id)) return json({ error: "ID non valido." }, 400);
    if (!title) return json({ error: "Titolo non valido." }, 400);
    if (!introduction) return json({ error: "Introduzione non valida." }, 400);
    if (!lyrics) return json({ error: "Testo non valido." }, 400);
    if (!mediaKey) return json({ error: "Chiave media non valida." }, 400);

    const existing = await env.DB.prepare("SELECT id FROM cuffiette_songs WHERE id = ?").bind(id).first();
    if (existing) {
      return json({ error: "Esiste già una canzone con questo ID." }, 409);
    }

    const maxPosition = await env.DB.prepare("SELECT MAX(position) AS max FROM cuffiette_songs").first();
    const position = (maxPosition?.max ?? -1) + 1;
    const now = new Date().toISOString();

    await env.DB
      .prepare(`
        INSERT INTO cuffiette_songs (id, title, introduction, lyrics, media_key, position, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(id, title, introduction, lyrics, mediaKey, position, session.user.id, now, now)
      .run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "cuffiette",
      eventType: "content_created",
      metadata: { songId: id }
    }));

    const created = await env.DB.prepare("SELECT * FROM cuffiette_songs WHERE id = ?").bind(id).first();
    return json(toSongView(created), 201);
  } catch (error) {
    console.error(JSON.stringify({ event: "cuffiette_songs_create_error", message: error.message }));
    return json({ error: "Non è stato possibile creare la canzone." }, 500);
  }
}

export function toSongView(row) {
  return {
    id: row.id,
    title: row.title,
    introduction: row.introduction,
    lyrics: row.lyrics,
    mediaKey: row.media_key,
    position: row.position,
    updatedAt: row.updated_at
  };
}
