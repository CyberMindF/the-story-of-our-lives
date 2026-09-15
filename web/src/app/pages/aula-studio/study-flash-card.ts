import { Component, Input, output } from '@angular/core';

@Component({
  selector: 'app-study-flash-card',
  standalone: true,
  templateUrl: './study-flash-card.html',
  styleUrl: './study-flash-card.css',
})
export class StudyFlashCard {
  @Input({ required: true }) question = '';
  @Input({ required: true }) answer = '';
  @Input({ required: true }) context = '';
  @Input() flipped = false;
  @Input() interactive = true;

  readonly flip = output<void>();

  protected requestFlip(): void {
    if (this.interactive) this.flip.emit();
  }
}
