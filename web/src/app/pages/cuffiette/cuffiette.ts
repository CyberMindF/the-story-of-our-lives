import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TelemetryService } from '../../core/telemetry.service';
import { StaticContentService } from '../../core/static-content.service';
import { AppShell } from '../../shell/app-shell';
import { ContentMessage } from '../../shared/content-message/content-message';
import { AudioPlayer } from '../../shared/audio-player/audio-player';
import { ConfirmationDialog } from '../../shared/confirmation-dialog/confirmation-dialog';
import { EditorialText } from '../../shared/editorial-text/editorial-text';
import { AuthService } from '../../core/auth.service';
import { ApiService } from '../../core/api.service';

interface Song {
  id: string;
  title: string;
  introduction: string;
  lyrics: string;
  mediaKey: string;
  position: number;
}

interface SongDraft {
  id: string;
  title: string;
  introduction: string;
  lyrics: string;
  mediaKey: string;
}

function emptyDraft(): SongDraft {
  return { id: '', title: '', introduction: '', lyrics: '', mediaKey: '' };
}

function toDraft(song: Song): SongDraft {
  return { id: song.id, title: song.title, introduction: song.introduction, lyrics: song.lyrics, mediaKey: song.mediaKey };
}

interface StolenWordItem {
  quote: string;
  source: string;
}

// playlist.name/url, bonus e le citazioni delle Parole Rubate restano per ora nel JSON: le tre
// introduzioni e le canzoni sono già migrate nel CMS (content_entries/cuffiette_songs).
interface MusicData {
  playlist: { name: string; url: string };
  bonus?: { available: boolean; key?: string };
  stolenWords: { items: StolenWordItem[] };
}

// Editor dedicato delle canzoni delle Cuffiette (documentazione/cms/planning-editor-contenuti.md, Fase 7). Porting
// di assets/js/music/main.js per la parte ancora statica; le canzoni vivono ora in
// cuffiette_songs, non più nell'array songs di content/music.json.
@Component({
  selector: 'app-cuffiette',
  standalone: true,
  imports: [AppShell, ContentMessage, RouterLink, AudioPlayer, FormsModule, ConfirmationDialog, EditorialText],
  styleUrls: ['../../../styles/pages/music.css'],
  templateUrl: './cuffiette.html'
})
export class Cuffiette {
  private readonly staticContent = inject(StaticContentService);
  private readonly telemetryService = inject(TelemetryService);
  private readonly api = inject(ApiService);
  protected readonly authService = inject(AuthService);

  protected readonly canEdit = computed(() => this.authService.isAdmin() && this.authService.adminModeEnabled());

  protected readonly data = signal<MusicData | null>(null);
  protected readonly loadError = signal(false);
  protected readonly bonusUrl = computed(() => {
    const bonus = this.data()?.bonus;
    return bonus?.available && bonus.key ? `/api/media/${bonus.key}` : null;
  });

  private readonly songs = signal<Song[]>([]);
  protected readonly sortedSongs = computed(() => [...this.songs()].sort((a, b) => a.position - b.position));

  protected readonly editingId = signal<string | null>(null);
  protected readonly draft = signal<SongDraft>(emptyDraft());
  protected readonly formError = signal('');
  protected readonly deleteTargetId = signal<string | null>(null);

  constructor() {
    void this.loadStatic();
    void this.loadSongs();
  }

  private async loadStatic(): Promise<void> {
    try {
      const data = await this.staticContent.load<MusicData>('/content/music.json');
      if (!Array.isArray(data.stolenWords?.items)) {
        throw new Error('Contenuto musicale incompleto');
      }
      this.data.set(data);
    } catch (error) {
      console.error('Errore nel caricamento delle Cuffiette:', error);
      this.loadError.set(true);
    }
  }

  private async loadSongs(): Promise<void> {
    try {
      const response = await fetch('/api/cuffiette-songs', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`Errore ${response.status}`);
      const result = await this.api.readApiResponse<{ songs?: Song[] }>(response);
      this.songs.set(result.songs ?? []);
    } catch (error) {
      console.error('Errore nel caricamento delle canzoni:', error);
      this.loadError.set(true);
    }
  }

  protected songUrl(song: Song): string {
    return `/api/media/${song.mediaKey}`;
  }

  protected onPlaylistLinkClick(): void {
    void this.telemetryService.trackEvent('music', 'playlist_link_clicked', {});
  }

  protected onSongPlayed(songId: string): void {
    void this.telemetryService.trackEvent('music', 'song_played', { songId });
  }

  protected onSongCompleted(songId: string): void {
    void this.telemetryService.trackEvent('music', 'song_completed', { songId });
  }

  protected onBonusPlayed(): void {
    void this.telemetryService.trackEvent('music', 'song_played', { bonus: true });
  }

  protected onBonusCompleted(): void {
    void this.telemetryService.trackEvent('music', 'song_completed', { bonus: true });
  }

  protected startCreate(): void {
    this.draft.set(emptyDraft());
    this.formError.set('');
    this.editingId.set('__new__');
  }

  protected startEdit(song: Song): void {
    this.draft.set(toDraft(song));
    this.formError.set('');
    this.editingId.set(song.id);
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
  }

  protected updateDraft(patch: Partial<SongDraft>): void {
    this.draft.set({ ...this.draft(), ...patch });
  }

  protected async submitEdit(): Promise<void> {
    const d = this.draft();
    if (!d.title.trim() || !d.introduction.trim() || !d.lyrics.trim() || !d.mediaKey.trim()) {
      this.formError.set('Tutti i campi sono obbligatori.');
      return;
    }

    const isNew = this.editingId() === '__new__';
    const payload = {
      ...(isNew ? { id: d.id.trim().toLowerCase() } : {}),
      title: d.title.trim(),
      introduction: d.introduction.trim(),
      lyrics: d.lyrics.trim(),
      mediaKey: d.mediaKey.trim()
    };

    if (isNew && !/^[a-z][a-z0-9-]{0,63}$/.test(payload.id ?? '')) {
      this.formError.set('ID non valido: solo lettere minuscole, numeri e trattini.');
      return;
    }

    const endpoint = isNew ? '/api/cuffiette-songs' : `/api/cuffiette-songs/${this.editingId()}`;
    const ok = await this.api.sendAuthenticatedJson(endpoint, payload, isNew ? 'POST' : 'PUT');
    if (!ok) {
      this.formError.set('Non è stato possibile salvare la canzone.');
      return;
    }

    this.editingId.set(null);
    await this.loadSongs();
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
    await this.api.sendAuthenticatedJson(`/api/cuffiette-songs/${id}`, {}, 'DELETE');
    this.deleteTargetId.set(null);
    await this.loadSongs();
  }

  protected async move(id: string, direction: 'up' | 'down'): Promise<void> {
    await this.api.sendAuthenticatedJson(`/api/cuffiette-songs/${id}/move`, { direction }, 'POST');
    await this.loadSongs();
  }
}
