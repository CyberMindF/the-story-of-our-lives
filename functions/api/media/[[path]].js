import { getAuthenticatedSession } from "../auth/_shared.js";

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

  const object = await context.env.MEDIA.get(key);
  if (!object) {
    return new Response("Non trovato.", { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("Cache-Control", "private, max-age=300");

  return new Response(object.body, { headers });
}
