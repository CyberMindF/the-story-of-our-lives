import { getAuthenticatedSession, json } from "../auth/_shared.js";
import { hasPermission } from "../_shared/permissions.js";
import { recordEvent } from "../_shared/events.js";

// Upload dei nuovi media della Bacheca verso R2 (Fase 4 dell'editor "ibrido", concordata il
// 12/08/2026): l'admin non scrive mai una chiave a mano, questo endpoint la genera. La
// miniatura delle foto arriva già pronta dal browser (ridimensionata via <canvas>: Cloudflare
// Workers non può eseguire una libreria di ridimensionamento nativa come sharp). Il corpo è
// inviato come stream binario, non multipart/form-data: request.formData() + arrayBuffer()
// bufferizzavano anche video da 200 MB oltre il limite di memoria del Worker.
const LIMITS = {
  photo: { maxBytes: 15 * 1024 * 1024, types: ["image/jpeg", "image/png", "image/webp"], extensions: { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } },
  video: { maxBytes: 200 * 1024 * 1024, types: ["video/mp4", "video/webm", "video/quicktime"], extensions: { "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov" } },
  audio: { maxBytes: 50 * 1024 * 1024, types: ["audio/mpeg", "audio/mp4", "audio/wav", "audio/ogg"], extensions: { "audio/mpeg": "mp3", "audio/mp4": "m4a", "audio/wav": "wav", "audio/ogg": "ogg" } }
};
const THUMBNAIL_LIMITS = { maxBytes: 2 * 1024 * 1024, types: ["image/jpeg", "image/webp"], extensions: { "image/jpeg": "jpg", "image/webp": "webp" } };

function randomId() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.create")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const url = new URL(request.url);
    const mediaType = url.searchParams.get("type");
    const isThumbnail = mediaType === "thumbnail";
    const limits = isThumbnail ? THUMBNAIL_LIMITS : LIMITS[mediaType];
    if (!limits) {
      return json({ error: "Tipo di media non valido." }, 400);
    }

    const contentType = request.headers.get("Content-Type")?.split(";", 1)[0].trim().toLowerCase() || "";
    const contentLength = Number(request.headers.get("Content-Length"));
    if (!request.body || !Number.isFinite(contentLength) || contentLength <= 0) {
      return json({ error: "File vuoto o dimensione non disponibile." }, 400);
    }
    if (!limits.types.includes(contentType)) {
      return json({ error: `Formato non supportato per ${mediaType}. Ammessi: ${limits.types.join(", ")}.` }, 400);
    }
    if (contentLength > limits.maxBytes) {
      return json({ error: `Il file supera la dimensione massima (${Math.round(limits.maxBytes / 1024 / 1024)} MB).` }, 400);
    }

    const extension = limits.extensions[contentType];
    const id = randomId();
    const key = `bacheca/uploads/${id}${isThumbnail ? "-thumb" : ""}.${extension}`;
    await env.MEDIA.put(key, request.body, { httpMetadata: { contentType } });

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "bacheca",
      eventType: "media_uploaded",
      metadata: { key, mediaType, bytes: contentLength }
    }));

    return json({ key }, 201);
  } catch (error) {
    console.error(JSON.stringify({ event: "bacheca_media_upload_error", message: error.message }));
    return json({ error: "Upload non riuscito." }, 500);
  }
}
