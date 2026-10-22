import { Component, input, output } from '@angular/core';
import { MachinePuzzle } from './coop-models';

@Component({
  selector: 'app-machine-room', templateUrl: './machine-room.html', styleUrl: './machine-room.css'
})
export class MachineRoom {
  readonly puzzle = input.required<MachinePuzzle>();
  readonly busy = input(false);
  readonly command = output<Record<string, unknown> & {type: string}>();
  protected floorY(floor: number): number { return 355 - floor * 125; }
  protected send(type: string, extra: Record<string, unknown> = {}): void {
    if (!this.busy()) this.command.emit({type: 'machine-' + type, ...extra});
  }
}
