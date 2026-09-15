import { json, readJson } from "../auth/_shared.js";
import { buildStudyBulkPlan, normalizeConflictPolicy } from "./_plan.mjs";
import { parseStudyBulkSource } from "./_shared.mjs";
import {
  loadStudyImportState,
  requireStudyBulkAdmin,
} from "./_endpoint-shared.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const access = await requireStudyBulkAdmin(request, env);
    if (access.response) return access.response;

    const payload = await readJson(request);
    const conflictPolicy =
      normalizeConflictPolicy(payload?.conflictPolicy) ?? "skip";
    const parsed = parseStudyBulkSource(payload?.source);
    if (parsed.errors.length > 0) {
      return json(
        {
          errors: parsed.errors,
          totalTopics: parsed.totalTopics,
          totalCards: parsed.totalCards,
        },
        400,
      );
    }

    const state = await loadStudyImportState(env);
    const plan = buildStudyBulkPlan(
      parsed,
      state.folders,
      state.topics,
      conflictPolicy,
    );
    if (plan.errors.length > 0) return json({ errors: plan.errors }, 409);

    return json({
      paths: plan.preview,
      conflictCount: plan.conflictCount,
      summary: plan.summary,
      totalTopics: parsed.totalTopics,
      totalCards: parsed.totalCards,
    });
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
