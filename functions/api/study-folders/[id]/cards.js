import { getAuthenticatedSession, json } from "../../auth/_shared.js";
import {
  TOPIC_WITH_CARDS_SELECT,
  topicsFromRows,
} from "../../study-topics/_shared.js";
import { normalizeFolderId } from "../_shared.js";

export async function onRequestGet({ request, env, params }) {
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const folderId = normalizeFolderId(params.id);
    if (!folderId) return json({ error: "Cartella non valida." }, 400);
    const folder = await env.DB.prepare(
      "SELECT id FROM study_folders WHERE id = ? AND deleted_at IS NULL",
    )
      .bind(folderId)
      .first();
    if (!folder) return json({ error: "Cartella non trovata." }, 404);

    const { results } = await env.DB.prepare(
      `WITH RECURSIVE descendant_folders(id) AS (
         SELECT id FROM study_folders WHERE id = ? AND deleted_at IS NULL
         UNION ALL
         SELECT folders.id
         FROM study_folders AS folders
         JOIN descendant_folders ON folders.parent_id = descendant_folders.id
         WHERE folders.deleted_at IS NULL
       )
       ${TOPIC_WITH_CARDS_SELECT}
       AND topics.folder_id IN (SELECT id FROM descendant_folders)
       ORDER BY topics.updated_at DESC, topics.id DESC, cards.position ASC`,
    )
      .bind(folderId)
      .all();

    return json({ topics: topicsFromRows(results) });
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "study_folder_cards_error",
        message: error.message,
      }),
    );
    return json({ error: "Non è stato possibile caricare le flashcard." }, 500);
  }
}
