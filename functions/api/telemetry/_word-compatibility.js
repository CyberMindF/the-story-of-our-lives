// Calcola metriche complementari per distinguere correttezza, somiglianza e completezza.
export function calculateAttemptMetrics(attempt, solution) {
  const visibleLetters = [...attempt].filter((letter) => letter !== "_");
  const compactAttempt = visibleLetters.join("");
  const matchingPositions = [...attempt].reduce((matches, letter, index) => {
    if (letter === "_" || letter !== solution[index]) {
      return matches;
    }
    return matches + 1;
  }, 0);

  const positionAccuracy = percentage(matchingPositions, visibleLetters.length);
  const completion = percentage(Math.min(visibleLetters.length, solution.length), solution.length);
  const editDistance = levenshteinDistance(compactAttempt, solution);
  const editSimilarity = roundPercentage(
    Math.max(0, 1 - editDistance / Math.max(compactAttempt.length, solution.length, 1)) * 100
  );
  const isCorrectPrefix = !attempt.includes("_") && solution.startsWith(compactAttempt);
  const isExact = compactAttempt === solution && !attempt.includes("_");

  return {
    compatibilityPercent: isCorrectPrefix ? 100 : Math.max(positionAccuracy, editSimilarity),
    positionAccuracyPercent: positionAccuracy,
    editSimilarityPercent: editSimilarity,
    completionPercent: completion,
    isCorrectPrefix,
    isExact
  };
}

// Calcola la distanza minima di inserimenti, eliminazioni e sostituzioni fra due parole.
function levenshteinDistance(first, second) {
  const previous = Array.from({ length: second.length + 1 }, (_, index) => index);

  for (let firstIndex = 1; firstIndex <= first.length; firstIndex += 1) {
    const current = [firstIndex];
    for (let secondIndex = 1; secondIndex <= second.length; secondIndex += 1) {
      const substitutionCost = first[firstIndex - 1] === second[secondIndex - 1] ? 0 : 1;
      current[secondIndex] = Math.min(
        current[secondIndex - 1] + 1,
        previous[secondIndex] + 1,
        previous[secondIndex - 1] + substitutionCost
      );
    }
    previous.splice(0, previous.length, ...current);
  }

  return previous[second.length];
}

// Converte un rapporto in percentuale evitando divisioni per zero.
function percentage(value, total) {
  return total > 0 ? roundPercentage((value / total) * 100) : 0;
}

// Mantiene due decimali per rendere le metriche semplici da filtrare e visualizzare.
function roundPercentage(value) {
  return Math.round(value * 100) / 100;
}
