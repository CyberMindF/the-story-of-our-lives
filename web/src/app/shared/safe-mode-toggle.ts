import { Component, Input, inject } from '@angular/core';
import { SafeModeService } from '../core/safe-mode.service';
@Component({
  selector: 'app-safe-mode-toggle', standalone: true,
  styles: [`.safe-mode-error { position: fixed; pointer-events: none; z-index: 120; right: 1rem; bottom: 1rem; max-width: min(28rem, calc(100vw - 2rem)); padding: 1rem; border: 1px solid var(--border-color); border-radius: .75rem; background: var(--bg-color); color: var(--text-color); box-shadow: var(--shadow); }`],
  template: `<div class="safe-mode-entry" [class.is-outside]="outside">
      <button type="button" class="safe-mode-control safe-mode-button settings-toggle-button"
        role="switch" aria-label="Safe mode" [attr.aria-checked]="safe.enabled()"
        [attr.aria-busy]="safe.saving()" [disabled]="safe.saving()"
        [class.is-active]="safe.enabled()" (click)="toggle()" [attr.aria-describedby]="outside ? 'safe-entry-status' : null">
        <svg class="safe-mode-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 18V5.5C12 2 7 2 6.5 5 3 4.5 1.5 8.5 4 10c-3 2-2 6 1.5 6.5C4.5 21 12 23 12 18Z"/><path d="M12 5.5C12 2 17 2 17.5 5 21 4.5 22.5 8.5 20 10c3 2 2 6-1.5 6.5C19.5 21 12 23 12 18M8 8c0 2 2 3 4 3m4-3c0 2-2 3-4 3M7 14c2 0 3 1 3 3m7-3c-2 0-3 1-3 3"/></svg>
        <span>Safe mode</span>
        <span class="settings-toggle-switch" aria-hidden="true"></span>
      </button>
      @if (outside) {
        <p id="safe-entry-status" class="safe-entry-status" role="status">{{ entryStatus() }}</p>
      }
    </div>
    @if (safe.error()) { <span class="safe-mode-error" role="alert">{{ safe.error() }}</span> }`
})
export class SafeModeToggle {
  @Input() outside = false;
  protected readonly safe = inject(SafeModeService);
  protected entryStatus(): string {
    if (!this.safe.entryAuthenticated() && this.safe.entryChoice() === null) {
      return 'All’accesso ritroverai la modalità salvata nel tuo account.';
    }
    return this.safe.enabled()
      ? 'Attiva · contenuti sentimentali nascosti.'
      : 'Disattivata · il Mondo Bianco completo.';
  }
  protected async toggle(): Promise<void> {
    const previous = this.safe.enabled();
    if (!this.outside) { await this.safe.save(!previous); return; }
    this.safe.chooseEntry(!previous);
    if (this.safe.entryAuthenticated() && !await this.safe.save(!previous)) {
      this.safe.chooseEntry(previous);
    }
  }
}
