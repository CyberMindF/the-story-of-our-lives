import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild, computed, signal } from '@angular/core';

// Player audio condiviso (Cuffiette, Bacheca, Storie, Mappamondo, Mondo Bianco): sostituisce
// gli embed SoundCloud/YouTube e l'<audio controls> nativo con un'unica UI coerente coi temi.
// preload="none" sull'<audio>: niente scarica finché non si preme play (o non parte l'autoplay
// esplicitamente richiesto per una singola traccia), stesso principio di "mai player attivi
// finché non richiesto" già in uso qui.
@Component({
  selector: 'app-audio-player',
  standalone: true,
  styleUrls: ['../../../styles/components/audio-player.css'],
  templateUrl: './audio-player.html'
})
export class AudioPlayer implements AfterViewInit {
  @Input({ required: true }) src!: string;
  @Input() label = 'traccia audio';

  // Avvio automatico in sottofondo (usato solo per "Il Cerchio" nel Mondo Bianco): i browser
  // bloccano l'autoplay con audio prima di un'interazione dell'utente sul sito, quindi questo
  // è un tentativo "best effort" — se il browser lo rifiuta, resta semplicemente in pausa
  // pronto per un click, nessun errore visibile.
  @Input() autoplay = false;
  @Input() initialVolume = 1;
  // Personalizzabile per contesto (es. un cuore per Le Cuffiette, una nota per un'altra
  // pagina): di default il cerchio, il motivo ricorrente del sito.
  @Input() seekThumb = '⭕';

  // Emesso una sola volta, al primo play reale (non ad ogni ripresa dopo pausa) — stesso
  // schema di bonusPlayTracked in cuffiette.ts, spostato qui per non ripeterlo per canzone.
  @Output() readonly played = new EventEmitter<void>();
  @Output() readonly completed = new EventEmitter<void>();

  @ViewChild('audioEl') private readonly audioRef!: ElementRef<HTMLAudioElement>;

  protected readonly playing = signal(false);
  protected readonly currentTime = signal(0);
  protected readonly duration = signal(0);
  protected readonly volume = signal(1);
  protected readonly muted = signal(false);

  // Posizione (in %) dell'emoji ⭕ sovrapposta alla barra di scorrimento nativa — l'input
  // range resta invariato sotto (trascinabile, accessibile da tastiera), il cerchio è solo
  // un overlay visivo che segue lo stesso valore.
  protected readonly seekPercent = computed(() => {
    const total = this.duration();
    return total > 0 ? (this.currentTime() / total) * 100 : 0;
  });

  private hasTrackedPlay = false;

  ngAfterViewInit(): void {
    const audio = this.audioRef.nativeElement;
    const startVolume = Math.min(1, Math.max(0, this.initialVolume));
    audio.volume = startVolume;
    this.volume.set(startVolume);

    if (this.autoplay) {
      audio.play().catch(() => {
        // Bloccato dalla policy autoplay del browser: resta in pausa, nessun problema.
      });
    }
  }

  protected toggle(): void {
    const audio = this.audioRef.nativeElement;
    if (audio.paused) {
      void audio.play();
    } else {
      audio.pause();
    }
  }

  protected onSeek(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.audioRef.nativeElement.currentTime = value;
    this.currentTime.set(value);
  }

  protected onVolumeChange(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    const audio = this.audioRef.nativeElement;
    audio.volume = value;
    audio.muted = value === 0;
    this.volume.set(value);
    this.muted.set(audio.muted);
  }

  protected toggleMute(): void {
    const audio = this.audioRef.nativeElement;
    audio.muted = !audio.muted;
    this.muted.set(audio.muted);
  }

  protected onLoadedMetadata(): void {
    this.duration.set(this.audioRef.nativeElement.duration || 0);
  }

  protected onTimeUpdate(): void {
    this.currentTime.set(this.audioRef.nativeElement.currentTime);
  }

  protected onPlay(): void {
    this.playing.set(true);
    if (!this.hasTrackedPlay) {
      this.hasTrackedPlay = true;
      this.played.emit();
    }
  }

  protected onPause(): void {
    this.playing.set(false);
  }

  protected onEnded(): void {
    this.playing.set(false);
    this.completed.emit();
  }

  protected formatTime(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds < 0) {
      return '0:00';
    }
    const total = Math.floor(seconds);
    const minutes = Math.floor(total / 60);
    const secs = total % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}
