import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, Output, ViewChild, computed, signal } from '@angular/core';

type AudioPlayerSize = 'compact' | 'default' | 'large';
type AudioPlayerLayout = 'line' | 'card';

// Copertina di default per qualunque traccia senza un'immagine propria: lo stesso cerchio
// dorato con rose e fuoco della favicon/del Portone, non un'icona generica.
const DEFAULT_COVER = 'assets/images/components/audio-default-cover.webp';

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
export class AudioPlayer implements AfterViewInit, OnDestroy {
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
  @Input() size: AudioPlayerSize = 'default';
  // "line" è la pillola orizzontale compatta di prima (liste come le Cuffiette); "card" è
  // una versione verticale con copertina grande in cima, pensata per un unico player messo
  // in risalto (es. l'apertura del Mondo Bianco), non per elenchi di più tracce.
  @Input() layout: AudioPlayerLayout = 'line';
  @Input() cover: string = DEFAULT_COVER;
  // Onda sonora reale (Web Audio API), non un'animazione finta: creata solo al primo play
  // effettivo, mai per player mai avviati — evitiamo AudioContext inutili se questa pagina
  // ne ha molti (es. le 9 canzoni delle Cuffiette).
  @Input() showWaveform = false;

  // Emesso una sola volta, al primo play reale (non ad ogni ripresa dopo pausa) — stesso
  // schema di bonusPlayTracked in cuffiette.ts, spostato qui per non ripeterlo per canzone.
  @Output() readonly played = new EventEmitter<void>();
  @Output() readonly completed = new EventEmitter<void>();

  @ViewChild('audioEl') private readonly audioRef!: ElementRef<HTMLAudioElement>;
  @ViewChild('waveCanvas') private readonly waveCanvasRef?: ElementRef<HTMLCanvasElement>;

  protected readonly playing = signal(false);
  // Vero tra il click su play e il "play" reale del browser (buffering) — mentre è così un
  // secondo click viene ignorato invece di mettere in pausa una riproduzione che non è mai
  // partita: era la causa del "sembra che non parta" su pagine con tante risorse in corso.
  protected readonly loading = signal(false);
  protected readonly currentTime = signal(0);
  protected readonly duration = signal(0);
  protected readonly volume = signal(1);
  protected readonly muted = signal(false);
  // Mentre è vero, l'emoji overlay segue il dito/mouse 1:1 (nessuna transizione CSS): la
  // transizione "left 120ms" serve solo ad ammorbidire i piccoli scatti di timeupdate durante
  // la riproduzione normale, ma durante un trascinamento reale la faceva inseguire il cursore
  // sempre in ritardo, dando la sensazione che il trascinamento "non funzionasse".
  protected readonly seeking = signal(false);

  // Posizione (in %) dell'emoji ⭕ sovrapposta alla barra di scorrimento nativa — l'input
  // range resta invariato sotto (trascinabile, accessibile da tastiera), il cerchio è solo
  // un overlay visivo che segue lo stesso valore.
  protected readonly seekPercent = computed(() => {
    const total = this.duration();
    return total > 0 ? (this.currentTime() / total) * 100 : 0;
  });

  private hasTrackedPlay = false;

  private audioCtx?: AudioContext;
  private analyser?: AnalyserNode;
  private sourceNode?: MediaElementAudioSourceNode;
  private waveformFrame?: number;
  private waveformResizeObserver?: ResizeObserver;

  ngAfterViewInit(): void {
    const audio = this.audioRef.nativeElement;
    const startVolume = Math.min(1, Math.max(0, this.initialVolume));
    audio.volume = startVolume;
    this.volume.set(startVolume);

    if (this.autoplay) {
      this.loading.set(true);
      audio.play().catch(() => {
        // Bloccato dalla policy autoplay del browser: resta in pausa, nessun problema.
        this.loading.set(false);
      });
    }
  }

  ngOnDestroy(): void {
    this.stopWaveformLoop();
    void this.audioCtx?.close();
  }

  protected toggle(): void {
    const audio = this.audioRef.nativeElement;
    if (this.loading()) {
      return;
    }
    if (audio.paused) {
      this.loading.set(true);
      audio.play().catch(() => {
        this.loading.set(false);
      });
    } else {
      audio.pause();
    }
  }

  protected onSeek(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.audioRef.nativeElement.currentTime = value;
    this.currentTime.set(value);
  }

  protected onSeekPointerDown(): void {
    this.seeking.set(true);
  }

  // Non basta (pointerup) sull'input: durante un trascinamento reale il mouse esce quasi
  // sempre dai bordi della barra (larga poche decine di px) prima che il tasto venga
  // rilasciato, e l'evento sull'input specifico non arriva mai — "seeking" restava bloccato
  // a true per sempre. Ascoltando tutta la finestra il rilascio si intercetta comunque.
  @HostListener('window:pointerup')
  @HostListener('window:pointercancel')
  protected onWindowPointerUp(): void {
    this.seeking.set(false);
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
    this.loading.set(false);
    if (this.showWaveform) {
      this.ensureAnalyser();
      void this.audioCtx?.resume();
      this.startWaveformLoop();
    }
    if (!this.hasTrackedPlay) {
      this.hasTrackedPlay = true;
      this.played.emit();
    }
  }

