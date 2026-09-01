// Unica sorgente di verita' per il perimetro dei dati creati dagli account test.
// Viene riusata sia dal reset conservativo sia dall'eliminazione definitiva.
export async function getTestAccount(env, userId) {
  return env.DB
    .prepare("SELECT id, email, nickname, identity FROM users WHERE id = ? AND is_test = 1")
    .bind(userId)
    .first();
}

export async function clearTestAccountData(env, userId) {
  const { results: mediaRows } = await env.DB
    .prepare("SELECT media_key FROM ponti_chat_messages WHERE sender_user_id = ? AND media_key IS NOT NULL")
    .bind(userId)
    .all();

  // Prima R2, poi D1: se una cancellazione R2 fallisce non perdiamo nel DB la chiave che
  // permette di ritentare. delete() e' idempotente anche se l'oggetto non esiste piu'.
  for (const row of mediaRows) await env.MEDIA.delete(row.media_key);

  const twoParty = (sql) => env.DB.prepare(sql).bind(userId, userId);
  const own = (sql) => env.DB.prepare(sql).bind(userId);
  await env.DB.batch([
    twoParty("DELETE FROM carte_trade_items WHERE trade_id IN (SELECT id FROM carte_trade WHERE proponente_user_id = ? OR destinatario_user_id = ?)"),
    twoParty("UPDATE carte_trade SET trade_precedente_id = NULL WHERE trade_precedente_id IN (SELECT id FROM carte_trade WHERE proponente_user_id = ? OR destinatario_user_id = ?)"),
    twoParty("DELETE FROM carte_trade WHERE proponente_user_id = ? OR destinatario_user_id = ?"),
    own("DELETE FROM carte_possesso WHERE user_id = ?"),
    own("DELETE FROM carte_bustine WHERE user_id = ?"),
    own("DELETE FROM carte_streak WHERE user_id = ?"),
    own("DELETE FROM ponti_chat_reads WHERE user_id = ?"),
    own("DELETE FROM ponti_chat_messages WHERE sender_user_id = ?"),
    own("DELETE FROM stranger_chat_messages WHERE created_by = ?"),
    own("DELETE FROM letters WHERE author_id = ?"),
    own("DELETE FROM letter_drafts WHERE user_id = ?"),
    own("DELETE FROM gdr_turns WHERE author_id = ?"),
    own("DELETE FROM gdr_notes WHERE user_id = ?"),
    own("DELETE FROM gdr_characters WHERE user_id = ?"),
    own("DELETE FROM story_suggestions WHERE user_id = ?"),
    own("DELETE FROM world_suggestions WHERE user_id = ?"),
    own("DELETE FROM crossword_answers WHERE user_id = ?"),
    own("DELETE FROM crossword_word_attempts WHERE user_id = ?"),
    own("DELETE FROM events WHERE user_id = ?"),
    own("DELETE FROM visit_session_links WHERE user_id = ?"),
    own("DELETE FROM password_reset_tokens WHERE user_id = ?"),
    own("DELETE FROM user_access_ips WHERE user_id = ?"),
    own("DELETE FROM sessions WHERE user_id = ?")
  ]);

  return { deletedMedia: mediaRows.length };
}
