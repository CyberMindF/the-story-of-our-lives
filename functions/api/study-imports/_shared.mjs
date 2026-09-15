export const MAX_BULK_SOURCE_LENGTH = 500_000;
const MAX_NAME_LENGTH = 120;
const MAX_CARD_SIDE_LENGTH = 2_000;

export function parseStudyBulkSource(value) {
  const source = typeof value === "string" ? value.replace(/\r\n?/g, "\n") : "";
  const errors = [];
  const paths = [];
  let currentPath = null;
  let currentTopic = null;

  if (!source.trim()) {
    return bulkParseResult(paths, [bulkError(1, "Incolla del testo o carica un file Markdown.")]);
  }
  if (source.length > MAX_BULK_SOURCE_LENGTH) {
    return bulkParseResult(paths, [
      bulkError(1, `Il contenuto supera il limite di ${MAX_BULK_SOURCE_LENGTH.toLocaleString("it-IT")} caratteri.`),
    ]);
  }

  const finishTopic = () => {
    if (!currentTopic) return;
    if (currentTopic.lines.length % 2 !== 0) {
      const unmatched = currentTopic.lines.at(-1);
      errors.push(
        bulkError(
          unmatched?.line ?? currentTopic.line,
          "Manca la risposta all'ultima domanda.",
          currentPath?.path,
          currentTopic.title,
        ),
      );
    }

    for (let index = 0; index + 1 < currentTopic.lines.length; index += 2) {
      const question = currentTopic.lines[index];
      const answer = currentTopic.lines[index + 1];
      if (question.text.length > MAX_CARD_SIDE_LENGTH) {
        errors.push(
          bulkError(
            question.line,
            `La domanda supera ${MAX_CARD_SIDE_LENGTH} caratteri.`,
            currentPath?.path,
            currentTopic.title,
          ),
        );
      }
      if (answer.text.length > MAX_CARD_SIDE_LENGTH) {
        errors.push(
          bulkError(
            answer.line,
            `La risposta supera ${MAX_CARD_SIDE_LENGTH} caratteri.`,
            currentPath?.path,
            currentTopic.title,
          ),
        );
      }
      currentTopic.cards.push({ question: question.text, answer: answer.text });
    }

    if (currentTopic.cards.length === 0 && currentTopic.lines.length === 0) {
      errors.push(
        bulkError(
          currentTopic.line,
          "L'argomento non contiene nessuna coppia domanda-risposta.",
          currentPath?.path,
          currentTopic.title,
        ),
      );
    }
    currentTopic = null;
  };

  for (const [index, originalLine] of source.split("\n").entries()) {
    const lineNumber = index + 1;
    const line = originalLine.trim();
    if (!line) continue;

    const pathHeading = line.match(/^#(?:\s+|$)(.*)$/);
    if (pathHeading) {
      finishTopic();
      const rawPath = pathHeading[1].trim();
      const segments = rawPath.split(">").map((segment) => segment.trim());
      if (!rawPath || segments.some((segment) => !segment)) {
        errors.push(bulkError(lineNumber, "Il percorso contiene un segmento di cartella vuoto."));
        currentPath = null;
        continue;
      }
      if (segments.some((segment) => segment.length > MAX_NAME_LENGTH)) {
        errors.push(
          bulkError(
            lineNumber,
            `I nomi delle cartelle non possono superare ${MAX_NAME_LENGTH} caratteri.`,
            segments.join(" › "),
          ),
        );
        currentPath = null;
        continue;
      }
      currentPath = { segments, path: segments.join(" › "), line: lineNumber, topics: [] };
      paths.push(currentPath);
      continue;
    }

    const topicHeading = line.match(/^##(?:\s+|$)(.*)$/);
    if (topicHeading) {
      finishTopic();
      const title = topicHeading[1].trim();
      if (!currentPath) {
        errors.push(bulkError(lineNumber, "Dichiara un percorso di cartelle prima dell'argomento.", undefined, title || undefined));
        continue;
      }
      if (!title) {
        errors.push(bulkError(lineNumber, "Il titolo dell'argomento è vuoto.", currentPath.path));
        continue;
      }
      if (title.length > MAX_NAME_LENGTH) {
        errors.push(
          bulkError(
            lineNumber,
            `Il titolo dell'argomento supera ${MAX_NAME_LENGTH} caratteri.`,
            currentPath.path,
            title,
          ),
        );
        continue;
      }
      currentTopic = { title, line: lineNumber, lines: [], cards: [] };
      currentPath.topics.push(currentTopic);
      continue;
    }

    if (!currentTopic) {
      errors.push(
        bulkError(
          lineNumber,
          "Questa riga non appartiene a nessun argomento.",
          currentPath?.path,
        ),
      );
      continue;
    }
    currentTopic.lines.push({ text: line, line: lineNumber });
  }

  finishTopic();

  for (const path of paths) {
    if (path.topics.length === 0) {
      errors.push(bulkError(path.line, "Il percorso non contiene nessun argomento.", path.path));
    }
  }

  const seenTopics = new Map();
  for (const path of paths) {
    const folderKey = path.segments.map(normalizeLookupText).join("\u0000");
    for (const topic of path.topics) {
      const key = `${folderKey}\u0001${normalizeLookupText(topic.title)}`;
      const firstLine = seenTopics.get(key);
      if (firstLine !== undefined) {
        errors.push(
          bulkError(
            topic.line,
            `L'argomento è già dichiarato alla riga ${firstLine} nello stesso percorso.`,
            path.path,
            topic.title,
          ),
        );
      } else {
        seenTopics.set(key, topic.line);
      }
    }
  }

  return bulkParseResult(paths, errors);
}

export function normalizeLookupText(value) {
  return value.trim().toLocaleLowerCase("it");
}

function bulkParseResult(paths, errors) {
  const cleanPaths = paths.map((path) => ({
    segments: path.segments,
    path: path.path,
    line: path.line,
    topics: path.topics.map((topic) => ({
      title: topic.title,
      line: topic.line,
      cards: topic.cards,
    })),
  }));
  return {
    paths: cleanPaths,
    errors,
    totalTopics: cleanPaths.reduce((total, path) => total + path.topics.length, 0),
    totalCards: cleanPaths.reduce(
      (total, path) => total + path.topics.reduce((sum, topic) => sum + topic.cards.length, 0),
      0,
    ),
  };
}

function bulkError(line, message, path, topic) {
  return { line, message, ...(path ? { path } : {}), ...(topic ? { topic } : {}) };
}
