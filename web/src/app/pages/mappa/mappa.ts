import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AppShell } from '../../shell/app-shell';
import { ContentMessage } from '../../shared/content-message/content-message';
import { EditorialText } from '../../shared/editorial-text/editorial-text';
import { ConfirmationDialog } from '../../shared/confirmation-dialog/confirmation-dialog';
import { AuthService } from '../../core/auth.service';
import { ApiService } from '../../core/api.service';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface DestinationImage {
  src: string;
  alt: string;
  beforeParagraph?: number;
  position?: 'before' | 'after';
  // Forza il layout "immagini sopra a tutta larghezza, testo sotto" (di norma quello dei
  // paragrafi lunghi, isLong sotto) anche con un testo breve — non tutti i paragrafi
  // arriveranno ai 900 caratteri della soglia automatica, ma con 2 foto affiancate un testo
  // corto a fianco resta comunque stretto e schiacciato. Basta impostarlo sulla prima
  // immagine del gruppo (stesso beforeParagraph), come già "position".
  stacked?: boolean;
}

interface Destination {
  id: string;
  name: string;
  isOpen: boolean;
  coordinates: Coordinates | null;
  paragraphs: string[];
  images: DestinationImage[];
  position: number;
}

interface Passage {
  images: DestinationImage[];
  text: string;
  isLong: boolean;
  imagePosition: 'before' | 'after';
}

interface DestinationView {
  destination: Destination;
  index: number;
  passages: Passage[];
  hasImages: boolean;
}

interface PinView {
  destination: Destination;
  index: number;
  x: number;
  y: number;
}

interface DestinationDraft {
  id: string;
  name: string;
  isOpen: boolean;
  latitude: string;
  longitude: string;
  paragraphs: string;
  imagesJson: string;
}

function emptyDraft(): DestinationDraft {
  return { id: '', name: '', isOpen: false, latitude: '', longitude: '', paragraphs: '', imagesJson: '[]' };
}

function toDraft(destination: Destination): DestinationDraft {
  return {
    id: destination.id,
    name: destination.name,
    isOpen: destination.isOpen,
    latitude: destination.coordinates ? String(destination.coordinates.latitude) : '',
    longitude: destination.coordinates ? String(destination.coordinates.longitude) : '',
    paragraphs: destination.paragraphs.join('\n\n'),
    imagesJson: JSON.stringify(destination.images, null, 2)
  };
}

// Editor dedicato della Mappa (documentazione/cms/planning-editor-contenuti.md, Fase 7): le destinazioni vivono ora
// in map_destinations via /api/map-destinations, stesso pattern di posizione esplicita e
// riordino "su/giù" di Ricettario/Storie/Cuffiette. Le immagini restano un campo JSON grezzo in
// modifica (sono legate a un indice di paragrafo specifico, non un semplice elenco) — editor
// "senza fronzoli", non un repeater visuale. Niente più vincolo "esattamente 7 destinazioni":
// stesso bug già corretto altrove, qui non ancora esercitato ma comunque rimosso.
@Component({
  selector: 'app-mappa',
  standalone: true,
  imports: [AppShell, ContentMessage, NgTemplateOutlet, RouterLink, EditorialText, FormsModule, ConfirmationDialog],
  styleUrls: ['../../../styles/pages/map.css'],
  templateUrl: './mappa.html'
})
export class Mappa {
  private readonly api = inject(ApiService);
  protected readonly authService = inject(AuthService);

  protected readonly canEdit = computed(() => this.authService.isAdmin() && this.authService.adminModeEnabled());

  private readonly destinations = signal<Destination[]>([]);
  protected readonly loadError = signal(false);
  protected readonly selectedId = signal<string | null>(null);

  protected readonly destinationViews = computed<DestinationView[]>(() =>
    [...this.destinations()]
      .sort((a, b) => a.position - b.position)
      .map((destination, index) => this.toDestinationView(destination, index))
  );
  protected readonly pins = computed<PinView[]>(() =>
    this.destinationViews().map((view) => this.toPinView(view.destination, view.index))
  );

  protected readonly selected = computed(() => {
    const id = this.selectedId();
    if (!id) {
      return null;
    }
    const views = this.destinationViews();
    const index = views.findIndex((view) => view.destination.id === id);
    if (index === -1) {
      return null;
    }
    const view = views[index];
    const cover = view.destination.images[0] ?? null;
    return {
      view,
      index,
      label: view.destination.isOpen ? 'La puntina ancora libera' : 'Una meta sulla mappa',
      firstParagraph: view.destination.paragraphs[0] ?? '',
      cover
    };
  });

