// Scambi del gioco di carte collezionabili (#e4), Blocco 2 del piano in
// documentazione/e4-carte-collezionabili.md. Le identità sono sempre 'lui'/'lei' derivate dalla sessione lato
// server (mai dal client), stesso principio di pensieri-biglietti e ponti-chat.

export const MAX_MESSAGGIO_LENGTH = 500;

export function otherIdentity(identity) {
  return identity === "lui" ? "lei" : "lui";
}

// Messaggio libero e opzionale (richiesta esplicita di Rory nel design doc): stringa vuota o
// assente diventa null, non un errore.
export function normalizeMessaggio(value) {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length <= MAX_MESSAGGIO_LENGTH ? trimmed : undefined;
}

// Normalizza e accorpa la lista di carte offerte/richieste: [{ carteDefinizioneId, quantita }].
// Id ripetuti vengono sommati invece di generare righe duplicate. Ritorna null se la forma non
// è valida (non un array, quantità non intere/positive, id non numerici).
export function parseItems(raw) {
  if (!Array.isArray(raw)) return null;

  const byId = new Map();
  for (const entry of raw) {
    const id = Number(entry?.carteDefinizioneId);
    const quantita = Number(entry?.quantita);
    if (!Number.isInteger(id) || id <= 0) return null;
    if (!Number.isInteger(quantita) || quantita <= 0) return null;
    byId.set(id, (byId.get(id) ?? 0) + quantita);
  }

  return [...byId.entries()].map(([carteDefinizioneId, quantita]) => ({ carteDefinizioneId, quantita }));
}

// Verifica che ownerIdentity possieda almeno la quantità richiesta di ciascuna carta elencata.
// Usata sia in proposta (soft-check) sia subito prima di accettare/controproporre (hard-check,
// lo stato può essere cambiato nel frattempo).
export async function findInsufficientItem(env, ownerIdentity, items) {
  for (const item of items) {
    const row = await env.DB
      .prepare("SELECT quantita FROM carte_possesso WHERE owner_identity = ? AND carta_definizione_id = ?")
      .bind(ownerIdentity, item.carteDefinizioneId)
      .first();
    if (!row || row.quantita < item.quantita) return item;
  }
  return null;
}

export async function definizioniExist(env, items) {
  if (items.length === 0) return true;
  const placeholders = items.map(() => "?").join(", ");
  const { results } = await env.DB
    .prepare(`SELECT id FROM carte_definizioni WHERE id IN (${placeholders})`)
    .bind(...items.map((item) => item.carteDefinizioneId))
    .all();
  return results.length === items.length;
}

// Statement d'inserimento per gli item di un lato ('offerta' | 'richiesta') di un trade, da
// aggiungere a un batch insieme all'insert/update del trade stesso.
export function itemInsertStatements(env, tradeId, lato, items) {
  return items.map((item) =>
    env.DB
      .prepare("INSERT INTO carte_trade_items (trade_id, lato, carta_definizione_id, quantita) VALUES (?, ?, ?, ?)")
      .bind(tradeId, lato, item.carteDefinizioneId, item.quantita)
  );
}

// Statement di spostamento di un lato di scambio già accettato: decrementa il possesso di chi
// dà, incrementa (o crea) quello di chi riceve. Il CHECK (quantita >= 0) di carte_possesso fa
// fallire l'intero batch se il pre-check con findInsufficientItem non è più valido (race tra
// la verifica e l'accettazione), quindi la scrittura resta comunque coerente.
export function transferStatements(env, fromIdentity, toIdentity, items, now) {
  const statements = [];
  for (const item of items) {
    statements.push(
      env.DB
        .prepare("UPDATE carte_possesso SET quantita = quantita - ?, updated_at = ? WHERE owner_identity = ? AND carta_definizione_id = ?")
        .bind(item.quantita, now, fromIdentity, item.carteDefinizioneId)
    );
    statements.push(
      env.DB
        .prepare(
          `INSERT INTO carte_possesso (owner_identity, carta_definizione_id, quantita, updated_at)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(owner_identity, carta_definizione_id)
           DO UPDATE SET quantita = quantita + excluded.quantita, updated_at = excluded.updated_at`
        )
        .bind(toIdentity, item.carteDefinizioneId, item.quantita, now)
    );
  }
  return statements;
}

async function fetchItems(env, tradeId, lato) {
  const { results } = await env.DB
    .prepare(
      `SELECT cd.id AS id, cd.finitura AS finitura, des.id AS design_id, des.nome AS design_nome,
              COALESCE(cd.immagine_key, des.immagine_key) AS immagine_key, cti.quantita AS quantita
       FROM carte_trade_items cti
       JOIN carte_definizioni cd ON cd.id = cti.carta_definizione_id
       JOIN carte_designs des ON des.id = cd.design_id
       WHERE cti.trade_id = ? AND cti.lato = ?`
    )
    .bind(tradeId, lato)
    .all();

  return results.map((row) => ({
    carteDefinizioneId: String(row.id),
    finitura: row.finitura,
    designId: String(row.design_id),
    designNome: row.design_nome,
    immagineKey: row.immagine_key,
    quantita: row.quantita
  }));
}

export async function toTradeView(env, trade) {
  const [offerta, richiesta] = await Promise.all([
    fetchItems(env, trade.id, "offerta"),
    fetchItems(env, trade.id, "richiesta")
  ]);

  return {
    id: String(trade.id),
    proponenteIdentity: trade.proponente_identity,
    destinatarioIdentity: trade.destinatario_identity,
    stato: trade.stato,
    messaggio: trade.messaggio,
    tradePrecedenteId: trade.trade_precedente_id !== null ? String(trade.trade_precedente_id) : null,
    createdAt: trade.created_at,
    risoltoAt: trade.risolto_at,
    offerta,
    richiesta
  };
}
