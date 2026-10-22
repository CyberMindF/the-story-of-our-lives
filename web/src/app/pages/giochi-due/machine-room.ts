import { Component, effect, input, output, signal } from '@angular/core';
import { MachinePuzzle } from './coop-models';

type Piece = 'belt' | 'cog' | 'ball';
interface Gesture { kind: Piece | 'crank'; id: number; x: number; y: number; angle: number; rotation: number; moved: boolean; element: HTMLElement; stage: HTMLElement; }

@Component({
  selector: 'app-machine-room', templateUrl: './machine-room.html', styleUrl: './machine-room.css'
})
export class MachineRoom {
  readonly puzzle = input.required<MachinePuzzle>();
  readonly busy = input(false);
  readonly command = output<Record<string, unknown> & {type: string}>();
  protected readonly selected = signal<Piece | null>(null);
  protected readonly ghost = signal<{x: number; y: number} | null>(null);
  protected readonly crankPreview = signal(0);
  protected readonly touched = signal('');
  private gesture?: Gesture;
  private suppressClick = false;
  private ballFrom?: number | 'lift';
  private ballFloor?: number;
  private identity = '';
  constructor() {
    effect(() => {
      const p = this.puzzle(), identity = p.id + ':' + p.role;
      if (identity !== this.identity) { this.identity = identity; this.cancelGesture(); this.selected.set(null); }
    });
  }
  protected floorY(floor: number): number { return 355 - floor * 125; }
  protected ballX(): number { const s = this.puzzle().inside; return s?.ball === 'lift' ? 500 : s?.ball === 1 ? 310 : 250; }
  protected ballY(): number { const s = this.puzzle().inside; return s ? this.floorY(s.ball === 'lift' ? s.lift : s.ball) - 24 : 0; }
  protected choose(piece: Piece): void {
    if (this.ignoreClick() || this.busy()) return;
    this.select(piece);
  }
  private select(piece: Piece): void {
    this.selected.set(this.selected() === piece ? null : piece);
    if (piece === 'ball') { this.ballFrom = this.puzzle().inside?.ball; this.ballFloor = this.puzzle().inside?.lift; }
  }
  protected act(type: string, extra: Record<string, unknown> = {}): void {
    if (this.ignoreClick()) return;
    this.selected.set(null); this.send(type, extra);
  }
  protected target(target: string): void {
    if (!this.ignoreClick()) this.drop(target);
  }
  private drop(target: string): void {
    const piece = this.selected(), s = this.puzzle().inside;
    this.selected.set(null);
    if (piece === 'belt' && ['lift', 'dynamo'].includes(target)) this.send('belt', {drive: target});
    else if (piece === 'cog' && target === 'dynamo') this.send('cog');
    else if (piece === 'ball' && s) {
      const to = target === 'platform' ? 'lift' : target.startsWith('floor-') ? Number(target.slice(6)) : null;
      if (to !== null && to !== this.ballFrom) this.send('cargo', {from: this.ballFrom, to, lift: this.ballFloor});
    } else if (!piece && s) {
      if (target === 'platform') this.send('board');
      else if (target.startsWith('floor-')) {
        const to = Number(target.slice(6));
        if (s.aboard && to === s.lift) this.send('step');
        else this.send('climb', {to});
      }
    }
  }
  protected start(event: PointerEvent, kind: Piece | 'crank'): void {
    if (this.busy() || event.button !== 0) return;
    this.suppressClick = false;
    const element = event.currentTarget as HTMLElement, stage = element.closest('.machine-stage') as HTMLElement;
    const box = stage.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width * 620, y = (event.clientY - box.top) / box.height * 430;
    this.gesture = {kind, id: event.pointerId, x: event.clientX, y: event.clientY, angle: Math.atan2(y - 268, x - 310), rotation: 0, moved: false, element, stage};
    element.setPointerCapture(event.pointerId);
  }
  protected move(event: PointerEvent): void {
    const g = this.gesture;
    if (!g || event.pointerId !== g.id) return;
    if (Math.hypot(event.clientX - g.x, event.clientY - g.y) < 8 && !g.moved) return;
    event.preventDefault();
    if (!g.moved && g.kind !== 'crank') { this.selected.set(null); this.select(g.kind); }
    g.moved = true;
    const box = g.stage.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width * 620, y = (event.clientY - box.top) / box.height * 430;
    if (g.kind === 'crank') {
      const angle = Math.atan2(y - 268, x - 310);
      g.rotation += Math.atan2(Math.sin(angle - g.angle), Math.cos(angle - g.angle)); g.angle = angle;
      this.crankPreview.set(Math.max(-60, Math.min(60, g.rotation * 180 / Math.PI)));
    } else this.ghost.set({x, y});
  }
  protected end(event: PointerEvent): void {
    const g = this.gesture;
    if (!g || event.pointerId !== g.id) return;
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-target]');
    this.cancelGesture();
    if (!g.moved) return;
    this.suppressClick = true;
    if (g.kind === 'crank') {
      if (Math.abs(g.rotation) > .35) this.send('crank', {direction: g.rotation > 0 ? 1 : -1});
    } else if (target && g.stage.contains(target)) this.drop(target.dataset['target'] ?? '');
    else this.selected.set(null);
  }
  protected cancelGesture(): void {
    const g = this.gesture; this.gesture = undefined;
    if (g?.element.hasPointerCapture(g.id)) g.element.releasePointerCapture(g.id);
    this.ghost.set(null); this.crankPreview.set(0);
  }
  protected escape(): void { this.cancelGesture(); this.selected.set(null); }
  private ignoreClick(): boolean { const ignore = this.suppressClick; this.suppressClick = false; return ignore; }
  protected send(type: string, extra: Record<string, unknown> = {}): void {
    if (!this.busy()) { this.touched.set(type); this.command.emit({type: 'machine-' + type, ...extra}); }
  }
}