  protected readonly editingId = signal<string | null>(null);
  protected readonly draft = signal<DestinationDraft>(emptyDraft());
  protected readonly formError = signal('');
  protected readonly deleteTargetId = signal<string | null>(null);

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      const response = await fetch('/api/map-destinations', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`Errore ${response.status}`);
      const result = await this.api.readApiResponse<{ destinations?: Destination[] }>(response);
      const destinations = result.destinations ?? [];
      this.destinations.set(destinations);
      if (!this.selectedId() && destinations.length > 0) {
        this.selectedId.set([...destinations].sort((a, b) => a.position - b.position)[0].id);
      }
    } catch (error) {
      console.error('Errore nel caricamento della mappa:', error);
      this.loadError.set(true);
    }
  }

  protected selectDestination(destinationId: string): void {
    this.selectedId.set(destinationId);
  }

  private toPinView(destination: Destination, index: number): PinView {
    const position = this.projectCoordinates(destination.coordinates ?? undefined);
    return { destination, index, x: position.x, y: position.y };
  }

  private toDestinationView(destination: Destination, index: number): DestinationView {
    const passages = destination.paragraphs.map((text, paragraphIndex) => {
      const images = destination.images.filter((image) => image.beforeParagraph === paragraphIndex);
      const imagePosition = images[0]?.position ?? 'before';
      const isLong = images.length > 0 && (text.length > 900 || images[0]?.stacked === true);
      return { images, text, isLong, imagePosition };
    });
    return { destination, index, passages, hasImages: destination.images.length > 0 };
  }

  private projectCoordinates(coordinates?: Coordinates): { x: number; y: number } {
    if (!coordinates) {
      return { x: 50, y: 50 };
    }

    const radians = Math.PI / 180;
    const latitude = coordinates.latitude * radians;
    const longitude = (coordinates.longitude - 11) * radians;
    const a1 = 1.340264;
    const a2 = -0.081106;
    const a3 = 0.000893;
    const a4 = 0.003796;
    const m = Math.sqrt(3) / 2;
    const theta = Math.asin(m * Math.sin(latitude));
    const theta2 = theta * theta;
    const theta6 = theta2 * theta2 * theta2;
    const denominator = m * (a1 + 3 * a2 * theta2 + theta6 * (7 * a3 + 9 * a4 * theta2));
    const projectedX = (longitude * Math.cos(theta)) / denominator;
    const projectedY = theta * (a1 + a2 * theta2 + theta6 * (a3 + a4 * theta2));
    const x = 50 + (projectedX / 2.70663) * 50;
    const y = 50 - (projectedY / 1.31736) * 50;

    return { x, y };
  }

  protected startCreate(): void {
    this.draft.set(emptyDraft());
    this.formError.set('');
    this.editingId.set('__new__');
  }

  protected startEdit(destination: Destination): void {
    this.draft.set(toDraft(destination));
    this.formError.set('');
    this.editingId.set(destination.id);
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
  }

  protected updateDraft(patch: Partial<DestinationDraft>): void {
    this.draft.set({ ...this.draft(), ...patch });
  }

  protected async submitEdit(): Promise<void> {
    const d = this.draft();
    const paragraphs = d.paragraphs.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

    let images: unknown;
    try {
      images = JSON.parse(d.imagesJson || '[]');
    } catch {
      this.formError.set('Il campo immagini non è JSON valido.');
      return;
    }

    if (!d.name.trim() || paragraphs.length === 0) {
      this.formError.set('Nome e paragrafi sono obbligatori.');
      return;
    }

    const isNew = this.editingId() === '__new__';
    const payload = {
      ...(isNew ? { id: d.id.trim().toLowerCase() } : {}),
      name: d.name.trim(),
      isOpen: d.isOpen,
      latitude: d.latitude.trim() || null,
      longitude: d.longitude.trim() || null,
      paragraphs,
      images
    };

    if (isNew && !/^[a-z][a-z0-9-]{0,63}$/.test(payload.id ?? '')) {
      this.formError.set('ID non valido: solo lettere minuscole, numeri e trattini.');
      return;
    }

    const endpoint = isNew ? '/api/map-destinations' : `/api/map-destinations/${this.editingId()}`;
    const ok = await this.api.sendAuthenticatedJson(endpoint, payload, isNew ? 'POST' : 'PUT');
    if (!ok) {
      this.formError.set('Non è stato possibile salvare la destinazione.');
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
    await this.api.sendAuthenticatedJson(`/api/map-destinations/${id}`, {}, 'DELETE');
    this.deleteTargetId.set(null);
    await this.load();
  }

  protected async move(id: string, direction: 'up' | 'down'): Promise<void> {
    await this.api.sendAuthenticatedJson(`/api/map-destinations/${id}/move`, { direction }, 'POST');
    await this.load();
  }
}
