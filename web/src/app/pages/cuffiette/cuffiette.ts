import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { TelemetryService } from '../../core/telemetry.service';
import { StaticContentService } from '../../core/static-content.service';
import { AppShell } from '../../shell/app-shell';
import { ContentMessage } from '../../shared/content-message/content-message';
import { AudioPlayer } from '../../shared/audio-player/audio-player';

interface Song {
  id: string;
  title: string;
  introduction: string;
  lyrics: string;
  key: string;
}

interface StolenWordItem {
  quote: string;
  source: string;
}

interface MusicData {
  playlist: { name: string; introduction: string; url: string };
  songsIntroduction: string;
  songs: Song[];
  bonus?: { available: boolean; key?: string };
  stolenWords: { introduction: string; items: StolenWordItem[] };
}

// Porting di assets/js/music/main.js: stessa fonte dati (content/music.json), stessa
// validazione (9 canzoni). Il player SoundCloud è stato sostituito da AudioPlayer (mp3
// propri su R2, via /api/media/<key>): stesso principio "mai autoplay, niente scarica finché
// l'utente non preme play" ma senza più dipendere da un servizio esterno.
@Component({
  selector: 'app-cuffiette',
  standalone: true,
  imports: [AppShell, ContentMessage, RouterLink, AudioPlayer],
  styleUrls: ['../../../styles/pages/music.css'],
  templateUrl: './cuffiette.html'
})
export class Cuffiette implements OnInit {
  private readonly staticContent = inject(StaticContentService);
  private readonly telemetryService = inject(TelemetryService);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly data = signal<MusicData | null>(null);
  protected readonly loadError = signal(false);
  protected readonly bonusUrl = computed(() => {
    const bonus = this.data()?.bonus;
    return bonus?.available && bonus.key ? `/api/media/${bonus.key}` : null;
  });

  protected readonly songsIntroductionHtml = computed<SafeHtml>(() => {
    const text = this.data()?.songsIntroduction ?? '';
    return this.sanitizer.bypassSecurityTrustHtml(this.renderSongsIntroduction(text));
  });

  async ngOnInit(): Promise<void> {
    try {
      const data = await this.staticContent.load<MusicData>('/content/music.json');
      if (data.songs?.length !== 9 || !Array.isArray(data.stolenWords?.items)) {
        throw new Error('Contenuto musicale incompleto');
      }
      this.data.set(data);
    } catch (error) {
      console.error('Errore nel caricamento delle Cuffiette:', error);
      this.loadError.set(true);
    }
  }

  protected songUrl(song: Song): string {
    return `/api/media/${song.key}`;
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

  // Collega il rimando a "I Ponti", ora che la pagina esiste.
  private renderSongsIntroduction(text: string): string {
    const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return escaped.replace(/\[\s*🌈\s*I Ponti\s*\]/, '<a class="music-inline-mark" href="/ponti">🌈 I Ponti</a>');
  }
}
