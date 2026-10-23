import { getAuthenticatedSession, json, readJson } from "../auth/_shared.js";

export async function onRequestPost({ request, env }) {
  const session = await getAuthenticatedSession(request, env);
  if (!session) return json({ error: "Accesso richiesto." }, 401);
  const body = await readJson(request);
  const ids = [...new Set(Array.isArray(body?.ids) ? body.ids.map(Number).filter(Number.isInteger) : [])].slice(0, 200);
  if (ids.length === 0) return json({ ok: true });
  const now = new Date().toISOString();
  await env.DB.batch(ids.map((id) => env.DB.prepare(
    `INSERT INTO world_update_reads (user_id, update_id, seen_at) VALUES (?, ?, ?)
     ON CONFLICT(user_id, update_id) DO UPDATE SET seen_at = excluded.seen_at`
  ).bind(session.user.id, id, now)));
  return json({ ok: true });
}
