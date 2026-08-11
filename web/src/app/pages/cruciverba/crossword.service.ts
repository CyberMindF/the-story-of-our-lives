import { Injectable, OnDestroy, computed, inject, signal } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { TelemetryService } from '../../core/telemetry.service';
import {
  ScrollTarget,
  animateScrollTo,
  cancelScrollAnimation,
  clampNumber,
  getScrollLimits,
  getScrollPosition,
  getVisualViewport,
  needsPageScroll
} from './crossword-scroll';
import {
  CellState,
  CrosswordData,
  CrosswordDimensions,
  CrosswordDirection,
  PersistentAnswer,
  SelectCellOptions,
  SelectWordOptions,
  ValidatedWordData,
  ValidationMark,
  WordCell,
  WordEntry
} from './crossword.types';
import { getCellKey, normalizeLetter } from './crossword-utils';

const STORAGE_VERSION = 'v15';
const STORAGE_VERSION_KEY = 'noi-crossword-storage-version';
const STORAGE_KEY = `noi-crossword-progress-${STORAGE_VERSION}`;
// Le credenziali sono gestite dal server; nel browser restano solo indicatori della sessione.
const LEGACY_ACCESS_STORAGE_KEY = 'noi-crossword-access';
const WORD_ATTEMPT_DEBOUNCE_MS = 1000;
const RESETTABLE_STORAGE_PREFIXES = ['noi-crossword-progress-', 'noi-crossword-theme-'];
// data.json è servito direttamente dagli asset pubblici della SPA.
const CROSSWORD_DATA_URL = '/data.json';
const CROSSWORD_HINTS_URL = '/content/crossword-hints.json';

type ProgressSource = 'local' | 'remote';

// Porting fedele di assets/js/crossword/main.js: stessa logica, stessi nomi di funzione dove
// possibile, tradotta in un servizio Angular scoped alla pagina (provided in Cruciverba, non
// in root — un'istanza nuova per ogni visita, come il modulo JS veniva ricaricato da zero a
// ogni apertura della pagina statica).
//
// Deviazioni consapevoli rispetto all'originale:
// - Il toggling manuale delle classi CSS (wrapper.classList.toggle/updateGridInputs/
//   refreshSelectionClasses/updateValidationClasses) sparisce: le stesse classi sono derivate
//   qui come signal/computed e lette direttamente dai template dei componenti figli. Stesso
//   risultato visivo, meno codice imperativo — è il genere di semplificazione che Angular rende
//   naturale, non una riscrittura del comportamento.
// - escapeHtml + innerHTML per il testo delle definizioni sparisce: l'interpolazione Angular
//   ({{ }}) fa l'escape automaticamente.
// - Gli elementi DOM (input di cella, bottoni definizione, scroller) non si leggono più con
//   document.getElementById: vengono registrati dai componenti figli (CrosswordGrid/
//   CrosswordClues) dopo il loro render, tramite i metodi registerXxx qui sotto.
// - Le "developer tools" (rivela soluzioni) erano già dietro ENABLE_DEVELOPER_TOOLS=false e
//   quindi irraggiungibili (bottone sempre hidden, nessun listener collegato): il bottone resta
//   nel template con hidden fisso, ma la logica di reveal non è stata riportata — non c'era
//   nessun comportamento osservabile da preservare.
@Injectable()
export class CrosswordService implements OnDestroy {
  private readonly api = inject(ApiService);
  private readonly telemetryService = inject(TelemetryService);

  // ==================== Stato osservato dai template ====================
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly title = signal('Caricamento…');
  readonly subtitle = signal('');
  readonly words = signal<WordEntry[]>([]);
  readonly cellsList = signal<CellState[]>([]);
  readonly dimensions = signal<CrosswordDimensions>({ rows: 0, cols: 0, rowOffset: 0, colOffset: 0 });
  readonly progress = signal<Record<string, string>>({});
  readonly validationMarks = signal<Record<string, ValidationMark>>({});
  readonly currentWordId = signal<string | null>(null);
  readonly currentDirection = signal<CrosswordDirection | null>(null);
  readonly currentCellKey = signal<string | null>(null);
  readonly completedWordIds = signal<ReadonlySet<string>>(new Set());
  readonly isComplete = signal(false);
  readonly checkSummary = signal('Nessun controllo eseguito.');
  readonly completionModalOpen = signal(false);
  readonly resetModalOpen = signal(false);
  readonly checkModalOpen = signal(false);
  readonly hintModalOpen = signal(false);
  readonly hintRequest = signal('');
  readonly hintsAvailable = signal(false);
  readonly mobileSheetOpen = signal(false);

  readonly hintDescription = computed(
    () => `Per meritarti un aiutino, prima fai questo piccolo pegno in chat:\n\n${this.hintRequest()}\n\nPoi chiedimi direttamente il suggerimento.`
  );

  readonly activeCellKeys = computed<ReadonlySet<string>>(() => {
    const entry = this.currentEntry();
    return new Set(entry ? entry.cells.map((cell) => cell.key) : []);
  });

  readonly completionStatusText = computed(
    () => `${this.completedWordIds().size} di ${this.words().length} ricordi completati`
  );

