import { recordEvent } from "../_shared/events.js";
import { getAuthenticatedSession, json, readJson } from "./_shared.js";

// Attiva/disattiva la Modalità admin per la sessione corrente (documentazione/cms/planning-editor-contenuti.md,
// Fase 2). Non è un permesso a sé: solo chi ha già role "admin" può accenderla, e vive sulla
// sessione (non sull'utente) così un nuovo login riparte spenta di default.
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) {
      return json({ error: "Sessione non valida o scaduta." }, 401);
    }
    if (session.user.role !== "admin") {
      return json({ error: "Non autorizzato." }, 403);
    }

    const body = await readJson(request);
    const enabled = body?.enabled === true;

    await env.DB
      .prepare("UPDATE sessions SET admin_mode_enabled = ? WHERE id = ?")
      .bind(enabled ? 1 : 0, session.sessionId)
      .run();

    context.waitUntil(recordEvent(env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "admin",
      eventType: enabled ? "admin_mode_enabled" : "admin_mode_disabled",
      metadata: {}
    }));

    return json({ adminModeEnabled: enabled });
  } catch (error) {
    console.error(JSON.stringify({ event: "admin_mode_post_error", message: error.message }));
    return json({ error: "Non è stato possibile aggiornare la modalità admin." }, 500);
  }
}
