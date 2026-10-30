import { getAuthenticatedSession, json, readJson } from './_shared.js';

// Preferenza personale: nessuna modifica alle impostazioni condivise del mondo.
export async function onRequestPost({ request, env }) {
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: 'Accesso richiesto.' }, 401);
    const body = await readJson(request);
    if (typeof body?.enabled !== 'boolean') return json({ error: 'Scelta non valida.' }, 400);
    await env.DB.prepare('UPDATE users SET safe_mode = ? WHERE id = ?')
      .bind(body.enabled ? 1 : 0, session.user.id).run();
    return json({ safeMode: body.enabled });
  } catch {
    return json({ error: 'Non è stato possibile salvare la safe mode.' }, 500);
  }
}
