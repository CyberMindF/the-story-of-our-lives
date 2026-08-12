const MAX_TITLE_LENGTH = 60;
const MAX_ICON_LENGTH = 8;
const MAX_NOTE_LENGTH = 2000;

export function normalizeTitle(value) {
  const title = typeof value === "string" ? value.trim() : "";
  return title && title.length <= MAX_TITLE_LENGTH ? title : null;
}

export function normalizeIcon(value) {
  const icon = typeof value === "string" ? value.trim() : "";
  return icon && icon.length <= MAX_ICON_LENGTH ? icon : null;
}

// La nota è facoltativa: non ogni categoria ne ha una (solo "Sentimenti" oggi).
export function normalizeNote(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const note = typeof value === "string" ? value.trim() : "";
  return note.length <= MAX_NOTE_LENGTH ? note : undefined;
}
