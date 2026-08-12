import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AppShell } from '../../shell/app-shell';
import { AudioPlayer } from '../../shared/audio-player/audio-player';
import { EditorialText } from '../../shared/editorial-text/editorial-text';
import { AuthService } from '../../core/auth.service';
import { ApiService } from '../../core/api.service';

// Emoji, rotta, disponibilità e ordine restano nel codice (documentazione/cms/planning-editor-contenuti.md,
// decisione #2 dell'inventario): solo nome e descrizione sono contenuto editoriale, letti da
// /api/mondo-bianco-cards e sovrascrivibili in modalità admin. L'elenco e l'ordine delle card
// non cambiano dall'editor — aggiungerne o toglierne una è comunque una modifica di codice.
interface PlaceMeta {
  id: string;
  emoji: string;
  route: string;
  fallbackName: string;
}

const PLACES: readonly PlaceMeta[] = [
  { id: 'bacheca', emoji: '📸', route: '/bacheca', fallbackName: 'La Bacheca dei Ricordi' },
  { id: 'mappamondo', emoji: '🌍', route: '/mappamondo', fallbackName: 'Il Mappamondo' },
  { id: 'ponti', emoji: '🌈', route: '/ponti', fallbackName: 'I Ponti' },
  { id: 'storie', emoji: '📖', route: '/storie', fallbackName: 'Le Storie' },
  { id: 'calendario', emoji: '📅', route: '/calendario', fallbackName: 'Il Calendario' },
  { id: 'cuffiette', emoji: '🎧', route: '/cuffiette', fallbackName: 'Le Cuffiette' },
  { id: 'tavolo-da-gioco', emoji: '🎲', route: '/tavolo-da-gioco', fallbackName: 'Il Tavolo da Gioco' },
  { id: 'mappa', emoji: '🗺️', route: '/mappa', fallbackName: 'La Mappa' },
  { id: 'lettere', emoji: '📫', route: '/lettere', fallbackName: 'La Cassetta delle Lettere' },
  { id: 'domande', emoji: '⛲', route: '/domande', fallbackName: 'Il Pozzo dei Dubbi' },
  { id: 'cose-da-fare-insieme', emoji: '📔', route: '/cose-da-fare-insieme', fallbackName: "L'Agenda delle Idee" },
  { id: 'ricettario', emoji: '🍳', route: '/ricettario', fallbackName: 'Il Ricettario' },
  { id: 'impostazioni-mondo', emoji: '🎛️', route: '/impostazioni-mondo', fallbackName: 'La Stanza dei Bottoni' },
  { id: 'il-cielo', emoji: '🌌', route: '/il-cielo', fallbackName: 'Il Cielo' }
];

interface CardOverride {
  name: string;
  description: string | null;
}

interface PlaceView extends PlaceMeta {
  name: string;
  description: string | null;
}

@Component({
  selector: 'app-mondo-bianco',
  standalone: true,
  imports: [RouterLink, AppShell, AudioPlayer, EditorialText, FormsModule],
  styleUrls: ['../../../styles/pages/world.css'],
  templateUrl: './mondo-bianco.html'
})
export class MondoBianco {
  private readonly api = inject(ApiService);
  protected readonly authService = inject(AuthService);

  protected readonly songUrl = '/api/media/cuffiette/canzoni/il-cerchio.mp3';
  protected readonly canEdit = computed(() => this.authService.isAdmin() && this.authService.adminModeEnabled());

  private readonly overrides = signal<Map<string, CardOverride>>(new Map());
  protected readonly places = computed<PlaceView[]>(() =>
    PLACES.map((place) => {
      const override = this.overrides().get(place.id);
      return { ...place, name: override?.name ?? place.fallbackName, description: override?.description ?? null };
    })
  );

  protected readonly editingId = signal<string | null>(null);
  protected readonly draftName = signal('');
  protected readonly draftDescription = signal('');
  protected readonly formError = signal('');

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      const response = await fetch('/api/mondo-bianco-cards', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
      if (!response.ok) return;
      const result = await this.api.readApiResponse<{ cards?: { id: string; name: string; description: string | null }[] }>(response);
      const map = new Map<string, CardOverride>();
      for (const card of result.cards ?? []) {
        map.set(card.id, { name: card.name, description: card.description });
      }
      this.overrides.set(map);
    } catch (error) {
      console.error('Errore nel caricamento delle card del Mondo Bianco:', error);
    }
  }

  protected startEdit(place: PlaceView): void {
    this.draftName.set(place.name);
    this.draftDescription.set(place.description ?? '');
    this.formError.set('');
    this.editingId.set(place.id);
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
  }

  protected async submitEdit(): Promise<void> {
    const id = this.editingId();
    if (!id) return;
    const name = this.draftName().trim();
    if (!name) {
      this.formError.set('Il nome non può essere vuoto.');
      return;
    }

    const ok = await this.api.sendAuthenticatedJson(`/api/mondo-bianco-cards/${id}`, {
      name,
      description: this.draftDescription().trim()
    }, 'PUT');

    if (!ok) {
      this.formError.set('Non è stato possibile salvare la card.');
      return;
    }

    this.editingId.set(null);
    await this.load();
  }
}
