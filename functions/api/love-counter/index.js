import { getAuthenticatedSession, json } from '../auth/_shared.js';
import { counterRequest, CounterError } from './_store.mjs';

export async function onRequest({ request, env }) {
  const session = await getAuthenticatedSession(request, env);
  if (!session) return json({ error: 'Accesso richiesto.' }, 401);
  if (session.user.role !== 'admin') return json({ error: 'Accesso riservato agli amministratori.' }, 403);
  try {
    return json(await counterRequest(request, env.DB, session.user.id));
  } catch (error) {
    if (error instanceof CounterError) return json({ error: error.message }, error.status);
    // Nessuna nota personale in log, telemetria o notifiche realtime.
    return json({ error: 'Non è stato possibile salvare o caricare il contatore. Riprova.' }, 500);
  }
}
