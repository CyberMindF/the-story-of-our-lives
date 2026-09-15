import { getAuthenticatedSession, json } from "../auth/_shared.js";
import { hasPermission } from "../_shared/permissions.js";

export async function requireStudyBulkAdmin(request, env) {
  const session = await getAuthenticatedSession(request, env);
  if (!session) {
    return { response: json({ error: "Sessione non valida o scaduta." }, 401) };
  }
  if (
    !session.adminModeEnabled ||
    !hasPermission(session.user.role, "study.bulk_import")
  ) {
    return {
      response: json(
        { error: "Importazione riservata alla Modalità admin." },
        403,
      ),
    };
  }
  return { session };
}

export async function loadStudyFolders(env) {
  const { results } = await env.DB.prepare(
    "SELECT id, parent_id, name FROM study_folders WHERE deleted_at IS NULL ORDER BY id",
  ).all();
  return results;
}

export function prepareD1Statements(env, operations) {
  return operations.map((operation) =>
    env.DB.prepare(operation.sql).bind(...operation.params),
  );
}

export function parseSummary(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
