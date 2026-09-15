const MAX_FOLDER_NAME_LENGTH = 120;

export function normalizeFolderName(value) {
  const name = typeof value === "string" ? value.trim() : "";
  return name && name.length <= MAX_FOLDER_NAME_LENGTH ? name : null;
}

export function normalizeFolderId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function normalizeNullableFolderId(value) {
  if (value === null || value === undefined || value === "") return null;
  return normalizeFolderId(value) ?? undefined;
}

export function toFolderView(row) {
  return {
    id: row.id,
    name: row.name,
    parentId: row.parent_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function folderExists(env, folderId) {
  if (folderId === null) return true;
  return Boolean(
    await env.DB.prepare(
      "SELECT id FROM study_folders WHERE id = ? AND deleted_at IS NULL",
    )
      .bind(folderId)
      .first(),
  );
}
