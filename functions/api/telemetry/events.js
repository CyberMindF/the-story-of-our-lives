import { json, readAuthenticatedRequest, recordEvent } from "./_shared.js";

// Registra un evento significativo associandolo sempre all'utente e alla sessione autenticati.
export async function onRequestPost(context) {
  try {
    const parsed = await readAuthenticatedRequest(context.request, context.env);
    if (parsed.error) {
      return parsed.error;
    }

    const result = await recordEvent(context.env, parsed.session, parsed.body);
    if (result.error) {
      return json({ error: result.error }, 400);
    }

    return json({ saved: true, id: result.id }, 201);
  } catch (error) {
    console.error(JSON.stringify({ event: "telemetry_event_error", message: error.message }));
    return json({ error: "Errore interno del server." }, 500);
  }
}
