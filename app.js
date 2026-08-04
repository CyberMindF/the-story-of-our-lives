const STORAGE_VERSION = "v2";
const STORAGE_VERSION_KEY = "noi-crossword-storage-version";
const STORAGE_KEY = `noi-crossword-progress-${STORAGE_VERSION}`;
const THEME_STORAGE_KEY = `noi-crossword-theme-${STORAGE_VERSION}`;
const LEGACY_STORAGE_KEYS = ["noi-crossword-progress-v1", "noi-crossword-theme-v1"];
const DEFAULT_THEME_ID = "sea";
const THEMES = [
  { id: "velvet", label: "Velvet", icon: "moon" },
  { id: "sea", label: "Ocean", icon: "sun" }
];

const state = {
  data: null,
  words: [],
  cells: new Map(),
  entriesById: new Map(),
  cluesById: new Map(),
  inputByCellKey: new Map(),
  currentWordId: null,
  currentDirection: null,
  currentCellKey: null,
  progress: {},
  validationMarks: {},
  dimensions: { rows: 0, cols: 0 },
  isComplete: false
};

const elements = {
  title: document.getElementById("title"),
  subtitle: document.getElementById("subtitle"),
  grid: document.getElementById("grid"),
  gridScroll: document.getElementById("grid-scroll"),
  cluesList: document.getElementById("clues-list"),
  completionStatus: document.getElementById("completion-status"),
  checkSummary: document.getElementById("check-summary"),
  checkButton: document.getElementById("check-button"),
  resetButton: document.getElementById("reset-button"),
  themeSwitcher: document.getElementById("theme-switcher"),
  completionModal: document.getElementById("completion-modal"),
  closeModalButton: document.getElementById("close-modal-button"),
  resetModal: document.getElementById("reset-modal"),
  cancelResetButton: document.getElementById("cancel-reset-button"),
  confirmResetButton: document.getElementById("confirm-reset-button")
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  try {
    ensureStorageVersion();
    applySavedTheme();
    const data = await loadData();
    const validation = validateData(data);
    if (!validation.ok) {
      elements.checkSummary.textContent = "Sono presenti errori nei dati. Controlla la console.";
    }
    setupState(data, validation);
    renderGrid();
    renderClues();
    bindControls();
    loadProgress();
    updateGridInputs();
    updateCompletionState();
    selectWord(findFirstUnfinishedWordId(), { focusFirstEmpty: true, scroll: false });
  } catch (error) {
    console.error("Errore durante l'inizializzazione del cruciverba:", error);
    elements.title.textContent = "Errore di caricamento";
    elements.checkSummary.textContent = "Impossibile leggere data.json.";
  }
}

function ensureStorageVersion() {
  const savedVersion = localStorage.getItem(STORAGE_VERSION_KEY);

  if (savedVersion === STORAGE_VERSION) {
    return;
  }

  LEGACY_STORAGE_KEYS.forEach((key) => {
    localStorage.removeItem(key);
  });

  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(THEME_STORAGE_KEY);
  localStorage.setItem(STORAGE_VERSION_KEY, STORAGE_VERSION);
}

