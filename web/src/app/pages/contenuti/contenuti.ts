import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppShell } from '../../shell/app-shell';
import { ApiService } from '../../core/api.service';

interface ContentIndexEntry {
  id: number;
  contentKey: string;
  label: string;
  contentType: string;
  versioningMode: string;
  updatedAt: string;
}

// Indice dei contenuti modificabili (documentazione/cms/planning-editor-contenuti.md, Fase 6): sola lettura, il
// salvataggio vero e proprio resta sulla pagina dove il contenuto vive (EditorialText) — questo
// elenco serve solo a trovarli, con ricerca per etichetta/chiave e filtro per tipo.
@Component({
  selector: 'app-contenuti',
  standalone: true,
  imports: [AppShell, FormsModule],
  styleUrls: ['../../../styles/pages/contenuti.css'],
  templateUrl: './contenuti.html'
})
export class Contenuti {
  private readonly api = inject(ApiService);

  protected readonly entries = signal<ContentIndexEntry[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly search = signal('');
  protected readonly typeFilter = signal('');

  protected readonly contentTypes = computed(() => [...new Set(this.entries().map((entry) => entry.contentType))]);

  protected readonly visibleEntries = computed(() => {
    const query = this.search().trim().toLowerCase();
    const type = this.typeFilter();
    return this.entries().filter((entry) => {
      const matchesQuery = !query || entry.label.toLowerCase().includes(query) || entry.contentKey.toLowerCase().includes(query);
      const matchesType = !type || entry.contentType === type;
      return matchesQuery && matchesType;
    });
  });

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const response = await fetch('/api/content', {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) {
        this.error.set(response.status === 403 ? 'Non sei autorizzata a vedere questa pagina.' : 'Errore nel caricamento dei contenuti.');
        return;
      }

      const result = await this.api.readApiResponse<{ entries?: ContentIndexEntry[] }>(response);
      this.entries.set(result.entries ?? []);
    } catch (error) {
      console.error('Errore nel caricamento dei contenuti:', error);
      this.error.set('Errore nel caricamento dei contenuti.');
    } finally {
      this.loading.set(false);
    }
  }
}
