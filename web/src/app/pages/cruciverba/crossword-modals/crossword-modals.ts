import { Component } from '@angular/core';
import { ConfirmationDialog } from '../../../shared/confirmation-dialog/confirmation-dialog';
import { CrosswordService } from '../crossword.service';

@Component({
  selector: 'app-crossword-modals',
  standalone: true,
  imports: [ConfirmationDialog],
  host: { style: 'display: contents' },
  templateUrl: './crossword-modals.html'
})
export class CrosswordModals {
  constructor(protected readonly crossword: CrosswordService) {}

  protected onCompletionBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.crossword.closeCompletionModal();
    }
  }
}
