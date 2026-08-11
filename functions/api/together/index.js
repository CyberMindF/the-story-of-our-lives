import { getAuthenticatedSession, json } from "../auth/_shared.js";
import { TOGETHER_ACTIVITIES, publicActivity } from "./_data.js";

export async function onRequestGet(context) {
  try {
    const session = await getAuthenticatedSession(context.request, context.env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const result = await context.env.DB
      .prepare("SELECT activity_id, status FROM together_activity_status")
      .all();
    const statuses = new Map(result.results.map((row) => [row.activity_id, row.status]));

    return json({
      activities: TOGETHER_ACTIVITIES.map((activity, index) => ({
        ...publicActivity(activity),
        number: index + 1,
        status: statuses.get(activity.id) || "todo"
      }))
    });
  } catch (error) {
    console.error(JSON.stringify({ event: "together_get_error", message: error.message }));
    return json({ error: "Non è stato possibile caricare la lista." }, 500);
  }
}
