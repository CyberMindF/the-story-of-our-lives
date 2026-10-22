import { Component, ElementRef, OnDestroy, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { AppShell } from '../../shell/app-shell';
import { CartaTilt } from '../../shared/carta-tilt/carta-tilt';
import { CARTA_FINITURE, CARTA_FINITURA_LABELS, CartaFinitura } from '../../shared/carta-finiture';
import { cardImageError, imageFromClipboard } from '../../shared/card-image-file';

interface Design {
  id: string;
  setId: string;
  nome: string;
  immagineKey: string | null;
  position: number;
}
interface CardSet { id: string; nome: string; }

@Component({
  selector: 'app-carte-catalogo',
  imports: [AppShell, FormsModule, CartaTilt],
  templateUrl: './carte-catalogo.html',
  styleUrl: './carte-catalogo.css'
})
export class CarteCatalogo implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  @ViewChild('details', { static: true }) private details!: ElementRef<HTMLDialogElement>;
  protected readonly canEdit = computed(() => this.auth.isAdmin() && this.auth.adminModeEnabled() && !this.auth.currentUser()?.isTest);
  protected readonly designs = signal<Design[]>([]);
  protected readonly sets = signal<CardSet[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly notice = signal('');
  protected readonly search = signal('');
  protected readonly filterSet = signal('');
  protected readonly selected = signal<Design | null>(null);
  protected readonly editing = signal(false);
  protected readonly saving = signal(false);
  protected readonly formError = signal('');
  protected readonly name = signal('');
  protected readonly setId = signal('');
  protected readonly imageKey = signal<string | null>(null);
  protected readonly filePreview = signal<string | null>(null);
  protected readonly finish = signal<CartaFinitura>('flat');
  protected readonly finishes = CARTA_FINITURE;
  protected readonly finishLabels = CARTA_FINITURA_LABELS;
  private file: File | null = null;
  protected readonly previewUrl = computed(() => this.filePreview() ?? this.imageUrl(this.imageKey()));
  protected readonly filtered = computed(() => {
    const term = this.search().trim().toLocaleLowerCase('it');
    const setId = this.filterSet();
    return this.designs().filter((card) => (!setId || card.setId === setId)
      && (!term || card.nome.toLocaleLowerCase('it').includes(term)));
  });
  protected readonly groups = computed(() => this.sets()
    .map((set) => ({ ...set, cards: this.filtered().filter((card) => card.setId === set.id) }))
    .filter((set) => set.cards.length > 0));

  async ngOnInit(): Promise<void> {
    await this.load();
    const id = this.route.snapshot.queryParamMap.get('carta');
    const card = this.designs().find((item) => item.id === id);
    if (card) this.open(card);
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const [designs, sets] = await Promise.all([
        this.request<{ designs: Design[] }>('/api/carte-designs'),
        this.request<{ sets: CardSet[] }>('/api/carte-sets')
      ]);
      this.designs.set(designs.designs);
      this.sets.set(sets.sets);
    } catch (error) {
      this.error.set(this.errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  protected imageUrl(key: string | null): string | null {
    return key ? `/api/media/${key}` : null;
  }

  protected open(card: Design | null): void {
    if (!card && !this.canEdit()) return;
    this.clearFile();
    this.selected.set(card);
    this.name.set(card?.nome ?? '');
    this.setId.set(card?.setId ?? (this.filterSet() || this.sets()[0]?.id || ''));
    this.imageKey.set(card?.immagineKey ?? null);
    this.editing.set(card === null);
    this.finish.set('flat');
    this.formError.set('');
    this.details.nativeElement.showModal();
  }

  protected close(): void {
    if (this.saving()) return;
    this.details.nativeElement.close();
    this.clearFile();
  }

  protected cancelDialog(event: Event): void {
    event.preventDefault();
    this.close();
  }

  protected onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!this.useFile(file)) input.value = '';
  }

  protected onPaste(event: ClipboardEvent): void {
    if (!this.editing() || !this.canEdit() || this.saving()) return;
    const file = imageFromClipboard(event);
    if (!file) return; // L'incolla di testo continua a funzionare normalmente nei campi.
    event.preventDefault();
    this.useFile(file);
  }

  protected async save(): Promise<void> {
    if (!this.canEdit() || this.saving()) return;
    const nome = this.name().trim();
    if (!nome || !this.setId()) {
      this.formError.set('Inserisci il nome e scegli un set.');
      return;
    }
    this.saving.set(true);
    this.formError.set('');
    try {
      if (this.file) {
        const result = await this.request<{ key: string }>('/api/carte-media/upload?type=photo', {
          method: 'POST', headers: { 'Content-Type': this.file.type }, body: this.file
        });
        this.imageKey.set(result.key);
        this.clearFile();
      }
      const current = this.selected();
      const saved = await this.request<Design>(current ? `/api/carte-designs/${current.id}` : '/api/carte-designs', {
        method: current ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, setId: Number(this.setId()), immagineKey: this.imageKey() })
      });
      this.designs.update((items) => [...items.filter((item) => item.id !== saved.id), saved]
        .sort((a, b) => a.position - b.position || Number(a.id) - Number(b.id)));
      this.selected.set(saved);
      this.editing.set(false);
      this.notice.set(current ? `“${saved.nome}” aggiornata.` : `“${saved.nome}” aggiunta al gioco.`);
      // Il risultato resta visibile anche se nome o set non corrispondono piu ai filtri.
      this.filterSet.set(saved.setId);
      this.search.set('');
    } catch (error) {
      this.formError.set(this.errorMessage(error));
    } finally {
      this.saving.set(false);
    }
  }

  private async request<T>(url: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(url, { credentials: 'same-origin', ...init });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Operazione non riuscita. Riprova.');
    return data as T;
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Operazione non riuscita. Riprova.';
  }

  private clearFile(): void {
    const url = this.filePreview();
    if (url) URL.revokeObjectURL(url);
    this.filePreview.set(null);
    this.file = null;
  }

  private useFile(file: File): boolean {
    const error = cardImageError(file);
    this.formError.set(error ?? '');
    if (error) return false;
    this.clearFile();
    this.file = file;
    this.filePreview.set(URL.createObjectURL(file));
    return true;
  }

  ngOnDestroy(): void {
    this.clearFile();
    this.details.nativeElement.close();
  }
}
