import { getAuthenticatedSession } from "../auth/_shared.js";
import { applyByteRangeHeaders, parseByteRange } from "./_range.mjs";

// Serve un oggetto privato da R2 soltanto dopo aver verificato la sessione dell'utente.
export async function onRequestGet(context) {
  const session = await getAuthenticatedSession(context.request, context.env);
  if (!session) {
    return new Response("Non autorizzato.", { status: 401 });
  }

  const segments = context.params.path;
  const key = Array.isArray(segments) ? segments.join("/") : segments;
  if (!key || key.includes("..")) {
    return new Response("Percorso non valido.", { status: 400 });
  }

  const rangeHeader = context.request.headers.get("Range");
  let object;
  let fullSize;
  let range = null;

  if (rangeHeader) {
    const metadata = await context.env.MEDIA.head(key);
    if (!metadata) return new Response("Non trovato.", { status: 404 });
    fullSize = metadata.size;
    range = parseByteRange(rangeHeader, fullSize);
    if (!range) {
      return new Response("Intervallo non valido.", {
        status: 416,
        headers: { "Content-Range": `bytes */${fullSize}`, "Accept-Ranges": "bytes" }
      });
    }
    object = await context.env.MEDIA.get(key, { range });
  } else {
    object = await context.env.MEDIA.get(key);
    fullSize = object?.size;
  }
  if (!object) {
    return new Response("Non trovato.", { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("Cache-Control", "private, max-age=300");
  headers.set("Accept-Ranges", "bytes");

  if (range) {
    applyByteRangeHeaders(headers, range, fullSize);
  }

  return new Response(object.body, { status: range ? 206 : 200, headers });
}
