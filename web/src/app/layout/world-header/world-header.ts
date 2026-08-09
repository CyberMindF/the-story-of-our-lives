import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WorldUserBar } from '../world-user-bar/world-user-bar';

@Component({
  selector: 'app-world-header',
  standalone: true,
  imports: [RouterLink, WorldUserBar],
  templateUrl: './world-header.html'
})
export class WorldHeader {
  @Input() homeHref = '/mondo-bianco';
  @Input() homeAria = 'Torna al Mondo Bianco';
  @Input() homeIcon = '←';
  @Input() homeLabel = 'Il Mondo Bianco';
  @Input() homeLabelCollapsible = true;
  @Input() showSuggestLink = true;
  @Input() showHomeShortcut = true;
  @Input() extraClass = '';
  @Input() homeLinkExtraClass = '';
  @Input() userbarExtraClass = '';
  @Input() beforeLogout: (() => Promise<void>) | null = null;
}
