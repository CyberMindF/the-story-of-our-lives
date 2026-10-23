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
  categoriaTarocco: CategoriaTarocco | null;
  numeroTarocco: string | null;
  position: number;
}
type CategoriaTarocco = 'maggiori' | 'bastoni' | 'coppe' | 'spade' | 'denari' | 'speciali';
interface CardSet {
  id: string;
  nome: string;
  descrizione: string | null;
  tipo: 'normale' | 'tarocchi';
  position: number;
}

type SetTipo = CardSet['tipo'];

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
  @ViewChild('setDetails', { static: true }) private setDetails!: ElementRef<HTMLDialogElement>;
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
  protected readonly creatingTarot = signal(false);
  protected readonly tarotCategory = signal<CategoriaTarocco>('maggiori');
  protected readonly tarotNumber = signal('');
  protected readonly selectedSet = signal<CardSet | null>(null);
  protected readonly setName = signal('');
  protected readonly setDescription = signal('');
  protected readonly setType = signal<SetTipo>('normale');
  protected readonly setSaving = signal(false);
  protected readonly setError = signal('');
  protected readonly categoryLabels: Record<CategoriaTarocco, string> = {
    maggiori: 'Arcani Maggiori',
    bastoni: 'Bastoni',
    coppe: 'Coppe',
    spade: 'Spade',
    denari: 'Denari',
    speciali: 'Presagi'
  };
  protected readonly categoryOrder: CategoriaTarocco[] = ['maggiori', 'bastoni', 'coppe', 'spade', 'denari', 'speciali'];
  private file: File | null = null;
  protected readonly previewUrl = computed(() => this.filePreview() ?? this.imageUrl(this.imageKey()));
  protected readonly isTarot = computed(() => this.creatingTarot()
    || this.sets().find((set) => set.id === this.setId())?.tipo === 'tarocchi');
  protected readonly tarotSets = computed(() => this.sets().filter((set) => set.tipo === 'tarocchi'));
  protected readonly filtered = computed(() => {
    const term = this.search().trim().toLocaleLowerCase('it');
    const setId = this.filterSet();
    return this.designs().filter((card) => (!setId || card.setId === setId)
      && (!term || card.nome.toLocaleLowerCase('it').includes(term)));
  });
  protected readonly groups = computed(() => {
    const term = this.search().trim();
    const filterSet = this.filterSet();
    return this.sets()
      .filter((set) => !filterSet || set.id === filterSet)
      .map((set) => {
        const cards = this.filtered().filter((card) => card.setId === set.id);
        const sections = set.tipo === 'tarocchi'
          ? this.categoryOrder
            .map((categoria) => ({ categoria, cards: cards.filter((card) => card.categoriaTarocco === categoria) }))
            .filter((section) => section.cards.length > 0)
          : [{ categoria: null, cards }];
        return { ...set, cards, sections };
      })
      .filter((set) => !term || set.cards.length > 0);
  });

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

  protected open(card: Design | null, preferredSetId = ''): void {
    if (!card && !this.canEdit()) return;
    this.clearFile();
    this.selected.set(card);
    this.creatingTarot.set(false);
    this.name.set(card?.nome ?? '');
    this.setId.set(card?.setId ?? (preferredSetId || this.filterSet() || this.sets()[0]?.id || ''));
    this.tarotCategory.set(card?.categoriaTarocco ?? 'maggiori');
    this.tarotNumber.set(card?.numeroTarocco ?? '');
    this.imageKey.set(card?.immagineKey ?? null);
    this.editing.set(card === null);
    this.finish.set('flat');
    this.formError.set('');
    this.details.nativeElement.showModal();
  }

  protected openTarot(preferredSetId = ''): void {
    if (!this.canEdit() || this.tarotSets().length === 0) return;
    this.clearFile();
    this.selected.set(null);
    this.creatingTarot.set(true);
    this.tarotCategory.set('maggiori');
    this.tarotNumber.set('');
    this.name.set('');
    this.setId.set(this.tarotSets().some((set) => set.id === preferredSetId) ? preferredSetId : this.tarotSets()[0].id);
    this.imageKey.set(null);
    this.editing.set(true);
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
      this.formError.set(this.creatingTarot() ? 'Inserisci il nome e scegli un mazzo.' : 'Inserisci il nome e scegli un set.');
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
        body: JSON.stringify({
          nome,
          setId: Number(this.setId()),
          immagineKey: this.imageKey(),
          categoriaTarocco: this.isTarot() ? this.tarotCategory() : null,
          numeroTarocco: this.isTarot() ? this.tarotNumber().trim() || null : null
        })
      });
      this.designs.update((items) => [...items.filter((item) => item.id !== saved.id), saved]
        .sort((a, b) => a.position - b.position || Number(a.id) - Number(b.id)));
      this.selected.set(saved);
      this.creatingTarot.set(false);
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

  protected openSet(set: CardSet | null, type: SetTipo = 'normale'): void {
    if (!this.canEdit()) return;
    this.selectedSet.set(set);
    this.setName.set(set?.nome ?? '');
    this.setDescription.set(set?.descrizione ?? '');
    this.setType.set(set?.tipo ?? type);
    this.setError.set('');
    this.setDetails.nativeElement.showModal();
  }

  protected closeSet(): void {
    if (this.setSaving()) return;
    this.setDetails.nativeElement.close();
  }

  protected cancelSetDialog(event: Event): void {
    event.preventDefault();
    this.closeSet();
  }

  protected async saveSet(): Promise<void> {
    if (!this.canEdit() || this.setSaving()) return;
    const nome = this.setName().trim();
    if (!nome) {
      this.setError.set('Inserisci il nome del set.');
      return;
    }
    this.setSaving.set(true);
    this.setError.set('');
    const current = this.selectedSet();
    try {
      const saved = await this.request<CardSet>(current ? `/api/carte-sets/${current.id}` : '/api/carte-sets', {
        method: current ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          descrizione: this.setDescription().trim(),
          tipo: this.setType()
        })
      });
      this.sets.update((items) => [...items.filter((item) => item.id !== saved.id), saved]
        .sort((a, b) => a.position - b.position || Number(a.id) - Number(b.id)));
      this.filterSet.set(saved.id);
      this.search.set('');
      this.notice.set(current ? `Set “${saved.nome}” aggiornato.` : `Set “${saved.nome}” creato.`);
      this.setDetails.nativeElement.close();
    } catch (error) {
      this.setError.set(this.errorMessage(error));
    } finally {
      this.setSaving.set(false);
    }
  }

  protected setCardCount(setId: string): number {
    return this.designs().filter((card) => card.setId === setId).length;
  }

  protected async deleteSet(set: CardSet): Promise<void> {
    if (!this.canEdit() || this.setSaving() || this.setCardCount(set.id) > 0) return;
    if (!window.confirm(`Eliminare il set “${set.nome}”?`)) return;
    this.setSaving.set(true);
    this.setError.set('');
    try {
      await this.request<{ ok: boolean }>(`/api/carte-sets/${set.id}`, { method: 'DELETE' });
      this.sets.update((items) => items.filter((item) => item.id !== set.id));
      if (this.filterSet() === set.id) this.filterSet.set('');
      this.notice.set(`Set “${set.nome}” eliminato.`);
      if (this.setDetails.nativeElement.open) this.setDetails.nativeElement.close();
    } catch (error) {
      this.setError.set(this.errorMessage(error));
    } finally {
      this.setSaving.set(false);
    }
  }

  protected async deleteCard(card: Design): Promise<void> {
    if (!this.canEdit() || this.saving()) return;
    if (!window.confirm(`Eliminare la carta “${card.nome}”? Verrà rimossa anche dagli album.`)) return;
    this.saving.set(true);
    this.formError.set('');
    try {
      await this.request<{ ok: boolean }>(`/api/carte-designs/${card.id}`, { method: 'DELETE' });
      this.designs.update((items) => items.filter((item) => item.id !== card.id));
      this.notice.set(`“${card.nome}” eliminata dal gioco.`);
      this.details.nativeElement.close();
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
    if (this.details.nativeElement.open) this.details.nativeElement.close();
    if (this.setDetails.nativeElement.open) this.setDetails.nativeElement.close();
  }
}
