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
      <button type="button" class="safe-mode-control safe-mode-button settings-toggle-button"
        role="switch" aria-label="Safe mode" [attr.aria-checked]="safe.enabled()"
        [attr.aria-busy]="safe.saving()" [disabled]="safe.saving()"
        [class.is-active]="safe.enabled()" (click)="toggle()">
        <svg class="safe-mode-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 8 3v6c0 4-4 7-8 9-4-2-8-5-8-9V6l8-3Z"/><path d="m8.5 12 2.5 2.5 4.5-5"/></svg>
        <span>Safe mode</span>
        <span class="settings-toggle-switch" aria-hidden="true"></span>
      </button>
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
  protected toggle(): void {
    void this.safe.save(!this.safe.enabled());
  }
}
