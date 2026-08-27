export async function findTradePartner(env, user) {
  if (user.isTest) {
    return null;
  }

  const oppositeIdentity = user.identity === "lui" ? "lei" : "lui";
  return env.DB
    .prepare("SELECT id, identity, nickname FROM users WHERE identity = ? AND is_test = 0 AND id != ? ORDER BY id LIMIT 1")
    .bind(oppositeIdentity, user.id)
    .first();
}
