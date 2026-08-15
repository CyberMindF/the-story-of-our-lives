import { getAuthenticatedSession, json } from "../auth/_shared.js";

// Stesso schema stream-binario di functions/api/ponti-chat/media.js (niente
// multipart/form-data). A differenza di Ponti Chat, qui non c'è scadenza: una capsula può
// restare sigillata per mesi, il media deve sopravvivere fino allo sblocco e oltre.
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
    const key = `capsule-tempo/uploads/${randomId()}.${extension}`;
    await env.MEDIA.put(key, request.body, { httpMetadata: { contentType } });

    return json({ key, mediaType }, 201);
  } catch (error) {
    console.error(JSON.stringify({ event: "capsule_tempo_media_upload_error", message: error.message }));
    return json({ error: "Upload non riuscito." }, 500);
  }
}