  protected onPause(): void {
    this.playing.set(false);
    this.stopWaveformLoop();
  }

  protected onEnded(): void {
    this.playing.set(false);
    this.stopWaveformLoop();
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

  // createMediaElementSource si può chiamare una sola volta per elemento <audio> in tutta la
  // sua vita: da qui in poi l'uscita audio passa SEMPRE dal grafo Web Audio, per questo
  // analyser viene comunque ricollegato a destination (altrimenti l'audio ammutolirebbe).
  private ensureAnalyser(): void {
    if (!this.showWaveform || this.analyser) {
      return;
    }
    const AudioContextCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.audioCtx = new AudioContextCtor();
    this.sourceNode = this.audioCtx.createMediaElementSource(this.audioRef.nativeElement);
    this.analyser = this.audioCtx.createAnalyser();
    // 128 invece di 64: il doppio delle barre, più sottili — molto più vicino a un'onda
    // sonora vera che a un equalizzatore a blocchi radi.
    this.analyser.fftSize = 128;
    this.sourceNode.connect(this.analyser);
    this.analyser.connect(this.audioCtx.destination);
  }

  private startWaveformLoop(): void {
    const canvas = this.waveCanvasRef?.nativeElement;
    if (!this.analyser || !canvas) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    const analyser = this.analyser;
    const data = new Uint8Array(analyser.frequencyBinCount);
    // Il colore reale lo decide il CSS (color sul canvas stesso, "currentColor" nel markup),
    // letto qui una volta sola: resta coerente col tema/contesto senza hardcodare colori.
    const color = getComputedStyle(canvas).color;

    // Gli attributi width/height dell'HTML fissavano la risoluzione del bitmap una volta per
    // tutte: a zoom del browser diverso da 100% (che alza devicePixelRatio) o su schermi
    // retina il canvas veniva comunque disegnato a quella risoluzione fissa e poi ingrandito
    // via CSS, risultando sgranato. Qui invece la risoluzione reale del bitmap segue sempre
    // la dimensione a schermo dell'elemento moltiplicata per devicePixelRatio, ricalcolata a
    // ogni cambio di layout/zoom tramite ResizeObserver (che su Chrome/Safari si attiva anche
    // solo per un cambio di devicePixelRatio dovuto allo zoom, senza bisogno di un resize
    // della finestra).
    let width = 0;
    let height = 0;
    let slot = 0;
    let barWidth = 0;
    let radius = 0;
    let minBarHeight = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width * dpr));
      height = Math.max(1, Math.round(rect.height * dpr));
      canvas.width = width;
      canvas.height = height;
      // Barre sottili con un vero spazio tra loro (60% pieno, 40% vuoto) invece di blocchi
      // pieni attaccati: risultato molto meno "invadente" — era la lamentela principale sulla
      // prima versione, oltre alla fascia troppo alta (rifinita separatamente in CSS).
      slot = width / data.length;
      barWidth = Math.max(1, slot * 0.6);
      radius = Math.min(barWidth / 2, 2);
      minBarHeight = 2 * dpr;
    };
    resize();
    this.waveformResizeObserver = new ResizeObserver(resize);
    this.waveformResizeObserver.observe(canvas);

    const draw = () => {
      analyser.getByteFrequencyData(data);
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = color;
      const centerY = height / 2;
      // Un po' di margine sopra e sotto invece di toccare i bordi del canvas: le barre più
      // alte restano "dentro" la pillola invece di sembrare tagliate.
      const maxBarHeight = height - minBarHeight * 2;
      for (let i = 0; i < data.length; i += 1) {
        // Un'onda vera, non un equalizzatore a blocchi: le barre crescono dal centro verso
        // l'alto e il basso (non solo dal basso), e un dolce inviluppo a seno le smorza verso
        // i due estremi — il risultato somiglia a una forma d'onda continua invece che a un
        // muro di barre tutte uguali che finisce di netto ai bordi.
        const envelope = 0.5 + 0.5 * Math.sin((Math.PI * (i + 0.5)) / data.length);
        const barHeight = Math.max(minBarHeight, (data[i] / 255) * maxBarHeight * envelope);
        const x = i * slot + (slot - barWidth) / 2;
        const y = centerY - barHeight / 2;
        ctx.globalAlpha = 0.5 + 0.5 * envelope;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, radius);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      this.waveformFrame = requestAnimationFrame(draw);
    };
    draw();
  }

  private stopWaveformLoop(): void {
    if (this.waveformFrame !== undefined) {
      cancelAnimationFrame(this.waveformFrame);
      this.waveformFrame = undefined;
    }
    this.waveformResizeObserver?.disconnect();
    this.waveformResizeObserver = undefined;
    const canvas = this.waveCanvasRef?.nativeElement;
    canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
  }
}