  readonly mobileClueKicker = computed(() => {
    const entry = this.currentEntry();
    return entry ? `Ricordo ${entry.id}` : 'Ricordo selezionato';
  });

  readonly mobileClueText = computed(() => {
    const entry = this.currentEntry();
    return entry ? entry.clue : 'Seleziona una parola per vedere la definizione.';
  });

  // ==================== Stato interno (non letto dai template) ====================
  private entriesById = new Map<string, WordEntry>();
  private hintRequests: string[] = [];
  private cells = new Map<string, CellState>();
  private telemetryReady = false;
  private reportedCompletedWordIds = new Set<string>();
  private crosswordOpenedAt = 0;
  private crosswordClosedTracked = false;
  private wordAttemptTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private lastWordAttempts = new Map<string, string>();
  private lastSyncedAnswers = new Map<string, string>();
  private wordSyncChains = new Map<string, Promise<boolean>>();
  private cleanupFns: Array<() => void> = [];
  private scrollInterruptionsBound = false;

  // ==================== Registro elementi DOM (popolato dai figli dopo il render) ====================
  private gridScrollEl: HTMLElement | null = null;
  private cluesListEl: HTMLElement | null = null;
  private cellInputEls = new Map<string, HTMLInputElement>();
  private clueButtonEls = new Map<string, HTMLElement>();

  registerGridScroll(el: HTMLElement | null): void {
    this.gridScrollEl = el;
  }

  registerCluesList(el: HTMLElement | null): void {
    this.cluesListEl = el;
  }

  registerCellInputs(entries: ReadonlyArray<readonly [string, HTMLInputElement]>): void {
    this.cellInputEls = new Map(entries);
  }

  registerClueButtons(entries: ReadonlyArray<readonly [string, HTMLElement]>): void {
    this.clueButtonEls = new Map(entries);
  }

  private currentEntry(): WordEntry | undefined {
    const id = this.currentWordId();
    return id ? this.entriesById.get(id) : undefined;
  }

  // ==================== Inizializzazione ====================

  async initializeCrossword(): Promise<void> {
    try {
      this.ensureStorageVersion();
      document.body.dataset['mobileMode'] = 'sheet';
      document.body.dataset['mobileSheet'] = 'closed';
      this.bindScrollInterruptions();

      const data = await this.loadData();
      await this.loadHintRequests();
      const validation = this.validateData(data);
      if (!validation.ok) {
        this.checkSummary.set('Sono presenti errori nei dati. Controlla la console.');
      }
      this.setupState(data, validation);

      const persistentProgress = await this.loadProgress();
      this.initializeTelemetryState();
      this.initializeAnswerSyncState(persistentProgress);
      this.updateCompletionState();
      this.telemetryReady = true;
      this.crosswordOpenedAt = Date.now();
      this.crosswordClosedTracked = false;
      void this.trackEvent('crossword_opened', {
        totalWords: this.words().length,
        completedWords: this.completedWordIds().size,
        theme: document.body.dataset['theme']
      });
      if (persistentProgress.source === 'local') {
        void this.syncAllCurrentAnswers();
      }
      this.loading.set(false);
    } catch (error) {
      console.error("Errore durante l'inizializzazione del cruciverba:", error);
      this.title.set('Errore di caricamento');
      this.checkSummary.set('Impossibile leggere data.json.');
      this.loadError.set(true);
      this.loading.set(false);
    }
  }

  // Chiamato dal componente definizioni dopo il proprio render (quindi con i riferimenti sia
  // della griglia sia delle definizioni già registrati): seleziona la prima parola non finita,
  // senza scroll (la pagina è appena apparsa) ma con focus — stesso comportamento
  // dell'originale, che metteva subito a fuoco la prima cella vuota a fine initializeCrossword.
  focusInitialWord(): void {
    const words = this.words();
    if (words.length === 0) {
      return;
    }
    this.selectWord(this.findFirstUnfinishedWordId(), { focusFirstEmpty: true, scroll: false });
  }

  private ensureStorageVersion(): void {
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
    localStorage.setItem(STORAGE_VERSION_KEY, STORAGE_VERSION);
  }

