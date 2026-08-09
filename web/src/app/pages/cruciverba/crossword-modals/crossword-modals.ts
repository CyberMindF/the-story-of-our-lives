import { Component } from '@angular/core';
import { CrosswordService } from '../crossword.service';

@Component({
  selector: 'app-crossword-modals',
  standalone: true,
  host: { style: 'display: contents' },
  template: `
    <div
      class="modal"
      [class.hidden]="!crossword.completionModalOpen()"
      role="dialog"
      aria-modal="true"
      aria-labelledby="completion-title"
      aria-describedby="completion-text"
      (click)="closeCompletionOnBackdrop($event)"
    >
      <div class="modal-card card--dialog">
        <h2 id="completion-title">Cruciverba completato</h2>
        <p id="completion-text">Ho raccolto qui una parte di noi.<br />Hai ritrovato tutti i nostri ricordi.</p>
        <button type="button" (click)="crossword.closeCompletionModal()">Chiudi</button>
      </div>
    </div>

    <div
      class="modal"
      [class.hidden]="!crossword.resetModalOpen()"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-title"
      aria-describedby="reset-text"
      (click)="closeResetOnBackdrop($event)"
    >
      <div class="modal-card card--dialog">
        <h2 id="reset-title">Ricominciare da capo?</h2>
        <p id="reset-text">Questo cancellerà tutte le lettere inserite finora.</p>
        <div class="modal-actions">
          <button type="button" (click)="crossword.closeResetModal()">Annulla</button>
          <button type="button" (click)="crossword.resetProgress()">Cancella tutto</button>
        </div>
      </div>
    </div>

    <div
      class="modal"
      [class.hidden]="!crossword.checkModalOpen()"
      role="dialog"
      aria-modal="true"
      aria-labelledby="check-title"
      aria-describedby="check-text"
      (click)="closeCheckOnBackdrop($event)"
    >
      <div class="modal-card card--dialog">
        <h2 id="check-title">Controllare le risposte?</h2>
        <p id="check-text">Le lettere inserite saranno indicate come corrette o errate. Le celle vuote non verranno considerate.</p>
        <div class="modal-actions">
          <button type="button" (click)="crossword.closeCheckModal()">Annulla</button>
          <button type="button" (click)="crossword.confirmCheck()">Controlla</button>
        </div>
      </div>
    </div>
  `
})
export class CrosswordModals {
  constructor(protected readonly crossword: CrosswordService) {}

  protected closeCompletionOnBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.crossword.closeCompletionModal();
    }
  }

  protected closeResetOnBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.crossword.closeResetModal();
    }
  }

  protected closeCheckOnBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.crossword.closeCheckModal();
    }
  }
}