async function loadData() {
  const response = await fetch("./data.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

function validateData(data) {
  const words = data.words.map((entry, index) => ({
    ...entry,
    word: String(entry.word).toUpperCase(),
    order: index + 1
  }));

  const grid = new Map();
  const conflicts = [];
  let maxRow = 0;
  let maxCol = 0;

  words.forEach((entry) => {
    for (let index = 0; index < entry.word.length; index += 1) {
      const row = entry.row + (entry.direction === "V" ? index : 0);
      const col = entry.col + (entry.direction === "O" ? index : 0);
      const key = getCellKey(row, col);
      const letter = entry.word[index];
      const previous = grid.get(key);

      maxRow = Math.max(maxRow, row);
      maxCol = Math.max(maxCol, col);

      if (previous && previous.letter !== letter) {
        conflicts.push({
          row,
          col,
          words: [previous.word, entry.word],
          letters: [previous.letter, letter]
        });
      } else if (!previous) {
        grid.set(key, { letter, word: entry.word });
      }
    }
  });

  if (conflicts.length > 0) {
    conflicts.forEach((conflict) => {
      console.error(
        `Conflitto alla riga ${conflict.row}, colonna ${conflict.col}: ${conflict.words.join(" / ")} con lettere ${conflict.letters.join(" vs ")}`
      );
    });
  }

  console.info(`Validazione completata: ${words.length} parole, ${maxRow} righe logiche, ${maxCol} colonne logiche.`);

  return {
    ok: conflicts.length === 0,
    words,
    dimensions: { rows: maxRow, cols: maxCol },
    conflicts
  };
}

function setupState(data, validation) {
  state.data = data;
  state.dimensions = validation.dimensions;
  state.words = validation.words.map((entry) => buildWordEntry(entry));

  state.cells.clear();
  state.entriesById.clear();
  state.cluesById.clear();
  state.inputByCellKey.clear();

  state.words.forEach((entry) => {
    state.entriesById.set(entry.id, entry);

    entry.cells.forEach((cell) => {
      const existing = state.cells.get(cell.key) || {
        key: cell.key,
        row: cell.row,
        col: cell.col,
        solution: cell.solution,
        wordIds: [],
        startWordIds: []
      };

      existing.wordIds.push(entry.id);
      if (cell.index === 0) {
        existing.startWordIds.push(entry.id);
      }
      state.cells.set(cell.key, existing);
    });
  });

  elements.title.textContent = data.title;
  elements.subtitle.textContent = data.subtitle;
  elements.grid.style.gridTemplateColumns = `repeat(${state.dimensions.cols}, var(--cell-size))`;
  elements.grid.style.gridTemplateRows = `repeat(${state.dimensions.rows}, var(--cell-size))`;
}

function buildWordEntry(entry) {
  const id = `${entry.order}-${entry.word}-${entry.direction}`;
  const cells = [];

  for (let index = 0; index < entry.word.length; index += 1) {
    const row = entry.row + (entry.direction === "V" ? index : 0);
    const col = entry.col + (entry.direction === "O" ? index : 0);
    cells.push({
      row,
      col,
      key: getCellKey(row, col),
      solution: entry.word[index],
      index
    });
  }

  return { ...entry, id, cells };
}

function renderGrid() {
  elements.grid.innerHTML = "";
  const sortedCells = Array.from(state.cells.values()).sort((a, b) => a.row - b.row || a.col - b.col);

  sortedCells.forEach((cell) => {
    const wrapper = document.createElement("div");
    wrapper.className = "cell";
    wrapper.style.gridRow = String(cell.row);
    wrapper.style.gridColumn = String(cell.col);
    wrapper.dataset.cellKey = cell.key;

    if (cell.startWordIds.length > 0) {
      const marker = document.createElement("span");
      marker.className = "cell-number";
      marker.textContent = getCellMarkerText(cell);
      marker.setAttribute("aria-hidden", "true");
      wrapper.appendChild(marker);
    }

    const input = document.createElement("input");
    input.className = "cell-input";
    input.type = "text";
    input.inputMode = "text";
    input.maxLength = 1;
    input.autocomplete = "off";
    input.spellcheck = false;
    input.dataset.cellKey = cell.key;
    input.setAttribute("aria-label", getCellAriaLabel(cell));

    input.addEventListener("focus", () => {
      selectCell(cell.key, { preferCurrentDirection: true, focus: false });
    });
    input.addEventListener("click", () => {
      handleCellClick(cell.key);
    });
    input.addEventListener("keydown", handleCellKeyDown);
    input.addEventListener("keyup", handleCellKeyUp);
    input.addEventListener("beforeinput", handleCellBeforeInput);
    input.addEventListener("input", handleCellInput);
    input.addEventListener("paste", handleCellPaste);

    wrapper.appendChild(input);
    elements.grid.appendChild(wrapper);
    state.inputByCellKey.set(cell.key, input);
  });
}

function renderClues() {
  elements.cluesList.innerHTML = "";

  state.words.forEach((entry) => {
    const item = document.createElement("li");
    item.className = "clue-item";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "clue-button";
    button.dataset.wordId = entry.id;
    button.innerHTML = `<span class="clue-order">${entry.order}.</span><span>${escapeHtml(entry.clue)}</span>`;
    button.addEventListener("click", () => {
      selectWord(entry.id, { focusFirstEmpty: true, scroll: true });
    });

    item.appendChild(button);
    elements.cluesList.appendChild(item);
    state.cluesById.set(entry.id, button);
  });
}

function bindControls() {
  elements.checkButton.addEventListener("click", checkAnswers);
  elements.resetButton.addEventListener("click", openResetModal);
  renderThemeSwitcher();
  elements.closeModalButton.addEventListener("click", closeCompletionModal);
  elements.completionModal.addEventListener("click", (event) => {
    if (event.target === elements.completionModal) {
      closeCompletionModal();
    }
  });
  elements.cancelResetButton.addEventListener("click", closeResetModal);
  elements.confirmResetButton.addEventListener("click", resetProgress);
  elements.resetModal.addEventListener("click", (event) => {
    if (event.target === elements.resetModal) {
      closeResetModal();
    }
  });
}

function handleCellClick(cellKey) {
  const cell = state.cells.get(cellKey);
  if (!cell) {
    return;
  }

  if (state.currentCellKey === cellKey && cell.wordIds.length > 1) {
    toggleDirectionAtCell(cellKey);
    return;
  }

  selectCell(cellKey, { preferCurrentDirection: true, focus: true });
}

function handleCellInput(event) {
  const input = event.currentTarget;
  const cellKey = input.dataset.cellKey;
  const rawValue = input.value;
  const letter = normalizeLetter(rawValue);

  if (letter !== input.value) {
    input.value = letter;
  }

  if (!letter) {
    setCellValue(cellKey, "");
    return;
  }

  setCellValue(cellKey, letter);
  moveToAdjacentCell(cellKey, 1);
}

function handleCellKeyDown(event) {
  const cellKey = event.currentTarget.dataset.cellKey;

  if (event.key === "Backspace" || event.key === "Delete") {
    event.preventDefault();
    handleBackspace(cellKey);
    return;
  }

  if (event.key === " ") {
    const cell = state.cells.get(cellKey);
    if (cell?.wordIds.length > 1) {
      event.preventDefault();
      toggleDirectionAtCell(cellKey);
    }
    return;
  }

  if (event.key.startsWith("Arrow")) {
    event.preventDefault();
    handleArrowNavigation(cellKey, event.key);
    return;
  }

  if (event.key === "Tab") {
    return;
  }

  if (event.key.length === 1) {
    const letter = normalizeLetter(event.key);
    if (!letter) {
      event.preventDefault();
      return;
    }
  }
}

function handleCellKeyUp(event) {
  if (event.key !== "Backspace" && event.key !== "Delete") {
    return;
  }

  const cellKey = event.currentTarget.dataset.cellKey;
  const input = state.inputByCellKey.get(cellKey);
  if (!input) {
    return;
  }

  if (input.value) {
    setCellValue(cellKey, "");
  }
}

function handleCellBeforeInput(event) {
  if (event.inputType !== "deleteContentBackward" && event.inputType !== "deleteContentForward") {
    return;
  }

  event.preventDefault();
  const cellKey = event.currentTarget.dataset.cellKey;
  handleBackspace(cellKey);
}

function handleCellPaste(event) {
  const text = event.clipboardData?.getData("text") || "";
  const letter = normalizeLetter(text);
  if (!letter) {
    event.preventDefault();
    return;
  }

  event.preventDefault();
  const cellKey = event.currentTarget.dataset.cellKey;
  setCellValue(cellKey, letter);
  moveToAdjacentCell(cellKey, 1);
}

function handleBackspace(cellKey) {
  const input = state.inputByCellKey.get(cellKey);
  if (!input) {
    return;
  }

  if (input.value) {
    setCellValue(cellKey, "");
    return;
  }

  const previousKey = getNextCellKey(cellKey, -1);
  if (!previousKey) {
    return;
  }

  const previousInput = state.inputByCellKey.get(previousKey);
  if (!previousInput) {
    return;
  }

  setCellValue(previousKey, "");
  focusCell(previousKey);
}

function handleArrowNavigation(cellKey, key) {
  const deltas = {
    ArrowUp: [-1, 0],
    ArrowDown: [1, 0],
    ArrowLeft: [0, -1],
    ArrowRight: [0, 1]
  };

  const cell = state.cells.get(cellKey);
  const [rowDelta, colDelta] = deltas[key];
  const nextKey = getCellKey(cell.row + rowDelta, cell.col + colDelta);

  if (!state.cells.has(nextKey)) {
    return;
  }

  selectCell(nextKey, { preferDirectionFromArrow: key, focus: true });
}

function selectWord(wordId, options = {}) {
  const entry = state.entriesById.get(wordId);
  if (!entry) {
    return;
  }

  state.currentWordId = wordId;
  state.currentDirection = entry.direction;
  const targetCell = getTargetCellForWord(entry, Boolean(options.focusFirstEmpty));
  state.currentCellKey = targetCell.key;
  refreshSelectionClasses();
  highlightClue(wordId);

  if (options.scroll !== false) {
    centerCellIntoView(targetCell.key);
  }

  if (options.focus !== false) {
    focusCell(targetCell.key);
  }
}

function selectCell(cellKey, options = {}) {
  const cell = state.cells.get(cellKey);
  if (!cell) {
    return;
  }

  const targetWordId = resolveWordIdForCell(cell, options);
  state.currentWordId = targetWordId;
  state.currentDirection = state.entriesById.get(targetWordId).direction;
  state.currentCellKey = cellKey;
  refreshSelectionClasses();
  highlightClue(targetWordId);

  if (options.scroll !== false) {
    centerCellIntoView(cellKey);
  }

  if (options.focus) {
    focusCell(cellKey);
  }
}

function resolveWordIdForCell(cell, options = {}) {
  if (cell.wordIds.length === 1) {
    return cell.wordIds[0];
  }

  if (options.preferDirectionFromArrow) {
    const direction = options.preferDirectionFromArrow === "ArrowLeft" || options.preferDirectionFromArrow === "ArrowRight" ? "O" : "V";
    return cell.wordIds.find((wordId) => state.entriesById.get(wordId).direction === direction) || cell.wordIds[0];
  }

  if (options.preferCurrentDirection && state.currentDirection) {
    return cell.wordIds.find((wordId) => state.entriesById.get(wordId).direction === state.currentDirection) || cell.wordIds[0];
  }

  return cell.wordIds[0];
}

function toggleDirectionAtCell(cellKey) {
  const cell = state.cells.get(cellKey);
  if (!cell || cell.wordIds.length < 2) {
    return;
  }

  const alternative = cell.wordIds.find((wordId) => wordId !== state.currentWordId) || cell.wordIds[0];
  state.currentWordId = alternative;
  state.currentDirection = state.entriesById.get(alternative).direction;
  state.currentCellKey = cellKey;
  refreshSelectionClasses();
  highlightClue(alternative);
  centerCellIntoView(cellKey);
  focusCell(cellKey);
}

function refreshSelectionClasses() {
  const activeWord = state.entriesById.get(state.currentWordId);
  const activeKeys = new Set(activeWord ? activeWord.cells.map((cell) => cell.key) : []);

  state.inputByCellKey.forEach((input, cellKey) => {
    const wrapper = input.parentElement;
    wrapper.classList.toggle("is-selected", activeKeys.has(cellKey));
    wrapper.classList.toggle("is-active", cellKey === state.currentCellKey);
  });
}

function highlightClue(wordId) {
  state.cluesById.forEach((button, id) => {
    button.classList.toggle("is-selected", id === wordId);
    if (id === wordId) {
      button.scrollIntoView({ block: "nearest", behavior: "smooth", inline: "nearest" });
    }
  });
}

function centerCellIntoView(cellKey) {
  const input = state.inputByCellKey.get(cellKey);
  if (!input) {
    return;
  }

  const wrapper = input.parentElement;
  if (wrapper) {
    wrapper.scrollIntoView({
      behavior: "auto",
      block: "center",
      inline: "center"
    });
  }
}

function focusCell(cellKey) {
  const input = state.inputByCellKey.get(cellKey);
  if (input) {
    input.focus({ preventScroll: true });
    input.select();
  }
}

function getTargetCellForWord(entry, firstEmpty) {
  if (!firstEmpty) {
    return entry.cells[0];
  }

  return entry.cells.find((cell) => !state.progress[cell.key]) || entry.cells[0];
}

function getNextCellKey(cellKey, step) {
  const entry = state.entriesById.get(state.currentWordId);
  if (!entry) {
    return null;
  }

  const currentIndex = entry.cells.findIndex((cell) => cell.key === cellKey);
  if (currentIndex === -1) {
    return null;
  }

  const nextCell = entry.cells[currentIndex + step];
  return nextCell ? nextCell.key : null;
}

function moveToAdjacentCell(cellKey, step) {
  const nextKey = getNextCellKey(cellKey, step);
  if (nextKey) {
    selectCell(nextKey, { preferCurrentDirection: true, focus: true });
    return;
  }

  if (step > 0 && isWordFilled(state.currentWordId) && advanceToNextWord()) {
    return;
  }

  focusCell(cellKey);
}

function isWordFilled(wordId) {
  const entry = state.entriesById.get(wordId);
  if (!entry) {
    return false;
  }

  return entry.cells.every((cell) => normalizeLetter(state.progress[cell.key] || ""));
}

function findFirstUnfinishedWordId() {
  const firstUnfinished = state.words.find((word) => !isWordFilled(word.id));
  return firstUnfinished ? firstUnfinished.id : state.words[0].id;
}

function advanceToNextWord() {
  const currentEntry = state.entriesById.get(state.currentWordId);
  if (!currentEntry) {
    return false;
  }

  const currentIndex = state.words.findIndex((word) => word.id === currentEntry.id);

  for (let index = currentIndex + 1; index < state.words.length; index += 1) {
    const candidate = state.words[index];
    if (!isWordFilled(candidate.id)) {
      selectWord(candidate.id, { focusFirstEmpty: true, scroll: true });
      return true;
    }
  }

  return false;
}

function checkAnswers() {
  let correct = 0;
  let filled = 0;

  state.validationMarks = {};

  state.cells.forEach((cell, cellKey) => {
    const value = normalizeLetter(state.progress[cellKey] || "");
    if (!value) {
      return;
    }

    filled += 1;
    const isCorrect = value === cell.solution;
    state.validationMarks[cellKey] = isCorrect ? "correct" : "error";
    if (isCorrect) {
      correct += 1;
    }
  });

  updateValidationClasses();
  elements.checkSummary.textContent = `${correct} lettere corrette su ${filled} inserite.`;
}

function updateValidationClasses() {
  state.inputByCellKey.forEach((input, cellKey) => {
    const wrapper = input.parentElement;
    wrapper.classList.toggle("is-correct", state.validationMarks[cellKey] === "correct");
    wrapper.classList.toggle("is-error", state.validationMarks[cellKey] === "error");
  });
}

function clearValidationForCell(cellKey) {
  if (!state.validationMarks[cellKey]) {
    return;
  }

  delete state.validationMarks[cellKey];
  updateValidationClasses();
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    state.progress = raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.warn("Impossibile leggere il progresso salvato:", error);
    state.progress = {};
  }
}

function renderThemeSwitcher() {
  elements.themeSwitcher.innerHTML = "";

  THEMES.forEach((theme) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "theme-chip";
    button.dataset.theme = theme.id;
    button.innerHTML = `<span class="theme-chip-icon theme-chip-icon-${theme.icon}" aria-hidden="true"></span><span class="theme-chip-name">${theme.label}</span>`;
    button.setAttribute("aria-pressed", document.body.dataset.theme === theme.id ? "true" : "false");
    button.setAttribute("aria-label", `Attiva il tema ${theme.label}`);
    button.addEventListener("click", () => {
      applyTheme(theme.id);
    });
    elements.themeSwitcher.appendChild(button);
  });

  updateThemeButtons();
}

function applySavedTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME_ID;
  applyTheme(savedTheme, { persist: false });
}

function applyTheme(themeId, options = {}) {
  const theme = THEMES.find((entry) => entry.id === themeId) || THEMES.find((entry) => entry.id === DEFAULT_THEME_ID) || THEMES[0];
  document.body.dataset.theme = theme.id;

  if (options.persist !== false) {
    localStorage.setItem(THEME_STORAGE_KEY, theme.id);
  }

  updateThemeButtons();
}

function updateThemeButtons() {
  const activeTheme = document.body.dataset.theme;
  elements.themeSwitcher?.querySelectorAll(".theme-chip").forEach((button) => {
    const selected = button.dataset.theme === activeTheme;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", selected ? "true" : "false");
  });
}

function updateGridInputs() {
  state.inputByCellKey.forEach((input, cellKey) => {
    input.value = normalizeLetter(state.progress[cellKey] || "");
  });
}

function setCellValue(cellKey, value) {
  const normalized = normalizeLetter(value);
  const input = state.inputByCellKey.get(cellKey);
  if (input) {
    input.value = normalized;
    input.setAttribute("value", normalized);
  }

  state.progress[cellKey] = normalized;
  clearValidationForCell(cellKey);
  saveProgress();
  updateCompletionState();
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress));
}

