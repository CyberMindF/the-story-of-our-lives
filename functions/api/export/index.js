import { getAuthenticatedSession, json } from "../auth/_shared.js";
import { hasPermission } from "../_shared/permissions.js";
import { recordEvent } from "../_shared/events.js";

// Esportazione di sicurezza (documentazione/cms/planning-editor-contenuti.md, Fase 8): un backup scaricabile di
// tutti i contenuti editoriali del CMS, richiesto dal piano prima di eliminare ogni vecchia
// fonte JSON. Include private_text delle attività dell'Agenda — è un backup per Rory, che ne è
// l'autore, non un endpoint pubblico: resta dietro content.edit come ogni altra azione admin.
export async function onRequestGet(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);
    if (!hasPermission(session.user.role, "content.edit")) {
      return json({ error: "Non autorizzato." }, 403);
    }

    const db = context.env.DB;
    const [
      contentEntries,
      contentVersions,
      calendarEvents,
      recipes,
      stories,
      cuffietteSongs,
      mapDestinations,
      togetherActivities
    ] = await Promise.all([
      db.prepare("SELECT * FROM content_entries").all(),
      db.prepare("SELECT * FROM content_versions").all(),
      db.prepare("SELECT * FROM calendar_events").all(),
      db.prepare("SELECT * FROM recipes").all(),
      db.prepare("SELECT * FROM stories").all(),
      db.prepare("SELECT * FROM cuffiette_songs").all(),
      db.prepare("SELECT * FROM map_destinations").all(),
      db.prepare("SELECT * FROM together_activities").all()
    ]);

    context.waitUntil(recordEvent(context.env, { userId: session.user.id, sessionId: session.sessionId }, {
      section: "admin",
      eventType: "content_export_downloaded",
      metadata: {}
    }));

    const exportedAt = new Date().toISOString();
    return json(
      {
        exportedAt,
        contentEntries: contentEntries.results,
        contentVersions: contentVersions.results,
        calendarEvents: calendarEvents.results,
        recipes: recipes.results,
        stories: stories.results,
        cuffietteSongs: cuffietteSongs.results,
        mapDestinations: mapDestinations.results,
        togetherActivities: togetherActivities.results
      },
      200,
      { "Content-Disposition": `attachment; filename="mondo-bianco-export-${exportedAt.slice(0, 10)}.json"` }
    );
  } catch (error) {
    console.error(JSON.stringify({ event: "export_error", message: error.message }));
    return json({ error: "Non è stato possibile esportare i contenuti." }, 500);
  }
}
