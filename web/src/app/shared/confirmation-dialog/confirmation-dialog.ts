import { Component, Input, output } from '@angular/core';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  host: { style: 'display: contents' },
  styleUrls: ['../../../styles/components/modal.css'],
  templateUrl: './confirmation-dialog.html'
})
export class ConfirmationDialog {
  @Input({ required: true }) dialogId = '';
  @Input({ required: true }) title = '';
  @Input({ required: true }) description = '';
  @Input() confirmLabel = 'Conferma';
  @Input() cancelLabel = '';
  @Input() open = false;

  readonly confirm = output<void>();
  readonly cancel = output<void>();

  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.cancel.emit();
  }
}
