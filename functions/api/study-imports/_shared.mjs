export const MAX_BULK_SOURCE_LENGTH = 500_000;
const MAX_NAME_LENGTH = 120;
const MAX_CARD_SIDE_LENGTH = 2_000;
const MAX_QUESTION_LENGTH = 4_000;

export function parseStudyBulkSource(value) {
  const source = typeof value === "string" ? value.replace(/\r\n?/g, "\n") : "";
  if (!source.trim())
    return result(
      [],
      [error(1, "Incolla del testo o carica un file Markdown.")],
    );
  if (source.length > MAX_BULK_SOURCE_LENGTH)
    return result(
      [],
      [
        error(
          1,
          `Il contenuto supera ${MAX_BULK_SOURCE_LENGTH.toLocaleString("it-IT")} caratteri.`,
        ),
      ],
    );

  const paths = [];
  const errors = [];
  let currentPath = null;
  let material = null;
  let quizQuestion = null;

  const finishQuestion = () => {
    if (!quizQuestion || material?.kind !== "quiz") return;
    const context = [currentPath?.path, material.title];
    if (!quizQuestion.prompt)
      errors.push(
        error(quizQuestion.line, "La domanda del quiz è vuota.", ...context),
      );
    if (quizQuestion.type === "open") {
      quizQuestion.options = [];
    } else {
      if (quizQuestion.options.length < 2)
        errors.push(
          error(quizQuestion.line, "Servono almeno due opzioni.", ...context),
        );
      const correct = quizQuestion.options.filter(
        (option) => option.correct,
      ).length;
      if (quizQuestion.type === "single" && correct !== 1)
        errors.push(
          error(
            quizQuestion.line,
            "Una domanda singola deve avere una sola risposta corretta.",
            ...context,
          ),
        );
      if (quizQuestion.type === "multiple" && correct < 2)
        errors.push(
          error(
            quizQuestion.line,
            "Una domanda multipla deve avere almeno due risposte corrette.",
            ...context,
          ),
        );
    }
    material.questions.push(quizQuestion);
    quizQuestion = null;
  };

  const finishMaterial = () => {
    if (!material) return;
    finishQuestion();
    if (material.kind === "flashcard") {
      if (material.lines.length === 0)
        errors.push(
          error(
            material.line,
            "L'argomento non contiene domande e risposte.",
            currentPath?.path,
            material.title,
          ),
        );
      else if (material.lines.length % 2 !== 0)
        errors.push(
          error(
            material.lines.at(-1).line,
            "Manca la risposta all'ultima domanda.",
            currentPath?.path,
            material.title,
          ),
        );
      for (let index = 0; index + 1 < material.lines.length; index += 2) {
        const question = material.lines[index];
        const answer = material.lines[index + 1];
        if (question.text.length > MAX_CARD_SIDE_LENGTH)
          errors.push(
            error(
              question.line,
              `La domanda supera ${MAX_CARD_SIDE_LENGTH} caratteri.`,
              currentPath?.path,
              material.title,
            ),
          );
        if (answer.text.length > MAX_CARD_SIDE_LENGTH)
          errors.push(
            error(
              answer.line,
              `La risposta supera ${MAX_CARD_SIDE_LENGTH} caratteri.`,
              currentPath?.path,
              material.title,
            ),
          );
        material.cards.push({ question: question.text, answer: answer.text });
      }
    } else if (material.questions.length === 0) {
      errors.push(
        error(
          material.line,
          "Il quiz non contiene domande.",
          currentPath?.path,
          material.title,
        ),
      );
    }
    material = null;
  };

  for (const [index, rawLine] of source.split("\n").entries()) {
    const line = rawLine.trim();
    const lineNumber = index + 1;
    if (!line) continue;

    const questionHeading = line.match(/^###(?:\s+|$)(.*)$/);
    if (questionHeading) {
      if (material?.kind !== "quiz") {
        errors.push(
          error(
            lineNumber,
            "Le sezioni ### sono ammesse soltanto nei quiz.",
            currentPath?.path,
            material?.title,
          ),
        );
        continue;
      }
      finishQuestion();
      const type = normalizeQuestionType(questionHeading[1]);
      if (!type)
        errors.push(
          error(
            lineNumber,
            "Tipo di domanda non valido: usa Singola, Multipla o Aperta.",
            currentPath?.path,
            material.title,
          ),
        );
      else
        quizQuestion = {
          type,
          line: lineNumber,
          prompt: "",
          difficultyLevel: null,
          imageUrl: null,
          imageAlt: null,
          referenceAnswer: null,
          options: [],
        };
      continue;
    }

    const materialHeading = line.match(/^##(?:\s+|$)(.*)$/);
    if (materialHeading) {
      finishMaterial();
      const declaration = materialHeading[1].trim();
      const typed = declaration.match(/^(Flashcard|Quiz)\s*:\s*(.*)$/i);
      const kind =
        typed?.[1].toLocaleLowerCase("it") === "quiz" ? "quiz" : "flashcard";
      const title = (typed ? typed[2] : declaration).trim();
      if (!currentPath)
        errors.push(
          error(
            lineNumber,
            "Dichiara un percorso prima dell'argomento o del quiz.",
            undefined,
            title,
          ),
        );
      else if (!title)
        errors.push(
          error(
            lineNumber,
            "Il titolo del pacchetto è vuoto.",
            currentPath.path,
          ),
        );
      else if (title.length > MAX_NAME_LENGTH)
        errors.push(
          error(
            lineNumber,
            `Il titolo supera ${MAX_NAME_LENGTH} caratteri.`,
            currentPath.path,
            title,
          ),
        );
      else if (kind === "quiz") {
        material = {
          kind,
          title,
          line: lineNumber,
          correctionMode: "final",
          shuffleQuestions: true,
          shuffleOptions: false,
          questions: [],
        };
        currentPath.quizzes.push(material);
      } else {
        material = { kind, title, line: lineNumber, lines: [], cards: [] };
        currentPath.topics.push(material);
      }
      continue;
    }

    const pathHeading = line.match(/^#(?:\s+|$)(.*)$/);
    if (pathHeading) {
      finishMaterial();
      const segments = pathHeading[1]
        .split(">")
        .map((segment) => segment.trim());
      if (segments.some((segment) => !segment)) {
        errors.push(
          error(
            lineNumber,
            "Il percorso contiene un segmento di cartella vuoto.",
          ),
        );
        currentPath = null;
      } else if (segments.some((segment) => segment.length > MAX_NAME_LENGTH)) {
        errors.push(
          error(
            lineNumber,
            `I nomi delle cartelle non possono superare ${MAX_NAME_LENGTH} caratteri.`,
          ),
        );
        currentPath = null;
      } else {
        currentPath = {
          segments,
          path: segments.join(" › "),
          line: lineNumber,
          topics: [],
          quizzes: [],
        };
        paths.push(currentPath);
      }
      continue;
    }

    if (!material)
      errors.push(
        error(
          lineNumber,
          "Questa riga non appartiene a nessun pacchetto.",
          currentPath?.path,
        ),
      );
    else if (material.kind === "flashcard")
      material.lines.push({ text: line, line: lineNumber });
    else if (!quizQuestion) {
      const setting = line.match(/^(Correzione|Ordine|Opzioni)\s*:\s*(.+)$/i);
      if (!setting || !applyQuizSetting(material, setting[1], setting[2]))
        errors.push(
          error(
            lineNumber,
            "Impostazione del quiz non riconosciuta.",
            currentPath?.path,
            material.title,
          ),
        );
    } else
      parseQuestionLine(
        quizQuestion,
        line,
        lineNumber,
        errors,
        currentPath?.path,
        material.title,
      );
  }

  finishMaterial();
  for (const path of paths)
    if (path.topics.length === 0 && path.quizzes.length === 0)
      errors.push(
        error(path.line, "Il percorso non contiene pacchetti.", path.path),
      );
  return result(paths, errors);
}

function parseQuestionLine(question, line, lineNumber, errors, path, title) {
  const option = line.match(/^-\s*\[([ xX])\]\s*(.+)$/);
  if (option) {
    if (question.type === "open")
      errors.push(
        error(
          lineNumber,
          "Una domanda aperta non può avere opzioni.",
          path,
          title,
        ),
      );
    else if (option[2].trim().length > MAX_CARD_SIDE_LENGTH)
      errors.push(
        error(
          lineNumber,
          `L'opzione supera ${MAX_CARD_SIDE_LENGTH} caratteri.`,
          path,
          title,
        ),
      );
    else
      question.options.push({
        text: option[2].trim(),
        correct: option[1].toLowerCase() === "x",
      });
    return;
  }
  const property = line.match(
    /^(Domanda|Livello|Immagine|Testo immagine|Risposta)\s*:\s*(.*)$/i,
  );
  if (!property)
    return errors.push(
      error(lineNumber, "Riga della domanda non riconosciuta.", path, title),
    );
  const key = property[1].toLocaleLowerCase("it");
  const text = property[2].trim();
  if (key === "domanda") {
    if (!text || text.length > MAX_QUESTION_LENGTH)
      errors.push(
        error(
          lineNumber,
          `La domanda deve contenere da 1 a ${MAX_QUESTION_LENGTH} caratteri.`,
          path,
          title,
        ),
      );
    else question.prompt = text;
  } else if (key === "livello") {
    const level = Number(text);
    if (
      !/^\d+$/.test(text) ||
      !Number.isInteger(level) ||
      level < 1 ||
      level > 5
    )
      errors.push(
        error(
          lineNumber,
          "Il livello deve essere un numero intero da 1 a 5.",
          path,
          title,
        ),
      );
    else question.difficultyLevel = level;
  } else if (key === "immagine") {
    if (!isHttpUrl(text))
      errors.push(
        error(
          lineNumber,
          "L'immagine deve essere un URL http o https valido.",
          path,
          title,
        ),
      );
    else question.imageUrl = text;
  } else if (key === "testo immagine")
    question.imageAlt = text.slice(0, 500) || null;
  else if (key === "risposta") {
    if (question.type !== "open")
      errors.push(
        error(
          lineNumber,
          "La risposta di riferimento è ammessa soltanto nelle domande aperte.",
          path,
          title,
        ),
      );
    else if (text.length > MAX_QUESTION_LENGTH)
      errors.push(
        error(
          lineNumber,
          `La risposta supera ${MAX_QUESTION_LENGTH} caratteri.`,
          path,
          title,
        ),
      );
    else question.referenceAnswer = text || null;
  }
}

function applyQuizSetting(quiz, rawKey, rawValue) {
  const key = rawKey.toLocaleLowerCase("it");
  const value = rawValue.trim().toLocaleLowerCase("it");
  if (key === "correzione" && ["immediata", "fine"].includes(value))
    quiz.correctionMode = value === "immediata" ? "immediate" : "final";
  else if (key === "ordine" && ["casuale", "originale"].includes(value))
    quiz.shuffleQuestions = value === "casuale";
  else if (key === "opzioni" && ["casuali", "originali"].includes(value))
    quiz.shuffleOptions = value === "casuali";
  else return false;
  return true;
}

function normalizeQuestionType(value) {
  const normalized = value.trim().toLocaleLowerCase("it");
  return normalized === "singola"
    ? "single"
    : normalized === "multipla"
      ? "multiple"
      : normalized === "aperta"
        ? "open"
        : null;
}

function isHttpUrl(value) {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

export function normalizeLookupText(value) {
  return value.trim().toLocaleLowerCase("it");
}

function result(paths, errors) {
  const cleanPaths = paths.map((path) => ({
    segments: path.segments,
    path: path.path,
    line: path.line,
    topics: path.topics.map(({ title, line, cards }) => ({
      title,
      line,
      cards,
    })),
    quizzes: path.quizzes.map(({ kind: _kind, ...quiz }) => quiz),
  }));
  return {
    paths: cleanPaths,
    errors,
    totalTopics: cleanPaths.reduce(
      (total, path) => total + path.topics.length,
      0,
    ),
    totalCards: cleanPaths.reduce(
      (total, path) =>
        total + path.topics.reduce((sum, topic) => sum + topic.cards.length, 0),
      0,
    ),
    totalQuizzes: cleanPaths.reduce(
      (total, path) => total + path.quizzes.length,
      0,
    ),
    totalQuizQuestions: cleanPaths.reduce(
      (total, path) =>
        total +
        path.quizzes.reduce((sum, quiz) => sum + quiz.questions.length, 0),
      0,
    ),
  };
}

function error(line, message, path, topic) {
  return {
    line,
    message,
    ...(path ? { path } : {}),
    ...(topic ? { topic } : {}),
  };
}
