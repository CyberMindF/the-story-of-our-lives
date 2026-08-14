import { getAuthenticatedSession, json } from "../auth/_shared.js";

// Stesso schema di functions/api/bacheca-media/upload.js (stream binario, non
// multipart/form-data, per non bufferizzare video grossi in memoria nel Worker). Solo
// foto/video qui (niente audio): il messaggio di chat li allega, la scadenza (30 giorni)
// viene impostata da POST /api/ponti-chat quando il messaggio viene creato con questa chiave.
const LIMITS = {
  photo: { maxBytes: 15 * 1024 * 1024, types: ["image/jpeg", "image/png", "image/webp"], extensions: { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } },
  video: { maxBytes: 200 * 1024 * 1024, types: ["video/mp4", "video/webm", "video/quicktime"], extensions: { "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov" } }
};

function randomId() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const url = new URL(request.url);
    const mediaType = url.searchParams.get("type");
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
      return json({ error: `Formato non supportato per ${mediaType}. Ammessi: ${limits.types.join(", ")}.` }, 400);
    }
    if (contentLength > limits.maxBytes) {
      return json({ error: `Il file supera la dimensione massima (${Math.round(limits.maxBytes / 1024 / 1024)} MB).` }, 400);
    }

    const extension = limits.extensions[contentType];
    const key = `ponti-chat/uploads/${randomId()}.${extension}`;
    await env.MEDIA.put(key, request.body, { httpMetadata: { contentType } });

    return json({ key, mediaType }, 201);
  } catch (error) {
    console.error(JSON.stringify({ event: "ponti_chat_media_upload_error", message: error.message }));
    return json({ error: "Upload non riuscito." }, 500);
  }
}
