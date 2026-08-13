import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AppShell } from '../../shell/app-shell';
import { AudioPlayer } from '../../shared/audio-player/audio-player';
import { ConfirmationDialog } from '../../shared/confirmation-dialog/confirmation-dialog';
import { AuthService } from '../../core/auth.service';
import { ApiService } from '../../core/api.service';
import { WORLD_PLACES, WORLD_PLACE_GROUPS, WorldPlace } from '../../core/world-places';

type Speaker = 'r' | 'd' | null;

interface SceneSegment {
  speaker: Speaker;
  text: string;
}

interface Scene {
  id: string;
  sceneNumber: number;
  title: string;
  lines: SceneSegment[][];
  isWide: boolean;
  isFinale: boolean;
  position: number;
}

interface LineDraft {
  segments: { speaker: string; text: string }[];
}

interface SceneDraft {
  id: string;
  sceneNumber: string;
  title: string;
  isWide: boolean;
  isFinale: boolean;
  lines: LineDraft[];
}

interface AtlasPlace extends WorldPlace {
  name: string;
  description: string;
  children: AtlasPlace[];
}

function emptyDraft(nextNumber: number): SceneDraft {
  return { id: '', sceneNumber: String(nextNumber), title: '', isWide: false, isFinale: false, lines: [{ segments: [{ speaker: '', text: '' }] }] };
}

function toDraft(scene: Scene): SceneDraft {
  return {
    id: scene.id,
    sceneNumber: String(scene.sceneNumber),
    title: scene.title,
    isWide: scene.isWide,
    isFinale: scene.isFinale,
    lines: scene.lines.map((segments) => ({ segments: segments.map((s) => ({ speaker: s.speaker ?? '', text: s.text })) }))
  };
}

// Editor dedicato del Mappamondo (documentazione/cms/planning-editor-contenuti.md, Fase 7, decisione #3
// dell'inventario). Ogni scena vive ora in mappamondo_scenes via /api/mappamondo-scenes: le
// righe sono liste di segmenti {speaker, text} per preservare i (rari) paragrafi che mescolano
// narrazione e battuta nello stesso testo, invece di appiattirli in paragrafi semplici.
@Component({
  selector: 'app-mappamondo',
  standalone: true,
  imports: [AppShell, AudioPlayer, FormsModule, RouterLink, ConfirmationDialog],
  styleUrls: ['../../../styles/pages/mappamondo.css'],
  templateUrl: './mappamondo.html'
})
export class Mappamondo {
  protected readonly songUrl = '/api/media/mappamondo/audio/benjamin.mp3';

  private readonly api = inject(ApiService);
  protected readonly authService = inject(AuthService);

  protected readonly canEdit = computed(() => this.authService.isAdmin() && this.authService.adminModeEnabled());

  private readonly scenes = signal<Scene[]>([]);
  protected readonly sortedScenes = computed(() => [...this.scenes()].sort((a, b) => a.position - b.position));
  protected readonly loadError = signal(false);
  private readonly placeOverrides = signal<Map<string, { name: string; description: string | null }>>(new Map());
  protected readonly atlasGroups = computed(() => WORLD_PLACE_GROUPS.map((group) => ({
    ...group,
    places: WORLD_PLACES
      .filter((place) => place.group === group.id && place.id !== 'mappamondo' && !place.parentId)
      .map<AtlasPlace>((place) => {
        const override = this.placeOverrides().get(place.id);
        const children = WORLD_PLACES.filter((candidate) => candidate.parentId === place.id).map<AtlasPlace>((child) => {
          const childOverride = this.placeOverrides().get(child.id);
          return {
            ...child,
            name: childOverride?.name ?? child.fallbackName,
            description: childOverride?.description || child.fallbackDescription,
            children: []
          };
        });
        return {
          ...place,
          name: override?.name ?? place.fallbackName,
          description: override?.description || place.fallbackDescription,
          children
        };
      })
  })));

  protected readonly editingId = signal<string | 'new' | null>(null);
  protected readonly draft = signal<SceneDraft>(emptyDraft(1));
  protected readonly formError = signal('');
  protected readonly deleteTargetId = signal<string | null>(null);
  protected readonly editingAtlasId = signal<string | null>(null);
  protected readonly atlasDraftName = signal('');
  protected readonly atlasDraftDescription = signal('');
  protected readonly atlasFormError = signal('');

  constructor() {
    void this.load();
    void this.loadAtlas();
  }

  private async load(): Promise<void> {
    try {
      const response = await fetch('/api/mappamondo-scenes', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`Errore ${response.status}`);
      const result = await this.api.readApiResponse<{ scenes?: Scene[] }>(response);
      this.scenes.set(result.scenes ?? []);
    } catch (error) {
      console.error('Errore nel caricamento del Mappamondo:', error);
      this.loadError.set(true);
    }
  }

