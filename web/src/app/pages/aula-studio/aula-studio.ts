import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppShell } from '../../shell/app-shell';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { StudyFocusService } from '../../core/study-focus.service';
import { TelemetryService } from '../../core/telemetry.service';
import { ConfirmationDialog } from '../../shared/confirmation-dialog/confirmation-dialog';
import { StudyFlashCard } from './study-flash-card';

interface StudyCard {
  id?: number;
  question: string;
  answer: string;
  position?: number;
}

interface StudySessionCard extends StudyCard {
  context: string;
}

interface StudyTopicSummary {
  id: number;
  title: string;
  folderId: number | null;
  cardCount: number;
  createdAt: string;
  updatedAt: string;
}

interface StudyTopic {
  id: number;
  title: string;
  folderId: number | null;
  cards: StudyCard[];
  createdAt: string;
  updatedAt: string;
}

interface StudyFolder {
  id: number;
  name: string;
  parentId: number | null;
  createdAt: string;
  updatedAt: string;
}

interface StudyQuizSummary {
  id: number;
  folderId: number | null;
  title: string;
  correctionMode: 'immediate' | 'final';
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  questionCount: number;
  activeAttemptId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TopicDraft {
  title: string;
  pairs: string;
  folderId: number | null;
}

interface FolderChoice extends StudyFolder {
  label: string;
}

interface ParsedPairs {
  cards: StudyCard[];
  danglingQuestion: string | null;
}

interface BulkImportSummary {
  paths: number;
  topics: number;
  cards: number;
  quizzes: number;
  quizQuestions: number;
}

interface BulkImportError {
  line?: number;
  message: string;
  path?: string;
  topic?: string;
}

interface BulkPreviewPath {
  path: string;
  topics: Array<{
    kind: 'flashcard' | 'quiz';
    title: string;
    cardCount?: number;
    questionCount?: number;
  }>;
}

interface BulkImportResponse {
  paths?: BulkPreviewPath[];
  summary?: BulkImportSummary;
  importId?: string;
  createdAt?: string;
  errors?: BulkImportError[];
  error?: string;
}

interface BulkImportHistoryItem {
  id: string;
  createdAt: string;
  createdBy: string;
  revertedAt: string | null;
  revertedBy: string | null;
  createdFolders: number;
  modifiedItems: number;
  details: BulkImportHistoryDetail[];
  summary: BulkImportSummary;
}

interface BulkImportHistoryDetail {
  path: string;
  kind: 'flashcard' | 'quiz';
  title: string;
  itemCount: number;
}

interface BulkImportHistoryResponse {
  imports?: BulkImportHistoryItem[];
  error?: string;
}

export function collectFolderStudyCards(
  folders: StudyFolder[],
  topics: StudyTopic[],
  folderId: number,
): StudySessionCard[] {
  const descendantIds = new Set<number>([folderId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const folder of folders) {
      if (
        folder.parentId !== null &&
        descendantIds.has(folder.parentId) &&
        !descendantIds.has(folder.id)
      ) {
        descendantIds.add(folder.id);
        changed = true;
      }
    }
  }

  return topics
    .filter((topic) => topic.folderId !== null && descendantIds.has(topic.folderId))
    .flatMap((topic) => {
      const context = buildStudyTopicPath(folders, topic);
      return topic.cards.map((card) => ({ ...card, context }));
    });
}

export function buildStudyTopicPath(
  folders: StudyFolder[],
  topic: Pick<StudyTopicSummary, 'title' | 'folderId'>,
): string {
  const byId = new Map(folders.map((folder) => [folder.id, folder]));
  const names: string[] = [topic.title];
  const visited = new Set<number>();
  let folder = topic.folderId === null ? null : (byId.get(topic.folderId) ?? null);
  while (folder && !visited.has(folder.id)) {
    visited.add(folder.id);
    names.unshift(folder.name);
    folder = folder.parentId === null ? null : (byId.get(folder.parentId) ?? null);
  }
  return names.join(' › ');
}

export function parseStudyPairs(value: string): ParsedPairs {
  const lines = value
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const cards: StudyCard[] = [];

  for (let index = 0; index + 1 < lines.length; index += 2) {
    cards.push({ question: lines[index], answer: lines[index + 1] });
  }

  return {
    cards,
    danglingQuestion: lines.length % 2 === 1 ? (lines.at(-1) ?? null) : null,
  };
}

function topicToDraft(topic: StudyTopic): TopicDraft {
  return {
    title: topic.title,
    pairs: topic.cards.flatMap((card) => [card.question, card.answer]).join('\n'),
    folderId: topic.folderId,
  };
}

export function buildFolderChoices(folders: StudyFolder[]): FolderChoice[] {
  const children = new Map<number | null, StudyFolder[]>();
  for (const folder of folders) {
    const siblings = children.get(folder.parentId) ?? [];
    siblings.push(folder);
    children.set(folder.parentId, siblings);
  }
  for (const siblings of children.values()) {
    siblings.sort((a, b) => a.name.localeCompare(b.name, 'it', { sensitivity: 'base' }));
  }

  const result: FolderChoice[] = [];
  const visited = new Set<number>();
  const visit = (parentId: number | null, depth: number): void => {
    for (const folder of children.get(parentId) ?? []) {
      if (visited.has(folder.id)) continue;
      visited.add(folder.id);
      result.push({ ...folder, label: `${'— '.repeat(depth)}${folder.name}` });
      visit(folder.id, depth + 1);
    }
  };
  visit(null, 0);
  return result;
}

function shuffledIndices(length: number): number[] {
  const result = Array.from({ length }, (_, index) => index);
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
}

@Component({
  selector: 'app-aula-studio',
  standalone: true,
  imports: [AppShell, FormsModule, ConfirmationDialog, StudyFlashCard],
  styleUrls: ['../../../styles/pages/aula-studio.css'],
  templateUrl: './aula-studio.html',
})
export class AulaStudio implements OnDestroy {
  private readonly api = inject(ApiService);
  private readonly telemetry = inject(TelemetryService);
  private readonly router = inject(Router);
  protected readonly authService = inject(AuthService);
  protected readonly focusMode = inject(StudyFocusService);

