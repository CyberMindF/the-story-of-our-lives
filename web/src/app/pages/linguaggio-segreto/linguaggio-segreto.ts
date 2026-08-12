import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppShell } from '../../shell/app-shell';
import { EditorialText } from '../../shared/editorial-text/editorial-text';
import { ConfirmationDialog } from '../../shared/confirmation-dialog/confirmation-dialog';
import { ContentMessage } from '../../shared/content-message/content-message';
import { AuthService } from '../../core/auth.service';
import { ApiService } from '../../core/api.service';

interface CategoryRow {
  id: string;
  title: string;
  icon: string;
  note: string | null;
  position: number;
}

interface SymbolRow {
  id: string;
  categoryId: string;
  symbol: string;
  meaning: string;
  explanation: string | null;
  position: number;
}

interface ExampleRow {
  id: string;
  code: string;
  meaning: string;
  position: number;
}

interface CodeEntry {
  id: string;
  symbol: string;
  meaning: string;
  explanation: string | null;
}

interface CodeCategory {
  id: string;
  title: string;
  icon: string;
  note: string | null;
  entries: CodeEntry[];
}

interface CategoryDraft {
  id: string;
  title: string;
  icon: string;
  note: string;
}

interface SymbolDraft {
  categoryId: string;
  symbol: string;
  meaning: string;
  explanation: string;
}

interface ExampleDraft {
  code: string;
  meaning: string;
}

function emptyCategoryDraft(): CategoryDraft {
  return { id: '', title: '', icon: '', note: '' };
}

function toCategoryDraft(category: CategoryRow): CategoryDraft {
  return { id: category.id, title: category.title, icon: category.icon, note: category.note ?? '' };
}

function emptySymbolDraft(categoryId: string): SymbolDraft {
  return { categoryId, symbol: '', meaning: '', explanation: '' };
}

function toSymbolDraft(symbol: SymbolRow): SymbolDraft {
  return { categoryId: symbol.categoryId, symbol: symbol.symbol, meaning: symbol.meaning, explanation: symbol.explanation ?? '' };
}

function emptyExampleDraft(): ExampleDraft {
  return { code: '', meaning: '' };
}

function toExampleDraft(example: ExampleRow): ExampleDraft {
  return { code: example.code, meaning: example.meaning };
}

// Editor dedicato del Linguaggio Segreto (planning editor contenuti.md, Fase 7; inventario
// contenuti CMS.md, decisione #4): tre collezioni indipendenti — categorie (lista piatta),
// simboli (annidati sotto una categoria, con riordino su/giù dentro la categoria più un
// comando "Sposta" per cambiare categoria/posizione senza N pressioni), esempi (lista piatta).
// Editor "senza fronzoli" come Mappa/Cruciverba: niente drag and drop, per richiesta esplicita.
@Component({
  selector: 'app-linguaggio-segreto',
  standalone: true,
  imports: [AppShell, EditorialText, FormsModule, ConfirmationDialog, ContentMessage],
  styleUrls: ['../../../styles/pages/linguaggio-segreto.css'],
  templateUrl: './linguaggio-segreto.html'
})
export class LinguaggioSegreto {
  private readonly api = inject(ApiService);
  protected readonly authService = inject(AuthService);

  protected readonly canEdit = computed(() => this.authService.isAdmin() && this.authService.adminModeEnabled());
  protected readonly adminPanelOpen = signal(false);

  // Disposizione "rubrica": linguette laterali con le categorie, come un'agenda/indice
  // alfabetico — scelta dopo aver confrontato 4 alternative dal vivo (griglia, colonna
  // singola, fisarmonica, sfoglia).
  protected readonly activeCategoryIndex = signal(0);

  private readonly rawCategories = signal<CategoryRow[]>([]);
  private readonly rawSymbols = signal<SymbolRow[]>([]);
  private readonly rawExamples = signal<ExampleRow[]>([]);
  protected readonly loadError = signal(false);

