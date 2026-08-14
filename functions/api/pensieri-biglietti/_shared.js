const MAX_TEXT_LENGTH = 1000;
const MAX_TITLE_LENGTH = 120;

export function normalizeText(value) {
  const text = typeof value === "string" ? value.trim() : "";
  return text && text.length <= MAX_TEXT_LENGTH ? text : null;
}

// Il titolo ("Per quando…") è facoltativo: assente per la maggior parte dei biglietti.
export function normalizeTitle(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const title = typeof value === "string" ? value.trim() : "";
  return title.length <= MAX_TITLE_LENGTH ? title : undefined;
}

export function otherIdentity(identity) {
  return identity === "lui" ? "lei" : "lui";
}

export function toBigliettoView(row) {
  return {
    id: String(row.id),
    jarIdentity: row.jar_identity,
    text: row.text,
    title: row.title,
    isActive: Boolean(row.is_active),
    position: row.position,
    drawCount: row.draw_count,
    updatedAt: row.updated_at
  };
}
