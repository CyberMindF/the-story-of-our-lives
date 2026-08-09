import { Component, OnInit, computed, signal } from '@angular/core';
import { AppShell } from '../../shell/app-shell';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface DestinationImage {
  src: string;
  alt: string;
  beforeParagraph?: number;
}

interface Destination {
  id: string;
  name: string;
  isOpen: boolean;
  coordinates?: Coordinates;
  paragraphs: string[];
  images: DestinationImage[];
}

interface Passage {
  images: DestinationImage[];
  text: string;
  isLong: boolean;
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

// Porting fedele di assets/js/map/main.js: stessa proiezione Equal Earth (funzione pura,
// portata carattere per carattere), stessa validazione (introduzione + 6 destinazioni),
// stessa anteprima aggiornata al click su una puntina, stesso diario di viaggio completo
// sotto. La costruzione DOM (createPin/createDestination/createGallery/createNarrative)
// diventa binding dichiarativo nel template — la logica di raggruppamento immagini per
// paragrafo resta identica, solo precalcolata una volta invece che ad ogni createElement.
@Component({
  selector: 'app-mappa',
  standalone: true,
  imports: [AppShell],
  styleUrls: ['../../../styles/pages/map.css'],
  templateUrl: './mappa.html'
})
export class Mappa implements OnInit {
  protected readonly introduction = signal<string[]>([]);
  protected readonly destinationViews = signal<DestinationView[]>([]);
  protected readonly pins = signal<PinView[]>([]);
  protected readonly selectedId = signal<string | null>(null);
  protected readonly loadError = signal(false);

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

  async ngOnInit(): Promise<void> {
    try {
      const response = await fetch('/content/map.json');
      if (!response.ok) {
        throw new Error(`Caricamento fallito: ${response.status}`);
      }

      const data = (await response.json()) as { introduction: string[]; destinations: Destination[] };
      if (!Array.isArray(data.introduction) || !Array.isArray(data.destinations) || data.destinations.length !== 6) {
        throw new Error('La mappa deve contenere introduzione e sei destinazioni');
      }

      this.introduction.set(data.introduction);
      this.destinationViews.set(data.destinations.map((destination, index) => this.toDestinationView(destination, index)));
      this.pins.set(data.destinations.map((destination, index) => this.toPinView(destination, index)));
      this.selectedId.set(data.destinations[0].id);
    } catch (error) {
      console.error('Errore nel caricamento della mappa:', error);
      this.loadError.set(true);
    }
  }

  protected selectDestination(destinationId: string): void {
    this.selectedId.set(destinationId);
  }

  private toPinView(destination: Destination, index: number): PinView {
    const position = this.projectCoordinates(destination.coordinates);
    return { destination, index, x: position.x, y: position.y };
  }

  private toDestinationView(destination: Destination, index: number): DestinationView {
    const passages = destination.paragraphs.map((text, paragraphIndex) => {
      const images = destination.images.filter((image) => image.beforeParagraph === paragraphIndex);
      return { images, text, isLong: images.length > 0 && text.length > 900 };
    });
    return { destination, index, passages, hasImages: destination.images.length > 0 };
  }

  // Proietta coordinate reali sulla stessa Equal Earth usata dall'immagine cartografica.
  private projectCoordinates(coordinates?: Coordinates): { x: number; y: number } {
    if (!coordinates) {
      return { x: 89, y: 87 };
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
}
