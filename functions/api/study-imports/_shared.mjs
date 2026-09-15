export const MAX_BULK_SOURCE_LENGTH = 500_000;
const MAX_NAME_LENGTH = 120;
const MAX_CARD_SIDE_LENGTH = 2_000;

export function parseStudyBulkSource(value) {
  const source = typeof value === "string" ? value.replace(/\r\n?/g, "\n") : "";
  if (!source.trim()) return result([], [error(1, "Incolla del testo o carica un file Markdown.")]);
  if (source.length > MAX_BULK_SOURCE_LENGTH) {
    return result([], [error(1, `Il contenuto supera ${MAX_BULK_SOURCE_LENGTH.toLocaleString("it-IT")} caratteri.`)]);
  }

  const paths = [];
  const errors = [];
  let currentPath = null;
  let currentTopic = null;

  const finishTopic = () => {
    if (!currentTopic) return;
    const lines = currentTopic.lines;
    if (lines.length === 0) {
      errors.push(error(currentTopic.line, "L'argomento non contiene domande e risposte.", currentPath?.path, currentTopic.title));
    } else if (lines.length % 2 !== 0) {
      errors.push(error(lines.at(-1).line, "Manca la risposta all'ultima domanda.", currentPath?.path, currentTopic.title));
    }

    for (let index = 0; index + 1 < lines.length; index += 2) {
      const question = lines[index];
      const answer = lines[index + 1];
      if (question.text.length > MAX_CARD_SIDE_LENGTH) {
        errors.push(error(question.line, `La domanda supera ${MAX_CARD_SIDE_LENGTH} caratteri.`, currentPath?.path, currentTopic.title));
      }
      if (answer.text.length > MAX_CARD_SIDE_LENGTH) {
        errors.push(error(answer.line, `La risposta supera ${MAX_CARD_SIDE_LENGTH} caratteri.`, currentPath?.path, currentTopic.title));
      }
      currentTopic.cards.push({ question: question.text, answer: answer.text });
    }
    currentTopic = null;
  };

  for (const [index, rawLine] of source.split("\n").entries()) {
    const line = rawLine.trim();
    const lineNumber = index + 1;
    if (!line) continue;

    const topicHeading = line.match(/^##(?:\s+|$)(.*)$/);
    if (topicHeading) {
      finishTopic();
      const title = topicHeading[1].trim();
      if (!currentPath) {
        errors.push(error(lineNumber, "Dichiara un percorso prima dell'argomento.", undefined, title));
      } else if (!title) {
        errors.push(error(lineNumber, "Il titolo dell'argomento è vuoto.", currentPath.path));
      } else if (title.length > MAX_NAME_LENGTH) {
        errors.push(error(lineNumber, `Il titolo supera ${MAX_NAME_LENGTH} caratteri.`, currentPath.path, title));
      } else {
        currentTopic = { title, line: lineNumber, lines: [], cards: [] };
        currentPath.topics.push(currentTopic);
      }
      continue;
    }

    const pathHeading = line.match(/^#(?:\s+|$)(.*)$/);
    if (pathHeading) {
      finishTopic();
      const segments = pathHeading[1].split(">").map((segment) => segment.trim());
      if (segments.some((segment) => !segment)) {
        errors.push(error(lineNumber, "Il percorso contiene un segmento di cartella vuoto."));
        currentPath = null;
      } else if (segments.some((segment) => segment.length > MAX_NAME_LENGTH)) {
        errors.push(error(lineNumber, `I nomi delle cartelle non possono superare ${MAX_NAME_LENGTH} caratteri.`));
        currentPath = null;
      } else {
        currentPath = { segments, path: segments.join(" › "), line: lineNumber, topics: [] };
        paths.push(currentPath);
      }
      continue;
    }

    if (!currentTopic) {
      errors.push(error(lineNumber, "Questa riga non appartiene a nessun argomento.", currentPath?.path));
    } else {
      currentTopic.lines.push({ text: line, line: lineNumber });
    }
  }

  finishTopic();
  for (const path of paths) {
    if (path.topics.length === 0) errors.push(error(path.line, "Il percorso non contiene argomenti.", path.path));
  }
  return result(paths, errors);
}

export function normalizeLookupText(value) {
  return value.trim().toLocaleLowerCase("it");
}

function result(paths, errors) {
  const cleanPaths = paths.map((path) => ({
    segments: path.segments,
    path: path.path,
    line: path.line,
    topics: path.topics.map(({ title, line, cards }) => ({ title, line, cards })),
  }));
  return {
    paths: cleanPaths,
    errors,
    totalTopics: cleanPaths.reduce((total, path) => total + path.topics.length, 0),
    totalCards: cleanPaths.reduce((total, path) => total + path.topics.reduce((sum, topic) => sum + topic.cards.length, 0), 0),
  };
}

function error(line, message, path, topic) {
  return { line, message, ...(path ? { path } : {}), ...(topic ? { topic } : {}) };
}
