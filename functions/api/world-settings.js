import { getAuthenticatedSession, json, readJson } from "./auth/_shared.js";

// Chiavi note: allowlist esplicita invece di accettare qualunque stringa dal client, per non
// lasciare che "world_settings" accumuli righe arbitrarie mai lette da nessuna UI.
const KNOWN_KEYS = new Set(["lanterns", "stars", "moon", "theme", "sparkles", "leaves", "waves", "petals"]);

// Solo alcune chiavi accettano anche un "value" oltre a enabled (es. la luna: la fase scelta,
// "auto" o un indice 0-7; il tema: quale dei 5; i fiori: quale forma o "mix") — allowlist dei
// valori validi per non lasciare che il client scriva testo arbitrario nella colonna.
// Stessi 5 id di THEMES in web/src/app/core/theme.service.ts — non importabile da qui (mondi
// diversi, Angular vs Functions), va tenuto sincronizzato a mano se cambiano i temi. Stessi 3
// PetalKind di world-petals.ts, stesso discorso.
const VALID_VALUES = {
  moon: new Set(["auto", "0", "1", "2", "3", "4", "5", "6", "7"]),
  theme: new Set(["the-white-world", "sea", "velvet", "red-of-you", "green-of-me"]),
  petals: new Set(["mix", "daisy", "pink", "rose"])
};

// Interruttori condivisi degli effetti del Mondo Bianco (vedi migrations/0022): non uno per
// utente come il tema, uno solo per tutti e due — chi lo accende lo vede anche l'altro.
export async function onRequestGet(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const result = await context.env.DB.prepare("SELECT key, enabled, value FROM world_settings").all();
    const settings = {};
    const values = {};
    for (const row of result.results) {
      settings[row.key] = row.enabled === 1;
      if (row.value !== null) {
        values[row.key] = row.value;
      }
    }

    return json({ settings, values });
  } catch (error) {
    console.error(JSON.stringify({ event: "world_settings_get_error", message: error.message }));
    return json({ error: "Errore interno del server." }, 500);
  }
}

// Aggiorna un solo interruttore (ed eventualmente il suo value) alla volta.
export async function onRequestPost(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const body = await readJson(context.request);
    const key = body?.key;
    if (typeof key !== "string" || !KNOWN_KEYS.has(key)) {
      return json({ error: "Impostazione sconosciuta." }, 400);
    }

    let value = null;
    if (body?.value !== undefined && body.value !== null) {
      const allowedValues = VALID_VALUES[key];
      if (!allowedValues || typeof body.value !== "string" || !allowedValues.has(body.value)) {
        return json({ error: "Valore non valido per questa impostazione." }, 400);
      }
      value = body.value;
    }

    const enabled = body.enabled === true ? 1 : 0;
    const updatedAt = new Date().toISOString();

    // COALESCE(?, value): un POST che aggiorna solo "enabled" (value non inviato) non deve
    // azzerare la fase già scelta in precedenza.
    await context.env.DB
      .prepare(`
        INSERT INTO world_settings (key, enabled, value, updated_by, updated_at) VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET
          enabled = excluded.enabled,
          value = COALESCE(?, world_settings.value),
          updated_by = excluded.updated_by,
          updated_at = excluded.updated_at
      `)
      .bind(key, enabled, value, session.user.id, updatedAt, value)
      .run();

    return json({ key, enabled: enabled === 1, value });
  } catch (error) {
    console.error(JSON.stringify({ event: "world_settings_post_error", message: error.message }));
    return json({ error: "Non è stato possibile salvare l'impostazione." }, 500);
  }
}