  protected readonly topics = signal<StudyTopicSummary[]>([]);
  protected readonly folders = signal<StudyFolder[]>([]);
  protected readonly quizzes = signal<StudyQuizSummary[]>([]);
  protected readonly loading = signal(true);
  protected readonly pageError = signal('');
  protected readonly saving = signal(false);
  protected readonly openingTopicId = signal<number | null>(null);
  protected readonly openingFolderId = signal<number | null>(null);

  protected readonly editingId = signal<number | 'new' | null>(null);
  protected readonly draft = signal<TopicDraft>({ title: '', pairs: '', folderId: null });
  protected readonly formError = signal('');
  protected readonly parsedPairs = computed(() => parseStudyPairs(this.draft().pairs));
  protected readonly deleteTarget = signal<StudyTopicSummary | null>(null);

  protected readonly currentFolderId = signal<number | null>(null);
  protected readonly editingFolderId = signal<number | 'new' | null>(null);
  protected readonly folderName = signal('');
  protected readonly folderError = signal('');
  protected readonly savingFolder = signal(false);
  protected readonly deleteFolderTarget = signal<StudyFolder | null>(null);
  protected readonly canBulkImport = computed(
    () => this.authService.isAdmin() && this.authService.adminModeEnabled(),
  );
  protected readonly bulkMode = signal(false);
  protected readonly bulkStep = signal<1 | 2 | 3>(1);
  protected readonly bulkSource = signal('');
  protected readonly bulkFileName = signal('');
  protected readonly bulkPreview = signal<BulkPreviewPath[]>([]);
  protected readonly bulkSummary = signal<BulkImportSummary | null>(null);
  private readonly bulkIdempotencyKey = signal('');
  protected readonly bulkConfirmed = signal(false);
  protected readonly bulkChecking = signal(false);
  protected readonly bulkImporting = signal(false);
  protected readonly bulkErrors = signal<BulkImportError[]>([]);
  protected readonly bulkError = signal('');
  protected readonly bulkResult = signal<BulkImportSummary | null>(null);
  protected readonly bulkImports = signal<BulkImportHistoryItem[]>([]);
  protected readonly bulkImportsLoading = signal(false);
  protected readonly bulkImportsError = signal('');
  protected readonly revertingImportId = signal<string | null>(null);
  protected readonly revertImportTarget = signal<BulkImportHistoryItem | null>(null);
  protected readonly currentFolder = computed(
    () => this.folders().find((folder) => folder.id === this.currentFolderId()) ?? null,
  );
  protected readonly currentFolders = computed(() =>
    this.folders().filter((folder) => folder.parentId === this.currentFolderId()),
  );
  protected readonly currentTopics = computed(() =>
    this.topics().filter((topic) => topic.folderId === this.currentFolderId()),
  );
  protected readonly currentQuizzes = computed(() =>
    this.quizzes().filter((quiz) => quiz.folderId === this.currentFolderId()),
  );
  protected readonly folderChoices = computed(() => buildFolderChoices(this.folders()));
  protected readonly breadcrumbs = computed(() => {
    const byId = new Map(this.folders().map((folder) => [folder.id, folder]));
    const path: StudyFolder[] = [];
    const visited = new Set<number>();
    let folder = this.currentFolder();
    while (folder && !visited.has(folder.id)) {
      visited.add(folder.id);
      path.unshift(folder);
      folder = folder.parentId === null ? null : (byId.get(folder.parentId) ?? null);
    }
    return path;
  });

