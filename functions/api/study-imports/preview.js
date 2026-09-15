import { json, readJson } from "../auth/_shared.js";
import { buildStudyBulkPlan } from "./_plan.mjs";
import { parseStudyBulkSource } from "./_shared.mjs";
import { loadStudyFolders, requireStudyBulkAdmin } from "./_endpoint-shared.js";

export async function onRequestPost({ request, env }) {
  try {
    const access = await requireStudyBulkAdmin(request, env);
    if (access.response) return access.response;

    const parsed = parseStudyBulkSource((await readJson(request))?.source);
    if (parsed.errors.length > 0) {
      return json({ errors: parsed.errors }, 400);
    }

    const plan = buildStudyBulkPlan(parsed, await loadStudyFolders(env));
    return json({ paths: plan.preview, summary: plan.summary });
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "study_bulk_preview_error",
        message: error instanceof Error ? error.message : String(error),
      }),
    );
    return json(
      { error: "Non è stato possibile controllare l'importazione." },
      500,
    );
  }
}
