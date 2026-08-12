import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StaticContentService } from '../../core/static-content.service';
import { AppShell } from '../../shell/app-shell';

type RecipeKind = 'Fatta insieme' | 'Da provare';
type RecipeFilter = 'Tutte' | RecipeKind;

interface Recipe {
  id: string;
  title: string;
  kind: RecipeKind;
  note?: string;
  placeholder?: boolean;
  source?: { label: string; href: string };
  ingredients: string[];
  steps: string[];
}
@Component({
  selector: 'app-ricettario',
  standalone: true,
  imports: [AppShell, RouterLink],
  styleUrls: ['../../../styles/pages/ricettario.css'],
  templateUrl: './ricettario.html'
})
export class Ricettario {
  private readonly content = inject(StaticContentService);
  protected readonly recipes = signal<Recipe[]>([]);
  protected readonly filter = signal<RecipeFilter>('Tutte');
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly visibleRecipes = computed(() => {
    const selected = this.filter();
    return selected === 'Tutte' ? this.recipes() : this.recipes().filter((recipe) => recipe.kind === selected);
  });

  constructor() {
    void this.load();
  }

  protected setFilter(filter: RecipeFilter): void {
    this.filter.set(filter);
  }

  private async load(): Promise<void> {
    try {
      const data = await this.content.load<{ recipes: Recipe[] }>('/content/recipes.json');
      if (!Array.isArray(data.recipes)) throw new Error('Formato non valido');
      this.recipes.set(data.recipes);
    } catch {
      this.error.set('Non sono riuscito ad aprire il ricettario.');
    } finally {
      this.loading.set(false);
    }
  }
}
