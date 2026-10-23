import { getAuthenticatedSession, json, readJson } from "../auth/_shared.js";

export async function onRequestPost({ request, env }) {
  const session = await getAuthenticatedSession(request, env);
  if (!session) return json({ error: "Accesso richiesto." }, 401);
  const body = await readJson(request);
  const promoId = Number(body?.promoId);
  if (!Number.isInteger(promoId)) return json({ error: "Pubblicità non valida." }, 400);
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO world_promo_views (user_id, promo_id, last_seen_at, impression_count)
     SELECT ?, id, ?, 1 FROM world_promos WHERE id = ? AND active = 1
     ON CONFLICT(user_id, promo_id) DO UPDATE SET
       last_seen_at = excluded.last_seen_at, impression_count = impression_count + 1`
  ).bind(session.user.id, now, promoId).run();
  return json({ ok: true });
}
