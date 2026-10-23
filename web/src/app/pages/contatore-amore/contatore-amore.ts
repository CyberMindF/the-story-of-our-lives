import { Component, ElementRef, HostListener, OnDestroy, computed, effect, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppShell } from '../../shell/app-shell';
import { CounterState, Episode, localDateTime, scoreColor, statistics, timeline } from './counter-model';
import { EXTRA_RULES, PHRASES, RULES } from './counter-copy';

@Component({
  selector: 'app-contatore-amore', standalone: true, imports: [AppShell, FormsModule, DatePipe],
  templateUrl: './contatore-amore.html', styleUrl: './contatore-amore.css',
})
export class ContatoreAmore implements OnDestroy {
  readonly state = signal<CounterState | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly notice = signal('');
  readonly phrase = signal(PHRASES[Math.floor(Math.random() * PHRASES.length)]);
  readonly rules = RULES;
  readonly extraRules = EXTRA_RULES;
  readonly stats = computed(() => this.state() ? statistics(this.state()!) : null);
  readonly color = computed(() => scoreColor(this.stats()?.current ?? 20, this.state()?.settings.initialScore ?? 20));
  readonly liquidLevel = computed(() => {
    const current = this.stats()?.current ?? 0;
    const initial = this.state()?.settings.initialScore ?? 20;
    const reference = initial > 0 ? initial : 20;
    return Math.max(0, Math.min(100, current / reference * 100));
  });
  readonly scoreFontSize = computed(() => Math.min(88, 180 / (String(this.stats()?.current ?? 20).length * .65)));
  readonly points = computed(() => this.state() ? timeline(this.state()!) : []);
  readonly selectedId = signal('initial');
  readonly selectedPoint = computed(() => this.points().find(p => p.id === this.selectedId()) ?? this.points().at(-1));
  readonly visibleCount = signal(25);
  readonly history = computed(() => [...(this.state()?.episodes ?? [])].reverse().slice(0, this.visibleCount()));
  readonly editing = signal<Episode | null>(null);
  readonly deleting = signal<Episode | null>(null);
  readonly copiedEpisodeId = signal<string | null>(null);
  readonly openEpisodeMenuId = signal<string | null>(null);
  readonly pendingQuick = signal<{ id: string; delta: number } | null>(null);
  reason = '';
  psychologistComment = '';
  editDate = '';
  editDelta = 1;
  initialScore = 20;
  private readonly plot = viewChild<ElementRef<HTMLElement>>('plot');
  private readonly plotWidth = signal(640);
  private copyResetTimer: ReturnType<typeof setTimeout> | null = null;
  readonly chart = computed(() => {
    const points = this.points(), width = this.plotWidth(), height = 260;
    const totals = points.map(p => p.total);
    const min = Math.min(0, ...totals), max = Math.max(1, ...totals), pad = Math.max(1, (max - min) * .12);
    const low = min - pad, high = max + pad;
    const from = points[0]?.time ?? Date.now(), to = points.at(-1)?.time ?? from;
    const span = Math.max(1, to - from);
    const start = points.length === 1 ? from - .5 : from - span * .03;
    const end = points.length === 1 ? from + .5 : from + span * 1.03;
    const y = (value: number) => 16 + (high - value) / (high - low) * (height - 40);
    const plotted = points.map(p => ({ ...p, x: 42 + (p.time - start) / (end - start) * (width - 58), y: y(p.total) }));
    return { width, height, points: plotted, line: plotted.map(p => `${p.x},${p.y}`).join(' '), zero: y(0),
      ticks: [...new Set([min, Math.round((min + max) / 2), max])].map(value => ({ value, y: y(value), label: new Intl.NumberFormat('it', { notation: 'compact', maximumFractionDigits: 1 }).format(value) })),
      from, to, timeFormat: to - from < 60000 ? 'dd/MM/yy HH:mm:ss' : 'dd/MM/yy HH:mm' };
  });

  constructor() {
    effect(onCleanup => {
      const element = this.plot()?.nativeElement;
      if (!element) return;
      const observer = new ResizeObserver(entries => this.plotWidth.set(Math.max(240, entries[0].contentRect.width)));
      observer.observe(element);
      onCleanup(() => observer.disconnect());
    });
    void this.load();
  }

  signed(value: number): string { return value > 0 ? `+${value}` : String(value).replace('-', '−'); }

  ngOnDestroy(): void {
    if (this.copyResetTimer) clearTimeout(this.copyResetTimer);
  }

  @HostListener('document:click')
  @HostListener('document:keydown.escape')
  closeEpisodeMenu(): void {
    this.openEpisodeMenuId.set(null);
  }

  toggleEpisodeMenu(event: Event, episodeId: string): void {
    event.stopPropagation();
    this.openEpisodeMenuId.update((current) => current === episodeId ? null : episodeId);
  }