  private async loadAtlas(): Promise<void> {
    try {
      const response = await fetch('/api/mondo-bianco-cards', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
      if (!response.ok) return;
      const result = await this.api.readApiResponse<{ cards?: { id: string; name: string; description: string | null }[] }>(response);
      this.placeOverrides.set(new Map((result.cards ?? []).map((card) => [card.id, { name: card.name, description: card.description }])));
    } catch (error) {
      console.error('Errore nel caricamento delle destinazioni dell’atlante:', error);
    }
  }

  protected startAtlasEdit(place: AtlasPlace): void {
    this.atlasDraftName.set(place.name);
    this.atlasDraftDescription.set(place.description);
    this.atlasFormError.set('');
    this.editingAtlasId.set(place.id);
  }

  protected cancelAtlasEdit(): void {
    this.editingAtlasId.set(null);
  }

  protected async submitAtlasEdit(): Promise<void> {
    const id = this.editingAtlasId();
    const name = this.atlasDraftName().trim();
    const description = this.atlasDraftDescription().trim();
    if (!id || !name || name.length > 60 || description.length > 200) {
      this.atlasFormError.set('Il nome è obbligatorio; la descrizione può avere al massimo 200 caratteri.');
      return;
    }
    const ok = await this.api.sendAuthenticatedJson(`/api/mondo-bianco-cards/${id}`, { name, description }, 'PUT');
    if (!ok) {
      this.atlasFormError.set('Non è stato possibile salvare questa tappa.');
      return;
    }
    this.editingAtlasId.set(null);
    await this.loadAtlas();
  }

  protected startCreate(): void {
    const nextNumber = this.sortedScenes().length + 1;
    this.draft.set(emptyDraft(nextNumber));
    this.formError.set('');
    this.editingId.set('new');
  }

  protected startEdit(scene: Scene): void {
    this.draft.set(toDraft(scene));
    this.formError.set('');
    this.editingId.set(scene.id);
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
  }

  protected updateDraft(patch: Partial<SceneDraft>): void {
    this.draft.set({ ...this.draft(), ...patch });
  }

  protected updateLineText(lineIndex: number, segmentIndex: number, text: string): void {
    const d = this.draft();
    const lines = d.lines.map((line, i) =>
      i !== lineIndex ? line : { segments: line.segments.map((s, j) => (j !== segmentIndex ? s : { ...s, text })) }
    );
    this.draft.set({ ...d, lines });
  }

  protected updateLineSpeaker(lineIndex: number, segmentIndex: number, speaker: string): void {
    const d = this.draft();
    const lines = d.lines.map((line, i) =>
      i !== lineIndex ? line : { segments: line.segments.map((s, j) => (j !== segmentIndex ? s : { ...s, speaker })) }
    );
    this.draft.set({ ...d, lines });
  }

  protected addLine(): void {
    const d = this.draft();
    this.draft.set({ ...d, lines: [...d.lines, { segments: [{ speaker: '', text: '' }] }] });
  }

  protected removeLine(lineIndex: number): void {
    const d = this.draft();
    if (d.lines.length <= 1) return;
    this.draft.set({ ...d, lines: d.lines.filter((_, i) => i !== lineIndex) });
  }

  protected addSegment(lineIndex: number): void {
    const d = this.draft();
    const lines = d.lines.map((line, i) => (i !== lineIndex ? line : { segments: [...line.segments, { speaker: '', text: '' }] }));
    this.draft.set({ ...d, lines });
  }

  protected async submitEdit(): Promise<void> {
    const d = this.draft();
    const sceneNumber = Number(d.sceneNumber);
    const lines = d.lines
      .map((line) => line.segments.map((s) => ({ speaker: s.speaker || null, text: s.text.trim() })).filter((s) => s.text))
      .filter((line) => line.length > 0);

    if (!d.title.trim() || !Number.isInteger(sceneNumber) || sceneNumber < 1 || lines.length === 0) {
      this.formError.set('Titolo, numero scena e almeno una riga di testo sono obbligatori.');
      return;
    }

    const isNew = this.editingId() === 'new';
    const payload = {
      ...(isNew ? { id: d.id.trim().toLowerCase() } : {}),
      title: d.title.trim(),
      sceneNumber,
      lines,
      isWide: d.isWide,
      isFinale: d.isFinale
    };

    if (isNew && !/^[a-z][a-z0-9-]{0,63}$/.test(payload.id ?? '')) {
      this.formError.set('ID non valido: solo lettere minuscole, numeri e trattini.');
      return;
    }

    const endpoint = isNew ? '/api/mappamondo-scenes' : `/api/mappamondo-scenes/${this.editingId()}`;
    const ok = await this.api.sendAuthenticatedJson(endpoint, payload, isNew ? 'POST' : 'PUT');
    if (!ok) {
      this.formError.set('Non è stato possibile salvare la scena.');
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
    await this.api.sendAuthenticatedJson(`/api/mappamondo-scenes/${id}`, {}, 'DELETE');
    this.deleteTargetId.set(null);
    await this.load();
  }

  protected async move(id: string, direction: 'up' | 'down'): Promise<void> {
    await this.api.sendAuthenticatedJson(`/api/mappamondo-scenes/${id}/move`, { direction }, 'POST');
    await this.load();
  }
}
