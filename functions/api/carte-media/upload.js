import { getAuthenticatedSession, json } from "../auth/_shared.js";
import { hasPermission } from "../_shared/permissions.js";
import { recordEvent } from "../_shared/events.js";

// Upload delle immagini per il gioco di carte collezionabili (#e4): stesso schema stream
// binario di bacheca-media/upload.js e ponti-chat/media.js (niente multipart/form-data, per
// non bufferizzare file grossi in memoria nel Worker). Solo foto qui — i design sono
// foto/sticker/emoji caricati dall'admin, mai video/audio. La chiave R2 è generata
// server-side, mai dal nome file del client.
const LIMITS = {
  photo: { maxBytes: 15 * 1024 * 1024, types: ["image/jpeg", "image/png", "image/webp"], extensions: { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } }
};

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
    const mediaType = url.searchParams.get("type") || "photo";
    const limits = LIMITS[mediaType];
    if (!limits) {
      return json({ error: "Tipo di media non valido." }, 400);
    }

    const contentType = request.headers.get("Content-Type")?.split(";", 1)[0].trim().toLowerCase() || "";
    const contentLength = Number(request.headers.get("Content-Length"));
    if (!request.body || !Number.isFinite(contentLength) || contentLength <= 0) {
      return json({ error: "File vuoto o dimensione non disponibile." }, 400);
    }
    if (!limits.types.includes(contentType)) {
      return json({ error: `Formato non supportato. Ammessi: ${limits.types.join(", ")}.` }, 400);
    }
    if (contentLength > limits.maxBytes) {
      return json({ error: `Il file supera la dimensione massima (${Math.round(limits.maxBytes / 1024 / 1024)} MB).` }, 400);
    }

    const extension = limits.extensions[contentType];
    const key = `carte/uploads/${randomId()}.${extension}`;
    await env.MEDIA.put(key, request.body, { httpMetadata: { contentType } });

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "carte",
      eventType: "carte_media_uploaded",
      metadata: { key, bytes: contentLength }
    }));

    return json({ key }, 201);
  } catch (error) {
    console.error(JSON.stringify({ event: "carte_media_upload_error", message: error.message }));
    return json({ error: "Upload non riuscito." }, 500);
  }
}
