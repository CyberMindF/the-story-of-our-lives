const STORAGE_VERSION = "v15";
const STORAGE_VERSION_KEY = "noi-crossword-storage-version";
const STORAGE_KEY = `noi-crossword-progress-${STORAGE_VERSION}`;
const THEME_STORAGE_KEY = `noi-crossword-theme-${STORAGE_VERSION}`;
// Le credenziali sono gestite dal server; nel browser restano solo indicatori della sessione.
const LEGACY_ACCESS_STORAGE_KEY = "noi-crossword-access";
const ACCESS_SESSION_KEY = "noi-crossword-access-session-v1";
const RETURN_TARGET_KEY = "mondo-bianco-return-target-v1";
const KNOWN_ACCOUNT_STORAGE_KEY = "noi-crossword-known-account-v1";
const ENABLE_DEVELOPER_TOOLS = false;
const WORD_ATTEMPT_DEBOUNCE_MS = 1000;
const RESETTABLE_STORAGE_PREFIXES = ["noi-crossword-progress-", "noi-crossword-theme-"];
const DEFAULT_THEME_ID = "sea";
const THEMES = [
  { id: "sea", label: "Ocean", icon: "sun" },
  { id: "velvet", label: "Velvet", icon: "moon" },
  { id: "red-of-you", label: "Red of You", icon: "letter", iconText: "D" },
  { id: "green-of-me", label: "Green of Me", icon: "letter", iconText: "R" }
];
let themeToastTimer = null;

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
  dimensions: { rows: 0, cols: 0, rowOffset: 0, colOffset: 0 },
  isComplete: false,
  developerRevealActive: false,
  developerProgressSnapshot: null,
  telemetryReady: false,
  completedWordIds: new Set(),
  reportedCompletedWordIds: new Set(),
  crosswordOpenedAt: 0,
  crosswordClosedTracked: false,
  wordAttemptTimers: new Map(),
  lastWordAttempts: new Map(),
  lastSyncedAnswers: new Map(),
  wordSyncChains: new Map()
};

const elements = {
  appShell: document.getElementById("app-shell"),
  accessGate: document.getElementById("access-gate"),
  accessForm: document.getElementById("access-form"),
  accessTitle: document.getElementById("access-title"),
  accessText: document.getElementById("access-text"),
  accessModeSwitcher: document.getElementById("access-mode-switcher"),
  accessAccountFields: document.getElementById("access-account-fields"),
  accessEmail: document.getElementById("access-email"),
  accessPassword: document.getElementById("access-password"),
  accessKey: document.getElementById("access-key"),
  accessSubmitButton: document.getElementById("access-submit-button"),
  showLoginButton: document.getElementById("show-login-button"),
  showRegisterButton: document.getElementById("show-register-button"),
  accessError: document.getElementById("access-error"),
  userGreeting: document.getElementById("user-greeting"),
  logoutButton: document.getElementById("logout-button"),
  title: document.getElementById("title"),
  subtitle: document.getElementById("subtitle"),
  grid: document.getElementById("grid"),
  gridScroll: document.getElementById("grid-scroll"),
  cluesList: document.getElementById("clues-list"),
  completionStatus: document.getElementById("completion-status"),
  checkSummary: document.getElementById("check-summary"),
  checkButton: document.getElementById("check-button"),
  resetButton: document.getElementById("reset-button"),
  revealButton: document.getElementById("reveal-button"),
  themeSwitcher: document.getElementById("theme-switcher"),
  themeToast: document.getElementById("theme-toast"),
  mobileClueKicker: document.getElementById("mobile-clue-kicker"),
  mobileClueText: document.getElementById("mobile-clue-text"),
  mobileSheetToggle: document.getElementById("mobile-sheet-toggle"),
  previousClueButton: document.getElementById("previous-clue-button"),
  nextClueButton: document.getElementById("next-clue-button"),
  completionModal: document.getElementById("completion-modal"),
  closeModalButton: document.getElementById("close-modal-button"),
  resetModal: document.getElementById("reset-modal"),
  cancelResetButton: document.getElementById("cancel-reset-button"),
  confirmResetButton: document.getElementById("confirm-reset-button"),
  checkModal: document.getElementById("check-modal"),
  cancelCheckButton: document.getElementById("cancel-check-button"),
  confirmCheckButton: document.getElementById("confirm-check-button")
};

document.addEventListener("DOMContentLoaded", init);

// Prepara tema e accesso, controlla la sessione e avvia il cruciverba solo per un utente autorizzato.
async function init() {
  ensureStorageVersion();
  rememberRequestedDestination();
  applySavedTheme();
  bindVisualViewport();
  bindAccessGate();
  await captureAnonymousVisit();

  const session = await loadAuthSession();
  if (!session.authenticated) {
    const initialMode = localStorage.getItem(KNOWN_ACCOUNT_STORAGE_KEY) === "true" ? "login" : "register";
    setAccessMode(initialMode);
    return;
  }

  if (sessionStorage.getItem(ACCESS_SESSION_KEY) !== String(session.user.id)) {
    setAccessMode("key");
    return;
  }

  showAuthenticatedUser(session.user);
  unlockAccess();
  if (returnToRequestedDestination()) {
    return;
  }
  await initializeCrossword();
}

// Registra la visita prima di mostrare login o registrazione, senza richiedere dati all'utente.
async function captureAnonymousVisit() {
  try {
    const response = await fetch("/api/visits", {
      method: "POST",
      credentials: "same-origin",
      headers: { Accept: "application/json" }
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`HTTP ${response.status}: ${body}`);
    }
  } catch (error) {
    // Un problema di telemetria non deve impedire l'accesso al Mondo Bianco.
    console.warn("Impossibile registrare la visita anonima:", error);
  }
}