  private async loadData(): Promise<CrosswordData> {
    const response = await fetch(CROSSWORD_DATA_URL, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  }

  private async loadHintRequests(): Promise<void> {
    try {
      const response = await fetch(CROSSWORD_HINTS_URL, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as { requests?: unknown };
      if (!Array.isArray(data.requests)) {
        throw new Error('La proprietà "requests" deve essere un array.');
      }

      this.hintRequests = data.requests.filter(
        (request): request is string => typeof request === 'string' && request.trim().length > 0
      );
      if (this.hintRequests.length === 0) {
        throw new Error('Non è presente nessuna richiesta valida.');
      }
      this.hintsAvailable.set(true);
    } catch (error) {
      console.error('Impossibile caricare i suggerimenti del cruciverba:', error);
      this.hintRequests = [];
      this.hintsAvailable.set(false);
    }
  }

  private validateData(data: CrosswordData): { ok: boolean; words: ValidatedWordData[]; dimensions: CrosswordDimensions } {
    const words: ValidatedWordData[] = data.words.map((entry, index) => ({
      ...entry,
      id: String(index + 1),
      word: String(entry.word).toUpperCase()
    }));

    const grid = new Map<string, { letter: string; word: string }>();
    const conflicts: Array<{ row: number; col: number; words: string[]; letters: string[] }> = [];
    let minRow = 1;
    let minCol = 1;
    let maxRow = 0;
    let maxCol = 0;

    words.forEach((entry) => {
      for (let index = 0; index < entry.word.length; index += 1) {
        const row = entry.row + (entry.direction === 'V' ? index : 0);
        const col = entry.col + (entry.direction === 'O' ? index : 0);
        const key = getCellKey(row, col);
        const letter = entry.word[index];
        const previous = grid.get(key);

        minRow = Math.min(minRow, row);
        minCol = Math.min(minCol, col);
        maxRow = Math.max(maxRow, row);
        maxCol = Math.max(maxCol, col);

        if (previous && previous.letter !== letter) {
          conflicts.push({ row, col, words: [previous.word, entry.word], letters: [previous.letter, letter] });
        } else if (!previous) {
          grid.set(key, { letter, word: entry.word });
        }
      }
    });

    if (conflicts.length > 0) {
      conflicts.forEach((conflict) => {
        console.error(
          `Conflitto alla riga ${conflict.row}, colonna ${conflict.col}: ${conflict.words.join(' / ')} con lettere ${conflict.letters.join(' vs ')}`
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

    return { ok: conflicts.length === 0, words, dimensions: { rows, cols, rowOffset, colOffset } };
  }

  private setupState(
    data: CrosswordData,
    validation: { words: ValidatedWordData[]; dimensions: CrosswordDimensions }
  ): void {
    this.dimensions.set(validation.dimensions);
    const words = validation.words.map((entry) => this.buildWordEntry(entry));
    this.words.set(words);

    this.entriesById.clear();
    this.cells.clear();

    words.forEach((entry) => {
      this.entriesById.set(entry.id, entry);
      entry.cells.forEach((cell) => {
        const existing = this.cells.get(cell.key) ?? {
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
        this.cells.set(cell.key, existing);
      });
    });

    const sortedCells = Array.from(this.cells.values()).sort((a, b) => a.row - b.row || a.col - b.col);
    this.cellsList.set(sortedCells);

    this.title.set(data.title);
    this.subtitle.set(data.subtitle);
  }

  private buildWordEntry(entry: ValidatedWordData): WordEntry {
    const cells: WordCell[] = [];
    for (let index = 0; index < entry.word.length; index += 1) {
      const row = entry.row + (entry.direction === 'V' ? index : 0);
      const col = entry.col + (entry.direction === 'O' ? index : 0);
      cells.push({ row, col, key: getCellKey(row, col), solution: entry.word[index], index });
    }
    return { ...entry, cells };
  }

  // ==================== Selezione ====================

  selectWord(wordId: string, options: SelectWordOptions = {}): void {
    const entry = this.entriesById.get(wordId);
    if (!entry) {
      return;
    }

    this.currentWordId.set(wordId);
    this.currentDirection.set(entry.direction);
    const targetCell = this.getTargetCellForWord(entry, Boolean(options.focusFirstEmpty));
    this.currentCellKey.set(targetCell.key);
    this.highlightClue(wordId);

    if (options.scroll !== false) {
      this.centerCellIntoView(targetCell.key);
    }
    if (options.focus !== false) {
      this.focusCell(targetCell.key);
    }
  }

  selectCell(cellKey: string, options: SelectCellOptions = {}): void {
    const cell = this.cells.get(cellKey);
    if (!cell) {
      return;
    }

    const targetWordId = this.resolveWordIdForCell(cell, options);
    const entry = this.entriesById.get(targetWordId);
    if (!entry) {
      return;
    }

    this.currentWordId.set(targetWordId);
    this.currentDirection.set(entry.direction);
    this.currentCellKey.set(cellKey);
    this.highlightClue(targetWordId);

    if (options.scroll !== false) {
      this.centerCellIntoView(cellKey);
    }
    if (options.focus) {
      this.focusCell(cellKey);
    }
  }

  private resolveWordIdForCell(cell: CellState, options: SelectCellOptions = {}): string {
    if (cell.wordIds.length === 1) {
      return cell.wordIds[0];
    }

    if (options.preferDirectionFromArrow) {
      const direction: CrosswordDirection =
        options.preferDirectionFromArrow === 'ArrowLeft' || options.preferDirectionFromArrow === 'ArrowRight'
          ? 'O'
          : 'V';
      return cell.wordIds.find((wordId) => this.entriesById.get(wordId)?.direction === direction) ?? cell.wordIds[0];
    }

    if (options.preferCurrentDirection && this.currentDirection()) {
      const direction = this.currentDirection();
      return cell.wordIds.find((wordId) => this.entriesById.get(wordId)?.direction === direction) ?? cell.wordIds[0];
    }

    return cell.wordIds[0];
  }

  toggleDirectionAtCell(cellKey: string): void {
    const cell = this.cells.get(cellKey);
    if (!cell || cell.wordIds.length < 2) {
      return;
    }

    const alternative = cell.wordIds.find((wordId) => wordId !== this.currentWordId()) ?? cell.wordIds[0];
    const entry = this.entriesById.get(alternative);
    if (!entry) {
      return;
    }

    this.currentWordId.set(alternative);
    this.currentDirection.set(entry.direction);
    this.currentCellKey.set(cellKey);
    this.highlightClue(alternative);
    this.centerCellIntoView(cellKey);
    this.focusCell(cellKey);
  }

  // ==================== Interazione con le celle ====================

  handleCellClick(cellKey: string): void {
    const cell = this.cells.get(cellKey);
    if (!cell) {
      return;
    }

    if (this.currentCellKey() === cellKey && cell.wordIds.length > 1) {
      this.toggleDirectionAtCell(cellKey);
      return;
    }

    this.selectCell(cellKey, { preferCurrentDirection: true, focus: true });
  }

  handleCellFocus(cellKey: string): void {
    this.selectCell(cellKey, { preferCurrentDirection: true, focus: false });
  }

  handleCellInput(event: Event, cellKey: string): void {
    const input = event.currentTarget as HTMLInputElement;
    const rawValue = input.value;
    const letter = normalizeLetter(rawValue);

    if (letter !== input.value) {
      input.value = letter;
    }

    if (!letter) {
      this.setCellValue(cellKey, '');
      return;
    }

    this.setCellValue(cellKey, letter);
    this.moveToAdjacentCell(cellKey, 1);
  }

  handleCellKeyDown(event: KeyboardEvent, cellKey: string): void {
    if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault();
      this.handleBackspace(cellKey);
      return;
    }

    if (event.key === ' ') {
      const cell = this.cells.get(cellKey);
      if (cell && cell.wordIds.length > 1) {
        event.preventDefault();
        this.toggleDirectionAtCell(cellKey);
      }
      return;
    }

    if (event.key.startsWith('Arrow')) {
      event.preventDefault();
      this.handleArrowNavigation(cellKey, event.key as 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight');
      return;
    }

    if (event.key === 'Tab') {
      return;
    }

    if (event.key.length === 1) {
      const letter = normalizeLetter(event.key);
      if (!letter) {
        event.preventDefault();
      }
    }
  }

  handleCellKeyUp(event: KeyboardEvent, cellKey: string): void {
    if (event.key !== 'Backspace' && event.key !== 'Delete') {
      return;
    }

    const input = this.cellInputEls.get(cellKey);
    if (!input) {
      return;
    }

    if (input.value) {
      this.setCellValue(cellKey, '');
    }
  }

  handleCellBeforeInput(event: InputEvent, cellKey: string): void {
    if (event.inputType !== 'deleteContentBackward' && event.inputType !== 'deleteContentForward') {
      return;
    }

    event.preventDefault();
    this.handleBackspace(cellKey);
  }

  handleCellPaste(event: ClipboardEvent, cellKey: string): void {
    const text = event.clipboardData?.getData('text') || '';
    const letter = normalizeLetter(text);
    if (!letter) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    this.setCellValue(cellKey, letter);
    this.moveToAdjacentCell(cellKey, 1);
  }

  private handleBackspace(cellKey: string): void {
    const input = this.cellInputEls.get(cellKey);
    if (!input) {
      return;
    }

    if (input.value) {
      this.setCellValue(cellKey, '');
      return;
    }

    const previousKey = this.getNextCellKey(cellKey, -1);
    if (!previousKey) {
      return;
    }

    const previousInput = this.cellInputEls.get(previousKey);
    if (!previousInput) {
      return;
    }

    this.setCellValue(previousKey, '');
    this.focusCell(previousKey);
  }

  private handleArrowNavigation(
    cellKey: string,
    key: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'
  ): void {
    const deltas: Record<'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight', [number, number]> = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1]
    };

    const cell = this.cells.get(cellKey);
    if (!cell) {
      return;
    }

    const [rowDelta, colDelta] = deltas[key];
    const nextKey = getCellKey(cell.row + rowDelta, cell.col + colDelta);

    if (!this.cells.has(nextKey)) {
      return;
    }

    this.selectCell(nextKey, { preferDirectionFromArrow: key, focus: true });
  }

  // ==================== Navigazione fra celle/parole ====================

  private getTargetCellForWord(entry: WordEntry, firstEmpty: boolean): WordCell {
    if (!firstEmpty) {
      return entry.cells[0];
    }

    const progress = this.progress();
    return entry.cells.find((cell) => !progress[cell.key]) ?? entry.cells[0];
  }

  private getNextCellKey(cellKey: string, step: number): string | null {
    const wordId = this.currentWordId();
    const entry = wordId ? this.entriesById.get(wordId) : undefined;
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

  private moveToAdjacentCell(cellKey: string, step: number): void {
    const nextKey = this.getNextCellKey(cellKey, step);
    if (nextKey) {
      this.selectCell(nextKey, { preferCurrentDirection: true, focus: true });
      return;
    }

    const wordId = this.currentWordId();
    if (step > 0 && wordId && this.isWordFilled(wordId) && this.advanceToNextWord()) {
      return;
    }

    this.focusCell(cellKey);
  }

  private isWordFilled(wordId: string): boolean {
    const entry = this.entriesById.get(wordId);
    if (!entry) {
      return false;
    }

    const progress = this.progress();
    return entry.cells.every((cell) => normalizeLetter(progress[cell.key] || ''));
  }

  private findFirstUnfinishedWordId(): string {
    const words = this.words();
    const firstUnfinished = words.find((word) => !this.isWordFilled(word.id));
    return firstUnfinished ? firstUnfinished.id : words[0].id;
  }

  private advanceToNextWord(): boolean {
    const currentId = this.currentWordId();
    const currentEntry = currentId ? this.entriesById.get(currentId) : undefined;
    if (!currentEntry) {
      return false;
    }

    const words = this.words();
    const currentIndex = words.findIndex((word) => word.id === currentEntry.id);

    for (let index = currentIndex + 1; index < words.length; index += 1) {
      const candidate = words[index];
      if (!this.isWordFilled(candidate.id)) {
        this.selectWord(candidate.id, { focusFirstEmpty: true, scroll: true });
        return true;
      }
    }

    return false;
  }

  selectAdjacentWord(step: number): void {
    const words = this.words();
    if (words.length === 0) {
      return;
    }

    const currentId = this.currentWordId();
    const currentIndex = words.findIndex((entry) => entry.id === currentId);
    const startIndex = currentIndex >= 0 ? currentIndex : 0;
    const nextIndex = (startIndex + step + words.length) % words.length;
    const keepKeyboardOpen = document.body.classList.contains('keyboard-open');
    this.selectWord(words[nextIndex].id, { focusFirstEmpty: true, scroll: true, focus: keepKeyboardOpen });
  }

  // ==================== Controllo / validazione ====================

  checkAnswers(): void {
    let correct = 0;
    let filled = 0;
    const marks: Record<string, ValidationMark> = {};
    const progress = this.progress();

    this.cells.forEach((cell, cellKey) => {
      const value = normalizeLetter(progress[cellKey] || '');
      if (!value) {
        return;
      }

      filled += 1;
      const isCorrect = value === cell.solution;
      marks[cellKey] = isCorrect ? 'correct' : 'error';
      if (isCorrect) {
        correct += 1;
      }
    });

    this.validationMarks.set(marks);
    this.checkSummary.set(`${correct} lettere corrette su ${filled} inserite.`);
  }

  private clearValidationForCell(cellKey: string): void {
    if (!this.validationMarks()[cellKey]) {
      return;
    }

    const marks = { ...this.validationMarks() };
    delete marks[cellKey];
    this.validationMarks.set(marks);
  }

  // ==================== Persistenza del progresso ====================

  private async loadProgress(): Promise<{ source: ProgressSource; answers: PersistentAnswer[] }> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      this.progress.set(raw ? JSON.parse(raw) : {});
    } catch (error) {
      console.warn('Impossibile leggere il progresso salvato:', error);
      this.progress.set({});
    }

    try {
      const response = await fetch('/api/crossword/answers', {
        method: 'GET',
        credentials: 'same-origin',
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await this.api.readApiResponse<{ answers?: PersistentAnswer[] }>(response);
      const answers = Array.isArray(result.answers) ? result.answers : [];
      if (answers.length === 0) {
        return { source: 'local', answers: [] };
      }

      this.progress.set({});
      this.applyPersistentAnswers(answers);
      this.saveProgress();
      return { source: 'remote', answers };
    } catch (error) {
      console.warn('Impossibile caricare il progresso remoto, uso quello locale:', error);
      return { source: 'local', answers: [] };
    }
  }

  // Ricostruisce le celle condivise applicando in ordine cronologico le risposte dal backend.
  private applyPersistentAnswers(answers: PersistentAnswer[]): void {
    const progress = { ...this.progress() };
    answers.forEach((answer) => {
      const entry = this.entriesById.get(answer.wordId);
      if (!entry || typeof answer.currentAnswer !== 'string') {
        return;
      }

      [...answer.currentAnswer].forEach((letter, index) => {
        const cell = entry.cells[index];
        if (!cell || letter === '_') {
          return;
        }

        const normalized = normalizeLetter(letter);
        const previous = progress[cell.key];
        if (previous && previous !== normalized) {
          console.warn(`Risposte remote incompatibili nella cella ${cell.key}: ${previous} / ${normalized}`);
        }
        progress[cell.key] = normalized;
      });
    });
    this.progress.set(progress);
  }

  setCellValue(cellKey: string, value: string): void {
    const normalized = normalizeLetter(value);
    const input = this.cellInputEls.get(cellKey);
    if (input) {
      input.value = normalized;
      input.setAttribute('value', normalized);
      if (normalized) {
        this.animateLetterEntry(input);
      }
    }

    const progress = { ...this.progress() };
    progress[cellKey] = normalized;
    this.progress.set(progress);

    this.clearValidationForCell(cellKey);
    this.saveProgress();
    this.updateCompletionState();
    this.scheduleWordAttemptsForCell(cellKey);
  }

  private animateLetterEntry(input: HTMLInputElement): void {
    input.classList.remove('is-letter-entering');
    void input.offsetWidth;
    input.classList.add('is-letter-entering');
  }

  private saveProgress(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress()));
  }

  // ==================== Modali ====================

  openResetModal(): void {
    this.resetModalOpen.set(true);
  }

  closeResetModal(): void {
    this.resetModalOpen.set(false);
  }

  openCheckModal(): void {
    this.checkModalOpen.set(true);
  }

  closeCheckModal(): void {
    this.checkModalOpen.set(false);
  }

  openHintModal(): void {
    if (this.hintRequests.length === 0) {
      return;
    }

    const currentRequest = this.hintRequest();
    const availableRequests = this.hintRequests.filter((request) => request !== currentRequest);
    const requests = availableRequests.length > 0 ? availableRequests : this.hintRequests;
    this.hintRequest.set(requests[Math.floor(Math.random() * requests.length)]);
    this.hintModalOpen.set(true);
  }

  closeHintModal(): void {
    this.hintModalOpen.set(false);
  }

  confirmCheck(): void {
    this.closeCheckModal();
    this.checkAnswers();
  }

  private openCompletionModal(): void {
    this.isComplete.set(true);
    this.completionModalOpen.set(true);
  }

  closeCompletionModal(): void {
    this.completionModalOpen.set(false);
  }

  resetProgress(): void {
    this.progress.set({});
    this.validationMarks.set({});
    localStorage.removeItem(STORAGE_KEY);
    this.checkSummary.set('Progresso cancellato.');
    this.closeResetModal();
    this.closeCompletionModal();
    this.updateCompletionState();
    void this.syncAllCurrentAnswers();

    const words = this.words();
    if (words.length > 0) {
      this.selectWord(words[0].id, { focusFirstEmpty: true, scroll: false });
    }
  }

  private updateCompletionState(): void {
    let allSolved = true;
    const completed = new Set<string>();
    const progress = this.progress();

    this.words().forEach((entry) => {
      const solved = entry.cells.every((cell) => normalizeLetter(progress[cell.key] || '') === cell.solution);
      const wasSolved = this.completedWordIds().has(entry.id);

      if (solved) {
        completed.add(entry.id);
        if (!wasSolved && this.telemetryReady && !this.reportedCompletedWordIds.has(entry.id)) {
          this.reportedCompletedWordIds.add(entry.id);
          void this.trackEvent('word_completed', { wordId: Number(entry.id), direction: entry.direction });
        }
      } else {
        allSolved = false;
      }
    });

    this.completedWordIds.set(completed);

    if (allSolved && !this.isComplete()) {
      if (this.telemetryReady) {
        void this.trackEvent('crossword_completed', { totalWords: this.words().length });
      }
      this.openCompletionModal();
    }

    if (!allSolved) {
      this.isComplete.set(false);
    }
  }

  // ==================== Telemetria e sync risposte ====================

  // Inizializza la telemetria dal progresso esistente senza trasformare il caricamento in nuovi eventi.
  private initializeTelemetryState(): void {
    this.telemetryReady = false;
    const completed = new Set<string>();
    this.reportedCompletedWordIds.clear();
    this.lastWordAttempts.clear();
    this.wordAttemptTimers.forEach((timer) => clearTimeout(timer));
    this.wordAttemptTimers.clear();

    this.words().forEach((entry) => {
      if (this.isWordSolved(entry)) {
        completed.add(entry.id);
        this.reportedCompletedWordIds.add(entry.id);
      }

      const currentAttempt = this.getWordAttempt(entry);
      if (currentAttempt) {
        this.lastWordAttempts.set(entry.id, currentAttempt);
      }
    });

    this.completedWordIds.set(completed);
  }

  // Riavvia il debounce per tutte le parole che condividono la cella appena modificata.
  private scheduleWordAttemptsForCell(cellKey: string): void {
    const cell = this.cells.get(cellKey);
    cell?.wordIds.forEach((wordId) => this.scheduleWordAttempt(wordId));
  }

  // Attende un secondo di pausa prima di consolidare e inviare il tentativo corrente della parola.
  private scheduleWordAttempt(wordId: string): void {
    const existing = this.wordAttemptTimers.get(wordId);
    if (existing) {
      clearTimeout(existing);
    }

    const timer = setTimeout(() => {
      this.wordAttemptTimers.delete(wordId);
      void Promise.all([this.sendWordAttempt(wordId), this.queueWordAnswerSync(wordId)]);
    }, WORD_ATTEMPT_DEBOUNCE_MS);
    this.wordAttemptTimers.set(wordId, timer);
  }

  // Inizializza i valori già presenti nel backend per evitare aggiornamenti duplicati all'apertura.
  private initializeAnswerSyncState(persistentProgress: { source: ProgressSource; answers: PersistentAnswer[] }): void {
    this.lastSyncedAnswers.clear();
    this.wordSyncChains.clear();

    if (persistentProgress.source !== 'remote') {
      return;
    }

    persistentProgress.answers.forEach((answer) => {
      if (this.entriesById.has(answer.wordId) && typeof answer.currentAnswer === 'string') {
        this.lastSyncedAnswers.set(answer.wordId, answer.currentAnswer);
      }
    });
  }

  // Accoda gli aggiornamenti della stessa parola per conservarne l'ordine anche con una rete lenta.
  private async queueWordAnswerSync(wordId: string): Promise<boolean> {
    const previous = this.wordSyncChains.get(wordId) ?? Promise.resolve(false);
    const current = previous.catch(() => false).then(() => this.syncWordAnswer(wordId));
    this.wordSyncChains.set(wordId, current);

    try {
      return await current;
    } finally {
      if (this.wordSyncChains.get(wordId) === current) {
        this.wordSyncChains.delete(wordId);
      }
    }
  }

  // Salva con PUT lo stato corrente della parola solo quando è diverso dall'ultimo confermato.
  private async syncWordAnswer(wordId: string): Promise<boolean> {
    const entry = this.entriesById.get(wordId);
    if (!entry) {
      return false;
    }

    const currentAnswer = this.getWordCurrentAnswer(entry);
    const previousAnswer = this.lastSyncedAnswers.get(wordId);
    const isEmpty = !currentAnswer.replaceAll('_', '');
    if (currentAnswer === previousAnswer || (isEmpty && previousAnswer === undefined)) {
      return false;
    }

    const saved = await this.api.sendAuthenticatedJson(
      `/api/crossword/answers/${encodeURIComponent(wordId)}`,
      { currentAnswer },
      'PUT'
    );
    if (saved) {
      this.lastSyncedAnswers.set(wordId, currentAnswer);
    }
    return saved;
  }

  // Sincronizza tutte le parole non vuote o già presenti sul server, usato per migrazione e reset.
  async syncAllCurrentAnswers(): Promise<void> {
    for (const entry of this.words()) {
      await this.queueWordAnswerSync(entry.id);
    }
  }

  // Restituisce una stringa lunga quanto la soluzione usando underscore per le celle vuote.
  private getWordCurrentAnswer(entry: WordEntry): string {
    const progress = this.progress();
    return entry.cells.map((cell) => normalizeLetter(progress[cell.key] || '') || '_').join('');
  }

  // Invia un tentativo non vuoto soltanto se differisce dall'ultimo confermato dal backend.
  private async sendWordAttempt(wordId: string): Promise<void> {
    const entry = this.entriesById.get(wordId);
    if (!entry) {
      return;
    }

    const attempt = this.getWordAttempt(entry);
    if (!attempt || attempt === this.lastWordAttempts.get(wordId)) {
      return;
    }

    const saved = await this.api.sendAuthenticatedJson('/api/telemetry/word-attempts', {
      wordId: Number(entry.id),
      attempt
    });
    if (saved) {
      this.lastWordAttempts.set(wordId, attempt);
    }
  }

  // Rappresenta le celle interne vuote con underscore e rimuove quelle vuote in coda.
  private getWordAttempt(entry: WordEntry): string {
    const progress = this.progress();
    return entry.cells
      .map((cell) => normalizeLetter(progress[cell.key] || '') || '_')
      .join('')
      .replace(/_+$/, '');
  }

  private isWordSolved(entry: WordEntry): boolean {
    const progress = this.progress();
    return entry.cells.every((cell) => normalizeLetter(progress[cell.key] || '') === cell.solution);
  }

  // Registra un evento della sezione cruciverba riusando lo stesso endpoint di tutte le altre
  // pagine (TelemetryService.trackEvent già fa POST /api/telemetry/events via sendAuthenticatedJson).
  trackEvent(eventType: string, metadata: Record<string, unknown> = {}): Promise<boolean> {
    return this.telemetryService.trackEvent('crossword', eventType, metadata);
  }

  // Registra una sola chiusura per apertura, includendo durata e progresso raggiunto.
  async trackCrosswordClosed(): Promise<boolean> {
    if (!this.telemetryReady || this.crosswordClosedTracked || !this.crosswordOpenedAt) {
      return false;
    }

    this.crosswordClosedTracked = true;
    return this.trackEvent('crossword_closed', {
      durationSeconds: Math.max(0, Math.round((Date.now() - this.crosswordOpenedAt) / 1000)),
      completedWords: this.completedWordIds().size,
      totalWords: this.words().length
    });
  }

  // ==================== Etichette / marker ====================

  getCellAriaLabel(cell: CellState): string {
    const labels = cell.wordIds.map((wordId) => `ricordo ${this.entriesById.get(wordId)?.id}`).join(', ');
    return `Cella riga ${cell.row} colonna ${cell.col}. Parole: ${labels}.`;
  }

  getCellMarkerText(cell: CellState): string {
    return cell.startWordIds
      .map((wordId) => Number(this.entriesById.get(wordId)?.id))
      .filter((wordId) => Number.isInteger(wordId))
      .sort((a, b) => a - b)
      .join('/');
  }

  // ==================== Foglio definizioni mobile ====================

  setMobileCluesOpen(isOpen: boolean): void {
    document.body.dataset['mobileSheet'] = isOpen ? 'open' : 'closed';
    this.mobileSheetOpen.set(isOpen);
  }

  toggleMobileClues(): void {
    const isOpen = this.mobileSheetOpen();
    this.setMobileCluesOpen(!isOpen);
    const wordId = this.currentWordId();
    if (!isOpen && wordId) {
      requestAnimationFrame(() => this.highlightClue(wordId));
    }
  }

  // ==================== Scroll / focus ====================

  // Quando la lista non scrolla da sola (layout mobile) lasciamo stare: la pagina deve seguire
  // la cella, non la definizione.
  private highlightClue(wordId: string): void {
    const button = this.clueButtonEls.get(wordId);
    const list = this.cluesListEl;
    if (!button || !list) {
      return;
    }

    const limits = getScrollLimits(list);
    if (limits.top <= 0) {
      return;
    }

    const listRect = list.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    const top = list.scrollTop + buttonRect.top - listRect.top - (list.clientHeight - buttonRect.height) / 2;

    animateScrollTo(list, list.scrollLeft, top);
  }

  centerCellIntoView(cellKey: string): void {
    const input = this.cellInputEls.get(cellKey);
    const scroller = this.gridScrollEl;
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

    // Dove finirà la cella nel viewport una volta che il riquadro si è assestato. Quello che il
    // riquadro non riesce a scrollare lo recupera la pagina: sotto i 980px la griglia cresce in
    // altezza e l'unico scroller verticale è il documento.
    this.centerCellIntoPage({
      left: cellRect.left - (left - position.left),
      top: cellRect.top - (top - position.top),
      width: cellRect.width,
      height: cellRect.height,
      forceVertical: limits.top <= 0,
      forceHorizontal: limits.left <= 0
    });
  }

  private centerCellIntoPage(projection: {
    left: number;
    top: number;
    width: number;
    height: number;
    forceVertical: boolean;
    forceHorizontal: boolean;
  }): void {
    // Il viewport "visuale" tiene conto della tastiera aperta sul telefono, così la cella
    // finisce al centro di quello che si vede davvero.
    const viewport = getVisualViewport();
    const limits = getScrollLimits(window);
    const position = getScrollPosition(window);

    const relativeLeft = projection.left - viewport.left;
    const relativeTop = projection.top - viewport.top;
    const centeredLeft = position.left + relativeLeft - (viewport.width - projection.width) / 2;
    const centeredTop = position.top + relativeTop - (viewport.height - projection.height) / 2;

    const left =
      limits.left > 0 && needsPageScroll(relativeLeft, projection.width, viewport.width, projection.forceHorizontal)
        ? clampNumber(centeredLeft, 0, limits.left)
        : position.left;
    const top =
      limits.top > 0 && needsPageScroll(relativeTop, projection.height, viewport.height, projection.forceVertical)
        ? clampNumber(centeredTop, 0, limits.top)
        : position.top;

    animateScrollTo(window, left, top);
  }

  focusCell(cellKey: string): void {
    const input = this.cellInputEls.get(cellKey);
    if (input) {
      input.focus({ preventScroll: true });
      input.select();
    }
  }

  // Se l'utente scrolla a mano smettiamo di trascinarlo dove diciamo noi (wheel e touch
  // risalgono fino a window, quindi bastano questi due listener).
  private bindScrollInterruptions(): void {
    if (this.scrollInterruptionsBound) {
      return;
    }
    this.scrollInterruptionsBound = true;

    const stop = () => {
      ([window as ScrollTarget, this.gridScrollEl, this.cluesListEl].filter(Boolean) as ScrollTarget[]).forEach(
        (target) => cancelScrollAnimation(target)
      );
    };

    window.addEventListener('wheel', stop, { passive: true });
    window.addEventListener('touchstart', stop, { passive: true });

    // La tastiera del telefono che si apre (o la rotazione dello schermo) cambia l'altezza
    // utile: rimettiamo al centro la cella attiva.
    const recenter = () => {
      const key = this.currentCellKey();
      if (key) {
        this.centerCellIntoView(key);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', recenter);
    } else {
      window.addEventListener('resize', recenter);
    }

    this.cleanupFns.push(() => {
      window.removeEventListener('wheel', stop);
      window.removeEventListener('touchstart', stop);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', recenter);
      } else {
        window.removeEventListener('resize', recenter);
      }
    });
  }

  // Il servizio è scoped alla pagina (providers: [CrosswordService] su Cruciverba): Angular
  // chiama questo automaticamente quando si lascia la pagina. A differenza dell'originale (un
  // caricamento statico, mai smontato) qui serve davvero ripulire timer e listener globali,
  // altrimenti resterebbero agganciati a una pagina Angular non più nel DOM.
  ngOnDestroy(): void {
    this.wordAttemptTimers.forEach((timer) => clearTimeout(timer));
    this.wordAttemptTimers.clear();
    this.cleanupFns.forEach((fn) => fn());
    this.cleanupFns = [];
    delete document.body.dataset['mobileMode'];
    delete document.body.dataset['mobileSheet'];
  }
}
