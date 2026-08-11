import { getAuthenticatedSession, json, readJson } from "./auth/_shared.js";

// Chiavi note: allowlist esplicita invece di accettare qualunque stringa dal client, per non
// lasciare che "world_settings" accumuli righe arbitrarie mai lette da nessuna UI.
const KNOWN_KEYS = new Set(["lanterns", "stars"]);

// Interruttori condivisi degli effetti del Mondo Bianco (vedi migrations/0022): non uno per
// utente come il tema, uno solo per tutti e due — chi lo accende lo vede anche l'altro.
export async function onRequestGet(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const result = await context.env.DB.prepare("SELECT key, enabled FROM world_settings").all();
    const settings = {};
    for (const row of result.results) {
      settings[row.key] = row.enabled === 1;
    }

    return json({ settings });
  } catch (error) {
    console.error(JSON.stringify({ event: "world_settings_get_error", message: error.message }));
    return json({ error: "Errore interno del server." }, 500);
  }
}

// Aggiorna un solo interruttore alla volta.
export async function onRequestPost(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const body = await readJson(context.request);
    const key = body?.key;
    if (typeof key !== "string" || !KNOWN_KEYS.has(key)) {
      return json({ error: "Impostazione sconosciuta." }, 400);
    }

    const enabled = body.enabled === true ? 1 : 0;
    const updatedAt = new Date().toISOString();

    await context.env.DB
      .prepare(`
        INSERT INTO world_settings (key, enabled, updated_by, updated_at) VALUES (?, ?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET enabled = excluded.enabled, updated_by = excluded.updated_by, updated_at = excluded.updated_at
      `)
      .bind(key, enabled, session.user.id, updatedAt)
      .run();

    return json({ key, enabled: enabled === 1 });
  } catch (error) {
    console.error(JSON.stringify({ event: "world_settings_post_error", message: error.message }));
    return json({ error: "Non è stato possibile salvare l'impostazione." }, 500);
  }
}
