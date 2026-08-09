import { getAuthenticatedSession, json } from "../auth/_shared.js";
import { recordEvent } from "../_shared/events.js";

const MAX_TEXT_LENGTH = 4000;
const DEFAULT_ADVENTURE = "il-prezzo-della-verita";
const DEFAULT_INVENTORY = [
  "Mantello da apprendista",
  "Bacchetta magica (registrata)",
  "Attestato da apprendista mago",
  "Moneta portafortuna",
  "Taccuino personale"
].join("\n");

const DEFAULTS = {
  name: "",
  catName: "",
  description: "",
  statMente: 1,
  statCuore: 1,
  statCorpo: 1,
  statMagia: 1,
  stressCurrent: 10,
  spellSlotsCurrent: 3,
  inventory: DEFAULT_INVENTORY
};

// Legge la scheda personaggio dell'utente per una specifica avventura; se non esiste ancora
// restituisce i valori di partenza (senza crearla finché non viene salvata la prima volta).
export async function onRequestGet(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const url = new URL(context.request.url);
    const adventure = normalizeAdventure(url.searchParams.get("adventure"));

    const row = await context.env.DB
      .prepare(`
        SELECT name, cat_name, description, stat_mente, stat_cuore, stat_corpo, stat_magia,
               stress_current, spell_slots_current, inventory, updated_at
        FROM gdr_characters WHERE user_id = ? AND adventure = ?
      `)
      .bind(session.user.id, adventure)
      .first();

    if (!row) {
      return json({ character: DEFAULTS, updatedAt: null });
    }

    return json({
      character: {
        name: row.name,
        catName: row.cat_name,
        description: row.description,
        statMente: row.stat_mente,
        statCuore: row.stat_cuore,
        statCorpo: row.stat_corpo,
        statMagia: row.stat_magia,
        stressCurrent: row.stress_current,
        spellSlotsCurrent: row.spell_slots_current,
        inventory: row.inventory
      },
      updatedAt: row.updated_at
    });
  } catch (error) {
    console.error(JSON.stringify({ event: "gdr_character_get_error", message: error.message }));
    return json({ error: "Errore interno del server." }, 500);
  }
}

// Salva (o aggiorna) la scheda personaggio dell'utente per una specifica avventura.
export async function onRequestPost(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const form = await context.request.formData();
    const adventure = normalizeAdventure(form.get("adventure"));
    const name = normalizeText(form.get("name"));
    const catName = normalizeText(form.get("catName"));
    const description = normalizeText(form.get("description"));
    const statMente = normalizeStat(form.get("statMente"));
    const statCuore = normalizeStat(form.get("statCuore"));
    const statCorpo = normalizeStat(form.get("statCorpo"));
    const statMagia = normalizeStat(form.get("statMagia"));
    const stressCurrent = normalizeRange(form.get("stressCurrent"), 0, 10, 10);
    const spellSlotsCurrent = normalizeRange(form.get("spellSlotsCurrent"), 0, 3, 3);
    const inventory = normalizeText(form.get("inventory"));
    const updatedAt = new Date().toISOString();

    await context.env.DB
      .prepare(`
        INSERT INTO gdr_characters (
          user_id, adventure, name, cat_name, description,
          stat_mente, stat_cuore, stat_corpo, stat_magia,
          stress_current, spell_slots_current, inventory, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (user_id, adventure) DO UPDATE SET
          name = excluded.name,
          cat_name = excluded.cat_name,
          description = excluded.description,
          stat_mente = excluded.stat_mente,
          stat_cuore = excluded.stat_cuore,
          stat_corpo = excluded.stat_corpo,
          stat_magia = excluded.stat_magia,
          stress_current = excluded.stress_current,
          spell_slots_current = excluded.spell_slots_current,
          inventory = excluded.inventory,
          updated_at = excluded.updated_at
      `)
      .bind(
        session.user.id, adventure, name, catName, description,
        statMente, statCuore, statCorpo, statMagia,
        stressCurrent, spellSlotsCurrent, inventory, updatedAt
      )
      .run();

    context.waitUntil(recordEvent(
      context.env,
      { userId: session.user.id, sessionId: session.sessionId },
      { section: "gdr", eventType: "gdr_character_saved", metadata: { adventure } }
    ));

    return json({ saved: true, updatedAt });
  } catch (error) {
    console.error(JSON.stringify({ event: "gdr_character_post_error", message: error.message }));
    return json({ error: "Non è stato possibile salvare la scheda." }, 500);
  }
}

function normalizeAdventure(value) {
  if (typeof value !== "string") return DEFAULT_ADVENTURE;
  const trimmed = value.trim();
  return trimmed || DEFAULT_ADVENTURE;
}

function normalizeText(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return trimmed.length <= MAX_TEXT_LENGTH ? trimmed : trimmed.slice(0, MAX_TEXT_LENGTH);
}

// Le statistiche seguono la regola della scheda: minimo 1, massimo 5.
function normalizeStat(value) {
  return normalizeRange(value, 1, 5, 1);
}

function normalizeRange(value, min, max, fallback) {
  const num = Number.parseInt(value, 10);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}