function openResetModal() {
  elements.resetModal.classList.remove("hidden");
  elements.cancelResetButton.focus();
}

function closeResetModal() {
  elements.resetModal.classList.add("hidden");
}

function resetProgress() {
  state.progress = {};
  state.validationMarks = {};
  localStorage.removeItem(STORAGE_KEY);
  updateGridInputs();
  updateValidationClasses();
  elements.checkSummary.textContent = "Progresso cancellato.";
  closeResetModal();
  closeCompletionModal();
  updateCompletionState();
  selectWord(state.words[0].id, { focusFirstEmpty: true, scroll: false });
}

function updateCompletionState() {
  let completedWords = 0;
  let allSolved = true;

  state.words.forEach((entry) => {
    const solved = entry.cells.every((cell) => normalizeLetter(state.progress[cell.key] || "") === cell.solution);
    const clueButton = state.cluesById.get(entry.id);
    if (clueButton) {
      clueButton.classList.toggle("is-complete", solved);
      clueButton.setAttribute("aria-current", state.currentWordId === entry.id ? "true" : "false");
    }

    if (solved) {
      completedWords += 1;
    } else {
      allSolved = false;
    }
  });

  elements.completionStatus.textContent = `${completedWords} di ${state.words.length} ricordi completati`;

  if (allSolved && !state.isComplete) {
    openCompletionModal();
  }

  if (!allSolved) {
    state.isComplete = false;
  }
}

function openCompletionModal() {
  state.isComplete = true;
  elements.completionModal.classList.remove("hidden");
  elements.closeModalButton.focus();
}

function closeCompletionModal() {
  elements.completionModal.classList.add("hidden");
}

function getCellAriaLabel(cell) {
  const labels = cell.wordIds
    .map((wordId) => {
      const entry = state.entriesById.get(wordId);
      return `${entry.order} ${entry.direction === "O" ? "orizzontale" : "verticale"}`;
    })
    .join(", ");

  return `Cella riga ${cell.row} colonna ${cell.col}. Parole: ${labels}.`;
}

function getCellMarkerText(cell) {
  const orders = cell.startWordIds
    .map((wordId) => state.entriesById.get(wordId)?.order)
    .filter((order) => Number.isInteger(order))
    .sort((a, b) => a - b);

  return orders.join("/");
}

function getCellKey(row, col) {
  return `${row},${col}`;
}

function normalizeLetter(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[^a-z]/gi, "")
    .slice(0, 1)
    .toUpperCase();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

window.__crosswordApp = {
  state,
  validateData,
  getCellKey,
  normalizeLetter
};
