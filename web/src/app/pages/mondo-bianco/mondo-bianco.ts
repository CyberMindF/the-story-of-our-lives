import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AppShell } from '../../shell/app-shell';
import { AudioPlayer } from '../../shared/audio-player/audio-player';
import { EditorialText } from '../../shared/editorial-text/editorial-text';
import { AuthService } from '../../core/auth.service';
import { ApiService } from '../../core/api.service';
import { WORLD_PLACES } from '../../core/world-places';

// Emoji, rotta, disponibilità e ordine restano nel codice (documentazione/cms/planning-editor-contenuti.md,
// decisione #2 dell'inventario): solo nome e descrizione sono contenuto editoriale, letti da
// /api/mondo-bianco-cards e sovrascrivibili in modalità admin. L'elenco e l'ordine delle card
// non cambiano dall'editor — aggiungerne o toglierne una è comunque una modifica di codice.
interface CardOverride {
  name: string;
  description: string | null;
}

interface PlaceView {
  id: string;
  emoji: string;
  route: string;
  fallbackName: string;
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
    WORLD_PLACES.filter((place): place is typeof place & { route: string } => Boolean(place.primary && place.route)).map((place) => {
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
