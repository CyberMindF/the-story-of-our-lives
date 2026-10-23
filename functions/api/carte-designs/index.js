import { getAuthenticatedSession, json, readJson } from "../auth/_shared.js";
import { hasPermission } from "../_shared/permissions.js";
import { recordEvent } from "../_shared/events.js";

// Editor admin dei design (#e4, Blocco 3): un soggetto concreto (foto/sticker/emoji) dentro un
// set. L'immagine è unica per design e condivisa dalle 5 finiture (COALESCE già gestito da
// GET /api/carte-collezione) — caricare artwork distinti per finitura non è ancora deciso con
// Rory (vedi "Cosa NON è ancora deciso" in documentazione/e4-carte-collezionabili.md), quindi non è
// supportato qui: si può aggiungere dopo senza rompere niente, la colonna immagine_key su
// carte_definizioni esiste già per quel caso.
export async function onRequestGet(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.read")) return json({ error: "Non autorizzato." }, 403);

    const { results } = await context.env.DB.prepare("SELECT * FROM carte_designs ORDER BY set_id, position").all();
    return json({ designs: results.map(toDesignView) });
  } catch (error) {
    console.error(JSON.stringify({ event: "carte_designs_list_error", message: error.message }));
    return json({ error: "Errore interno del server." }, 500);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.create")) return json({ error: "Non autorizzato." }, 403);

    const payload = await readJson(request);
    const setId = Number(payload?.setId);
    const nome = typeof payload?.nome === "string" ? payload.nome.trim() : "";
    const immagineKey = typeof payload?.immagineKey === "string" && payload.immagineKey.trim() ? payload.immagineKey.trim() : null;

    if (!Number.isInteger(setId)) return json({ error: "Set non valido." }, 400);
    if (!nome) return json({ error: "Nome non valido." }, 400);

    const set = await env.DB.prepare("SELECT id, COALESCE(tipo, 'normale') AS tipo FROM carte_sets WHERE id = ?").bind(setId).first();
    if (!set) return json({ error: "Set non trovato." }, 404);
    const categoriaTarocco = normalizeCategoriaTarocco(payload?.categoriaTarocco, set.tipo);
    const numeroTarocco = normalizeNumeroTarocco(payload?.numeroTarocco, set.tipo);
    if (categoriaTarocco === undefined) return json({ error: "Sezione del Tarocco non valida." }, 400);
    if (numeroTarocco === undefined) return json({ error: "Numero del Tarocco non valido." }, 400);

    const maxPosition = await env.DB.prepare("SELECT MAX(position) AS max FROM carte_designs WHERE set_id = ?").bind(setId).first();
    const position = (maxPosition?.max ?? -1) + 1;
    const now = new Date().toISOString();

    const created = await env.DB
      .prepare(
        `INSERT INTO carte_designs
           (set_id, nome, immagine_key, categoria_tarocco, numero_tarocco, position, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`
      )
      .bind(setId, nome, immagineKey, categoriaTarocco, numeroTarocco, position, session.user.id, now)
      .first();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "carte",
      eventType: "carte_design_creato",
      metadata: { designId: created.id, setId }
    }));

    return json(toDesignView(created), 201);
  } catch (error) {
    console.error(JSON.stringify({ event: "carte_designs_create_error", message: error.message }));
    return json({ error: "Non è stato possibile creare la carta." }, 500);
  }
}

export function toDesignView(row) {
  return {
    id: String(row.id),
    setId: String(row.set_id),
    nome: row.nome,
    immagineKey: row.immagine_key,
    categoriaTarocco: row.categoria_tarocco ?? null,
    numeroTarocco: row.numero_tarocco ?? null,
    position: row.position
  };
}

export function normalizeCategoriaTarocco(value, tipo) {
  if (tipo !== "tarocchi") return null;
  const allowed = new Set(["maggiori", "bastoni", "coppe", "spade", "denari", "speciali"]);
  return typeof value === "string" && allowed.has(value) ? value : undefined;
}

export function normalizeNumeroTarocco(value, tipo) {
  if (tipo !== "tarocchi") return null;
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length <= 20 ? (trimmed || null) : undefined;
}
