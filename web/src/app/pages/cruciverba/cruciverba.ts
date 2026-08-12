import { AfterViewInit, Component, OnDestroy, OnInit, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppShell } from '../../shell/app-shell';
import { ConfirmationDialog } from '../../shared/confirmation-dialog/confirmation-dialog';
import { EditorialText } from '../../shared/editorial-text/editorial-text';
import { AuthService } from '../../core/auth.service';
import { ApiService } from '../../core/api.service';
import { CrosswordClues } from './crossword-clues/crossword-clues';
import { CrosswordGrid } from './crossword-grid/crossword-grid';
import { CrosswordModals } from './crossword-modals/crossword-modals';
import { CrosswordService } from './crossword.service';
import { CrosswordToolbar } from './crossword-toolbar/crossword-toolbar';
import { CrosswordDirection } from './crossword.types';

interface AdminWord {
  id: string;
  word: string;
  clue: string;
  row: number;
  col: number;
  direction: CrosswordDirection;
  position: number;
}

interface AdminWordDraft {
  word: string;
  clue: string;
  row: string;
  col: string;
  direction: CrosswordDirection;
}

function emptyDraft(): AdminWordDraft {
  return { word: '', clue: '', row: '', col: '', direction: 'O' };
}

function toDraft(entry: AdminWord): AdminWordDraft {
  return {
    word: entry.word,
    clue: entry.clue,
    row: String(entry.row),
    col: String(entry.col),
    direction: entry.direction
  };
}

// Porting fedele di tavolo-da-gioco/cruciverba/index.html + assets/js/crossword/main.js.
// La logica del gioco è nel servizio scoped alla pagina; qui restano shell, lifecycle e i
// listener globali che dipendono dall'esistenza reale della vista (pagehide, viewport mobile).
// L'editor delle 100 definizioni (planning editor contenuti.md, Fase 7) vive invece qui, non nel
// servizio del gioco: stesso pattern CRUD + posizione esplicita di Mappa/Storie/Cuffiette, letto
// dalla stessa /api/crossword-words che alimenta la griglia — un secondo fetch indipendente,
// come mappa.ts fa per la propria lista amministrativa.
@Component({
  selector: 'app-cruciverba',
  standalone: true,
  imports: [AppShell, CrosswordToolbar, CrosswordGrid, CrosswordClues, CrosswordModals, FormsModule, ConfirmationDialog, EditorialText],
  providers: [CrosswordService],
  styleUrls: ['../../../styles/pages/crossword.css'],
  // Il foglio storico deve raggiungere anche grid, indizi e modali, ora separati in componenti.
  encapsulation: ViewEncapsulation.None,
  templateUrl: './cruciverba.html'
})
export class Cruciverba implements OnInit, AfterViewInit, OnDestroy {
  private readonly api = inject(ApiService);
  protected readonly authService = inject(AuthService);

  protected readonly canEdit = computed(() => this.authService.isAdmin() && this.authService.adminModeEnabled());
  protected readonly adminPanelOpen = signal(false);

  private readonly adminWords = signal<AdminWord[]>([]);
  protected readonly adminWordViews = computed(() => [...this.adminWords()].sort((a, b) => a.position - b.position));

  protected readonly editingId = signal<string | null>(null);
  protected readonly draft = signal<AdminWordDraft>(emptyDraft());
  protected readonly formError = signal('');
  protected readonly deleteTargetId = signal<string | null>(null);

  protected readonly beforeLogout = () => this.crossword.trackCrosswordClosed().then(() => undefined);

  private stableHeight = 0;
  private crosswordReady = false;
  private viewReady = false;
  private readonly pagehideHandler = () => void this.crossword.trackCrosswordClosed();
  private readonly orientationHandler = () => this.updateViewportHeight(true);
  private readonly focusOutHandler = () => {
    window.setTimeout(() => this.updateViewportHeight(), 120);
  };
  private readonly viewportResizeHandler = () => this.updateViewportHeight();
  private readonly viewportScrollHandler = () => this.updateViewportHeight();
  private readonly resizeHandler = () => this.updateViewportHeight();

  constructor(protected readonly crossword: CrosswordService) {}

  async ngOnInit(): Promise<void> {
    this.bindVisualViewport();
    window.addEventListener('pagehide', this.pagehideHandler);
    await this.crossword.initializeCrossword();
    this.crosswordReady = true;
    this.focusInitialWordWhenReady();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.focusInitialWordWhenReady();
  }

  ngOnDestroy(): void {
    window.removeEventListener('pagehide', this.pagehideHandler);
    window.removeEventListener('orientationchange', this.orientationHandler);
    window.removeEventListener('focusout', this.focusOutHandler);

    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', this.viewportResizeHandler);
      window.visualViewport.removeEventListener('scroll', this.viewportScrollHandler);
    } else {
      window.removeEventListener('resize', this.resizeHandler);
    }