  protected readonly categories = computed<CodeCategory[]>(() => {
    const symbolsByCategory = new Map<string, SymbolRow[]>();
    for (const symbol of this.rawSymbols()) {
      const list = symbolsByCategory.get(symbol.categoryId) ?? [];
      list.push(symbol);
      symbolsByCategory.set(symbol.categoryId, list);
    }
    return [...this.rawCategories()]
      .sort((a, b) => a.position - b.position)
      .map((category) => ({
        id: category.id,
        title: category.title,
        icon: category.icon,
        note: category.note,
        entries: (symbolsByCategory.get(category.id) ?? [])
          .sort((a, b) => a.position - b.position)
          .map((entry) => ({ id: entry.id, symbol: entry.symbol, meaning: entry.meaning, explanation: entry.explanation }))
      }));
  });

  protected readonly examples = computed(() => [...this.rawExamples()].sort((a, b) => a.position - b.position));

  // ==================== Editor categorie ====================
  protected readonly categoryEditingId = signal<string | null>(null);
  protected readonly categoryDraft = signal<CategoryDraft>(emptyCategoryDraft());
  protected readonly categoryFormError = signal('');
  protected readonly categoryDeleteTargetId = signal<string | null>(null);

  // ==================== Editor simboli ====================
  protected readonly symbolEditingId = signal<string | null>(null);
  protected readonly symbolDraft = signal<SymbolDraft>(emptySymbolDraft(''));
  protected readonly symbolFormError = signal('');
  protected readonly symbolDeleteTargetId = signal<string | null>(null);

  // "Sposta…" (categoria + elemento dopo cui inserire), separato dal form di modifica: uno
  // sposta il testo, l'altro sposta solo la posizione.
  protected readonly movingSymbolId = signal<string | null>(null);
  protected readonly moveTargetCategoryId = signal('');
  protected readonly moveAfterId = signal<string>('');
  protected readonly moveError = signal('');

