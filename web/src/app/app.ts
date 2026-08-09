import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { WorldStars } from './shared/world-stars';

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
  'tavolo-page',
  'not-found-page'
];

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, WorldStars],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    document.body.classList.add('world-atmosphere');
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.applyRouteBodyClasses());
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
