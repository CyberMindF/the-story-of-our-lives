import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationDialog } from '../confirmation-dialog/confirmation-dialog';
import { AuthService } from '../../core/auth.service';
import { ApiService } from '../../core/api.service';
import { GdrBlockRow, GdrBlockType, GdrDocumentKey } from './gdr-block.types';

interface BlockDraft {
  type: GdrBlockType;
  dataJson: string;
}

const BLOCK_TYPES: GdrBlockType[] = ['heading', 'paragraph', 'callout', 'image', 'npc_grid', 'list', 'table'];

const BLOCK_TEMPLATES: Record<GdrBlockType, unknown> = {
  heading: { level: 3, text: '' },
  paragraph: { text: '' },
  callout: { lead: '', text: '' },
  image: { src: '', alt: '', caption: null },
  npc_grid: { entries: [{ image: '', alt: '', name: '', description: '' }] },
  list: { items: [''] },
  table: { header: ['', ''], rows: [['', '']] }
};

function emptyDraft(): BlockDraft {
  return { type: 'paragraph', dataJson: JSON.stringify(BLOCK_TEMPLATES.paragraph, null, 2) };
}

function toDraft(block: GdrBlockRow): BlockDraft {
  return { type: block.type, dataJson: JSON.stringify(block.data, null, 2) };
}

// Editor amministrativo condiviso dei documenti del GDR (planning editor contenuti.md, Fase 7;
// inventario contenuti CMS.md, decisione #4): un blocco = un tipo + un blob JSON, "editor senza
// fronzoli" come le immagini di Mappa — niente builder visuale per 7 forme di dati diverse.
// Usato identico da Avventura e La Tua Maga, cambia solo `documentKey`.
@Component({
  selector: 'app-gdr-document-editor',
  standalone: true,
  imports: [FormsModule, ConfirmationDialog],
  styleUrls: ['./gdr-document-editor.css'],
  templateUrl: './gdr-document-editor.html'
})
export class GdrDocumentEditor implements OnInit {
  @Input({ required: true }) documentKey!: GdrDocumentKey;

  private readonly api = inject(ApiService);
  protected readonly authService = inject(AuthService);

  protected readonly canEdit = computed(() => this.authService.isAdmin() && this.authService.adminModeEnabled());
  protected readonly panelOpen = signal(false);
  protected readonly blockTypes = BLOCK_TYPES;

  private readonly rawBlocks = signal<GdrBlockRow[]>([]);
  protected readonly blocks = computed(() =>
    this.rawBlocks()
      .filter((block) => block.documentKey === this.documentKey)
      .sort((a, b) => a.position - b.position)
  );

  protected readonly editingId = signal<string | null>(null);
  protected readonly draft = signal<BlockDraft>(emptyDraft());
  protected readonly formError = signal('');
  protected readonly deleteTargetId = signal<string | null>(null);

  ngOnInit(): void {
    // Non carica subito: il pannello parte chiuso, come Cruciverba/Mappa.
  }

  protected togglePanel(): void {
    const next = !this.panelOpen();
    this.panelOpen.set(next);
    if (next && this.rawBlocks().length === 0) {
      void this.load();
    }
  }

  private async load(): Promise<void> {
    try {
      const response = await fetch('/api/gdr-blocks', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`Errore ${response.status}`);
      const result = await this.api.readApiResponse<{ blocks?: GdrBlockRow[] }>(response);
      this.rawBlocks.set(result.blocks ?? []);
    } catch (error) {
      console.error('Errore nel caricamento dei blocchi del GDR:', error);
    }
  }

  protected onTypeChange(type: GdrBlockType): void {
    this.draft.set({ type, dataJson: JSON.stringify(BLOCK_TEMPLATES[type], null, 2) });
  }

  protected startCreate(): void {
    this.draft.set(emptyDraft());
    this.formError.set('');
    this.editingId.set('__new__');
  }

  protected startEdit(block: GdrBlockRow): void {
    this.draft.set(toDraft(block));
    this.formError.set('');
    this.editingId.set(block.id);
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
  }

  protected updateDraftJson(value: string): void {
    this.draft.set({ ...this.draft(), dataJson: value });
  }

  protected async submitEdit(): Promise<void> {
    const d = this.draft();
    let data: unknown;
    try {
      data = JSON.parse(d.dataJson);
    } catch {
      this.formError.set('Il contenuto non è JSON valido.');
      return;
    }
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      this.formError.set('Il contenuto deve essere un oggetto JSON.');
      return;
    }

    const isNew = this.editingId() === '__new__';
    const payload: Record<string, unknown> = { type: d.type, data };
    if (isNew) {
      payload['documentKey'] = this.documentKey;
    }

    const endpoint = isNew ? '/api/gdr-blocks' : `/api/gdr-blocks/${this.editingId()}`;
    const ok = await this.api.sendAuthenticatedJson(endpoint, payload, isNew ? 'POST' : 'PUT');
    if (!ok) {
      this.formError.set('Non è stato possibile salvare il blocco.');
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
    await this.api.sendAuthenticatedJson(`/api/gdr-blocks/${id}`, {}, 'DELETE');
    this.deleteTargetId.set(null);
    await this.load();
  }

  protected async move(id: string, direction: 'up' | 'down'): Promise<void> {
    await this.api.sendAuthenticatedJson(`/api/gdr-blocks/${id}/move`, { direction }, 'POST');
    await this.load();
  }

  // Etichetta breve del blocco per la lista admin: il primo campo testuale utile, troncato.
  protected summary(block: GdrBlockRow): string {
    const data = block.data as unknown as Record<string, unknown>;
    const text = (data['text'] as string) ?? (data['name'] as string) ?? JSON.stringify(data);
    const raw = typeof text === 'string' ? text : JSON.stringify(data);
    return raw.length > 90 ? `${raw.slice(0, 90)}…` : raw;
  }
}