  // ==================== Editor esempi ====================
  protected readonly exampleEditingId = signal<string | null>(null);
  protected readonly exampleDraft = signal<ExampleDraft>(emptyExampleDraft());
  protected readonly exampleFormError = signal('');
  protected readonly exampleDeleteTargetId = signal<string | null>(null);

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      const [categoriesRes, symbolsRes, examplesRes] = await Promise.all([
        fetch('/api/linguaggio-segreto-categories', { credentials: 'same-origin', headers: { Accept: 'application/json' } }),
        fetch('/api/linguaggio-segreto-symbols', { credentials: 'same-origin', headers: { Accept: 'application/json' } }),
        fetch('/api/linguaggio-segreto-examples', { credentials: 'same-origin', headers: { Accept: 'application/json' } })
      ]);
      if (!categoriesRes.ok || !symbolsRes.ok || !examplesRes.ok) {
        throw new Error('Errore nel caricamento del Linguaggio Segreto');
      }
      const [categoriesData, symbolsData, examplesData] = await Promise.all([
        this.api.readApiResponse<{ categories?: CategoryRow[] }>(categoriesRes),
        this.api.readApiResponse<{ symbols?: SymbolRow[] }>(symbolsRes),
        this.api.readApiResponse<{ examples?: ExampleRow[] }>(examplesRes)
      ]);
      this.rawCategories.set(categoriesData.categories ?? []);
      this.rawSymbols.set(symbolsData.symbols ?? []);
      this.rawExamples.set(examplesData.examples ?? []);
    } catch (error) {
      console.error('Errore nel caricamento del Linguaggio Segreto:', error);
      this.loadError.set(true);
    }
  }

  protected toggleAdminPanel(): void {
    this.adminPanelOpen.set(!this.adminPanelOpen());
  }

  // -------------------- Categorie --------------------

  protected startCreateCategory(): void {
    this.categoryDraft.set(emptyCategoryDraft());
    this.categoryFormError.set('');
    this.categoryEditingId.set('__new__');
  }

  protected startEditCategory(category: CategoryRow): void {
    this.categoryDraft.set(toCategoryDraft(category));
    this.categoryFormError.set('');
    this.categoryEditingId.set(category.id);
  }

  protected cancelEditCategory(): void {
    this.categoryEditingId.set(null);
  }

  protected updateCategoryDraft(patch: Partial<CategoryDraft>): void {
    this.categoryDraft.set({ ...this.categoryDraft(), ...patch });
  }

  protected async submitCategory(): Promise<void> {
    const d = this.categoryDraft();
    if (!d.title.trim() || !d.icon.trim()) {
      this.categoryFormError.set('Titolo e icona sono obbligatori.');
      return;
    }

    const isNew = this.categoryEditingId() === '__new__';
    const payload = {
      ...(isNew ? { id: d.id.trim().toLowerCase() } : {}),
      title: d.title.trim(),
      icon: d.icon.trim(),
      note: d.note.trim() || null
    };

    if (isNew && !/^[a-z][a-z0-9-]{0,63}$/.test(payload.id ?? '')) {
      this.categoryFormError.set('ID non valido: solo lettere minuscole, numeri e trattini.');
      return;
    }

    const endpoint = isNew ? '/api/linguaggio-segreto-categories' : `/api/linguaggio-segreto-categories/${this.categoryEditingId()}`;
    const ok = await this.api.sendAuthenticatedJson(endpoint, payload, isNew ? 'POST' : 'PUT');
    if (!ok) {
      this.categoryFormError.set('Non è stato possibile salvare la categoria.');
      return;
    }

    this.categoryEditingId.set(null);
    await this.load();
  }

  protected requestDeleteCategory(id: string): void {
    this.categoryDeleteTargetId.set(id);
  }

  protected cancelDeleteCategory(): void {
    this.categoryDeleteTargetId.set(null);
  }

  protected async confirmDeleteCategory(): Promise<void> {
    const id = this.categoryDeleteTargetId();
    if (!id) return;
    await this.api.sendAuthenticatedJson(`/api/linguaggio-segreto-categories/${id}`, {}, 'DELETE');
    this.categoryDeleteTargetId.set(null);
    await this.load();
  }

  protected async moveCategory(id: string, direction: 'up' | 'down'): Promise<void> {
    await this.api.sendAuthenticatedJson(`/api/linguaggio-segreto-categories/${id}/move`, { direction }, 'POST');
    await this.load();
  }

  // -------------------- Simboli --------------------

  protected startCreateSymbol(categoryId: string): void {
    this.symbolDraft.set(emptySymbolDraft(categoryId));
    this.symbolFormError.set('');
    this.symbolEditingId.set('__new__');
  }

  protected startEditSymbol(symbol: SymbolRow): void {
    this.symbolDraft.set(toSymbolDraft(symbol));
    this.symbolFormError.set('');
    this.symbolEditingId.set(symbol.id);
  }

  protected cancelEditSymbol(): void {
    this.symbolEditingId.set(null);
  }

  protected updateSymbolDraft(patch: Partial<SymbolDraft>): void {
    this.symbolDraft.set({ ...this.symbolDraft(), ...patch });
  }

  protected async submitSymbol(): Promise<void> {
    const d = this.symbolDraft();
    if (!d.symbol.trim() || !d.meaning.trim()) {
      this.symbolFormError.set('Simbolo e significato sono obbligatori.');
      return;
    }

    const isNew = this.symbolEditingId() === '__new__';
    const payload: Record<string, unknown> = { symbol: d.symbol.trim(), meaning: d.meaning.trim(), explanation: d.explanation.trim() || null };
    if (isNew) {
      payload['categoryId'] = d.categoryId;
    }

    const endpoint = isNew ? '/api/linguaggio-segreto-symbols' : `/api/linguaggio-segreto-symbols/${this.symbolEditingId()}`;
    const ok = await this.api.sendAuthenticatedJson(endpoint, payload, isNew ? 'POST' : 'PUT');
    if (!ok) {
      this.symbolFormError.set('Non è stato possibile salvare il simbolo.');
      return;
    }

    this.symbolEditingId.set(null);
    await this.load();
  }

  protected requestDeleteSymbol(id: string): void {
    this.symbolDeleteTargetId.set(id);
  }

  protected cancelDeleteSymbol(): void {
    this.symbolDeleteTargetId.set(null);
  }

  protected async confirmDeleteSymbol(): Promise<void> {
    const id = this.symbolDeleteTargetId();
    if (!id) return;
    await this.api.sendAuthenticatedJson(`/api/linguaggio-segreto-symbols/${id}`, {}, 'DELETE');
    this.symbolDeleteTargetId.set(null);
    await this.load();
  }

  protected async moveSymbol(id: string, direction: 'up' | 'down'): Promise<void> {
    await this.api.sendAuthenticatedJson(`/api/linguaggio-segreto-symbols/${id}/move`, { direction }, 'POST');
    await this.load();
  }

  protected startMoveSymbol(symbol: SymbolRow): void {
    this.movingSymbolId.set(symbol.id);
    this.moveTargetCategoryId.set(symbol.categoryId);
    this.moveAfterId.set('');
    this.moveError.set('');
  }

  protected cancelMoveSymbol(): void {
    this.movingSymbolId.set(null);
  }

  // Simboli della categoria di destinazione scelta nel form "Sposta", per popolare il
  // menu "dopo quale elemento" — esclude il simbolo che si sta spostando.
  protected symbolsForMoveTarget(): SymbolRow[] {
    const targetCategory = this.moveTargetCategoryId();
    const movingId = this.movingSymbolId();
    return this.rawSymbols()
      .filter((symbol) => symbol.categoryId === targetCategory && symbol.id !== movingId)
      .sort((a, b) => a.position - b.position);
  }

  protected async confirmMoveSymbol(): Promise<void> {
    const id = this.movingSymbolId();
    if (!id) return;

    const ok = await this.api.sendAuthenticatedJson(`/api/linguaggio-segreto-symbols/${id}/move-to`, {
      categoryId: this.moveTargetCategoryId(),
      afterId: this.moveAfterId() || null
    }, 'POST');

    if (!ok) {
      this.moveError.set('Non è stato possibile spostare il simbolo.');
      return;
    }

    this.movingSymbolId.set(null);
    await this.load();
  }

  // -------------------- Esempi --------------------

  protected startCreateExample(): void {
    this.exampleDraft.set(emptyExampleDraft());
    this.exampleFormError.set('');
    this.exampleEditingId.set('__new__');
  }

  protected startEditExample(example: ExampleRow): void {
    this.exampleDraft.set(toExampleDraft(example));
    this.exampleFormError.set('');
    this.exampleEditingId.set(example.id);
  }

  protected cancelEditExample(): void {
    this.exampleEditingId.set(null);
  }

  protected updateExampleDraft(patch: Partial<ExampleDraft>): void {
    this.exampleDraft.set({ ...this.exampleDraft(), ...patch });
  }

  protected async submitExample(): Promise<void> {
    const d = this.exampleDraft();
    if (!d.code.trim() || !d.meaning.trim()) {
      this.exampleFormError.set('Codice e significato sono obbligatori.');
      return;
    }

    const isNew = this.exampleEditingId() === '__new__';
    const payload = { code: d.code.trim(), meaning: d.meaning.trim() };

    const endpoint = isNew ? '/api/linguaggio-segreto-examples' : `/api/linguaggio-segreto-examples/${this.exampleEditingId()}`;
    const ok = await this.api.sendAuthenticatedJson(endpoint, payload, isNew ? 'POST' : 'PUT');
    if (!ok) {
      this.exampleFormError.set('Non è stato possibile salvare l’esempio.');
      return;
    }

    this.exampleEditingId.set(null);
    await this.load();
  }

  protected requestDeleteExample(id: string): void {
    this.exampleDeleteTargetId.set(id);
  }

  protected cancelDeleteExample(): void {
    this.exampleDeleteTargetId.set(null);
  }

  protected async confirmDeleteExample(): Promise<void> {
    const id = this.exampleDeleteTargetId();
    if (!id) return;
    await this.api.sendAuthenticatedJson(`/api/linguaggio-segreto-examples/${id}`, {}, 'DELETE');
    this.exampleDeleteTargetId.set(null);
    await this.load();
  }

  protected async moveExample(id: string, direction: 'up' | 'down'): Promise<void> {
    await this.api.sendAuthenticatedJson(`/api/linguaggio-segreto-examples/${id}/move`, { direction }, 'POST');
    await this.load();
  }
}
