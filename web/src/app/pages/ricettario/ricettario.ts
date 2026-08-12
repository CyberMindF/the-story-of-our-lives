import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AppShell } from '../../shell/app-shell';
import { EditorialText } from '../../shared/editorial-text/editorial-text';
import { ConfirmationDialog } from '../../shared/confirmation-dialog/confirmation-dialog';
import { AuthService } from '../../core/auth.service';
import { ApiService } from '../../core/api.service';

type RecipeKind = 'Fatta insieme' | 'Da provare';
type RecipeFilter = 'Tutte' | RecipeKind;

interface Recipe {
  id: string;
  title: string;
  kind: RecipeKind;
  note: string | null;
  placeholder: boolean;
  source: { label: string; href: string } | null;
  ingredients: string[];
  steps: string[];
  position: number;
}

interface RecipeDraft {
  id: string;
  title: string;
  kind: RecipeKind;
  note: string;
  placeholder: boolean;
  sourceLabel: string;
  sourceHref: string;
  ingredients: string;
  steps: string;
}

function emptyDraft(): RecipeDraft {
  return { id: '', title: '', kind: 'Da provare', note: '', placeholder: false, sourceLabel: '', sourceHref: '', ingredients: '', steps: '' };
}

function toDraft(recipe: Recipe): RecipeDraft {
  return {
    id: recipe.id,
    title: recipe.title,
    kind: recipe.kind,
    note: recipe.note ?? '',
    placeholder: recipe.placeholder,
    sourceLabel: recipe.source?.label ?? '',
    sourceHref: recipe.source?.href ?? '',
    ingredients: recipe.ingredients.join('\n'),
    steps: recipe.steps.join('\n')
  };
}

// Editor dedicato del Ricettario (documentazione/cms/planning-editor-contenuti.md, Fase 7): le ricette vivono ora
// in recipes via /api/recipes, non più in content/recipes.json. A differenza del Calendario,
// l'ordine (position) è significativo: "prima/dopo" invece del drag and drop, come richiesto
// dal piano.
@Component({
  selector: 'app-ricettario',
  standalone: true,
  imports: [AppShell, RouterLink, EditorialText, FormsModule, ConfirmationDialog],
  styleUrls: ['../../../styles/pages/ricettario.css'],
  templateUrl: './ricettario.html'
})
export class Ricettario {
  private readonly api = inject(ApiService);
  protected readonly authService = inject(AuthService);

  protected readonly canEdit = computed(() => this.authService.isAdmin() && this.authService.adminModeEnabled());

  protected readonly recipes = signal<Recipe[]>([]);
  protected readonly filter = signal<RecipeFilter>('Tutte');
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly visibleRecipes = computed(() => {
    const selected = this.filter();
    const list = selected === 'Tutte' ? this.recipes() : this.recipes().filter((recipe) => recipe.kind === selected);
    return [...list].sort((a, b) => a.position - b.position);
  });

  protected readonly editingId = signal<string | null>(null);
  protected readonly draft = signal<RecipeDraft>(emptyDraft());
  protected readonly formError = signal('');
  protected readonly deleteTargetId = signal<string | null>(null);

  constructor() {
    void this.load();
  }

  protected setFilter(filter: RecipeFilter): void {
    this.filter.set(filter);
  }

  private async load(): Promise<void> {
    try {
      const response = await fetch('/api/recipes', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`Errore ${response.status}`);
      const result = await this.api.readApiResponse<{ recipes?: Recipe[] }>(response);
      this.recipes.set(result.recipes ?? []);
    } catch {
      this.error.set('Non sono riuscito ad aprire il ricettario.');
    } finally {
      this.loading.set(false);
    }
  }

  protected startCreate(): void {
    this.draft.set(emptyDraft());
    this.formError.set('');
    this.editingId.set('__new__');
  }

  protected startEdit(recipe: Recipe): void {
    this.draft.set(toDraft(recipe));
    this.formError.set('');
    this.editingId.set(recipe.id);
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
  }

  protected updateDraft(patch: Partial<RecipeDraft>): void {
    this.draft.set({ ...this.draft(), ...patch });
  }

  protected async submit(): Promise<void> {
    const d = this.draft();
    const ingredients = d.ingredients.split('\n').map((line) => line.trim()).filter(Boolean);
    const steps = d.steps.split('\n').map((line) => line.trim()).filter(Boolean);

    if (!d.title.trim() || ingredients.length === 0 || steps.length === 0) {
      this.formError.set('Titolo, ingredienti e procedimento sono obbligatori.');
      return;
    }

    const isNew = this.editingId() === '__new__';
    const payload = {
      ...(isNew ? { id: d.id.trim().toLowerCase() } : {}),
      title: d.title.trim(),
      kind: d.kind,
      note: d.note.trim() || null,
      placeholder: d.placeholder,
      source: d.sourceLabel.trim() && d.sourceHref.trim() ? { label: d.sourceLabel.trim(), href: d.sourceHref.trim() } : null,
      ingredients,
      steps
    };

    if (isNew && !/^[a-z][a-z0-9-]{0,63}$/.test(payload.id ?? '')) {
      this.formError.set('ID non valido: solo lettere minuscole, numeri e trattini.');
      return;
    }

    const endpoint = isNew ? '/api/recipes' : `/api/recipes/${this.editingId()}`;
    const ok = await this.api.sendAuthenticatedJson(endpoint, payload, isNew ? 'POST' : 'PUT');
    if (!ok) {
      this.formError.set('Non è stato possibile salvare la ricetta.');
      return;
    }

    this.editingId.set(null);
    await this.load();
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
    await this.api.sendAuthenticatedJson(`/api/recipes/${id}`, {}, 'DELETE');
    this.deleteTargetId.set(null);
    await this.load();
  }

  protected async move(id: string, direction: 'up' | 'down'): Promise<void> {
    await this.api.sendAuthenticatedJson(`/api/recipes/${id}/move`, { direction }, 'POST');
    await this.load();
  }
}
