import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { NavigationService } from '../core/navigation.service';
import { TelemetryService } from '../core/telemetry.service';
import { ThemeSwitcher } from '../shared/theme-switcher';

// Sostituisce templates/world-page.html + assets/js/world/main.js: stessa struttura
// (place-header/place-userbar/main), stesse classi CSS lette da world-shell.css/shell.css,
// stesso saluto/logout/evento "world_page_opened".
//
// A differenza della bozza di Fase 2/3, questo componente NON è più una route-parent con
// <router-outlet> condiviso tra tutte le pagine protette: nell'originale ogni pagina genera
// la PROPRIA shell completa (con la propria variante di homeHref/icona/classi estra), non
// una shell unica condivisa. Qui replica lo stesso: <app-shell> è un wrapper riusabile che
// ogni componente-pagina include attorno al proprio contenuto, con i suoi @Input, esattamente
// come ogni voce di scripts/world-pages.manifest.mjs aveva i propri campi
// (homeHref/homeAria/headerExtraClass/homeLinkExtraClass/shellClass/hideSuggestLink...).
// L'autenticazione resta comunque un'unica guardia condivisa su tutte le route (vedi
// app.routes.ts), solo la UI della shell torna a essere per-pagina come nell'originale.
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterLink, ThemeSwitcher],
  template: `
    <div class="place-shell" [class]="shellClass">
      <header class="place-header" [class]="headerExtraClass">
        <a class="place-home-link" [class]="homeLinkExtraClass" [routerLink]="homeHref" [attr.aria-label]="homeAria">
          <span aria-hidden="true">{{ homeIcon }}</span>
          <span [class.place-name-optional]="homeLabelCollapsible">{{ homeLabel }}</span>
        </a>
        <div class="place-userbar" [class]="userbarExtraClass">
          <p class="user-greeting">{{ userName() ? 'Ciao, ' + userName() : '' }}</p>
          <app-theme-switcher />
          @if (showSuggestLink) {
            <a routerLink="/suggerimenti" class="suggest-link" aria-label="Manda un suggerimento" title="Suggerisci">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-6 6c0 2.5 1.4 3.8 2.2 4.6.5.5.8 1.1.8 1.4h6c0-.3.3-.9.8-1.4.8-.8 2.2-2.1 2.2-4.6a6 6 0 0 0-6-6Z" /></svg>
            </a>
          }
          <button
            id="logout-button"
            class="logout-button"
            type="button"
            aria-label="Esci dall'account"
            title="Esci"
            [disabled]="loggingOut()"
            (click)="onLogoutClick()"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4M14 8l4 4-4 4M18 12H9" /></svg>
          </button>
        </div>
      </header>

      <main>
        <ng-content />
      </main>
    </div>
  `
})
export class AppShell implements OnInit {
  @Input() homeHref = '/mondo-bianco';
  @Input() homeAria = 'Torna al Mondo Bianco';
  @Input() homeIcon = '←';
  @Input() homeLabel = 'Il Mondo Bianco';
  @Input() homeLabelCollapsible = true;
  @Input() showSuggestLink = true;
  @Input() shellClass = '';
  @Input() headerExtraClass = '';
  @Input() homeLinkExtraClass = '';
  @Input() userbarExtraClass = '';
  // Il cruciverba reimplementa la propria pagina interamente (skipWorldScript nel vecchio
  // manifest): non passava mai da assets/js/world/main.js, quindi non deve generare
  // "world_page_opened" come tutte le altre pagine — l'unica eccezione nel sito.
  @Input() trackPageOpened = true;
  // Hook opzionale eseguito prima della revoca della sessione. Serve al cruciverba per
  // registrare "crossword_closed" (assets/js/crossword/main.js#logout chiamava
  // trackCrosswordClosed() prima di revokeAuthSession()) — nessun'altra pagina ne ha bisogno.
  @Input() beforeLogout: (() => Promise<void>) | null = null;

  private readonly authService = inject(AuthService);
  private readonly navigationService = inject(NavigationService);
  private readonly telemetryService = inject(TelemetryService);
  private readonly router = inject(Router);

  protected readonly loggingOut = signal(false);

  ngOnInit(): void {
    if (this.trackPageOpened) {
      void this.telemetryService.trackEvent(this.telemetryService.sectionFromPath(), 'world_page_opened', {
        path: window.location.pathname
      });
    }
  }

  protected userName(): string | null {
    return this.authService.currentUser()?.nickname ?? null;
  }

  // Porting di assets/js/world/main.js#logout: revoca la sessione, pulisce lo sblocco locale
  // e la destinazione richiesta, poi torna al Portone — qui via Router invece che
  // window.location.replace, per restare senza reload.
  protected async onLogoutClick(): Promise<void> {
    this.loggingOut.set(true);
    if (this.beforeLogout) {
      await this.beforeLogout();
    }
    const response = await this.authService.revokeAuthSession();
    if (response.ok) {
      this.authService.clearAccessUnlock();
      this.authService.currentUser.set(null);
      this.navigationService.clearRequestedDestination();
      await this.router.navigateByUrl('/');
      return;
    }
    this.loggingOut.set(false);
  }
}
