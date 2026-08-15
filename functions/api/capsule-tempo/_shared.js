const MAX_TEXT_LENGTH = 4000;
const MAX_TITLE_LENGTH = 120;

export function normalizeText(value) {
  const text = typeof value === "string" ? value.trim() : "";
  return text && text.length <= MAX_TEXT_LENGTH ? text : null;
}

export function normalizeTitle(value) {
  const title = typeof value === "string" ? value.trim() : "";
  return title && title.length <= MAX_TITLE_LENGTH ? title : null;
}

// Solo date future (rispetto a oggi, non a questo istante): 'YYYY-MM-DD' confrontabile
// come stringa con la data odierna in formato identico.
export function normalizeUnlockDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const today = new Date().toISOString().slice(0, 10);
  return value > today ? value : null;
}

export function isUnlocked(unlockDate) {
  const today = new Date().toISOString().slice(0, 10);
  return unlockDate <= today;
}

// Prima dello sblocco il contenuto (testo, titolo, foto) non deve mai arrivare al client,
// anche se non ancora aperto sul sito: il payload di rete stesso è la barriera, non solo la UI.
export function toCapsulaView(row) {
  const unlocked = isUnlocked(row.unlock_date);
  return {
    id: String(row.id),
    unlockDate: row.unlock_date,
    authorIdentity: row.author_identity,
    isUnlocked: unlocked,
    title: unlocked ? row.title : null,
    text: unlocked ? row.text : null,
    mediaKey: unlocked ? row.media_key : null,
    mediaType: unlocked ? row.media_type : null,
    createdAt: row.created_at
  };
}
