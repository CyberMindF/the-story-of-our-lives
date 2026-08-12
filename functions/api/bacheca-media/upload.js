import { getAuthenticatedSession, json } from "../auth/_shared.js";
import { hasPermission } from "../_shared/permissions.js";
import { recordEvent } from "../_shared/events.js";

// Upload dei nuovi media della Bacheca verso R2 (Fase 4 dell'editor "ibrido", concordata il
// 12/08/2026): l'admin non scrive mai una chiave a mano, questo endpoint la genera. La
// miniatura delle foto arriva già pronta dal browser (ridimensionata via <canvas>: Cloudflare
// Workers non può eseguire una libreria di ridimensionamento nativa come sharp) — qui viene
// solo caricata su R2 accanto all'originale, non generata qui.
const LIMITS = {
  photo: { maxBytes: 15 * 1024 * 1024, types: ["image/jpeg", "image/png", "image/webp"], extensions: { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } },
  video: { maxBytes: 200 * 1024 * 1024, types: ["video/mp4", "video/webm", "video/quicktime"], extensions: { "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov" } },
  audio: { maxBytes: 50 * 1024 * 1024, types: ["audio/mpeg", "audio/mp4", "audio/wav", "audio/ogg"], extensions: { "audio/mpeg": "mp3", "audio/mp4": "m4a", "audio/wav": "wav", "audio/ogg": "ogg" } }
};
const THUMBNAIL_LIMITS = { maxBytes: 2 * 1024 * 1024, types: ["image/jpeg", "image/webp"] };

function randomId() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}

async function putFile(env, key, file) {
  await env.MEDIA.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.create")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    let form;
    try {
      form = await request.formData();
    } catch {
      return json({ error: "Richiesta non valida." }, 400);
    }

    const mediaType = form.get("type");
    const limits = LIMITS[mediaType];
    if (!limits) {
      return json({ error: "Tipo di media non valido." }, 400);
    }

    const file = form.get("file");
    if (!(file instanceof File)) {
      return json({ error: "Nessun file ricevuto." }, 400);
    }
    if (!limits.types.includes(file.type)) {
      return json({ error: `Formato non supportato per ${mediaType}. Ammessi: ${limits.types.join(", ")}.` }, 400);
    }
    if (file.size === 0 || file.size > limits.maxBytes) {
      return json({ error: `Il file supera la dimensione massima (${Math.round(limits.maxBytes / 1024 / 1024)} MB).` }, 400);
    }

    const extension = limits.extensions[file.type];
    const id = randomId();
    const key = `bacheca/uploads/${id}.${extension}`;
    await putFile(env, key, file);

    let thumbKey;
    const thumbnail = form.get("thumbnail");
    if (mediaType === "photo" && thumbnail instanceof File) {
      if (!THUMBNAIL_LIMITS.types.includes(thumbnail.type)) {
        return json({ error: "Formato miniatura non supportato." }, 400);
      }
      if (thumbnail.size === 0 || thumbnail.size > THUMBNAIL_LIMITS.maxBytes) {
        return json({ error: "La miniatura supera la dimensione massima." }, 400);
      }
      thumbKey = `bacheca/uploads/${id}-thumb.jpg`;
      await putFile(env, thumbKey, thumbnail);
    }

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "bacheca",
      eventType: "media_uploaded",
      metadata: { key, mediaType, hasThumbnail: Boolean(thumbKey) }
    }));

    return json({ key, thumbKey }, 201);
  } catch (error) {
    console.error(JSON.stringify({ event: "bacheca_media_upload_error", message: error.message }));
    return json({ error: "Upload non riuscito." }, 500);
  }
}
