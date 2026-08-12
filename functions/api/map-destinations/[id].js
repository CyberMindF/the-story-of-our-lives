import { getAuthenticatedSession, json, readJson } from "../auth/_shared.js";
import { hasPermission } from "../_shared/permissions.js";
import { recordEvent } from "../_shared/events.js";
import { normalizeCoordinate, normalizeImages, normalizeName, normalizeParagraphs } from "./_shared.js";
import { toDestinationView } from "./index.js";

export async function onRequestPut(context) {
  const { request, env, params } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.edit")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const existing = await env.DB.prepare("SELECT id FROM map_destinations WHERE id = ?").bind(params.id).first();
    if (!existing) {
      return json({ error: "Destinazione non trovata." }, 404);
    }

    const payload = await readJson(request);
    const name = normalizeName(payload?.name);
    const isOpen = payload?.isOpen === true;
    const latitude = normalizeCoordinate(payload?.latitude);
    const longitude = normalizeCoordinate(payload?.longitude);
    const paragraphs = normalizeParagraphs(payload?.paragraphs);
    const images = normalizeImages(payload?.images);

    if (!name) return json({ error: "Nome non valido." }, 400);
    if (latitude === undefined || longitude === undefined) return json({ error: "Coordinate non valide." }, 400);
    if (!paragraphs) return json({ error: "Paragrafi non validi." }, 400);
    if (images === null) return json({ error: "Immagini non valide." }, 400);

    const now = new Date().toISOString();
    await env.DB
      .prepare(`
        UPDATE map_destinations
        SET name = ?, is_open = ?, latitude = ?, longitude = ?, paragraphs = ?, images = ?, updated_at = ?
        WHERE id = ?
      `)
      .bind(name, isOpen ? 1 : 0, latitude, longitude, JSON.stringify(paragraphs), JSON.stringify(images), now, params.id)
      .run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "mappa",
      eventType: "content_updated",
      metadata: { destinationId: params.id }
    }));

    const updated = await env.DB.prepare("SELECT * FROM map_destinations WHERE id = ?").bind(params.id).first();
    return json(toDestinationView(updated));
  } catch (error) {
    console.error(JSON.stringify({ event: "map_destinations_update_error", message: error.message }));
    return json({ error: "Non è stato possibile salvare la destinazione." }, 500);
  }
}

export async function onRequestDelete(context) {
  const { env, params } = context;
  try {
    const session = await getAuthenticatedSession(context.request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.delete")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const existing = await env.DB.prepare("SELECT id FROM map_destinations WHERE id = ?").bind(params.id).first();
    if (!existing) {
      return json({ error: "Destinazione non trovata." }, 404);
    }

    await env.DB.prepare("DELETE FROM map_destinations WHERE id = ?").bind(params.id).run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "mappa",
      eventType: "content_deleted",
      metadata: { destinationId: params.id }
    }));

    return json({ id: params.id, deleted: true });
  } catch (error) {
    console.error(JSON.stringify({ event: "map_destinations_delete_error", message: error.message }));
    return json({ error: "Non è stato possibile eliminare la destinazione." }, 500);
  }
}
