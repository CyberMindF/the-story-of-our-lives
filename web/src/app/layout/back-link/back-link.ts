import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-back-link',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './back-link.html'
})
export class BackLink {
  @Input({ required: true }) href = '';
  @Input({ required: true }) label = '';
}