  protected readonly studyingTopicId = signal<number | null>(null);
  protected readonly studyDeck = signal<StudySessionCard[]>([]);
  protected readonly studySessionTitle = signal('');
  protected readonly studySessionKind = signal<'topic' | 'folder' | null>(null);
  private readonly studyOrder = signal<number[]>([]);
  private studySessionId: string | null = null;
  private studySubjectId: number | null = null;
  private studyStartedAt = 0;
  private studyFlips = 0;
  private studyNavigations = 0;
  private studyCompleted = false;
  private readonly viewedStudyCards = new Set<number>();
  protected readonly studyPosition = signal(0);
  protected readonly flipped = signal(false);
  protected readonly transitionDirection = signal<'next' | 'previous' | null>(null);
  protected readonly outgoingCard = signal<{ card: StudySessionCard; flipped: boolean } | null>(
    null,
  );
  private transitionTimer: ReturnType<typeof window.setTimeout> | null = null;
  private libraryLoadController: AbortController | null = null;
  private readonly reducedMotion =
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  protected readonly isStudying = computed(() => this.studySessionKind() !== null);
  protected readonly currentCard = computed(() => {
    const cardIndex = this.studyOrder()[this.studyPosition()];
    return cardIndex !== undefined ? (this.studyDeck()[cardIndex] ?? null) : null;
  });

  constructor() {
    this.focusMode.enterPage();
    void this.load();
  }

  ngOnDestroy(): void {
    this.libraryLoadController?.abort();
    this.endStudySession('page_left');
    this.clearCardTransition();
    this.focusMode.leavePage();
  }

  protected toggleFocusMode(): void {
    this.focusMode.setEnabled(!this.focusMode.enabled());
  }

  protected startCreate(): void {
    this.closeBulkImport();
    this.closeStudy();
    this.closeFolderEditor();
    this.draft.set({ title: '', pairs: '', folderId: this.currentFolderId() });
    this.formError.set('');
    this.editingId.set('new');
  }

  protected async startEdit(topic: StudyTopicSummary): Promise<void> {
    if (this.openingTopicId() !== null) return;
    this.closeStudy();
    this.closeFolderEditor();
    this.openingTopicId.set(topic.id);
    this.pageError.set('');
    try {
      const detail = await this.loadTopicDetails(topic.id);
      this.draft.set(topicToDraft(detail));
      this.formError.set('');
      this.editingId.set(topic.id);
    } catch (error) {
      this.pageError.set(
        error instanceof Error ? error.message : "Non è stato possibile aprire l'argomento.",
      );
    } finally {
      this.openingTopicId.set(null);
    }
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
    this.formError.set('');
  }

  protected updateDraft(patch: Partial<TopicDraft>): void {
    this.draft.set({ ...this.draft(), ...patch });
  }

  protected openFolder(folderId: number | null): void {
    this.cancelEdit();
    this.closeFolderEditor();
    this.currentFolderId.set(folderId);
    this.pageError.set('');
  }

  protected startCreateFolder(): void {
    this.closeBulkImport();
    this.cancelEdit();
    this.folderName.set('');
    this.folderError.set('');
    this.editingFolderId.set('new');
  }

  protected startRenameFolder(folder: StudyFolder): void {
    this.cancelEdit();
    this.folderName.set(folder.name);
    this.folderError.set('');
    this.editingFolderId.set(folder.id);
  }

  protected closeFolderEditor(): void {
    this.editingFolderId.set(null);
    this.folderError.set('');
  }

