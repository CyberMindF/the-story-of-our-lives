import { Component, Input, inject } from '@angular/core';
import { SafeModeService } from '../core/safe-mode.service';
@Component({
  selector: 'app-safe-mode-toggle', standalone: true,
  styles: [`.safe-mode-error { position: fixed; pointer-events: none; z-index: 120; right: 1rem; bottom: 1rem; max-width: min(28rem, calc(100vw - 2rem)); padding: 1rem; border: 1px solid var(--border-color); border-radius: .75rem; background: var(--bg-color); color: var(--text-color); box-shadow: var(--shadow); }`],
  template: `@if (outside) {
      <label class="safe-mode-control">Safe mode
        <select aria-label="Safe mode" [value]="safe.entryChoice() === null ? 'saved' : String(safe.entryChoice())" (change)="entry($event)">
          <option value="saved">Preferenza del mio account</option>
          <option value="true">Attiva</option><option value="false">Disattiva</option>
        </select>
      </label>
    } @else {
      <label class="safe-mode-control"><input type="checkbox" [checked]="safe.enabled()"
        [disabled]="safe.saving()" (change)="change($event)" /> Safe mode</label>
    }
    @if (safe.error()) { <span class="safe-mode-error" role="alert">{{ safe.error() }}</span> }`
})
export class SafeModeToggle {
  @Input() outside = false;
  protected readonly safe = inject(SafeModeService);
  protected readonly String = String;
  protected entry(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.safe.entryChoice.set(value === 'saved' ? null : value === 'true');
  }
  protected change(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (this.outside) this.safe.chooseEntry(input.checked);
    else void this.safe.save(input.checked).then(() => input.checked = this.safe.enabled());
  }
}
