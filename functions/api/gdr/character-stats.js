import { getAuthenticatedSession, json } from "../auth/_shared.js";

// Statistiche del personaggio in forma chiave/valore, per avventure GDR che non usano lo
// schema fisso di gdr_characters (pensato per "Il Prezzo della Verità", un personaggio per
// account). Qui la scheda è unica e condivisa: non c'è "adventure + user_id", solo
// "adventure" — chi la apre, master o giocatrice, vede sempre la stessa. Allowlist per
// avventura qui, non in un CHECK su schema.sql: aggiungere una nuova avventura con le sue
// statistiche è solo una nuova voce in questa mappa, senza migrazioni.
const STAT_DEFINITIONS = {
  "la-casa-che-trattiene-il-respiro": {
    lucidita: { min: 0, max: 3, default: 3 }
  }
};

export async function onRequestGet(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const url = new URL(context.request.url);
    const adventure = url.searchParams.get("adventure");
    const definitions = STAT_DEFINITIONS[adventure];
    if (!definitions) return json({ error: "Avventura sconosciuta." }, 400);

    const { results } = await context.env.DB
      .prepare("SELECT stat_key, value FROM gdr_character_stats WHERE adventure = ?")
      .bind(adventure)
      .all();

    const stored = new Map((results || []).map((row) => [row.stat_key, row.value]));
    const stats = {};
    for (const [key, def] of Object.entries(definitions)) {
      stats[key] = stored.has(key) ? stored.get(key) : def.default;
    }

    return json({ stats });
  } catch (error) {
    console.error(JSON.stringify({ event: "gdr_character_stats_get_error", message: error.message }));
    return json({ error: "Errore interno del server." }, 500);
  }
}

export async function onRequestPost(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const form = await context.request.formData();
    const adventure = form.get("adventure");
    const statKey = form.get("statKey");
    const definitions = STAT_DEFINITIONS[adventure];
    const def = definitions?.[statKey];
    if (!def) return json({ error: "Statistica sconosciuta." }, 400);

    const rawValue = Number.parseInt(form.get("value"), 10);
    const value = Number.isFinite(rawValue) ? Math.min(def.max, Math.max(def.min, rawValue)) : def.default;
    const updatedAt = new Date().toISOString();

    await context.env.DB
      .prepare(`
        INSERT INTO gdr_character_stats (adventure, stat_key, value, updated_by, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT (adventure, stat_key) DO UPDATE SET value = excluded.value, updated_by = excluded.updated_by, updated_at = excluded.updated_at
      `)
      .bind(adventure, statKey, value, session.user.id, updatedAt)
      .run();

    return json({ saved: true, value, updatedAt });
  } catch (error) {
    console.error(JSON.stringify({ event: "gdr_character_stats_post_error", message: error.message }));
    return json({ error: "Non è stato possibile salvare la statistica." }, 500);
  }
}
