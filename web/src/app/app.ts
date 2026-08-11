import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from './core/auth.service';
import { ThemeService } from './core/theme.service';
import { WorldSettingsService } from './core/world-settings.service';
import { WorldLanterns } from './shared/world-lanterns';
import { WorldMoon } from './shared/world-moon';
import { WorldSparkles } from './shared/world-sparkles';
import { WorldStars } from './shared/world-stars';

// Eventi usati come "prova di attività" per rinnovare lo sblocco della Chiave (vedi
// AuthService.touchAccessUnlock) — non serve seguire ogni movimento del mouse, basta sapere
// che qualcuno sta ancora interagendo con la pagina.
const ACTIVITY_EVENTS = ['pointerdown', 'keydown'] as const;
// Non scrivere su sessionStorage a ogni singolo click: un tocco al minuto basta per restare
// entro la finestra di inattività di un'ora.
const ACTIVITY_TOUCH_THROTTLE_MS = 60 * 1000;

const ROUTE_BODY_CLASSES = [
  'access-locked',
  'portone-page',
  'world-page',
  'bacheca-page',
  'calendar-page',
  'music-page',
  'lettere-page',
  'map-page',
  'globe-page',
  'ponti-page',
  'stories-page',
  'suggerimenti-page',
  'impostazioni-mondo-page',
  'sky-view-page',
  'tavolo-page',
  'not-found-page'
];

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, WorldStars, WorldLanterns, WorldMoon, WorldSparkles],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly themeService = inject(ThemeService);
  private readonly worldSettingsService = inject(WorldSettingsService);
  private readonly authService = inject(AuthService);
  private lastActivityTouchAt = 0;

  constructor() {
    document.body.classList.add('world-atmosphere');
    this.themeService.applySavedTheme();
    void this.worldSettingsService.load().then(() => this.themeService.applySharedTheme());
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.applyRouteBodyClasses());

    const onActivity = () => this.touchAccessUnlockThrottled();
    ACTIVITY_EVENTS.forEach((eventName) => document.addEventListener(eventName, onActivity, { passive: true }));
    this.destroyRef.onDestroy(() => {
      ACTIVITY_EVENTS.forEach((eventName) => document.removeEventListener(eventName, onActivity));
    });
  }

  // Rinnova lo sblocco della Chiave durante l'uso attivo, anche restando sulla stessa pagina
  // (es. una lunga sessione di cruciverba), non solo quando si cambia rotta.
  private touchAccessUnlockThrottled(): void {
    const userId = this.authService.currentUser()?.id;
    if (userId === undefined) {
      return;
    }
    const now = Date.now();
    if (now - this.lastActivityTouchAt < ACTIVITY_TOUCH_THROTTLE_MS) {
      return;
    }
    this.lastActivityTouchAt = now;
    this.authService.touchAccessUnlock(userId);
  }

  private applyRouteBodyClasses(): void {
    let route = this.activatedRoute;
    while (route.firstChild) {
      route = route.firstChild;
    }

    document.body.classList.remove(...ROUTE_BODY_CLASSES);
    const bodyClasses = route.snapshot.data['bodyClasses'];
    if (Array.isArray(bodyClasses)) {
      document.body.classList.add(...bodyClasses);
    }
  }
}
