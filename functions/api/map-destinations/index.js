import { getAuthenticatedSession, json, readJson } from "../auth/_shared.js";
import { hasPermission } from "../_shared/permissions.js";
import { recordEvent } from "../_shared/events.js";
import { normalizeCoordinate, normalizeImages, normalizeName, normalizeParagraphs } from "./_shared.js";

// Editor dedicato della Mappa (documentazione/cms/planning-editor-contenuti.md, Fase 7). Stesso pattern CRUD +
// move.js di Ricettario/Storie/Cuffiette.
export async function onRequestGet(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.read")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const { results } = await context.env.DB
      .prepare("SELECT * FROM map_destinations ORDER BY position")
      .all();

    return json({ destinations: results.map(toDestinationView) });
  } catch (error) {
    console.error(JSON.stringify({ event: "map_destinations_list_error", message: error.message }));
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
    const name = normalizeName(payload?.name);
    const isOpen = payload?.isOpen === true;
    const latitude = normalizeCoordinate(payload?.latitude);
    const longitude = normalizeCoordinate(payload?.longitude);
    const paragraphs = normalizeParagraphs(payload?.paragraphs);
    const images = normalizeImages(payload?.images);

    if (!/^[a-z][a-z0-9-]{0,63}$/.test(id)) return json({ error: "ID non valido." }, 400);
    if (!name) return json({ error: "Nome non valido." }, 400);
    if (latitude === undefined || longitude === undefined) return json({ error: "Coordinate non valide." }, 400);
    if (!paragraphs) return json({ error: "Paragrafi non validi." }, 400);
    if (images === null) return json({ error: "Immagini non valide." }, 400);

    const existing = await env.DB.prepare("SELECT id FROM map_destinations WHERE id = ?").bind(id).first();
    if (existing) {
      return json({ error: "Esiste già una destinazione con questo ID." }, 409);
    }

    const maxPosition = await env.DB.prepare("SELECT MAX(position) AS max FROM map_destinations").first();
    const position = (maxPosition?.max ?? -1) + 1;
    const now = new Date().toISOString();

    await env.DB
      .prepare(`
        INSERT INTO map_destinations
          (id, name, is_open, latitude, longitude, paragraphs, images, position, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(id, name, isOpen ? 1 : 0, latitude, longitude, JSON.stringify(paragraphs), JSON.stringify(images), position, session.user.id, now, now)
      .run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "mappa",
      eventType: "content_created",
      metadata: { destinationId: id }
    }));

    const created = await env.DB.prepare("SELECT * FROM map_destinations WHERE id = ?").bind(id).first();
    return json(toDestinationView(created), 201);
  } catch (error) {
    console.error(JSON.stringify({ event: "map_destinations_create_error", message: error.message }));
    return json({ error: "Non è stato possibile creare la destinazione." }, 500);
  }
}

export function toDestinationView(row) {
  return {
    id: row.id,
    name: row.name,
    isOpen: row.is_open === 1,
    coordinates: row.latitude !== null && row.longitude !== null ? { latitude: row.latitude, longitude: row.longitude } : null,
    paragraphs: JSON.parse(row.paragraphs),
    images: JSON.parse(row.images),
    position: row.position,
    updatedAt: row.updated_at
  };
}
