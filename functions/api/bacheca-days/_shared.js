const MAX_ROWS = 80;
const MAX_COLUMNS = 3;
const MAX_BLOCKS_PER_COLUMN = 6;
const MAX_TEXT_LENGTH = 4000;
// Le didascalie della Bacheca sono spesso paragrafi narrativi veri, non etichette brevi (la
// più lunga nel contenuto esistente è 736 caratteri) — limite tenuto largo di proposito.
const MAX_CAPTION_LENGTH = 4000;
const MAX_LABEL_LENGTH = 120;
const MAX_HREF_LENGTH = 2000;
const MEDIA_KEY_PATTERN = /^[a-zA-Z0-9/_.-]{1,300}$/;
const HREF_PATTERN = /^https?:\/\/\S{1,2000}$/;
const BLOCK_TYPES = ["text", "photo", "video", "audio", "link"];

function isNonEmptyString(value, maxLength) {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;
}

function validateWidth(value) {
  const width = Number(value);
  return Number.isFinite(width) && width > 0 && width <= 1 ? width : null;
}

function validateInlineLink(value) {
  if (value === undefined || value === null) {
    return { ok: true, link: undefined };
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    return { ok: false };
  }
  if (!isNonEmptyString(value.href, MAX_HREF_LENGTH) || !HREF_PATTERN.test(value.href.trim())) {
    return { ok: false };
  }
  if (!isNonEmptyString(value.label, MAX_LABEL_LENGTH)) {
    return { ok: false };
  }
  return { ok: true, link: { href: value.href.trim(), label: value.label.trim() } };
}

// Un blocco malformato deve far fallire l'intero salvataggio (mai un JSON parzialmente
// valido in pagina): ogni tipo ha i propri campi obbligatori, il resto è ignorato.
function validateBlock(block) {
  if (!block || typeof block !== "object" || Array.isArray(block) || !BLOCK_TYPES.includes(block.type)) {
    return null;
  }

  switch (block.type) {
    case "text": {
      if (!isNonEmptyString(block.text, MAX_TEXT_LENGTH)) return null;
      const linkResult = validateInlineLink(block.link);
      if (!linkResult.ok) return null;
      const out = { type: "text", text: block.text.trim() };
      if (linkResult.link) out.link = linkResult.link;
      return out;
    }
    case "photo": {
      if (!isNonEmptyString(block.key, 300) || !MEDIA_KEY_PATTERN.test(block.key.trim())) return null;
      const out = { type: "photo", key: block.key.trim() };
      if (block.thumbKey !== undefined) {
        if (!isNonEmptyString(block.thumbKey, 300) || !MEDIA_KEY_PATTERN.test(block.thumbKey.trim())) return null;
        out.thumbKey = block.thumbKey.trim();
      }
      if (block.caption !== undefined && block.caption !== "") {
        if (!isNonEmptyString(block.caption, MAX_CAPTION_LENGTH)) return null;
        out.caption = block.caption.trim();
      }
      return out;
    }
    case "video":
    case "audio": {
      if (!isNonEmptyString(block.key, 300) || !MEDIA_KEY_PATTERN.test(block.key.trim())) return null;
      const out = { type: block.type, key: block.key.trim() };
      if (block.label !== undefined && block.label !== "") {
        if (!isNonEmptyString(block.label, MAX_LABEL_LENGTH)) return null;
        out.label = block.label.trim();
      }
      if (block.type === "video" && block.vertical !== undefined) {
        if (typeof block.vertical !== "boolean") return null;
        out.vertical = block.vertical;
      }
      return out;
    }
    case "link": {
      if (!isNonEmptyString(block.href, MAX_HREF_LENGTH) || !HREF_PATTERN.test(block.href.trim())) return null;
      const out = { type: "link", href: block.href.trim() };
      if (block.caption !== undefined && block.caption !== "") {
        if (!isNonEmptyString(block.caption, MAX_CAPTION_LENGTH)) return null;
        out.caption = block.caption.trim();
      }
      return out;
    }
    default:
      return null;
  }
}

function validateColumn(column) {
  const width = validateWidth(column?.width);
  if (width === null) return null;
  if (!Array.isArray(column.blocks) || column.blocks.length === 0 || column.blocks.length > MAX_BLOCKS_PER_COLUMN) {
    return null;
  }
  const blocks = [];
  for (const rawBlock of column.blocks) {
    const block = validateBlock(rawBlock);
    if (!block) return null;
    blocks.push(block);
  }
  return { width, blocks };
}

function validateRow(row) {
  if (!row || typeof row !== "object" || !Array.isArray(row.columns)) return null;
  if (row.columns.length === 0 || row.columns.length > MAX_COLUMNS) return null;
  const columns = [];
  for (const rawColumn of row.columns) {
    const column = validateColumn(rawColumn);
    if (!column) return null;
    columns.push(column);
  }
  return { columns };
}

// Valida l'intero layout di un giorno (righe → colonne → blocchi) prima di scriverlo:
// un JSON malformato non deve mai poter raggiungere la pagina pubblica. Ritorna la versione
// normalizzata (solo i campi noti, valori "trimmati") oppure null se qualcosa non torna.
export function validateContent(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || !Array.isArray(value.rows)) {
    return null;
  }
  if (value.rows.length === 0 || value.rows.length > MAX_ROWS) {
    return null;
  }
  const rows = [];
  for (const rawRow of value.rows) {
    const row = validateRow(rawRow);
    if (!row) return null;
    rows.push(row);
  }
  return { rows };
}

export function normalizeSlug(value) {
  const slug = typeof value === "string" ? value.trim().toLowerCase() : "";
  return /^[a-z][a-z0-9-]{0,63}$/.test(slug) ? slug : null;
}

export function normalizeTitle(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const title = typeof value === "string" ? value.trim() : "";
  return title.length > 0 && title.length <= 120 ? title : undefined;
}

export async function periodExists(env, periodId) {
  if (typeof periodId !== "string" || !periodId) {
    return false;
  }
  const row = await env.DB.prepare("SELECT id FROM bacheca_periods WHERE id = ?").bind(periodId).first();
  return Boolean(row);
}

export async function daySlugExists(env, periodId, slug, excludedId = null) {
  const query = excludedId === null
    ? "SELECT id FROM bacheca_days WHERE period_id = ? AND slug = ? LIMIT 1"
    : "SELECT id FROM bacheca_days WHERE period_id = ? AND slug = ? AND id != ? LIMIT 1";
  const statement = env.DB.prepare(query);
  const row = excludedId === null
    ? await statement.bind(periodId, slug).first()
    : await statement.bind(periodId, slug, excludedId).first();
  return Boolean(row);
}
