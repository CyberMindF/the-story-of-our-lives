export const MAX_MIXED_QUESTIONS = 500;
export const MAX_REQUESTED_QUESTIONS = 100;

export function normalizeMixedQuizConfig(payload) {
  const folderId = normalizePositiveInteger(payload?.folderId);
  const questionCount = normalizePositiveInteger(payload?.questionCount);
  const selectionMode = ["total", "per_unit"].includes(payload?.selectionMode)
    ? payload.selectionMode
    : null;
  if (
    !folderId ||
    !questionCount ||
    questionCount > MAX_REQUESTED_QUESTIONS ||
    !selectionMode
  )
    return null;
  return {
    folderId,
    selectionMode,
    questionCount,
    includeOpen: payload?.includeOpen !== false,
    shuffleQuestions: payload?.shuffleQuestions !== false,
    correctionMode:
      payload?.correctionMode === "immediate" ? "immediate" : "final",
  };
}

export function buildMixedQuizSnapshot(source, config, random = Math.random) {
  const eligible = source.questions.filter(
    (question) => config.includeOpen || question.type !== "open",
  );
  if (!eligible.length) return null;

  const unitGroups = groupValues(eligible, (question) => question.sourceUnitId);
  const unitOrders = [...unitGroups.values()].map((questions) =>
    buildUnitOrder(questions, config.shuffleQuestions, random),
  );
  let selected;
  if (config.selectionMode === "per_unit") {
    const selections = unitOrders.map((questions) =>
      questions.slice(0, config.questionCount),
    );
    selected = roundRobin(selections).slice(0, MAX_MIXED_QUESTIONS);
  } else {
    selected = roundRobin(unitOrders).slice(
      0,
      Math.min(config.questionCount, MAX_MIXED_QUESTIONS),
    );
  }
  if (!config.shuffleQuestions)
    selected.sort(
      (left, right) =>
        left.sourcePath.localeCompare(right.sourcePath, "it", {
          sensitivity: "base",
        }) ||
        left.sourceQuizId - right.sourceQuizId ||
        left.position - right.position,
    );

  const questions = selected.map(({ shuffleOptions, ...question }) => ({
    ...question,
    options: shuffleOptions
      ? shuffled(question.options, random)
      : [...question.options],
  }));
  return {
    quizId: null,
    folderId: source.folder.id,
    title: `${source.folder.name} · Quiz misto`,
    correctionMode: config.correctionMode,
    shuffleQuestions: config.shuffleQuestions,
    shuffleOptions: false,
    selectionMode: config.selectionMode,
    requestedCount: config.questionCount,
    includeOpen: config.includeOpen,
    questions,
  };
}

function buildUnitOrder(questions, shouldShuffle, random) {
  const levelGroups = groupValues(
    questions,
    (question) => question.difficultyLevel ?? 0,
  );
  const levelOrders = [...levelGroups.values()].map((levelQuestions) => {
    const quizGroups = [
      ...groupValues(
        levelQuestions,
        (question) => question.sourceQuizId,
      ).values(),
    ];
    const pools = shouldShuffle
      ? shuffled(quizGroups, random).map((pool) => shuffled(pool, random))
      : quizGroups;
    return roundRobin(pools);
  });
  return roundRobin(
    shouldShuffle ? shuffled(levelOrders, random) : levelOrders,
  );
}

function groupValues(values, keyFor) {
  const groups = new Map();
  for (const value of values) {
    const key = keyFor(value);
    const group = groups.get(key) ?? [];
    group.push(value);
    groups.set(key, group);
  }
  return groups;
}

function roundRobin(pools) {
  const result = [];
  for (let index = 0; ; index += 1) {
    let added = false;
    for (const pool of pools) {
      if (index >= pool.length) continue;
      result.push(pool[index]);
      added = true;
    }
    if (!added) return result;
  }
}

function shuffled(values, random) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
}

function normalizePositiveInteger(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}
