import { hasPermission } from "../../_shared/permissions.js";
import { getAuthenticatedSession, json } from "../_shared.js";

function canManageTestAccounts(session) {
  return session?.adminModeEnabled && hasPermission(session.user.role, "users.manage");
}

// Elimina esclusivamente dati che il perimetro dell'account test gli permette di creare.
// Le tabelle condivise/editoriali non possono essere mutate da un account test a monte.
export async function onRequestDelete(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!canManageTestAccounts(session)) return json({ error: "Non autorizzato." }, 403);

    const userId = Number(context.params.id);
    if (!Number.isInteger(userId) || userId <= 0) return json({ error: "Id non valido." }, 400);

    const target = await context.env.DB
      .prepare("SELECT id, email, nickname FROM users WHERE id = ? AND is_test = 1")
      .bind(userId)
      .first();
    if (!target) return json({ error: "Account di prova non trovato." }, 404);

    const statements = [
      "DELETE FROM carte_trade_items WHERE trade_id IN (SELECT id FROM carte_trade WHERE proponente_user_id = ? OR destinatario_user_id = ?)",
      "UPDATE carte_trade SET trade_precedente_id = NULL WHERE trade_precedente_id IN (SELECT id FROM carte_trade WHERE proponente_user_id = ? OR destinatario_user_id = ?)",
      "DELETE FROM carte_trade WHERE proponente_user_id = ? OR destinatario_user_id = ?",
      "DELETE FROM carte_possesso WHERE user_id = ?",
      "DELETE FROM carte_bustine WHERE user_id = ?",
      "DELETE FROM carte_streak WHERE user_id = ?",
      "DELETE FROM ponti_chat_messages WHERE created_by = ?",
      "DELETE FROM stranger_chat_messages WHERE created_by = ?",
      "DELETE FROM letters WHERE author_id = ?",
      "DELETE FROM letter_drafts WHERE user_id = ?",
      "DELETE FROM gdr_turns WHERE author_id = ?",
      "DELETE FROM gdr_notes WHERE user_id = ?",
      "DELETE FROM gdr_characters WHERE user_id = ?",
      "DELETE FROM story_suggestions WHERE user_id = ?",
      "DELETE FROM world_suggestions WHERE user_id = ?",
      "DELETE FROM crossword_answers WHERE user_id = ?",
      "DELETE FROM crossword_word_attempts WHERE user_id = ?",
      "DELETE FROM events WHERE user_id = ?",
      "DELETE FROM visit_session_links WHERE user_id = ?",
      "DELETE FROM password_reset_tokens WHERE user_id = ?",
      "DELETE FROM user_access_ips WHERE user_id = ?",
      "DELETE FROM sessions WHERE user_id = ?",
      "DELETE FROM users WHERE id = ? AND is_test = 1"
    ];

    await context.env.DB.batch(statements.map((sql, index) => {
      const statement = context.env.DB.prepare(sql);
      return index < 3 ? statement.bind(userId, userId) : statement.bind(userId);
    }));

    return json({ rolledBack: true, user: target });
  } catch (error) {
    console.error(JSON.stringify({ event: "test_account_rollback_error", message: error.message }));
    return json({ error: "Non è stato possibile completare il rollback." }, 500);
  }
}