  async load(): Promise<void> {
    if (this.busy()) return;
    this.loading.set(true); this.error.set('');
    try {
      const state = await this.request('GET');
      this.accept(state); this.selectedId.set(this.points().at(-1)?.id ?? 'initial');
      this.editing.set(null); this.deleting.set(null);
    } catch (error) { this.error.set((error as Error).message); }
    finally { this.loading.set(false); }
  }

  async quick(delta: number): Promise<void> {
    if (this.busy() || this.pendingQuick()) return;
    this.pendingQuick.set({ id: crypto.randomUUID(), delta });
    await this.retryQuick();
  }

  async retryQuick(): Promise<void> {
    const pending = this.pendingQuick();
    if (!pending || this.busy()) return;
    if (await this.mutate('POST', pending)) {
      this.selectedId.set(pending.id); this.pendingQuick.set(null);
      const alternatives = PHRASES.filter(p => p !== this.phrase());
      this.phrase.set(alternatives[Math.floor(Math.random() * alternatives.length)]);
    }
  }

  startEdit(episode: Episode): void {
    this.editing.set(episode); this.reason = episode.reason; this.psychologistComment = episode.psychologistComment ?? ''; this.editDelta = episode.delta;
    this.editDate = localDateTime(episode.occurredAt); this.error.set(''); this.notice.set('');
  }

  async saveEdit(): Promise<void> {
    const episode = this.editing();
    if (!episode) return;
    const entered = this.editDate.length === 16 ? this.editDate + ':00' : this.editDate;
    const date = new Date(entered);
    if (!entered || !Number.isFinite(date.getTime()) || localDateTime(date.toISOString()) !== entered) {
      this.error.set('Inserisci una data e un’ora locale valide (controlla anche il cambio dell’ora).'); return;
    }
    // Conserva l'istante esatto se l'utente modifica soltanto testo/punteggio (anche durante il cambio DST).
    const occurredAt = entered === localDateTime(episode.occurredAt) ? episode.occurredAt : date.toISOString();
    if (await this.mutate('PATCH', {
      id: episode.id,
      revision: episode.revision,
      delta: Number(this.editDelta),
      reason: this.reason,
      psychologistComment: this.psychologistComment,
      occurredAt,
    })) this.editing.set(null);
  }

  async remove(): Promise<void> {
    const episode = this.deleting();
    if (!episode) return;
    if (await this.mutate('DELETE', { id: episode.id, revision: episode.revision })) {
      this.deleting.set(null);
      if (this.editing()?.id === episode.id) this.editing.set(null);
    }
  }

  async copyEpisode(episode: Episode): Promise<void> {
    const [date, time] = localDateTime(episode.occurredAt).split('T');
    const [year, month, day] = date.split('-');
    const lines = [
      `Data e ora: ${day}/${month}/${year} · ${time}`,
      `Punteggio: ${this.signed(episode.delta)}`,
      `Motivazione: ${episode.reason.trim() || 'Nessuna motivazione'}`,
    ];
    const psychologistComment = episode.psychologistComment?.trim();
    if (psychologistComment) lines.push(`Commento dello psicologo (chat): ${psychologistComment}`);
    const text = lines.join('\n');
    try {
      await navigator.clipboard.writeText(text);
      this.copiedEpisodeId.set(episode.id);
      if (this.copyResetTimer) clearTimeout(this.copyResetTimer);
      this.copyResetTimer = setTimeout(() => this.copiedEpisodeId.set(null), 1800);
    } catch {
      this.error.set('Non sono riuscito a copiare questo episodio. Riprova.');
    }
  }

  async saveSettings(): Promise<void> {
    const state = this.state();
    if (!state) return;
    if (!Number.isSafeInteger(this.initialScore)) { this.error.set('Inserisci un punteggio iniziale intero.'); return; }
    await this.mutate('PATCH', { action: 'settings', initialScore: this.initialScore, revision: state.settings.revision });
  }

  selectAdjacent(direction: number): void {
    const points = this.points(), index = points.findIndex(p => p.id === this.selectedPoint()?.id);
    this.selectedId.set(points[Math.max(0, Math.min(points.length - 1, index + direction))].id);
  }

  private accept(state: CounterState): void { this.state.set(state); this.initialScore = state.settings.initialScore; }

  private async mutate(method: string, body: unknown): Promise<boolean> {
    if (this.busy()) return false;
    this.busy.set(true); this.error.set(''); this.notice.set('');
    try { this.accept(await this.request(method, body)); this.notice.set('Salvato.'); return true; }
    catch (error) { this.error.set((error as Error).message); return false; }
    finally { this.busy.set(false); }
  }

  private async request(method: string, body?: unknown): Promise<CounterState> {
    const response = await fetch('/api/love-counter', {
      method, credentials: 'same-origin', cache: 'no-store', keepalive: method !== 'GET',
      ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
    }).catch(() => { throw new Error('Connessione interrotta. Verifica il salvataggio con Riprova: lo stesso episodio non verrà aggiunto due volte.'); });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.settings || !Array.isArray(result.episodes)) throw new Error(result?.error || 'Il contatore non è disponibile. Riprova.');
    return result as CounterState;
  }
}
