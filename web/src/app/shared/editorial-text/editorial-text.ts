import { Component, computed, inject, Input, OnChanges, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { AuthService } from '../../core/auth.service';
import { ContentEntry, ContentService } from '../../core/content.service';
import { renderInlineLinks } from '../inline-text';
import { FormStatus } from '../form-status/form-status';

// Componente di visualizzazione (e, in modalità admin, modifica) condiviso per i testi
// editoriali del CMS (planning editor contenuti.md, Fase 5). Mostra il valore corrente di un
// content_entries e, sui contenuti "history", il selettore delle versioni; il pulsante
// "Modifica" compare solo con isAdmin() && adminModeEnabled(), ma la sicurezza vera resta
// sempre sul backend (403 su ogni endpoint /api/content senza il permesso richiesto).
@Component({
  selector: 'app-editorial-text',
  standalone: true,
  imports: [FormStatus],
  styleUrls: ['../../../styles/components/editorial-text.css'],
  host: { style: 'display: contents' },
  templateUrl: './editorial-text.html'
})
export class EditorialText implements OnChanges {
  @Input({ required: true }) contentKey = '';

  private readonly contentService = inject(ContentService);
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly authService = inject(AuthService);

  private readonly entry = signal<ContentEntry | null>(null);
  protected readonly loadError = signal(false);

  protected readonly canEdit = computed(() => this.authService.isAdmin() && this.authService.adminModeEnabled());
  protected readonly isHistory = computed(() => this.entry()?.versioningMode === 'history');
  protected readonly versions = computed(() => this.entry()?.versions ?? []);
  protected readonly viewingVersionId = computed(() => this.entry()?.versionId ?? null);
  protected readonly isViewingCurrent = computed(() => {
    const entry = this.entry();
    return !entry || entry.versionId === entry.currentVersionId;
  });

  // Supporto minimo e controllato ai link interni (inventario contenuti CMS.md, decisione #6):
  // solo la sintassi esplicita [etichetta](/rotta), mai HTML libero o URL esterni — sostituisce
  // il caso speciale che le Cuffiette gestivano a mano per il link verso "I Ponti". La stessa
  // funzione è riusata dai blocchi del GDR (shared/inline-text.ts), non duplicata.
  protected readonly paragraphs = computed(() =>
    toParagraphs(this.entry()?.body ?? '').map((paragraph) => renderInlineLinks(this.sanitizer, paragraph))
  );

  protected readonly editing = signal(false);
  protected readonly draft = signal('');
  protected readonly draftParagraphs = computed(() =>
    toParagraphs(this.draft()).map((paragraph) => renderInlineLinks(this.sanitizer, paragraph))
  );
  protected readonly saving = signal(false);
  protected readonly saveError = signal('');

  ngOnChanges(): void {
    this.editing.set(false);
    void this.load();
  }

  private async load(versionId?: number): Promise<void> {
    try {
      const entry = await this.contentService.load(this.contentKey, versionId);
      this.entry.set(entry);
      this.loadError.set(false);
    } catch (error) {
      console.error(`Impossibile caricare il contenuto "${this.contentKey}":`, error);
      this.loadError.set(true);
    }
  }

  protected selectVersion(versionId: number): void {
    void this.load(versionId);
  }

  protected startEdit(): void {
    this.draft.set(this.entry()?.body ?? '');
    this.saveError.set('');
    this.editing.set(true);
  }

  protected cancelEdit(): void {
    this.editing.set(false);
  }

  protected onDraftInput(event: Event): void {
    this.draft.set((event.target as HTMLTextAreaElement).value);
  }

  protected async save(createVersion: boolean): Promise<void> {
    const body = this.draft().trim();
    const currentEntry = this.entry();
    if (!body || this.saving() || !currentEntry) {
      return;
    }

    // Se si sta guardando una versione non corrente, "Salva modifica" scriverebbe il testo
    // vecchio sopra la versione in vigore (bug segnalato: apri una versione storica, premi
    // Salva modifica, la versione corrente viene sovrascritta col testo vecchio). Su una
    // versione storica l'unica azione possibile è aggiungerne una nuova, mai sovrascrivere.
    const effectiveCreateVersion = createVersion || !this.isViewingCurrent();

    this.saving.set(true);
    this.saveError.set('');
    try {
      const result = await this.contentService.save(this.contentKey, body, effectiveCreateVersion);
      if (currentEntry.versioningMode === 'history') {
        // La cronologia (elenco versioni, versionId in vigore) va ricaricata dal server: la
        // risposta del PUT non la porta per non duplicare quella logica in due posti.
        await this.load(result.currentVersionId ?? undefined);
      } else {
        this.entry.set({ ...currentEntry, body: result.body, updatedAt: result.updatedAt });
      }
      this.editing.set(false);
    } catch (error) {
      console.error(`Impossibile salvare il contenuto "${this.contentKey}":`, error);
      this.saveError.set('Non è stato possibile salvare. Riprova.');
    } finally {
      this.saving.set(false);
    }
  }

}

function toParagraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}
