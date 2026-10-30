import { Component, DestroyRef, OnDestroy, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CoopRoom } from './coop-room';
import { CoopState } from './coop-models';
import { SafeModeService } from '../../core/safe-mode.service';
import { AuthService } from '../../core/auth.service';
import { AppShell } from '../../shell/app-shell';
import { PetRoom, PetView } from './pet-room';

type Kind = 'trappole' | 'frequenze' | 'nuvola';
interface Actor { id: number; name: string; }
interface Challenge {
  id: string; title: string; creator: Actor; traps: number[]; status: 'open' | 'won' | 'lost' | 'cancelled';
  clues: Record<number, number>; rules?: number;
  attempt: { player: Actor; position: number; energy: number; steps: number[]; flags?: number[]; probed?: number | null } | null;
}
interface GameView extends PetView, CoopState {
  partner: string; challenges?: Challenge[];
}

@Component({
  selector: 'app-giochi-due', imports: [AppShell, RouterLink, FormsModule, PetRoom, CoopRoom],
  templateUrl: './giochi-due.html', styleUrl: './giochi-due.css'
})
export class GiochiDue implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly safe = inject(SafeModeService);
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
  protected readonly moveMode = signal<'move' | 'flag' | 'probe'>('move');
  protected readonly replay = signal(-1);
  protected readonly draft = signal<number[]>([]);
  protected readonly title = signal('');
  protected readonly cells = Array.from({ length: 25 }, (_, n) => n);
  protected readonly MathFloor = Math.floor;
  protected readonly tabs: { id: Kind; icon: string; name: string; description: string }[] = [
    { id: 'trappole', icon: '💣', name: 'Ti preparo una trappola', description: 'Nascondi le trappole. Vediamo chi arriva in fondo!' },
    { id: 'frequenze', icon: '📡', name: 'Sulla stessa frequenza', description: 'Una scatola da esplorare in due. E le prove di sempre.' },
    { id: 'nuvola', icon: '🐾', name: 'La casa degli animali', description: 'Uova, zampe e qualche disastro sul tappeto.' }
  ];
  protected readonly currentTab = computed(() => this.tabs.find(t => t.id === this.kind())!);
  protected readonly challenges = computed(() => this.data()?.challenges ?? []);
  protected readonly challenge = computed(() => this.challenges().find(c => c.id === this.selectedId())
    ?? this.challenges().find(c => c.status === 'open' && c.creator.id !== this.userId()) ?? this.challenges()[0]);
  protected readonly ownPending = computed(() => this.challenges().some(c => c.creator.id === this.userId() && c.status === 'open'));
  protected readonly isAdmin = computed(() => this.auth.isAdmin() && !this.safe.enabled());
  protected readonly adminModeEnabled = this.auth.adminModeEnabled;
  private generation = 0;
  private reading = false;
  private readError = '';
  private controller: AbortController | null = null;
  private pollTicks = 0;
  private readonly poll = setInterval(() => {
    const room = this.data()?.room;
    const exploring = room?.schema === 2 && room.puzzle?.type === 'machine';
    if ((++this.pollTicks % 3 === 0 || exploring) && !document.hidden && !this.busy()) void this.refresh();
  }, 1000);
  private readonly visibility = () => { if (!document.hidden) void this.refresh(); };

  constructor() {
    document.addEventListener('visibilitychange', this.visibility);
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const requested = this.route.snapshot.data['game'] ?? params.get('gioco');
      const next = this.tabs.find(t => t.id === requested)?.id ?? 'trappole';
      if (this.data() && next === this.kind()) return;
      this.generation++;
      this.controller?.abort(); this.reading = false;
      this.kind.set(next); this.data.set(null); this.error.set(''); this.notice.set('');
      this.selectedId.set(''); this.loading.set(true); this.busy.set(false);
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
      if (this.kind() === 'nuvola') {
        if (!['memory-flip', 'memory-start'].includes(type) || result.memory?.done) this.notice.set(result.events?.[0]?.text ?? 'Fatto!');
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
      this.notice.set('Sfida pronta. Resta qui anche se la giochiamo più tardi.');
    }
  }
  protected adjacent(a: number, b: number): boolean { return Math.abs(a - b) === 5 || (Math.floor(a / 5) === Math.floor(b / 5) && Math.abs(a - b) === 1); }
  protected canMove(c: Challenge, cell: number): boolean {
    if (this.busy() || c.status !== 'open' || c.attempt?.player.id !== this.userId()) return false;
    if (this.moveMode() === 'flag') return cell > 0 && cell < 24;
    if (this.moveMode() === 'probe') return c.rules === 2 && c.attempt.probed == null && cell > 0 && cell < 24 && this.adjacent(c.attempt.position, cell);
    return !c.attempt.flags?.includes(cell) && this.adjacent(c.attempt.position, cell);
  }
  protected async playCell(c: Challenge, cell: number): Promise<void> {
    if (await this.act(this.moveMode(), { id: c.id, cell })) { if (this.moveMode() === 'probe') this.moveMode.set('move'); }
  }
  protected position(c: Challenge): number { return c.status !== 'open' && this.replay() >= 0 ? c.attempt?.steps[this.replay() - 1] ?? 0 : c.attempt?.position ?? 0; }
  protected cellLabel(c: Challenge, cell: number): string {
    if (this.position(c) === cell) return '🚶';
    if (cell === 0) return '🚩';
    if (cell === 24) return '🏁';
    if (c.traps.includes(cell)) return '💣';
    if (c.attempt?.flags?.includes(cell)) return '🚩';
    return c.clues[cell] === undefined ? '' : String(c.clues[cell]);
  }
  protected status(c: Challenge): string {
    return ({ won: 'Percorso conquistato', lost: 'Trappola riuscita', cancelled: 'Ritirata', open: c.attempt ? 'In corso' : 'Da giocare' })[c.status];
  }
  ngOnDestroy(): void {
    this.generation++; this.controller?.abort(); clearInterval(this.poll);
    document.removeEventListener('visibilitychange', this.visibility);
  }
}
