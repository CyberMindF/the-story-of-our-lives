import { Component, Input, OnInit, inject } from '@angular/core';
import { TelemetryService } from '../core/telemetry.service';
import { BackLink } from '../layout/back-link/back-link';
import { WorldHeader } from '../layout/world-header/world-header';
import { PageWip } from '../shared/page-wip/page-wip';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [BackLink, WorldHeader, PageWip],
  templateUrl: './app-shell.html'
})
export class AppShell implements OnInit {
  @Input() homeHref = '/';
  @Input() homeAria = 'Torna al Mondo Bianco';
  @Input() homeIcon = '←';
  @Input() homeLabel = 'Il Mondo Bianco';
  @Input() homeLabelCollapsible = true;
  @Input() showSuggestLink = true;
  @Input() showHomeShortcut = true;
  @Input() showBackLink = true;
  @Input() showHeader = true;
  @Input() shellClass = '';
  @Input() headerExtraClass = '';
  @Input() homeLinkExtraClass = '';
  @Input() userbarExtraClass = '';
  @Input() trackPageOpened = true;
  @Input() beforeLogout: (() => Promise<void>) | null = null;

  private readonly telemetryService = inject(TelemetryService);

  ngOnInit(): void {
    if (this.trackPageOpened) {
      void this.telemetryService.trackEvent(this.telemetryService.sectionFromPath(), 'world_page_opened', {
        path: window.location.pathname
      });
    }
  }
}
