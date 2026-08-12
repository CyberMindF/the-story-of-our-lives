import { Component, computed, inject, Input, OnChanges, signal } from '@angular/core';
import { ContentService } from '../../core/content.service';

// Componente di visualizzazione condiviso per i testi editoriali del CMS (planning editor
// contenuti.md, Fase 5): mostra il valore corrente di un content_entries, senza controlli di
// modifica — quelli arrivano quando la modalità admin avrà l'editor vero e proprio.
@Component({
  selector: 'app-editorial-text',
  standalone: true,
  host: { style: 'display: contents' },
  templateUrl: './editorial-text.html'
})
export class EditorialText implements OnChanges {
  @Input({ required: true }) contentKey = '';

  private readonly contentService = inject(ContentService);
  private readonly body = signal('');
  protected readonly paragraphs = computed(() =>
    this.body()
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
  );

  ngOnChanges(): void {
    this.load();
  }

  private async load(): Promise<void> {
    try {
      const entry = await this.contentService.load(this.contentKey);
      this.body.set(entry.body);
    } catch (error) {
      console.error(`Impossibile caricare il contenuto "${this.contentKey}":`, error);
    }
  }
}
