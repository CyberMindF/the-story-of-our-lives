import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppShell } from '../../shell/app-shell';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { StudyFocusService } from '../../core/study-focus.service';
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

type BulkConflictPolicy = 'skip' | 'append' | 'replace';

interface BulkImportSummary {
  foldersCreated: number;
  foldersReused: number;
  topicsCreated: number;
  topicsSkipped: number;
  topicsAppended: number;
  topicsReplaced: number;
  cardsInserted: number;
}

interface BulkImportError {
  line?: number;
  message: string;
  path?: string;
  topic?: string;
}

interface BulkPreviewPath {
  path: string;
  segments: string[];
  topics: Array<{ title: string; cardCount: number; conflict: boolean }>;
}

interface BulkPreviewResponse {
  paths?: BulkPreviewPath[];
  conflictCount?: number;
  summary?: BulkImportSummary;
  totalTopics?: number;
  totalCards?: number;
  errors?: BulkImportError[];
  error?: string;
}

interface BulkImportView {
  id: string;
  conflictPolicy: BulkConflictPolicy;
  summary: BulkImportSummary;
  createdAt: string;
  undoneAt?: string | null;
}

interface BulkImportResponse {
  importId?: string;
  conflictPolicy?: BulkConflictPolicy;
  summary?: BulkImportSummary;
  createdAt?: string;
  import?: BulkImportView | null;
  retainedNonEmptyFolders?: number;
  errors?: BulkImportError[];
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

export function buildStudyTopicPath(folders: StudyFolder[], topic: StudyTopic): string {
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
  protected readonly authService = inject(AuthService);
  protected readonly focusMode = inject(StudyFocusService);

  protected readonly topics = signal<StudyTopic[]>([]);
  protected readonly folders = signal<StudyFolder[]>([]);
  protected readonly loading = signal(true);
  protected readonly pageError = signal('');
  protected readonly saving = signal(false);

  protected readonly editingId = signal<number | 'new' | null>(null);
  protected readonly draft = signal<TopicDraft>({ title: '', pairs: '', folderId: null });
  protected readonly formError = signal('');
  protected readonly parsedPairs = computed(() => parseStudyPairs(this.draft().pairs));
  protected readonly deleteTarget = signal<StudyTopic | null>(null);

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
  protected readonly bulkConflictCount = signal(0);
  protected readonly bulkTotalTopics = signal(0);
  protected readonly bulkTotalCards = signal(0);
  protected readonly bulkConflictPolicy = signal<BulkConflictPolicy>('skip');
  private readonly bulkIdempotencyKey = signal('');
  protected readonly bulkConfirmed = signal(false);
  protected readonly bulkChecking = signal(false);
  protected readonly bulkImporting = signal(false);
  protected readonly bulkUndoing = signal(false);
  protected readonly bulkErrors = signal<BulkImportError[]>([]);
  protected readonly bulkError = signal('');
  protected readonly bulkResult = signal<BulkImportView | null>(null);
  protected readonly latestBulkImport = signal<BulkImportView | null>(null);
  protected readonly bulkUndoTarget = signal<BulkImportView | null>(null);
  protected readonly bulkUndoMessage = signal('');
  protected readonly currentFolder = computed(
    () => this.folders().find((folder) => folder.id === this.currentFolderId()) ?? null,
  );
  protected readonly currentFolders = computed(() =>
    this.folders().filter((folder) => folder.parentId === this.currentFolderId()),
  );
  protected readonly currentTopics = computed(() =>
    this.topics().filter((topic) => topic.folderId === this.currentFolderId()),
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
  protected readonly studyPosition = signal(0);
  protected readonly flipped = signal(false);
  protected readonly transitionDirection = signal<'next' | 'previous' | null>(null);
  protected readonly outgoingCard = signal<{ card: StudySessionCard; flipped: boolean } | null>(
    null,
  );
  private transitionTimer: ReturnType<typeof window.setTimeout> | null = null;
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

  protected startEdit(topic: StudyTopic): void {
    this.closeStudy();
    this.closeFolderEditor();
    this.draft.set(topicToDraft(topic));
    this.formError.set('');
    this.editingId.set(topic.id);
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
    this.bulkConflictCount.set(0);
    this.bulkTotalTopics.set(0);
    this.bulkTotalCards.set(0);
    this.bulkConflictPolicy.set('skip');
    this.bulkIdempotencyKey.set('');
    this.bulkConfirmed.set(false);
    this.bulkErrors.set([]);
    this.bulkError.set('');
    this.bulkResult.set(null);
    this.bulkUndoMessage.set('');
    void this.loadLatestBulkImport();
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
        body: JSON.stringify({ source: this.bulkSource(), conflictPolicy: 'skip' }),
      });
      const result = await this.api.readApiResponse<BulkPreviewResponse>(response);
      if (!response.ok) {
        this.bulkErrors.set(result.errors ?? []);
        this.bulkError.set(
          result.error ?? (result.errors?.length ? '' : 'Controllo non riuscito.'),
        );
        return;
      }
      this.bulkPreview.set(result.paths ?? []);
      this.bulkConflictCount.set(result.conflictCount ?? 0);
      this.bulkTotalTopics.set(result.totalTopics ?? 0);
      this.bulkTotalCards.set(result.totalCards ?? 0);
      this.bulkConflictPolicy.set('skip');
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
          conflictPolicy: this.bulkConflictPolicy(),
          idempotencyKey: this.bulkIdempotencyKey(),
        }),
      });
      const result = await this.api.readApiResponse<BulkImportResponse>(response);
      if (!response.ok || !result.importId || !result.summary || !result.createdAt) {
        this.bulkErrors.set(result.errors ?? []);
        this.bulkError.set(result.error ?? 'Importazione non riuscita.');
        return;
      }
      const imported: BulkImportView = {
        id: result.importId,
        conflictPolicy: result.conflictPolicy ?? this.bulkConflictPolicy(),
        summary: result.summary,
        createdAt: result.createdAt,
      };
      this.bulkResult.set(imported);
      this.latestBulkImport.set(imported);
      this.bulkStep.set(3);
      await this.load();
    } catch {
      this.bulkError.set("Non è stato possibile completare l'importazione.");
    } finally {
      this.bulkImporting.set(false);
    }
  }

  protected requestUndoBulkImport(imported: BulkImportView): void {
    this.bulkUndoTarget.set(imported);
  }

  protected async confirmUndoBulkImport(): Promise<void> {
    if (!this.bulkUndoTarget()) return;
    this.bulkUndoing.set(true);
    this.bulkError.set('');
    try {
      const response = await fetch('/api/study-imports/undo-last', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
      });
      const result = await this.api.readApiResponse<BulkImportResponse>(response);
      if (!response.ok) {
        this.bulkError.set(result.error ?? "Non è stato possibile annullare l'importazione.");
        return;
      }
      const retained = result.retainedNonEmptyFolders ?? 0;
      this.bulkUndoMessage.set(
        retained > 0
          ? `Importazione annullata. ${retained} cartelle non vuote sono state conservate.`
          : 'Importazione annullata e contenuti precedenti ripristinati.',
      );
      this.bulkResult.set(null);
      this.bulkStep.set(1);
      this.latestBulkImport.set(null);
      await this.load();
      await this.loadLatestBulkImport();
    } catch {
      this.bulkError.set("Non è stato possibile annullare l'importazione.");
    } finally {
      this.bulkUndoing.set(false);
      this.bulkUndoTarget.set(null);
    }
  }

  private async loadLatestBulkImport(): Promise<void> {
    if (!this.canBulkImport()) return;
    try {
      const response = await fetch('/api/study-imports', {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) return;
      const result = await this.api.readApiResponse<BulkImportResponse>(response);
      this.latestBulkImport.set(result.import ?? null);
    } catch {
      // L'assenza del riepilogo precedente non deve bloccare una nuova importazione.
    }
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

  protected folderCardCount(folderId: number): number {
    return collectFolderStudyCards(this.folders(), this.topics(), folderId).length;
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

  protected requestDelete(topic: StudyTopic): void {
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

  protected startStudy(topic: StudyTopic): void {
    const context = buildStudyTopicPath(this.folders(), topic);
    const cards = topic.cards.map((card) => ({ ...card, context }));
    this.beginStudy(topic.title, cards, 'topic', topic.id);
  }

  protected startFolderStudy(folder: StudyFolder): void {
    const cards = collectFolderStudyCards(this.folders(), this.topics(), folder.id);
    if (cards.length === 0) return;
    this.beginStudy(`${folder.name} · Tutto insieme`, cards, 'folder', null);
  }

  protected closeStudy(): void {
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
    topicId: number | null,
  ): void {
    this.cancelEdit();
    this.closeFolderEditor();
    this.pageError.set('');
    this.clearCardTransition();
    this.studyingTopicId.set(topicId);
    this.studyDeck.set([...cards]);
    this.studySessionTitle.set(title);
    this.studySessionKind.set(kind);
    this.shuffleDeck();
  }

  private moveCard(offset: -1 | 1, direction: 'next' | 'previous'): void {
    if (this.transitionDirection()) return;
    const card = this.currentCard();
    const targetPosition = this.studyPosition() + offset;
    if (!card || targetPosition < 0 || targetPosition >= this.studyOrder().length) return;

    if (this.reducedMotion) {
      this.studyPosition.set(targetPosition);
      this.flipped.set(false);
      return;
    }

    this.outgoingCard.set({ card, flipped: this.flipped() });
    this.transitionDirection.set(direction);
    this.studyPosition.set(targetPosition);
    this.flipped.set(false);
    this.transitionTimer = window.setTimeout(() => this.clearCardTransition(), 360);
  }

  private clearCardTransition(): void {
    if (this.transitionTimer !== null) window.clearTimeout(this.transitionTimer);
    this.transitionTimer = null;
    this.outgoingCard.set(null);
    this.transitionDirection.set(null);
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    this.pageError.set('');
    try {
      const response = await fetch('/api/study-topics', {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
      });
      const result = await this.api.readApiResponse<{
        topics?: StudyTopic[];
        folders?: StudyFolder[];
        error?: string;
      }>(response);
      if (!response.ok) throw new Error(result.error || 'Caricamento non riuscito.');
      this.topics.set(result.topics ?? []);
      this.folders.set(result.folders ?? []);
      if (
        this.currentFolderId() !== null &&
        !(result.folders ?? []).some((folder) => folder.id === this.currentFolderId())
      ) {
        this.currentFolderId.set(null);
      }
    } catch (error) {
      this.pageError.set(
        error instanceof Error ? error.message : 'Non è stato possibile aprire l’Aula studio.',
      );
    } finally {
      this.loading.set(false);
    }
  }
}