  protected startBulkImport(): void {
    this.cancelEdit();
    this.closeFolderEditor();
    this.bulkMode.set(true);
    this.bulkStep.set(1);
    this.bulkSource.set('');
    this.bulkFileName.set('');
    this.bulkPreview.set([]);
    this.bulkSummary.set(null);
    this.bulkIdempotencyKey.set('');
    this.bulkConfirmed.set(false);
    this.bulkErrors.set([]);
    this.bulkError.set('');
    this.bulkResult.set(null);
    void this.loadBulkImports();
  }

  protected closeBulkImport(): void {
    this.bulkMode.set(false);
    this.bulkError.set('');
    this.bulkErrors.set([]);
  }

  protected async loadBulkFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.name.toLocaleLowerCase('it').endsWith('.md')) {
      this.bulkFileName.set('');
      this.bulkError.set('Scegli un file con estensione .md.');
      input.value = '';
      return;
    }
    try {
      this.bulkSource.set(await file.text());
      this.bulkFileName.set(file.name);
      this.bulkError.set('');
      this.bulkErrors.set([]);
    } catch {
      this.bulkError.set('Non è stato possibile leggere il file selezionato.');
    }
  }

  protected async previewBulkImport(): Promise<void> {
    this.bulkChecking.set(true);
    this.bulkError.set('');
    this.bulkErrors.set([]);
    try {
      const response = await fetch('/api/study-imports/preview', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: this.bulkSource() }),
      });
      const result = await this.api.readApiResponse<BulkImportResponse>(response);
      if (!response.ok) {
        this.bulkErrors.set(result.errors ?? []);
        this.bulkError.set(
          result.error ?? (result.errors?.length ? '' : 'Controllo non riuscito.'),
        );
        return;
      }
      this.bulkPreview.set(result.paths ?? []);
      this.bulkSummary.set(result.summary ?? null);
      this.bulkIdempotencyKey.set(crypto.randomUUID());
      this.bulkConfirmed.set(false);
      this.bulkResult.set(null);
      this.bulkStep.set(2);
    } catch {
      this.bulkError.set('Non è stato possibile controllare il contenuto.');
    } finally {
      this.bulkChecking.set(false);
    }
  }

  protected returnToBulkSource(): void {
    this.bulkStep.set(1);
    this.bulkIdempotencyKey.set('');
    this.bulkConfirmed.set(false);
    this.bulkError.set('');
    this.bulkErrors.set([]);
  }

  protected async importBulk(): Promise<void> {
    if (!this.bulkConfirmed()) return;
    if (!this.bulkIdempotencyKey()) this.bulkIdempotencyKey.set(crypto.randomUUID());
    this.bulkImporting.set(true);
    this.bulkError.set('');
    this.bulkErrors.set([]);
    try {
      const response = await fetch('/api/study-imports', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: this.bulkSource(),
          idempotencyKey: this.bulkIdempotencyKey(),
        }),
      });
      const result = await this.api.readApiResponse<BulkImportResponse>(response);
      if (!response.ok || !result.importId || !result.summary || !result.createdAt) {
        this.bulkErrors.set(result.errors ?? []);
        this.bulkError.set(result.error ?? 'Importazione non riuscita.');
        return;
      }
      this.bulkResult.set(result.summary);
      this.bulkStep.set(3);
      await Promise.all([this.load(), this.loadBulkImports()]);
    } catch {
      this.bulkError.set("Non è stato possibile completare l'importazione.");
    } finally {
      this.bulkImporting.set(false);
    }
  }

  protected requestRevertImport(item: BulkImportHistoryItem): void {
    if (item.revertedAt || this.revertingImportId() !== null) return;
    this.revertImportTarget.set(item);
  }

  protected async confirmRevertImport(): Promise<void> {
    const target = this.revertImportTarget();
    if (!target || this.revertingImportId() !== null) return;

    this.revertImportTarget.set(null);
    this.revertingImportId.set(target.id);
    this.bulkImportsError.set('');
    try {
      const response = await this.fetchWithTimeout(
        `/api/study-imports/${encodeURIComponent(target.id)}`,
        15_000,
        'DELETE',
      );
      const result = await this.api.readApiResponse<{
        reverted?: boolean;
        error?: string;
      }>(response);
      if (!response.ok || !result.reverted) {
        throw new Error(result.error || 'Annullamento non riuscito.');
      }
      await Promise.all([this.load(), this.loadBulkImports()]);
    } catch (error) {
      this.bulkImportsError.set(
        error instanceof Error ? error.message : "Non è stato possibile annullare l'importazione.",
      );
    } finally {
      this.revertingImportId.set(null);
    }
  }

  protected formatBulkImportDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('it-IT', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Europe/Rome',
    }).format(date);
  }

  protected bulkImportSummary(item: BulkImportHistoryItem): string {
    const parts: string[] = [];
    if (item.createdFolders > 0) {
      parts.push(`${item.createdFolders} ${item.createdFolders === 1 ? 'cartella' : 'cartelle'}`);
    }
    if (item.summary.topics > 0) {
      parts.push(`${item.summary.topics} ${item.summary.topics === 1 ? 'argomento' : 'argomenti'}`);
    }
    if (item.summary.cards > 0) parts.push(`${item.summary.cards} flashcard`);
    if (item.summary.quizzes > 0) {
      parts.push(`${item.summary.quizzes} quiz (${item.summary.quizQuestions} domande)`);
    }
    return parts.join(' · ') || 'Nessun contenuto registrato';
  }

  protected revertImportDescription(item: BulkImportHistoryItem | null): string {
    if (!item) return '';
    const warning =
      item.modifiedItems > 0
        ? ` Attenzione: ${item.modifiedItems} ${item.modifiedItems === 1 ? 'elemento risulta modificato' : 'elementi risultano modificati'} dopo l’importazione e ${item.modifiedItems === 1 ? 'sarà comunque rimosso' : 'saranno comunque rimossi'}.`
        : '';
    return `Verranno rimossi dall’Aula studio ${this.bulkImportSummary(item)}. Le cartelle saranno rimosse solo se vuote; lo storico dei tentativi dei quiz verrà conservato.${warning}`;
  }

  protected async saveFolder(): Promise<void> {
    const name = this.folderName().trim();
    if (!name) {
      this.folderError.set('Scrivi un nome per la cartella.');
      return;
    }

    const editingId = this.editingFolderId();
    if (editingId === null) return;
    const isNew = editingId === 'new';
    this.savingFolder.set(true);
    this.folderError.set('');
    try {
      const response = await fetch(
        isNew ? '/api/study-folders' : `/api/study-folders/${editingId}`,
        {
          method: isNew ? 'POST' : 'PUT',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, parentId: this.currentFolderId() }),
        },
      );
      const result = await this.api.readApiResponse<{ error?: string }>(response);
      if (!response.ok) throw new Error(result.error || 'Salvataggio non riuscito.');
      this.closeFolderEditor();
      await this.load();
    } catch (error) {
      this.folderError.set(
        error instanceof Error ? error.message : 'Non è stato possibile salvare la cartella.',
      );
    } finally {
      this.savingFolder.set(false);
    }
  }

  protected folderTopicCount(folderId: number): number {
    const descendants = new Set<number>([folderId]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const folder of this.folders()) {
        if (
          folder.parentId !== null &&
          descendants.has(folder.parentId) &&
          !descendants.has(folder.id)
        ) {
          descendants.add(folder.id);
          changed = true;
        }
      }
    }
    return this.topics().filter(
      (topic) => topic.folderId !== null && descendants.has(topic.folderId),
    ).length;
  }

  protected folderQuizCount(folderId: number): number {
    const descendants = this.folderDescendantIds(folderId);
    return this.quizzes().filter((quiz) => quiz.folderId !== null && descendants.has(quiz.folderId))
      .length;
  }

  private folderDescendantIds(folderId: number): Set<number> {
    const descendants = new Set<number>([folderId]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const folder of this.folders()) {
        if (
          folder.parentId !== null &&
          descendants.has(folder.parentId) &&
          !descendants.has(folder.id)
        ) {
          descendants.add(folder.id);
          changed = true;
        }
      }
    }
    return descendants;
  }

  protected folderCardCount(folderId: number): number {
    const descendants = this.folderDescendantIds(folderId);
    return this.topics().reduce(
      (total, topic) =>
        topic.folderId !== null && descendants.has(topic.folderId)
          ? total + topic.cardCount
          : total,
      0,
    );
  }

  protected folderChildCount(folderId: number): number {
    return this.folders().filter((folder) => folder.parentId === folderId).length;
  }

  protected requestDeleteFolder(folder: StudyFolder): void {
    this.deleteFolderTarget.set(folder);
  }

  protected async confirmDeleteFolder(): Promise<void> {
    const folder = this.deleteFolderTarget();
    if (!folder) return;
    try {
      const response = await fetch(`/api/study-folders/${folder.id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      const result = await this.api.readApiResponse<{ error?: string }>(response);
      if (!response.ok) throw new Error(result.error || 'Eliminazione non riuscita.');
      this.deleteFolderTarget.set(null);
      await this.load();
    } catch (error) {
      this.pageError.set(
        error instanceof Error ? error.message : 'Non è stato possibile eliminare la cartella.',
      );
      this.deleteFolderTarget.set(null);
    }
  }

  protected async saveTopic(): Promise<void> {
    const title = this.draft().title.trim();
    const parsed = this.parsedPairs();
    if (!title) {
      this.formError.set('Scrivi un nome per l’argomento.');
      return;
    }
    if (parsed.danglingQuestion) {
      this.formError.set(`Manca la risposta a: “${parsed.danglingQuestion}”.`);
      return;
    }
    if (parsed.cards.length === 0) {
      this.formError.set('Aggiungi almeno una domanda e la sua risposta.');
      return;
    }
    this.saving.set(true);
    this.formError.set('');
    const editingId = this.editingId();
    const isNew = editingId === 'new';
    const endpoint = isNew ? '/api/study-topics' : `/api/study-topics/${editingId}`;
    try {
      const response = await fetch(endpoint, {
        method: isNew ? 'POST' : 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, cards: parsed.cards, folderId: this.draft().folderId }),
      });
      const result = await this.api.readApiResponse<{ error?: string }>(response);
      if (!response.ok) throw new Error(result.error || 'Salvataggio non riuscito.');
      this.editingId.set(null);
      await this.load();
    } catch (error) {
      this.formError.set(
        error instanceof Error ? error.message : 'Non è stato possibile salvare l’argomento.',
      );
    } finally {
      this.saving.set(false);
    }
  }

  protected requestDelete(topic: StudyTopicSummary): void {
    this.deleteTarget.set(topic);
  }

  protected async confirmDelete(): Promise<void> {
    const topic = this.deleteTarget();
    if (!topic) return;
    try {
      const response = await fetch(`/api/study-topics/${topic.id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      if (!response.ok) throw new Error();
      this.deleteTarget.set(null);
      if (this.studyingTopicId() === topic.id) this.closeStudy();
      await this.load();
    } catch {
      this.pageError.set('Non è stato possibile eliminare l’argomento.');
      this.deleteTarget.set(null);
    }
  }

  protected async startStudy(topic: StudyTopicSummary): Promise<void> {
    if (this.openingTopicId() !== null) return;
    this.openingTopicId.set(topic.id);
    this.pageError.set('');
    try {
      const detail = await this.loadTopicDetails(topic.id);
      const context = buildStudyTopicPath(this.folders(), detail);
      const cards = detail.cards.map((card) => ({ ...card, context }));
      this.beginStudy(detail.title, cards, 'topic', detail.id);
    } catch (error) {
      this.pageError.set(
        error instanceof Error ? error.message : 'Non è stato possibile iniziare il ripasso.',
      );
    } finally {
      this.openingTopicId.set(null);
    }
  }

  protected openQuiz(quiz: StudyQuizSummary): void {
    void this.router.navigate(['/aula-studio/quiz', quiz.id]);
  }

  protected async deleteQuiz(quiz: StudyQuizSummary): Promise<void> {
    if (
      !window.confirm(
        `Eliminare il quiz “${quiz.title}”? Lo storico dei tentativi resterà disponibile.`,
      )
    )
      return;
    const response = await fetch(`/api/study-quizzes/${quiz.id}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    });
    if (!response.ok) {
      this.pageError.set('Non è stato possibile eliminare il quiz.');
      return;
    }
    await this.load();
  }

  protected async startFolderStudy(folder: StudyFolder): Promise<void> {
    if (this.openingFolderId() !== null) return;
    this.openingFolderId.set(folder.id);
    this.pageError.set('');
    try {
      const response = await this.fetchWithTimeout(`/api/study-folders/${folder.id}/cards`);
      const result = await this.api.readApiResponse<{ topics?: StudyTopic[]; error?: string }>(
        response,
      );
      if (!response.ok) throw new Error(result.error || 'Caricamento non riuscito.');
      const cards = collectFolderStudyCards(this.folders(), result.topics ?? [], folder.id);
      if (cards.length === 0) return;
      this.beginStudy(`${folder.name} · Tutto insieme`, cards, 'folder', folder.id);
    } catch (error) {
      this.pageError.set(
        error instanceof Error ? error.message : 'Non è stato possibile iniziare il ripasso.',
      );
    } finally {
      this.openingFolderId.set(null);
    }
  }

  protected closeStudy(): void {
    this.endStudySession('closed');
    this.clearCardTransition();
    this.studyingTopicId.set(null);
    this.studyDeck.set([]);
    this.studySessionTitle.set('');
    this.studySessionKind.set(null);
    this.studyOrder.set([]);
    this.studyPosition.set(0);
    this.flipped.set(false);
  }

  protected shuffleDeck(): void {
    const cards = this.studyDeck();
    if (cards.length === 0) return;
    this.clearCardTransition();
    this.studyOrder.set(shuffledIndices(cards.length));
    this.studyPosition.set(0);
    this.flipped.set(false);
    this.markCurrentCardViewed();
    this.trackStudyEvent('study_deck_shuffled', { cardCount: cards.length });
  }

  protected flipCurrentCard(): void {
    const flipped = !this.flipped();
    this.flipped.set(flipped);
    this.studyFlips += 1;
    this.trackStudyEvent('study_card_flipped', {
      position: this.studyPosition() + 1,
      side: flipped ? 'answer' : 'question',
    });
  }

  protected previousCard(): void {
    this.moveCard(-1, 'previous');
  }

  protected nextCard(): void {
    this.moveCard(1, 'next');
  }

  private beginStudy(
    title: string,
    cards: StudySessionCard[],
    kind: 'topic' | 'folder',
    subjectId: number,
  ): void {
    this.cancelEdit();
    this.closeFolderEditor();
    this.pageError.set('');
    this.clearCardTransition();
    this.studyingTopicId.set(kind === 'topic' ? subjectId : null);
    this.studyDeck.set([...cards]);
    this.studySessionTitle.set(title);
    this.studySessionKind.set(kind);
    this.studySubjectId = subjectId;
    this.studySessionId = crypto.randomUUID();
    this.studyStartedAt = Date.now();
    this.studyFlips = 0;
    this.studyNavigations = 0;
    this.studyCompleted = false;
    this.viewedStudyCards.clear();
    this.studyOrder.set(shuffledIndices(cards.length));
    this.studyPosition.set(0);
    this.flipped.set(false);
    this.trackStudyEvent('study_session_started', {
      cardCount: cards.length,
      ...(kind === 'topic' ? { topicId: subjectId } : { folderId: subjectId }),
    });
    this.markCurrentCardViewed();
  }

  private moveCard(offset: -1 | 1, direction: 'next' | 'previous'): void {
    if (this.transitionDirection()) return;
    const card = this.currentCard();
    const targetPosition = this.studyPosition() + offset;
    if (!card || targetPosition < 0 || targetPosition >= this.studyOrder().length) return;

    if (this.reducedMotion) {
      this.studyPosition.set(targetPosition);
      this.flipped.set(false);
      this.recordStudyNavigation(direction, targetPosition);
      return;
    }

    this.outgoingCard.set({ card, flipped: this.flipped() });
    this.transitionDirection.set(direction);
    this.studyPosition.set(targetPosition);
    this.flipped.set(false);
    this.recordStudyNavigation(direction, targetPosition);
    this.transitionTimer = window.setTimeout(() => this.clearCardTransition(), 360);
  }

  private recordStudyNavigation(direction: 'next' | 'previous', targetPosition: number): void {
    this.studyNavigations += 1;
    this.markCurrentCardViewed();
    this.trackStudyEvent('study_card_navigated', {
      direction,
      position: targetPosition + 1,
      cardCount: this.studyDeck().length,
    });
  }

  private markCurrentCardViewed(): void {
    const cardIndex = this.studyOrder()[this.studyPosition()];
    if (cardIndex === undefined) return;
    this.viewedStudyCards.add(cardIndex);
    if (!this.studyCompleted && this.viewedStudyCards.size === this.studyDeck().length) {
      this.studyCompleted = true;
      this.trackStudyEvent('study_session_completed', this.studySummary());
    }
  }

  private endStudySession(reason: 'closed' | 'page_left'): void {
    if (!this.studySessionId) return;
    this.trackStudyEvent('study_session_ended', { reason, ...this.studySummary() });
    this.studySessionId = null;
    this.studySubjectId = null;
  }

  private studySummary(): Record<string, unknown> {
    return {
      cardCount: this.studyDeck().length,
      viewedCardCount: this.viewedStudyCards.size,
      flipCount: this.studyFlips,
      navigationCount: this.studyNavigations,
      completed: this.studyCompleted,
      durationSeconds: Math.max(0, Math.round((Date.now() - this.studyStartedAt) / 1000)),
    };
  }

  private trackStudyEvent(eventType: string, metadata: Record<string, unknown>): void {
    if (!this.studySessionId) return;
    const kind = this.studySessionKind();
    void this.telemetry.trackEvent('aula-studio', eventType, {
      studySessionId: this.studySessionId,
      kind,
      ...(kind === 'topic' ? { topicId: this.studySubjectId } : { folderId: this.studySubjectId }),
      ...metadata,
    });
  }

  private clearCardTransition(): void {
    if (this.transitionTimer !== null) window.clearTimeout(this.transitionTimer);
    this.transitionTimer = null;
    this.outgoingCard.set(null);
    this.transitionDirection.set(null);
  }

  protected retryLoad(): void {
    void this.load();
  }

  private async loadTopicDetails(topicId: number): Promise<StudyTopic> {
    const response = await this.fetchWithTimeout(`/api/study-topics/${topicId}`);
    const result = await this.api.readApiResponse<{ topic?: StudyTopic; error?: string }>(response);
    if (!response.ok || !result.topic) {
      throw new Error(result.error || "Non è stato possibile caricare l'argomento.");
    }
    return result.topic;
  }

  protected async loadBulkImports(): Promise<void> {
    if (!this.canBulkImport()) return;
    this.bulkImportsLoading.set(true);
    this.bulkImportsError.set('');
    try {
      const response = await this.fetchWithTimeout('/api/study-imports');
      const result = await this.api.readApiResponse<BulkImportHistoryResponse>(response);
      if (!response.ok) {
        throw new Error(result.error || 'Caricamento delle importazioni non riuscito.');
      }
      this.bulkImports.set(result.imports ?? []);
    } catch (error) {
      this.bulkImportsError.set(
        error instanceof Error ? error.message : 'Non è stato possibile caricare le importazioni.',
      );
    } finally {
      this.bulkImportsLoading.set(false);
    }
  }

  private async fetchWithTimeout(
    input: RequestInfo | URL,
    timeoutMs = 15_000,
    method: 'GET' | 'DELETE' = 'GET',
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(input, {
        method,
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
    } catch (error) {
      if (controller.signal.aborted) {
        throw new Error('Il caricamento sta impiegando troppo tempo. Riprova.');
      }
      throw error;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  private async load(): Promise<void> {
    this.libraryLoadController?.abort();
    const controller = new AbortController();
    this.libraryLoadController = controller;
    let timedOut = false;
    const timeout = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 15_000);
    this.loading.set(true);
    this.pageError.set('');
    try {
      const [topicResponse, quizResponse] = await Promise.all([
        fetch('/api/study-topics', {
          credentials: 'same-origin',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        }),
        fetch('/api/study-quizzes', {
          credentials: 'same-origin',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        }),
      ]);
      const result = await this.api.readApiResponse<{
        topics?: StudyTopicSummary[];
        folders?: StudyFolder[];
        error?: string;
      }>(topicResponse);
      const quizResult = await this.api.readApiResponse<{
        quizzes?: StudyQuizSummary[];
        error?: string;
      }>(quizResponse);
      if (!topicResponse.ok || !quizResponse.ok)
        throw new Error(result.error || quizResult.error || 'Caricamento non riuscito.');
      this.topics.set(result.topics ?? []);
      this.folders.set(result.folders ?? []);
      this.quizzes.set(quizResult.quizzes ?? []);
      if (
        this.currentFolderId() !== null &&
        !(result.folders ?? []).some((folder) => folder.id === this.currentFolderId())
      ) {
        this.currentFolderId.set(null);
      }
    } catch (error) {
      if (this.libraryLoadController !== controller) return;
      this.pageError.set(
        timedOut
          ? 'Il caricamento dell’Aula sta impiegando troppo tempo.'
          : error instanceof Error
            ? error.message
            : 'Non è stato possibile aprire l’Aula studio.',
      );
    } finally {
      window.clearTimeout(timeout);
      if (this.libraryLoadController === controller) {
        this.libraryLoadController = null;
        this.loading.set(false);
      }
    }
  }
}
