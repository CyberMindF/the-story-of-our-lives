import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppShell } from '../../shell/app-shell';
import { AudioPlayer } from '../../shared/audio-player/audio-player';
import { ConfirmationDialog } from '../../shared/confirmation-dialog/confirmation-dialog';
import { AuthService } from '../../core/auth.service';
import { ApiService } from '../../core/api.service';

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
  imports: [AppShell, AudioPlayer, FormsModule, ConfirmationDialog],
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

  protected readonly editingId = signal<string | 'new' | null>(null);
  protected readonly draft = signal<SceneDraft>(emptyDraft(1));
  protected readonly formError = signal('');
  protected readonly deleteTargetId = signal<string | null>(null);

  constructor() {
    void this.load();
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
