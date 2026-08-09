import { Component } from '@angular/core';
import { CrosswordService } from '../crossword.service';

@Component({
  selector: 'app-crossword-modals',
  standalone: true,
  host: { style: 'display: contents' },
  templateUrl: './crossword-modals.html'
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
