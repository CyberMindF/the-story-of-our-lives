import { getAuthenticatedSession, json } from "./auth/_shared.js";
import { captureVisit, linkVisitIdToSession } from "./_shared/visits.js";

// Registra immediatamente la visita e la collega se esiste già una sessione autenticata.
export async function onRequestPost(context) {
  try {
    const visit = await captureVisit(context.request, context.env);
    const session = await getAuthenticatedSession(context.request, context.env);
    if (session) {
      await linkVisitIdToSession(context.env, visit.id, session.user.id, session.sessionId);
    }

    const headers = visit.cookie ? { "Set-Cookie": visit.cookie } : {};
    return json({ captured: true }, 201, headers);
  } catch (error) {
    console.error(JSON.stringify({ event: "visit_capture_error", message: error.message }));
    return json({ error: "Errore interno del server." }, 500);
  }
}
