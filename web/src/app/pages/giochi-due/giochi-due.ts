import { Component, DestroyRef, OnDestroy, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../core/auth.service';
import { AppShell } from '../../shell/app-shell';

type Kind = 'trappole' | 'frequenze' | 'nuvola';
interface Actor { id: number; name: string; }
interface Challenge {
  id: string; title: string; creator: Actor; traps: number[]; status: 'open' | 'won' | 'lost' | 'cancelled';
  clues: Record<number, number>;
  attempt: { player: Actor; position: number; energy: number; steps: number[] } | null;
}
interface Room {
  id: string; owner: Actor; partner: Actor | null; status: string; round: number; errors: number;
  role: 'explorer' | 'guide'; ready: boolean; sequence: string[];
  legend: { symbol: string; number: number }[]; lastWrong: boolean;
  instruction: string | null;
}
interface GameView {
  version: number; partner: string; challenges?: Challenge[]; room?: Room | null;
  history?: { id: string; status: string; errors: number; at: number }[];
  name?: string; affection?: number; decor?: string; myCare?: string[];
  events?: { actor: string; type: string; at: number }[];
}

@Component({
  selector: 'app-giochi-due', imports: [AppShell, RouterLink, FormsModule, DatePipe],
  templateUrl: './giochi-due.html', styleUrl: './giochi-due.css'
})
export class GiochiDue implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly userId = computed(() => this.auth.currentUser()?.id ?? 0);
  protected readonly kind = signal<Kind>('trappole');
  protected readonly data = signal<GameView | null>(null);
  protected readonly busy = signal(false);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly notice = signal('');
  protected readonly selectedId = signal('');
  protected readonly draft = signal<number[]>([]);
  protected readonly title = signal('');
  protected readonly code = signal('');
  protected readonly petName = signal('');
  protected readonly animation = signal('');
  protected readonly cells = Array.from({ length: 25 }, (_, n) => n);
  protected readonly MathFloor = Math.floor;
  protected readonly numbers = [1, 2, 3, 4, 5, 6, 7, 8];
  protected readonly tabs: { id: Kind; icon: string; name: string; description: string }[] = [
    { id: 'trappole', icon: '✦', name: 'Ti preparo una trappola', description: 'Una sfida da lasciare all’altra persona.' },
    { id: 'frequenze', icon: '⌁', name: 'Sulla stessa frequenza', description: 'Due schermi. Metà indizi a testa. Una sola soluzione.' },
    { id: 'nuvola', icon: '♡', name: 'Il nostro piccolo rifugio', description: 'Un gatto, un posto tranquillo, tutte le vostre coccole.' }
  ];
  protected readonly currentTab = computed(() => this.tabs.find(t => t.id === this.kind())!);
  protected readonly challenges = computed(() => this.data()?.challenges ?? []);
  protected readonly challenge = computed(() => this.challenges().find(c => c.id === this.selectedId())
    ?? this.challenges().find(c => c.status === 'open' && c.creator.id !== this.userId()) ?? this.challenges()[0]);
  protected readonly ownPending = computed(() => this.challenges().some(c => c.creator.id === this.userId() && c.status === 'open'));
  protected readonly room = computed(() => this.data()?.room);
  protected readonly affection = computed(() => this.data()?.affection ?? 0);
  protected readonly care = computed(() => this.data()?.myCare ?? []);
  protected readonly decorations = [
    { id: 'base', name: 'La finestra', icon: '☁', needed: 0 },
    { id: 'plant', name: 'Una piantina', icon: '🌱', needed: 3 },
    { id: 'cushion', name: 'Cuscino morbido', icon: '🧶', needed: 6 },
    { id: 'stars', name: 'Cielo stellato', icon: '✨', needed: 12 }
  ];
  protected readonly careActions = [
    { id: 'coccola', name: 'Una coccola', icon: '♡' },
    { id: 'snack', name: 'Uno spuntino', icon: '◒' },
    { id: 'gioca', name: 'Giochiamo!', icon: '⚽' }
  ];
  private generation = 0;
  private reading = false;
  private readError = '';
  private controller: AbortController | null = null;
  private animationTimer?: ReturnType<typeof setTimeout>;
  private readonly poll = setInterval(() => { if (!document.hidden && !this.busy()) void this.refresh(); }, 3000);
  private readonly visibility = () => { if (!document.hidden) void this.refresh(); };

  constructor() {
    document.addEventListener('visibilitychange', this.visibility);
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const requested = params.get('gioco');
      const next = this.tabs.find(t => t.id === requested)?.id ?? 'trappole';
      if (this.data() && next === this.kind()) return;
      this.generation++;
      this.controller?.abort(); this.reading = false;
      this.kind.set(next); this.data.set(null); this.error.set(''); this.notice.set('');
      this.code.set(''); this.selectedId.set(''); this.loading.set(true); this.busy.set(false);
      void this.refresh();
    });
  }

  protected async refresh(): Promise<void> {
    if (this.reading || this.busy()) return;
    const generation = this.generation;
    this.reading = true;
    this.controller = new AbortController();
    try {
      const response = await fetch(`/api/giochi-due/${this.kind()}`, { signal: this.controller.signal });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Non riesco ad aggiornare la partita.');
      if (generation !== this.generation) return;
      this.accept(result);
      // Gli errori di un’azione rimangono visibili; solo quelli di caricamento si cancellano.
      if (this.loading() || this.error() === this.readError) this.error.set('');
      this.readError = '';
    } catch (e) {
      if (generation === this.generation && !(e instanceof DOMException && e.name === 'AbortError')) {
        this.readError = e instanceof Error ? e.message : 'Connessione interrotta. Riprova.';
        this.error.set(this.readError);
      }
    } finally {
      if (generation === this.generation) { this.reading = false; this.loading.set(false); }
    }
  }

  private accept(result: GameView): void {
    if (result.version < (this.data()?.version ?? -1)) return;
    if (result.room?.round !== this.room()?.round || result.room?.id !== this.room()?.id) this.code.set('');
    if (result.name && (!this.data() || this.petName() === this.data()?.name)) this.petName.set(result.name);
    this.data.set(result);
  }

  protected async act(type: string, extra: Record<string, unknown> = {}): Promise<boolean> {
    if (this.busy() || !this.data()) return false;
    const generation = this.generation;
    this.busy.set(true); this.error.set(''); this.notice.set('');
    try {
      const response = await fetch(`/api/giochi-due/${this.kind()}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...extra, type, version: this.data()!.version, requestId: crypto.randomUUID() })
      });
      const result = await response.json();
      if (generation !== this.generation) return false;
      if (!response.ok) throw new Error(result.error || 'Operazione non riuscita.');
      this.accept(result);
      if (type === 'answer') this.code.set('');
      if (this.kind() === 'nuvola') {
        this.animation.set(type);
        clearTimeout(this.animationTimer);
        this.animationTimer = setTimeout(() => this.animation.set(''), 2400);
        this.notice.set(({ coccola: 'Si è avvicinato alla tua mano. Prrrr…', snack: 'Spuntino approvato. Si lecca i baffi!', gioca: 'Un agguato alla pallina. Presa!', rename: 'Il suo nome è aggiornato per entrambi.', decorate: 'Il rifugio ha un nuovo dettaglio.' } as Record<string, string>)[type] ?? 'Salvato.');
      }
      return true;
    } catch (e) {
      if (generation === this.generation) this.error.set(e instanceof Error ? e.message : 'Connessione interrotta.');
      return false;
    } finally {
      if (generation === this.generation) { this.busy.set(false); void this.refresh(); }
    }
  }

  protected toggleTrap(cell: number): void {
    if (cell === 0 || cell === 24 || this.busy()) return;
    this.draft.update(current => current.includes(cell) ? current.filter(n => n !== cell) : current.length < 6 ? [...current, cell] : current);
  }
  protected async publish(): Promise<void> {
    if (await this.act('create', { traps: this.draft(), title: this.title() })) {
      this.draft.set([]); this.title.set(''); this.selectedId.set(this.challenges()[0]?.id ?? '');
      this.notice.set('Sfida pronta. L’altra persona la troverà qui, anche più tardi.');
    }
  }
  protected adjacent(a: number, b: number): boolean { return Math.abs(a - b) === 5 || (Math.floor(a / 5) === Math.floor(b / 5) && Math.abs(a - b) === 1); }
  protected canMove(c: Challenge, cell: number): boolean {
    return !this.busy() && c.status === 'open' && c.attempt?.player.id === this.userId() && this.adjacent(c.attempt.position, cell);
  }
  protected cellLabel(c: Challenge, cell: number): string {
    if (c.attempt?.position === cell) return '●';
    if (cell === 0) return '↗';
    if (cell === 24) return '✦';
    if (c.traps.includes(cell)) return '✕';
    return c.clues[cell] === undefined ? '' : String(c.clues[cell]);
  }
  protected status(c: Challenge): string {
    return ({ won: 'Percorso conquistato', lost: 'Trappola riuscita', cancelled: 'Ritirata', open: c.attempt ? 'In corso' : 'Da giocare' })[c.status];
  }
  protected digit(value: number): void { if (this.code().length < (this.room()?.round ?? 0) + 4) this.code.update(s => s + value); }
  protected async cancelRoom(id: string): Promise<void> {
    if (confirm('Chiudere questa partita per entrambi? Potrete iniziarne una nuova.')) await this.act('cancel', { id });
  }
  protected eventText(type: string): string {
    return ({ coccola: 'ha fatto una coccola', snack: 'ha portato uno spuntino', gioca: 'ha giocato con la pallina', rename: 'ha scelto un nuovo nome', decorate: 'ha arredato il rifugio' } as Record<string, string>)[type] ?? type;
  }
  ngOnDestroy(): void {
    this.generation++; this.controller?.abort(); clearInterval(this.poll); clearTimeout(this.animationTimer);
    document.removeEventListener('visibilitychange', this.visibility);
  }
}
