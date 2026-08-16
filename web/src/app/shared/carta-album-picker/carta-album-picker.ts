import { Component, EventEmitter, HostListener, Input, Output, signal } from '@angular/core';
import { CartaFinitura, CARTA_FINITURA_LABELS, CARTA_FINITURE } from '../carta-finiture';
import { CartaTilt } from '../carta-tilt/carta-tilt';

export interface CartaAlbumPickerItem {
  id: string;
  nome: string;
  finitura: CartaFinitura;
  immagineUrl: string | null;
  quantita: number;
}

@Component({
  selector: 'app-carta-album-picker',
  standalone: true,
  imports: [CartaTilt],
  templateUrl: './carta-album-picker.html',
  styleUrl: './carta-album-picker.css'
})
export class CartaAlbumPicker {
  @Input({ required: true }) cards: readonly CartaAlbumPickerItem[] = [];
  @Input() selectedId = '';
  @Input() buttonLabel = "Scegli dall'album";
  @Input() title = 'Scegli una carta';
  @Output() readonly selectedIdChange = new EventEmitter<string>();

  protected readonly open = signal(false);
  protected readonly finitura = signal<CartaFinitura | 'tutte'>('tutte');
  protected readonly finiture = CARTA_FINITURE;
  protected readonly labels = CARTA_FINITURA_LABELS;

  protected get selected(): CartaAlbumPickerItem | undefined {
    return this.cards.find((card) => card.id === this.selectedId);
  }

  protected get filteredCards(): readonly CartaAlbumPickerItem[] {
    const finitura = this.finitura();
    return finitura === 'tutte' ? this.cards : this.cards.filter((card) => card.finitura === finitura);
  }

  protected choose(card: CartaAlbumPickerItem): void {
    this.selectedIdChange.emit(card.id);
    this.open.set(false);
  }

  protected closeOnBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.open.set(false);
  }

  @HostListener('document:keydown.escape')
  protected close(): void {
    this.open.set(false);
  }
}
