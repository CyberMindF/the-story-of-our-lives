import { getAuthenticatedSession, json } from "../auth/_shared.js";

// GET pubblico (planning editor contenuti.md, Fase 7): non deve MAI restituire private_text,
// indipendentemente dal ruolo di chi chiama — quel campo esce solo da /api/together/activities
// (content.edit) o da /api/together/unlock dopo la risposta corretta. La lista ora legge da
// together_activities invece dell'array fisso in _data.js, ma la forma della risposta resta
// identica a prima (number/status calcolati come sempre).
export async function onRequestGet(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const [activitiesResult, statusResult] = await Promise.all([
      context.env.DB.prepare("SELECT id, text, category, link, approximate_date, private_text FROM together_activities ORDER BY id").all(),
      context.env.DB.prepare("SELECT activity_id, status FROM together_activity_status").all()
    ]);

    const statuses = new Map(statusResult.results.map((row) => [row.activity_id, row.status]));

    return json({
      activities: activitiesResult.results.map((row, index) => ({
        id: row.id,
        text: row.text,
        category: row.category,
        link: row.link,
        approximateDate: row.approximate_date,
        hasPrivatePart: Boolean(row.private_text),
        privateOnly: !row.text,
        number: index + 1,
        status: statuses.get(row.id) || "todo"
      }))
    });
  } catch (error) {
    console.error(JSON.stringify({ event: "together_get_error", message: error.message }));
    return json({ error: "Non è stato possibile caricare la lista." }, 500);
  }
}