async function initializeCrossword() {
  try {
    applySavedTheme();
    document.body.dataset.mobileMode = "sheet";
    document.body.dataset.mobileSheet = "closed";
    const data = await loadData();
    const validation = validateData(data);
    if (!validation.ok) {
      elements.checkSummary.textContent = "Sono presenti errori nei dati. Controlla la console.";
    }
    setupState(data, validation);
    renderGrid();
    renderClues();
    bindControls();
    const persistentProgress = await loadProgress();
    updateGridInputs();
    initializeTelemetryState();
    initializeAnswerSyncState(persistentProgress);
    updateCompletionState();
    state.telemetryReady = true;
    state.crosswordOpenedAt = Date.now();
    state.crosswordClosedTracked = false;
    void trackEvent("crossword_opened", {
      totalWords: state.words.length,
      completedWords: state.completedWordIds.size,
      theme: document.body.dataset.theme
    });
    if (persistentProgress.source === "local") {
      void syncAllCurrentAnswers();
    }
    selectWord(findFirstUnfinishedWordId(), { focusFirstEmpty: true, scroll: false });
  } catch (error) {
    console.error("Errore durante l'inizializzazione del cruciverba:", error);
    elements.title.textContent = "Errore di caricamento";
    elements.checkSummary.textContent = "Impossibile leggere data.json.";
  }
}

// Collega i controlli del form di autenticazione e il pulsante di logout alle rispettive azioni.
function bindAccessGate() {
  elements.showLoginButton.addEventListener("click", () => setAccessMode("login"));
  elements.showRegisterButton.addEventListener("click", () => setAccessMode("register"));
  elements.logoutButton.addEventListener("click", logout);
  window.addEventListener("pagehide", () => void trackCrosswordClosed());

  elements.accessForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await submitAccessForm();
  });
}

