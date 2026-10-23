const DELTAS = [-2, -1, 1, 2];
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export class CounterError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
function check(value, message) { if (!value) throw new CounterError(message); }
function revision(value) { check(Number.isSafeInteger(value) && value >= 0, 'Versione del record non valida.'); }

// Tutte le query sono limitate al proprietario ricavato dalla sessione, mai dal payload.
// Ogni risposta è uno snapshot atomico; non esiste un totale persistito che possa divergere.
export async function counterRequest(request, database, userId) {
  const method = request.method;
  if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(method)) throw new CounterError('Metodo non consentito.', 405);
  let body;
  if (method !== 'GET') {
    const raw = await request.text();
    check(raw.length <= 12000, 'Richiesta troppo grande.');
    try { body = JSON.parse(raw); } catch { throw new CounterError('JSON non valido.'); }
    check(body && typeof body === 'object' && !Array.isArray(body), 'Richiesta non valida.');
  }
  const db = database.withSession('first-primary');
  const now = new Date().toISOString();
  const queries = [db.prepare('INSERT INTO love_counter_settings (user_id, created_at) VALUES (?, ?) ON CONFLICT(user_id) DO NOTHING').bind(userId, now)];
  let guarded = false;
  if (method === 'POST') {
    check(typeof body.id === 'string' && UUID.test(body.id), 'Identificativo non valido.');
    check(body.delta === 1 || body.delta === -1, 'La registrazione rapida accetta solo +1 o −1.');
    // ID stabile del client: un retry non raddoppia l'episodio, nemmeno dopo la sua eliminazione.
    queries.push(db.prepare(`INSERT INTO love_counter_episodes (user_id, id, delta, occurred_at, created_at)
      VALUES (?, ?, ?, ?, ?) ON CONFLICT(user_id, id) DO NOTHING`).bind(userId, body.id, body.delta, now, now));
  } else if (method === 'PATCH' && body.action === 'settings') {
    check(Number.isSafeInteger(body.initialScore), 'Il punteggio iniziale deve essere un numero intero.');
    revision(body.revision);
    queries.push(db.prepare('UPDATE love_counter_settings SET initial_score = ?, revision = revision + 1 WHERE user_id = ? AND revision = ?')
      .bind(body.initialScore, userId, body.revision));
    guarded = true;
  } else if (method === 'PATCH' || method === 'DELETE') {
    check(typeof body.id === 'string' && UUID.test(body.id), 'Identificativo non valido.');
    revision(body.revision);
    if (method === 'PATCH') {
      check(DELTAS.includes(body.delta), 'Scegli +1, −1, +2 o −2.');
      check(typeof body.reason === 'string' && body.reason.length <= 2000, 'La motivazione può contenere al massimo 2000 caratteri.');
      if (body.psychologistComment !== undefined) {
        check(typeof body.psychologistComment === 'string' && body.psychologistComment.length <= 2000,
          'Il commento dello psicologo può contenere al massimo 2000 caratteri.');
      }
      check(typeof body.occurredAt === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(body.occurredAt)
        && Number.isFinite(Date.parse(body.occurredAt)) && new Date(body.occurredAt).toISOString() === body.occurredAt, 'Data e ora non valide.');
      const psychologistComment = body.psychologistComment === undefined ? null : body.psychologistComment.trim();
      queries.push(db.prepare(`UPDATE love_counter_episodes SET delta = ?, reason = ?,
        psychologist_comment = CASE WHEN ? IS NULL THEN psychologist_comment ELSE ? END,
        occurred_at = ?, revision = revision + 1
        WHERE user_id = ? AND id = ? AND revision = ? AND deleted_at IS NULL`)
        .bind(body.delta, body.reason.trim(), psychologistComment, psychologistComment, body.occurredAt, userId, body.id, body.revision));
    } else {
      // Conserviamo solo una tombstone per l'idempotenza: la motivazione eliminata viene rimossa.
      queries.push(db.prepare(`UPDATE love_counter_episodes SET deleted_at = ?, reason = '', psychologist_comment = '', revision = revision + 1
        WHERE user_id = ? AND id = ? AND revision = ? AND deleted_at IS NULL`).bind(now, userId, body.id, body.revision));
    }
    guarded = true;
  }
  queries.push(db.prepare('SELECT initial_score AS initialScore, created_at AS createdAt, revision FROM love_counter_settings WHERE user_id = ?').bind(userId));
  queries.push(db.prepare(`SELECT id, delta, reason, psychologist_comment AS psychologistComment,
    occurred_at AS occurredAt, created_at AS createdAt, revision
    FROM love_counter_episodes WHERE user_id = ? AND deleted_at IS NULL ORDER BY occurred_at, created_at, id`).bind(userId));
  const results = await db.batch(queries);
  if (guarded && results[1].meta.changes !== 1) throw new CounterError('Questo elemento è cambiato o è stato eliminato in un’altra scheda. Ricarica lo storico prima di modificarlo.', 409);
  return { settings: results.at(-2).results[0], episodes: results.at(-1).results };
}
