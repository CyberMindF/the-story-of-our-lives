import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-content-message',
  standalone: true,
  host: { style: 'display: contents' },
  templateUrl: './content-message.html'
})
export class ContentMessage {
  @Input({ required: true }) message = '';
  @Input() tone: 'empty' | 'error' = 'empty';
  @Input() panel = false;
  @Input() extraClass = '';
}