// Invia registrazione, login o sola chiave alla rotta adatta alla modalità corrente.
async function submitAccessForm() {
  const mode = elements.accessForm.dataset.mode || "register";
  const worldKey = elements.accessKey.value.trim();
  const payload = { worldKey };

  if (mode !== "key") {
    payload.email = elements.accessEmail.value.trim();
    payload.password = elements.accessPassword.value;
  }

  setAccessLoading(true);
  elements.accessError.textContent = "";

  try {
    const endpoint = mode === "key" ? "/api/auth/session" : `/api/auth/${mode}`;
    const response = await fetch(endpoint, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await readApiResponse(response);

    if (!response.ok) {
      if (response.status === 401 && mode === "key") {
        setAccessMode("login");
      }
      throw new Error(result.error || "Accesso non riuscito.");
    }

    sessionStorage.setItem(ACCESS_SESSION_KEY, String(result.user.id));
    if (mode !== "key") {
      localStorage.setItem(KNOWN_ACCOUNT_STORAGE_KEY, "true");
    }

    showAuthenticatedUser(result.user);
    unlockAccess();
    if (returnToRequestedDestination()) {
      return;
    }
    await initializeCrossword();
  } catch (error) {
    elements.accessError.textContent = error.message || "Impossibile completare l’accesso.";
  } finally {
    setAccessLoading(false);
  }
}

// Mostra nell'intestazione il nickname restituito da una sessione verificata.
function showAuthenticatedUser(user) {
  // Il nickname viene inserito come testo, mai come HTML.
  elements.userGreeting.textContent = `Ciao, ${user.nickname}`;
}

// Revoca la sessione corrente sul server, rimuove lo sblocco locale e ricarica la pagina.
async function logout() {
  elements.logoutButton.disabled = true;

  try {
    await trackCrosswordClosed();
    const response = await fetch("/api/auth/session", {
      method: "DELETE",
      credentials: "same-origin"
    });

    if (!response.ok) {
      throw new Error("Logout non riuscito.");
    }

    // Il progresso resta nel browser; rimuoviamo soltanto lo sblocco della scheda corrente.
    sessionStorage.removeItem(ACCESS_SESSION_KEY);
    window.location.reload();
  } catch (error) {
    elements.logoutButton.disabled = false;
    elements.checkSummary.textContent = error.message;
  }
}

// Il cookie HttpOnly non è leggibile da JavaScript: chiediamo al server se è ancora valido.
async function loadAuthSession() {
  try {
    const response = await fetch("/api/auth/session", {
      method: "GET",
      credentials: "same-origin",
      headers: { Accept: "application/json" }
    });

    if (!response.ok) {
      return { authenticated: false };
    }

    return await readApiResponse(response);
  } catch (error) {
    console.warn("Impossibile verificare la sessione:", error);
    return { authenticated: false };
  }
}

// Legge una risposta JSON dell'API e restituisce un oggetto vuoto se il corpo non è valido.
async function readApiResponse(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

// Aggiorna campi e messaggi del form per registrazione, login o sola conferma della chiave.
function setAccessMode(mode) {
  // La modalità "key" nasconde le credenziali quando il cookie identifica già l'utente.
  const isKeyOnly = mode === "key";
  const isRegister = mode === "register";
  elements.accessForm.dataset.mode = mode;
  elements.accessModeSwitcher.hidden = isKeyOnly;
  elements.accessAccountFields.hidden = isKeyOnly;
  elements.accessEmail.required = !isKeyOnly;
  elements.accessPassword.required = !isKeyOnly;
  elements.showLoginButton.setAttribute("aria-pressed", String(mode === "login"));
  elements.showRegisterButton.setAttribute("aria-pressed", String(isRegister));
  elements.accessError.textContent = "";

  if (isKeyOnly) {
    elements.accessTitle.textContent = "Ti ricordi della chiave?";
    elements.accessText.textContent = "È la stessa con cui si apre anche il nostro mondo.";
    elements.accessSubmitButton.textContent = "Entra";
  } else if (isRegister) {
    elements.accessTitle.textContent = "Entra per la prima volta";
    elements.accessText.textContent = "Crea il tuo accesso per custodire i progressi e ritrovare tutti i nostri ricordi.";
    elements.accessSubmitButton.textContent = "Registrati ed entra";
  } else {
    elements.accessTitle.textContent = "Rieccoci nel nostro mondo";
    elements.accessText.textContent = "Accedi con il tuo account per tornare alle parole che raccontano di noi.";
    elements.accessSubmitButton.textContent = "Accedi ed entra";
  }

  const target = isKeyOnly ? elements.accessKey : elements.accessEmail;
  if (!window.matchMedia("(max-width: 640px)").matches) {
    target.focus();
  }
}

// Disabilita temporaneamente l'invio del form e mostra lo stato di caricamento.
function setAccessLoading(isLoading) {
  elements.accessSubmitButton.disabled = isLoading;
  elements.accessSubmitButton.textContent = isLoading ? "Attendi…" : getAccessSubmitLabel();
}

// Restituisce il testo del pulsante coerente con la modalità di accesso selezionata.
function getAccessSubmitLabel() {
  const mode = elements.accessForm.dataset.mode;
  if (mode === "key") return "Entra";
  if (mode === "login") return "Accedi ed entra";
  return "Registrati ed entra";
}

// Nasconde la schermata di accesso e rende nuovamente interattiva l'applicazione.
function unlockAccess() {
  document.body.classList.remove("access-locked");
  elements.accessGate.classList.add("hidden");
  elements.appShell.removeAttribute("inert");
  elements.appShell.removeAttribute("aria-hidden");
}

// Memorizza una destinazione richiesta soltanto se appartiene allo stesso sito ed è una pagina navigabile.
function rememberRequestedDestination() {
  const requestedTarget = new URLSearchParams(window.location.search).get("returnTo");
  if (!requestedTarget) {
    return;
  }

  const safeTarget = getSafeReturnTarget(requestedTarget);
  if (safeTarget) {
    sessionStorage.setItem(RETURN_TARGET_KEY, safeTarget);
  } else {
    sessionStorage.removeItem(RETURN_TARGET_KEY);
    console.warn("Destinazione successiva all'accesso non valida.");
  }
}

// Dopo lo sblocco apre la pagina originariamente richiesta e consuma la destinazione salvata.
function returnToRequestedDestination() {
  const savedTarget = sessionStorage.getItem(RETURN_TARGET_KEY);
  const safeTarget = getSafeReturnTarget(savedTarget);
  sessionStorage.removeItem(RETURN_TARGET_KEY);

  if (!safeTarget) {
    return false;
  }

  window.location.replace(safeTarget);
  return true;
}

// Accetta esclusivamente URL HTTP interni, evitando API e ritorni ciclici alla pagina di accesso.
function getSafeReturnTarget(value) {
  if (!value) {
    return null;
  }

  try {
    const target = new URL(value, window.location.origin);
    const currentPath = normalizePagePath(window.location.pathname);
    const targetPath = normalizePagePath(target.pathname);

    if (target.origin !== window.location.origin || target.pathname.startsWith("/api/")) {
      return null;
    }
    if (targetPath === currentPath) {
      return null;
    }

    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return null;
  }
}

// Considera equivalenti la directory principale e il relativo file index.html.
function normalizePagePath(pathname) {
  return pathname.replace(/\/index\.html$/, "/");
}

function ensureStorageVersion() {
  const savedVersion = localStorage.getItem(STORAGE_VERSION_KEY);

  if (savedVersion === STORAGE_VERSION) {
    return;
  }

  Object.keys(localStorage).forEach((key) => {
    if (RESETTABLE_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix))) {
      localStorage.removeItem(key);
    }
  });

  localStorage.removeItem(LEGACY_ACCESS_STORAGE_KEY);
  sessionStorage.removeItem(ACCESS_SESSION_KEY);
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
    id: String(index + 1),
    word: String(entry.word).toUpperCase()
  }));

  const grid = new Map();
  const conflicts = [];
  let minRow = 1;
  let minCol = 1;
  let maxRow = 0;
  let maxCol = 0;

  words.forEach((entry) => {
    for (let index = 0; index < entry.word.length; index += 1) {
      const row = entry.row + (entry.direction === "V" ? index : 0);
      const col = entry.col + (entry.direction === "O" ? index : 0);
      const key = getCellKey(row, col);
      const letter = entry.word[index];
      const previous = grid.get(key);

      minRow = Math.min(minRow, row);
      minCol = Math.min(minCol, col);
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

  const rowOffset = Math.max(0, 1 - minRow);
  const colOffset = Math.max(0, 1 - minCol);
  const rows = maxRow + rowOffset;
  const cols = maxCol + colOffset;

  console.info(
    `Validazione completata: ${words.length} parole, coordinate R${minRow}–${maxRow} C${minCol}–${maxCol}, griglia ${rows}×${cols}.`
  );

  return {
    ok: conflicts.length === 0,
    words,
    dimensions: { rows, cols, rowOffset, colOffset },
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

  return { ...entry, cells };
}

function renderGrid() {
  elements.grid.innerHTML = "";
  const sortedCells = Array.from(state.cells.values()).sort((a, b) => a.row - b.row || a.col - b.col);

  sortedCells.forEach((cell) => {
    const wrapper = document.createElement("div");
    wrapper.className = "cell";
    wrapper.style.gridRow = String(cell.row + state.dimensions.rowOffset);
    wrapper.style.gridColumn = String(cell.col + state.dimensions.colOffset);
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
    input.autocomplete = "one-time-code";
    input.spellcheck = false;
    input.setAttribute("autocorrect", "off");
    input.setAttribute("autocapitalize", "characters");
    input.setAttribute("data-1p-ignore", "true");
    input.setAttribute("data-lpignore", "true");
    input.setAttribute("data-bwignore", "true");
    input.setAttribute("data-form-type", "other");
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
    button.innerHTML = `<span class="clue-order">${entry.id}.</span><span>${escapeHtml(entry.clue)}</span>`;
    button.addEventListener("click", () => {
      selectWord(entry.id, { focusFirstEmpty: true, scroll: true });
      if (window.matchMedia("(max-width: 640px)").matches) {
        closeMobileClues();
      }
    });

    item.appendChild(button);
    elements.cluesList.appendChild(item);
    state.cluesById.set(entry.id, button);
  });
}

function bindControls() {
  bindScrollInterruptions();
  elements.checkButton.addEventListener("click", openCheckModal);
  elements.resetButton.addEventListener("click", openResetModal);
  if (ENABLE_DEVELOPER_TOOLS) {
    elements.revealButton.hidden = false;
    elements.revealButton.addEventListener("click", revealCrossword);
  }
  renderThemeSwitcher();
  elements.mobileSheetToggle.addEventListener("click", toggleMobileClues);
  [elements.previousClueButton, elements.nextClueButton].forEach((button) => {
    button.addEventListener("pointerdown", preserveGridFocusDuringNavigation);
  });
  elements.previousClueButton.addEventListener("click", () => selectAdjacentWord(-1));
  elements.nextClueButton.addEventListener("click", () => selectAdjacentWord(1));
  observeMobileSheetHeader();
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
  elements.cancelCheckButton.addEventListener("click", closeCheckModal);
  elements.confirmCheckButton.addEventListener("click", () => {
    closeCheckModal();
    checkAnswers();
  });
  elements.checkModal.addEventListener("click", (event) => {
    if (event.target === elements.checkModal) {
      closeCheckModal();
    }
  });
}

function bindVisualViewport() {
  let stableHeight = window.visualViewport?.height || window.innerHeight;

  const updateViewportHeight = (force = false) => {
    const visualViewport = window.visualViewport;
    const height = visualViewport?.height || window.innerHeight;
    const isGridInputFocused = document.activeElement?.classList.contains("cell-input");
    const isAccessInputFocused = elements.accessForm.contains(document.activeElement);
    const keyboardLikelyOpen = isGridInputFocused && height < stableHeight * 0.82;
    const accessKeyboardLikelyOpen = isAccessInputFocused && height < stableHeight * 0.82;

    document.body.classList.toggle("keyboard-open", keyboardLikelyOpen);
    document.body.classList.toggle("access-keyboard-open", accessKeyboardLikelyOpen);

    if (keyboardLikelyOpen) {
      const offsetTop = visualViewport?.offsetTop || 0;
      const keyboardOffset = Math.max(0, stableHeight - height - offsetTop);
      document.documentElement.style.setProperty("--keyboard-offset", `${Math.round(keyboardOffset)}px`);
    } else {
      document.documentElement.style.setProperty("--keyboard-offset", "0px");
    }

    if (!force && keyboardLikelyOpen) {
      return;
    }

    if (!force && accessKeyboardLikelyOpen) {
      document.documentElement.style.setProperty("--app-viewport-height", `${Math.round(height)}px`);
      return;
    }

    stableHeight = height;
    document.documentElement.style.setProperty("--app-viewport-height", `${Math.round(stableHeight)}px`);
  };

  updateViewportHeight(true);
  window.addEventListener("orientationchange", () => updateViewportHeight(true));
  window.addEventListener("focusout", () => window.setTimeout(() => updateViewportHeight(), 120));

  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", () => updateViewportHeight());
    window.visualViewport.addEventListener("scroll", () => updateViewportHeight());
  } else {
    window.addEventListener("resize", () => updateViewportHeight());
  }
}

function handleCellClick(cellKey) {
  const cell = state.cells.get(cellKey);
  if (!cell) {
    return;
  }

  if (ENABLE_DEVELOPER_TOOLS) {
    const coordinates = `R${cell.row} C${cell.col}`;
    elements.checkSummary.textContent = coordinates;
    showTemporaryToast(coordinates);
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
  updateMobileActiveClue();

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
  updateMobileActiveClue();

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
  updateMobileActiveClue();
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
  });

  const button = state.cluesById.get(wordId);
  const list = elements.cluesList;
  if (!button || !list) {
    return;
  }

  // Quando la lista non scrolla da sola (layout mobile) lasciamo stare:
  // la pagina deve seguire la cella, non la definizione.
  const limits = getScrollLimits(list);
  if (limits.top <= 0) {
    return;
  }

  const listRect = list.getBoundingClientRect();
  const buttonRect = button.getBoundingClientRect();
  const top = list.scrollTop
    + buttonRect.top
    - listRect.top
    - (list.clientHeight - buttonRect.height) / 2;

  animateScrollTo(list, list.scrollLeft, top);
}

function centerCellIntoView(cellKey) {
  const input = state.inputByCellKey.get(cellKey);
  const scroller = elements.gridScroll;
  const cell = input ? input.parentElement : null;
  if (!cell || !scroller) {
    return;
  }

  const scrollerRect = scroller.getBoundingClientRect();
  const cellRect = cell.getBoundingClientRect();
  const position = getScrollPosition(scroller);
  const limits = getScrollLimits(scroller);

  const left = clampNumber(
    position.left + cellRect.left - scrollerRect.left - (scroller.clientWidth - cellRect.width) / 2,
    0,
    limits.left
  );
  const top = clampNumber(
    position.top + cellRect.top - scrollerRect.top - (scroller.clientHeight - cellRect.height) / 2,
    0,
    limits.top
  );

  animateScrollTo(scroller, left, top);

  // Dove finirà la cella nel viewport una volta che il riquadro si è assestato.
  // Quello che il riquadro non riesce a scrollare lo recupera la pagina:
  // sotto i 980px la griglia cresce in altezza e l'unico scroller verticale è il documento.
  centerCellIntoPage({
    left: cellRect.left - (left - position.left),
    top: cellRect.top - (top - position.top),
    width: cellRect.width,
    height: cellRect.height,
    forceVertical: limits.top <= 0,
    forceHorizontal: limits.left <= 0
  });
}

function centerCellIntoPage(projection) {
  // Il viewport "visuale" tiene conto della tastiera aperta sul telefono,
  // così la cella finisce al centro di quello che si vede davvero.
  const viewport = getVisualViewport();
  const limits = getScrollLimits(window);
  const position = getScrollPosition(window);

  const relativeLeft = projection.left - viewport.left;
  const relativeTop = projection.top - viewport.top;
  const centeredLeft = position.left + relativeLeft - (viewport.width - projection.width) / 2;
  const centeredTop = position.top + relativeTop - (viewport.height - projection.height) / 2;

  const left = limits.left > 0 && needsPageScroll(relativeLeft, projection.width, viewport.width, projection.forceHorizontal)
    ? clampNumber(centeredLeft, 0, limits.left)
    : position.left;
  const top = limits.top > 0 && needsPageScroll(relativeTop, projection.height, viewport.height, projection.forceVertical)
    ? clampNumber(centeredTop, 0, limits.top)
    : position.top;

  animateScrollTo(window, left, top);
}

function getVisualViewport() {
  const visual = window.visualViewport;
  if (visual) {
    return { left: visual.offsetLeft, top: visual.offsetTop, width: visual.width, height: visual.height };
  }

  return {
    left: 0,
    top: 0,
    width: window.innerWidth || document.documentElement.clientWidth,
    height: window.innerHeight || document.documentElement.clientHeight
  };
}

// Con "force" ricentriamo sempre (la pagina è l'unico scroller su quell'asse),
// altrimenti interveniamo solo quando la cella esce dalla fascia centrale.
function needsPageScroll(start, size, viewportSize, force) {
  if (force) {
    return true;
  }

  const margin = Math.min(viewportSize * 0.3, 160);
  return start < margin || start + size > viewportSize - margin;
}

const SCROLL_MIN_DURATION = 180;
const SCROLL_MAX_DURATION = 520;
const SCROLL_MS_PER_PIXEL = 0.9;
const scrollAnimations = new WeakMap();

function clampNumber(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function easeOutCubic(progress) {
  return 1 - Math.pow(1 - progress, 3);
}

function prefersReducedMotion() {
  return typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getScrollPosition(target) {
  if (target === window) {
    return { left: window.scrollX, top: window.scrollY };
  }

  return { left: target.scrollLeft, top: target.scrollTop };
}

function getScrollLimits(target) {
  const element = target === window ? document.documentElement : target;
  return {
    left: Math.max(0, element.scrollWidth - element.clientWidth),
    top: Math.max(0, element.scrollHeight - element.clientHeight)
  };
}

function applyScrollPosition(target, left, top) {
  if (target === window) {
    window.scrollTo(left, top);
    return;
  }

  target.scrollLeft = left;
  target.scrollTop = top;
}

function cancelScrollAnimation(target) {
  const animation = scrollAnimations.get(target);
  if (animation) {
    cancelAnimationFrame(animation.frame);
    scrollAnimations.delete(target);
  }
}

// Un tween proprio invece di scrollTo({behavior:"smooth"}): riprogrammandolo
// a ogni lettera la corsa riparte dalla posizione corrente con una durata
// proporzionale alla distanza, quindi digitando in fretta la griglia continua
// a seguire il cursore invece di rincorrerlo.
function animateScrollTo(target, left, top) {
  const limits = getScrollLimits(target);
  const start = getScrollPosition(target);
  const endLeft = clampNumber(left, 0, limits.left);
  const endTop = clampNumber(top, 0, limits.top);
  const deltaLeft = endLeft - start.left;
  const deltaTop = endTop - start.top;

  cancelScrollAnimation(target);

  if (Math.abs(deltaLeft) < 1 && Math.abs(deltaTop) < 1) {
    return;
  }

  if (prefersReducedMotion()) {
    applyScrollPosition(target, endLeft, endTop);
    return;
  }

  const distance = Math.hypot(deltaLeft, deltaTop);
  const duration = clampNumber(distance * SCROLL_MS_PER_PIXEL, SCROLL_MIN_DURATION, SCROLL_MAX_DURATION);
  const animation = { frame: 0, startTime: 0 };

  const step = (now) => {
    if (!animation.startTime) {
      animation.startTime = now;
    }

    const progress = clampNumber((now - animation.startTime) / duration, 0, 1);
    const eased = easeOutCubic(progress);
    applyScrollPosition(target, start.left + deltaLeft * eased, start.top + deltaTop * eased);

    if (progress < 1) {
      animation.frame = requestAnimationFrame(step);
      return;
    }

    scrollAnimations.delete(target);
  };

  animation.frame = requestAnimationFrame(step);
  scrollAnimations.set(target, animation);
}

// Se l'utente scrolla a mano smettiamo di trascinarlo dove diciamo noi
// (wheel e touch risalgono fino a window, quindi bastano questi due listener).
function bindScrollInterruptions() {
  const stop = () => {
    [window, elements.gridScroll, elements.cluesList].forEach((target) => {
      if (target) {
        cancelScrollAnimation(target);
      }
    });
  };

  window.addEventListener("wheel", stop, { passive: true });
  window.addEventListener("touchstart", stop, { passive: true });

  // La tastiera del telefono che si apre (o la rotazione dello schermo) cambia
  // l'altezza utile: rimettiamo al centro la cella attiva.
  const recenter = () => {
    if (state.currentCellKey) {
      centerCellIntoView(state.currentCellKey);
    }
  };

  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", recenter);
  } else {
    window.addEventListener("resize", recenter);
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

// Carica il progresso remoto; se non esiste o non è raggiungibile mantiene il fallback locale.
async function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    state.progress = raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.warn("Impossibile leggere il progresso salvato:", error);
    state.progress = {};
  }

  try {
    const response = await fetch("/api/crossword/answers", {
      method: "GET",
      credentials: "same-origin",
      headers: { Accept: "application/json" }
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await readApiResponse(response);
    const answers = Array.isArray(result.answers) ? result.answers : [];
    if (answers.length === 0) {
      return { source: "local", answers: [] };
    }

    state.progress = {};
    applyPersistentAnswers(answers);
    saveProgress();
    return { source: "remote", answers };
  } catch (error) {
    console.warn("Impossibile caricare il progresso remoto, uso quello locale:", error);
    return { source: "local", answers: [] };
  }
}

// Ricostruisce le celle condivise applicando in ordine cronologico le risposte ricevute dal backend.
function applyPersistentAnswers(answers) {
  answers.forEach((answer) => {
    const entry = state.entriesById.get(answer.wordId);
    if (!entry || typeof answer.currentAnswer !== "string") {
      return;
    }

    [...answer.currentAnswer].forEach((letter, index) => {
      const cell = entry.cells[index];
      if (!cell || letter === "_") {
        return;
      }

      const normalized = normalizeLetter(letter);
      const previous = state.progress[cell.key];
      if (previous && previous !== normalized) {
        console.warn(`Risposte remote incompatibili nella cella ${cell.key}: ${previous} / ${normalized}`);
      }
      state.progress[cell.key] = normalized;
    });
  });
}

function renderThemeSwitcher() {
  elements.themeSwitcher.innerHTML = "";

  THEMES.forEach((theme) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "theme-chip";
    button.dataset.theme = theme.id;
    const iconMarkup = theme.icon === "letter"
      ? `<span class="theme-chip-icon theme-chip-icon-letter" aria-hidden="true">${theme.iconText ?? ""}</span>`
      : theme.icon === "moon"
        ? `<svg class="theme-chip-icon theme-chip-icon-moon" viewBox="0 0 24 24" aria-hidden="true"><circle class="moon-disc" cx="12" cy="12" r="9" /><path class="moon-crescent" d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" /></svg>`
        : `<span class="theme-chip-icon theme-chip-icon-${theme.icon}" aria-hidden="true"></span>`;
    button.innerHTML = `${iconMarkup}<span class="theme-chip-name">${theme.label}</span>`;
    button.setAttribute("aria-pressed", document.body.dataset.theme === theme.id ? "true" : "false");
    button.setAttribute("aria-label", `Attiva il tema ${theme.label}`);
    button.addEventListener("click", () => {
      const previousTheme = document.body.dataset.theme;
      applyTheme(theme.id);
      showThemeToast(theme.label);
      if (previousTheme !== theme.id) {
        void trackEvent("theme_changed", { previousTheme, theme: theme.id });
      }
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

function showThemeToast(themeName) {
  if (!elements.themeToast || !window.matchMedia("(max-width: 640px)").matches) {
    return;
  }

  showTemporaryToast(`Tema ${themeName}`);
}

function showTemporaryToast(message) {
  if (!elements.themeToast || !window.matchMedia("(max-width: 640px)").matches) {
    return;
  }

  window.clearTimeout(themeToastTimer);
  elements.themeToast.textContent = message;
  elements.themeToast.classList.remove("is-visible");
  void elements.themeToast.offsetWidth;
  elements.themeToast.classList.add("is-visible");

  themeToastTimer = window.setTimeout(() => {
    elements.themeToast.classList.remove("is-visible");
  }, 2200);
}

function toggleMobileClues() {
  const isOpen = document.body.dataset.mobileSheet === "open";
  setMobileCluesOpen(!isOpen);

  if (!isOpen && state.currentWordId) {
    requestAnimationFrame(() => highlightClue(state.currentWordId));
  }
}

function selectAdjacentWord(step) {
  if (state.words.length === 0) {
    return;
  }

  const currentIndex = state.words.findIndex((entry) => entry.id === state.currentWordId);
  const startIndex = currentIndex >= 0 ? currentIndex : 0;
  const nextIndex = (startIndex + step + state.words.length) % state.words.length;
  const keepKeyboardOpen = document.body.classList.contains("keyboard-open");
  selectWord(state.words[nextIndex].id, { focusFirstEmpty: true, scroll: true, focus: keepKeyboardOpen });
}

function preserveGridFocusDuringNavigation(event) {
  if (document.body.classList.contains("keyboard-open")) {
    event.preventDefault();
  }
}

function observeMobileSheetHeader() {
  const updatePeekHeight = () => {
    const height = Math.ceil(elements.mobileSheetToggle.getBoundingClientRect().height);
    if (height > 0) {
      document.documentElement.style.setProperty("--mobile-sheet-peek-height", `${height}px`);
    }
  };

  updatePeekHeight();

  if (typeof ResizeObserver === "function") {
    const observer = new ResizeObserver(updatePeekHeight);
    observer.observe(elements.mobileSheetToggle);
  } else {
    window.addEventListener("resize", updatePeekHeight);
  }
}

function closeMobileClues() {
  setMobileCluesOpen(false);
}

function setMobileCluesOpen(isOpen) {
  document.body.dataset.mobileSheet = isOpen ? "open" : "closed";
  elements.mobileSheetToggle.setAttribute("aria-expanded", String(isOpen));

  const accessibleLabel = elements.mobileSheetToggle.querySelector(".sr-only");
  accessibleLabel.textContent = isOpen ? "Chiudi la lista delle definizioni" : "Apri la lista delle definizioni";
}

function updateMobileActiveClue() {
  const entry = state.entriesById.get(state.currentWordId);
  if (!entry) {
    return;
  }

  elements.mobileClueKicker.textContent = `Ricordo ${entry.id}`;
  elements.mobileClueText.textContent = entry.clue;
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
    if (normalized) {
      animateLetterEntry(input);
    }
  }

  state.progress[cellKey] = normalized;
  clearValidationForCell(cellKey);
  saveProgress();
  updateCompletionState();
  scheduleWordAttemptsForCell(cellKey);
}

function animateLetterEntry(input) {
  input.classList.remove("is-letter-entering");
  void input.offsetWidth;
  input.classList.add("is-letter-entering");
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress));
}

function revealCrossword() {
  if (state.developerRevealActive) {
    state.progress = { ...state.developerProgressSnapshot };
    state.developerRevealActive = false;
    state.developerProgressSnapshot = null;
    elements.revealButton.classList.remove("is-active");
    elements.revealButton.setAttribute("aria-label", "Rivela tutto il cruciverba");
    elements.checkSummary.textContent = "Soluzioni sviluppatore nascoste.";
    closeCompletionModal();
  } else {
    state.developerProgressSnapshot = { ...state.progress };
    state.cells.forEach((cell, cellKey) => {
      state.progress[cellKey] = cell.solution;
    });
    state.developerRevealActive = true;
    elements.revealButton.classList.add("is-active");
    elements.revealButton.setAttribute("aria-label", "Nascondi le soluzioni del cruciverba");
    elements.checkSummary.textContent = "Cruciverba rivelato in modalità sviluppatore.";
  }

  state.validationMarks = {};
  updateGridInputs();
  updateValidationClasses();
  if (!state.developerRevealActive) {
    saveProgress();
  }
  updateCompletionState();
}

function openResetModal() {
  elements.resetModal.classList.remove("hidden");
  elements.cancelResetButton.focus();
}

function openCheckModal() {
  elements.checkModal.classList.remove("hidden");
  elements.cancelCheckButton.focus();
}

function closeCheckModal() {
  elements.checkModal.classList.add("hidden");
}

function closeResetModal() {
  elements.resetModal.classList.add("hidden");
}

function resetProgress() {
  state.progress = {};
  state.validationMarks = {};
  state.developerRevealActive = false;
  state.developerProgressSnapshot = null;
  elements.revealButton.classList.remove("is-active");
  elements.revealButton.setAttribute("aria-label", "Rivela tutto il cruciverba");
  localStorage.removeItem(STORAGE_KEY);
  updateGridInputs();
  updateValidationClasses();
  elements.checkSummary.textContent = "Progresso cancellato.";
  closeResetModal();
  closeCompletionModal();
  updateCompletionState();
  void syncAllCurrentAnswers();
  selectWord(state.words[0].id, { focusFirstEmpty: true, scroll: false });
}

function updateCompletionState() {
  let completedWords = 0;
  let allSolved = true;

  state.words.forEach((entry) => {
    const solved = entry.cells.every((cell) => normalizeLetter(state.progress[cell.key] || "") === cell.solution);
    const wasSolved = state.completedWordIds.has(entry.id);
    const clueButton = state.cluesById.get(entry.id);
    if (clueButton) {
      clueButton.classList.toggle("is-complete", solved);
      clueButton.setAttribute("aria-current", state.currentWordId === entry.id ? "true" : "false");
    }

    if (solved) {
      completedWords += 1;
      state.completedWordIds.add(entry.id);
      if (!wasSolved && state.telemetryReady && !state.reportedCompletedWordIds.has(entry.id)) {
        state.reportedCompletedWordIds.add(entry.id);
        void trackEvent("word_completed", { wordId: Number(entry.id), direction: entry.direction });
      }
    } else {
      allSolved = false;
      state.completedWordIds.delete(entry.id);
    }
  });

  elements.completionStatus.textContent = `${completedWords} di ${state.words.length} ricordi completati`;

  if (allSolved && !state.isComplete) {
    if (state.telemetryReady) {
      void trackEvent("crossword_completed", { totalWords: state.words.length });
    }
    openCompletionModal();
  }

  if (!allSolved) {
    state.isComplete = false;
  }
}

// Inizializza la telemetria dal progresso esistente senza trasformare il caricamento in nuovi eventi.
function initializeTelemetryState() {
  state.telemetryReady = false;
  state.completedWordIds.clear();
  state.reportedCompletedWordIds.clear();
  state.lastWordAttempts.clear();
  state.wordAttemptTimers.forEach((timer) => window.clearTimeout(timer));
  state.wordAttemptTimers.clear();

  state.words.forEach((entry) => {
    if (isWordSolved(entry)) {
      state.completedWordIds.add(entry.id);
      state.reportedCompletedWordIds.add(entry.id);
    }

    const currentAttempt = getWordAttempt(entry);
    if (currentAttempt) {
      state.lastWordAttempts.set(entry.id, currentAttempt);
    }
  });
}

// Riavvia il debounce per tutte le parole che condividono la cella appena modificata.
function scheduleWordAttemptsForCell(cellKey) {
  const cell = state.cells.get(cellKey);
  cell?.wordIds.forEach((wordId) => scheduleWordAttempt(wordId));
}

// Attende un secondo di pausa prima di consolidare e inviare il tentativo corrente della parola.
function scheduleWordAttempt(wordId) {
  window.clearTimeout(state.wordAttemptTimers.get(wordId));
  const timer = window.setTimeout(() => {
    state.wordAttemptTimers.delete(wordId);
    void Promise.all([sendWordAttempt(wordId), queueWordAnswerSync(wordId)]);
  }, WORD_ATTEMPT_DEBOUNCE_MS);
  state.wordAttemptTimers.set(wordId, timer);
}

// Inizializza i valori già presenti nel backend per evitare aggiornamenti duplicati all'apertura.
function initializeAnswerSyncState(persistentProgress) {
  state.lastSyncedAnswers.clear();
  state.wordSyncChains.clear();

  if (persistentProgress.source !== "remote") {
    return;
  }

  persistentProgress.answers.forEach((answer) => {
    if (state.entriesById.has(answer.wordId) && typeof answer.currentAnswer === "string") {
      state.lastSyncedAnswers.set(answer.wordId, answer.currentAnswer);
    }
  });
}

// Accoda gli aggiornamenti della stessa parola per conservarne l'ordine anche con una rete lenta.
async function queueWordAnswerSync(wordId) {
  const previous = state.wordSyncChains.get(wordId) || Promise.resolve();
  const current = previous.catch(() => false).then(() => syncWordAnswer(wordId));
  state.wordSyncChains.set(wordId, current);

  try {
    return await current;
  } finally {
    if (state.wordSyncChains.get(wordId) === current) {
      state.wordSyncChains.delete(wordId);
    }
  }
}

// Salva con PUT lo stato corrente della parola solo quando è diverso dall'ultimo confermato.
async function syncWordAnswer(wordId) {
  const entry = state.entriesById.get(wordId);
  if (!entry) {
    return false;
  }

  const currentAnswer = getWordCurrentAnswer(entry);
  const previousAnswer = state.lastSyncedAnswers.get(wordId);
  const isEmpty = !currentAnswer.replaceAll("_", "");
  if (currentAnswer === previousAnswer || (isEmpty && previousAnswer === undefined)) {
    return false;
  }

  const saved = await sendAuthenticatedJson(`/api/crossword/answers/${encodeURIComponent(wordId)}`, {
    currentAnswer
  }, "PUT");
  if (saved) {
    state.lastSyncedAnswers.set(wordId, currentAnswer);
  }
  return saved;
}

// Sincronizza tutte le parole non vuote o già presenti sul server, usato per migrazione e reset.
async function syncAllCurrentAnswers() {
  for (const entry of state.words) {
    await queueWordAnswerSync(entry.id);
  }
}

// Restituisce una stringa lunga quanto la soluzione usando underscore per le celle vuote.
function getWordCurrentAnswer(entry) {
  return entry.cells
    .map((cell) => normalizeLetter(state.progress[cell.key] || "") || "_")
    .join("");
}

// Invia un tentativo non vuoto soltanto se differisce dall'ultimo confermato dal backend.
async function sendWordAttempt(wordId) {
  const entry = state.entriesById.get(wordId);
  if (!entry) {
    return;
  }

  const attempt = getWordAttempt(entry);
  if (!attempt || attempt === state.lastWordAttempts.get(wordId)) {
    return;
  }

  const saved = await sendAuthenticatedJson("/api/telemetry/word-attempts", {
    wordId: Number(entry.id),
    attempt
  });
  if (saved) {
    state.lastWordAttempts.set(wordId, attempt);
  }
}

// Rappresenta le celle interne vuote con underscore e rimuove quelle vuote in coda.
function getWordAttempt(entry) {
  return entry.cells
    .map((cell) => normalizeLetter(state.progress[cell.key] || "") || "_")
    .join("")
    .replace(/_+$/, "");
}

// Controlla se tutte le celle di una parola contengono la relativa soluzione.
function isWordSolved(entry) {
  return entry.cells.every((cell) => normalizeLetter(state.progress[cell.key] || "") === cell.solution);
}

// Registra un evento generale della sezione cruciverba senza interrompere l'esperienza in caso di errore.
async function trackEvent(eventType, metadata = {}) {
  return sendAuthenticatedJson("/api/telemetry/events", {
    section: "crossword",
    eventType,
    metadata
  });
}

// Registra una sola chiusura per apertura, includendo durata e progresso raggiunto.
async function trackCrosswordClosed() {
  if (!state.telemetryReady || state.crosswordClosedTracked || !state.crosswordOpenedAt) {
    return false;
  }

  state.crosswordClosedTracked = true;
  return trackEvent("crossword_closed", {
    durationSeconds: Math.max(0, Math.round((Date.now() - state.crosswordOpenedAt) / 1000)),
    completedWords: state.completedWordIds.size,
    totalWords: state.words.length
  });
}

// Esegue una richiesta JSON autenticata senza interrompere l'interfaccia in caso di errore.
async function sendAuthenticatedJson(endpoint, payload, method = "POST") {
  try {
    const response = await fetch(endpoint, {
      method,
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true
    });
    return response.ok;
  } catch (error) {
    console.warn(`Impossibile completare la richiesta ${method} ${endpoint}:`, error);
    return false;
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
      return `ricordo ${entry.id}`;
    })
    .join(", ");

  return `Cella riga ${cell.row} colonna ${cell.col}. Parole: ${labels}.`;
}

function getCellMarkerText(cell) {
  const wordIds = cell.startWordIds
    .map((wordId) => Number(state.entriesById.get(wordId)?.id))
    .filter((wordId) => Number.isInteger(wordId))
    .sort((a, b) => a - b);

  return wordIds.join("/");
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
