import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';
import { TelemetryService } from '../../core/telemetry.service';
import { StaticContentService } from '../../core/static-content.service';
import { AppShell } from '../../shell/app-shell';
import { ContentMessage } from '../../shared/content-message/content-message';

interface Song {
  id: string;
  title: string;
  introduction: string;
  lyrics: string;
  soundcloudUrl: string;
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

// Porting fedele di assets/js/music/main.js: stessa fonte dati (content/music.json), stessa
// validazione (9 canzoni), stesso player SoundCloud caricato solo al click (mai autoplay,
// mai player attivi finché l'utente non li richiede esplicitamente), stesso audio bonus
// servito sempre dall'endpoint autenticato /api/media/<key>, mai da un percorso statico.
@Component({
  selector: 'app-cuffiette',
  standalone: true,
  imports: [AppShell, ContentMessage],
  styleUrls: ['../../../styles/pages/music.css'],
  templateUrl: './cuffiette.html'
})
export class Cuffiette implements OnInit {
  private readonly staticContent = inject(StaticContentService);
  private readonly telemetryService = inject(TelemetryService);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly data = signal<MusicData | null>(null);
  protected readonly loadError = signal(false);
  protected readonly playingSongIds = signal<ReadonlySet<string>>(new Set());
  protected readonly bonusRevealed = signal(false);
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

  // Crea il player SoundCloud soltanto dopo il click esplicito dell'utente (mai autoplay).
  protected loadPlayer(song: Song): void {
    this.playingSongIds.update((current) => new Set(current).add(song.id));
    void this.telemetryService.trackEvent('music', 'song_played', { songId: song.id });
  }

  protected isPlaying(songId: string): boolean {
    return this.playingSongIds().has(songId);
  }

  // Stesso pattern delle canzoni: il player compare solo dopo un click esplicito, mai da solo.
  protected revealBonusPlayer(): void {
    this.bonusRevealed.set(true);
  }

  // iframe[src] è in RESOURCE_URL context per Angular: senza bypassSecurityTrustResourceUrl
  // il binding verrebbe bloccato del tutto (errore di sicurezza), non solo "ripulito" come
  // per un normale attributo url. L'URL resta comunque costruito da noi, non da input utente.
  protected soundcloudSrc(song: Song): SafeResourceUrl {
    const url = `https://w.soundcloud.com/player/?url=${encodeURIComponent(song.soundcloudUrl)}&color=%23d8c8a8&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&visual=false`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  protected onPlaylistLinkClick(): void {
    void this.telemetryService.trackEvent('music', 'playlist_link_clicked', {});
  }

  // { once: true } nell'originale: si traccia solo il primo play, non ogni ripresa dopo pausa.
  private bonusPlayTracked = false;

  protected onBonusPlay(): void {
    if (this.bonusPlayTracked) {
      return;
    }
    this.bonusPlayTracked = true;
    void this.telemetryService.trackEvent('music', 'song_played', { bonus: true });
  }

  protected onBonusEnded(): void {
    void this.telemetryService.trackEvent('music', 'song_completed', { bonus: true });
  }

  // Collega il rimando a "I Ponti", ora che la pagina esiste.
  private renderSongsIntroduction(text: string): string {
    const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return escaped.replace(/\[\s*🌈\s*I Ponti\s*\]/, '<a class="music-inline-mark" href="/ponti">🌈 I Ponti</a>');
  }
}
