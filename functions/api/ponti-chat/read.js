import { getAuthenticatedSession, json } from "../auth/_shared.js";

// Segna come lette tutte le righe dell'altra identità non ancora lette — chiamato
// all'apertura della pagina, silenzioso (nessun evento di telemetria: sarebbe rumoroso
// quanto tracciare l'apertura di ogni singolo messaggio, la pagina è già coperta da
// world_page_opened).
export async function onRequestPost(context) {
  const { env, request } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const now = new Date().toISOString();
    await env.DB
      .prepare("UPDATE ponti_chat_messages SET read_at = ? WHERE sender_identity != ? AND read_at IS NULL")
      .bind(now, session.user.identity)
      .run();

    return json({ ok: true });
  } catch (error) {
    console.error(JSON.stringify({ event: "ponti_chat_read_error", message: error.message }));
    return json({ error: "Errore interno del server." }, 500);
  }
}
