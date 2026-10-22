import { Component, computed, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { BalancePuzzle, CoopState, MazePuzzle, OrderPuzzle } from './coop-models';
import { MachineRoom } from './machine-room';

@Component({
  selector: 'app-coop-room', imports: [FormsModule, DatePipe, MachineRoom],
  templateUrl: './coop-room.html', styleUrl: './coop-room.css'
})
export class CoopRoom {
  readonly state = input.required<CoopState>();
  readonly userId = input.required<number>();
  readonly busy = input(false);
  readonly canCreate = input(true);
  readonly compact = input(false);
  readonly command = output<Record<string, unknown> & {type: string}>();
  protected readonly room = computed(() => this.state().room);
  protected readonly mode = signal('mix');
  protected readonly difficulty = signal('normal');
  protected readonly length = signal(3);
  protected readonly code = signal('');
  protected readonly numbers = [1, 2, 3, 4, 5, 6, 7, 8];
  private lastPuzzle = '';
  constructor() {
    effect(() => {
      const r = this.room();
      const key = r ? r.id + ':' + r.round + ':' + (r.schema === 2 ? r.puzzle?.id ?? r.status : r.status) : '';
      if (key !== this.lastPuzzle) { this.lastPuzzle = key; this.code.set(''); }
    });
  }
  protected send(type: string, extra: Record<string, unknown> = {}): void {
    if (this.busy()) return;
    const r = this.room();
    this.command.emit({ id: r?.id, puzzleId: r?.schema === 2 ? r.puzzle?.id : undefined, round: r?.round, ...extra, type });
  }
  protected create(): void { this.send('create', { mode: this.mode(), difficulty: this.mode() === 'code' ? 'easy' : this.difficulty(), length: this.length() }); }
  protected createMachine(insideFirst = false): void { this.send('create', {mode: 'machine', difficulty: 'normal', insideFirst}); }
  protected cancel(): void {
    if (confirm('Chiudere la partita per entrambi? Le prove già completate resteranno nello storico.')) this.send('cancel');
  }
  protected digit(n: number, count = 4): void { if (this.code().length < count) this.code.update(c => c + n); }
  protected submitCode(type: string): void { this.send(type, { code: this.code() }); }
  protected cells(size: number): number[] { return Array.from({length: size * size}, (_, i) => i); }
  protected indices(size: number): number[] { return Array.from({length: size}, (_, i) => i); }
  protected coordinate(cell: number, size: number): string { return String.fromCharCode(65 + Math.floor(cell / size)) + (cell % size + 1); }
  protected adjacent(a: number, b: number, size: number): boolean {
    return Math.abs(a - b) === size || (Math.floor(a / size) === Math.floor(b / size) && Math.abs(a - b) === 1);
  }
  protected edge(p: MazePuzzle, cell: number, direction: number, seat: number): string {
    const n = p.size;
    if ((direction === 0 && cell < n) || (direction === 1 && cell % n === n - 1)
      || (direction === 2 && cell >= n * (n - 1)) || (direction === 3 && cell % n === 0)) return 'solid';
    if ((direction % 2 === 1 ? 0 : 1) !== seat) return 'dashed';
    const next = cell + [-n, 1, n, -1][direction];
    return p.edges.some(e => e.includes(cell) && e.includes(next)) ? 'none' : 'solid';
  }
  protected ordered(p: OrderPuzzle): {id: string; emoji: string; name: string}[] {
    return p.order.map(id => p.items.find(item => item.id === id)!);
  }
  protected sum(p: BalancePuzzle): number { return p.weights.reduce((sum, w) => sum + (w.selected ? w.value : 0), 0); }
  protected lampNames(indices: number[]): string { return indices.map(i => 'L' + (i + 1)).join(', '); }
  protected portX(port: number): number { return [50, 100, 50, 0][port]; }
  protected portY(port: number): number { return [0, 50, 100, 50][port]; }
  protected portNames(ports: number[] | null): string { return ports?.map(n => ['alto', 'destra', 'basso', 'sinistra'][n]).join(' e ') ?? 'tubo dell’altra persona'; }
  protected difficultyName(value: string): string { return ({easy: 'Facile', normal: 'Normale', hard: 'Difficile', prototype: 'Prototipo'} as Record<string, string>)[value] ?? value; }
  protected minutes(ms: number): number { return Math.max(1, Math.round(ms / 60000)); }
}