    document.body.classList.remove('keyboard-open', 'access-keyboard-open');
    document.documentElement.style.removeProperty('--keyboard-offset');
    document.documentElement.style.removeProperty('--app-viewport-height');
  }

  private bindVisualViewport(): void {
    this.stableHeight = window.visualViewport?.height || window.innerHeight;
    this.updateViewportHeight(true);
    window.addEventListener('orientationchange', this.orientationHandler);
    window.addEventListener('focusout', this.focusOutHandler);

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', this.viewportResizeHandler);
      window.visualViewport.addEventListener('scroll', this.viewportScrollHandler);
    } else {
      window.addEventListener('resize', this.resizeHandler);
    }
  }

  private focusInitialWordWhenReady(): void {
    if (!this.crosswordReady || !this.viewReady) {
      return;
    }

    requestAnimationFrame(() => this.crossword.focusInitialWord());
  }

  private updateViewportHeight(force = false): void {
    const visualViewport = window.visualViewport;
    const height = visualViewport?.height || window.innerHeight;
    const activeElement = document.activeElement as HTMLElement | null;
    const isGridInputFocused = activeElement?.classList.contains('cell-input') || false;
    const accessForm = document.getElementById('access-form');
    const isAccessInputFocused = accessForm?.contains(activeElement) || false;
    const keyboardLikelyOpen = isGridInputFocused && height < this.stableHeight * 0.82;
    const accessKeyboardLikelyOpen = isAccessInputFocused && height < this.stableHeight * 0.82;

    document.body.classList.toggle('keyboard-open', keyboardLikelyOpen);
    document.body.classList.toggle('access-keyboard-open', accessKeyboardLikelyOpen);

    if (keyboardLikelyOpen) {
      const offsetTop = visualViewport?.offsetTop || 0;
      const keyboardOffset = Math.max(0, this.stableHeight - height - offsetTop);
      document.documentElement.style.setProperty('--keyboard-offset', `${Math.round(keyboardOffset)}px`);
    } else {
      document.documentElement.style.setProperty('--keyboard-offset', '0px');
    }

    if (!force && keyboardLikelyOpen) {
      return;
    }

    if (!force && accessKeyboardLikelyOpen) {
      document.documentElement.style.setProperty('--app-viewport-height', `${Math.round(height)}px`);
      return;
    }

    this.stableHeight = height;
    document.documentElement.style.setProperty('--app-viewport-height', `${Math.round(this.stableHeight)}px`);
  }

  // ==================== Editor amministrativo delle definizioni ====================

  protected toggleAdminPanel(): void {
    const next = !this.adminPanelOpen();
    this.adminPanelOpen.set(next);
    if (next && this.adminWords().length === 0) {
      void this.loadAdminWords();
    }
  }

  private async loadAdminWords(): Promise<void> {
    try {
      const response = await fetch('/api/crossword-words', {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) throw new Error(`Errore ${response.status}`);
      const result = await this.api.readApiResponse<{ words?: AdminWord[] }>(response);
      this.adminWords.set(result.words ?? []);
    } catch (error) {
      console.error('Errore nel caricamento delle definizioni:', error);
    }
  }

  protected startCreate(): void {
    this.draft.set(emptyDraft());
    this.formError.set('');
    this.editingId.set('__new__');
  }

  protected startEdit(entry: AdminWord): void {
    this.draft.set(toDraft(entry));
    this.formError.set('');
    this.editingId.set(entry.id);
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
  }

  protected updateDraft(patch: Partial<AdminWordDraft>): void {
    this.draft.set({ ...this.draft(), ...patch });
  }

  protected async submitEdit(): Promise<void> {
    const d = this.draft();
    const row = Number(d.row);
    const col = Number(d.col);

    if (!d.word.trim() || !d.clue.trim()) {
      this.formError.set('Soluzione e definizione sono obbligatorie.');
      return;
    }
    if (!Number.isInteger(row) || !Number.isInteger(col)) {
      this.formError.set('Riga e colonna devono essere numeri interi.');
      return;
    }

    const isNew = this.editingId() === '__new__';
    const payload = { word: d.word.trim(), clue: d.clue.trim(), row, col, direction: d.direction };

    const endpoint = isNew ? '/api/crossword-words' : `/api/crossword-words/${this.editingId()}`;
    const ok = await this.api.sendAuthenticatedJson(endpoint, payload, isNew ? 'POST' : 'PUT');
    if (!ok) {
      this.formError.set('Non è stato possibile salvare la definizione.');
      return;
    }

    this.editingId.set(null);
    await this.loadAdminWords();
  }

  protected requestDelete(id: string): void {
    this.deleteTargetId.set(id);
  }

  protected cancelDelete(): void {
    this.deleteTargetId.set(null);
  }

  protected async confirmDelete(): Promise<void> {
    const id = this.deleteTargetId();
    if (!id) return;
    await this.api.sendAuthenticatedJson(`/api/crossword-words/${id}`, {}, 'DELETE');
    this.deleteTargetId.set(null);
    await this.loadAdminWords();
  }

  protected async move(id: string, direction: 'up' | 'down'): Promise<void> {
    await this.api.sendAuthenticatedJson(`/api/crossword-words/${id}/move`, { direction }, 'POST');
    await this.loadAdminWords();
  }
}
