import { Component, DestroyRef, ElementRef, Input, ViewChild, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { HOME_AREAS, HomeAreaId, WORLD_PLACES, WorldPlace, WorldPlaceGroup } from '../../core/world-places';

const FALLBACK_AREA_BY_GROUP: Record<WorldPlaceGroup, HomeAreaId> = {
  ricordi: 'valle',
  insieme: 'prato',
  giochi: 'prato',
  mondo: 'osservatorio'
};

@Component({
  selector: 'app-world-navigation',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './world-navigation.html',
  styleUrl: './world-navigation.css'
})
export class WorldNavigation {
  @Input() parentHref = '/';
  @Input() parentLabel = 'Torna indietro';
  @Input() showBack = true;

  @ViewChild('navigationDialog') private dialogRef?: ElementRef<HTMLDialogElement>;

  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly currentPath = signal(this.pathFromUrl(this.router.url));
  protected readonly groups = HOME_AREAS.map((area) => {
    const areaPlaces = WORLD_PLACES.filter((place) =>
      place.id !== 'profilo' && place.route && this.areaFor(place) === area.id
    );
    const primaryPlaces = areaPlaces.filter((place) => place.primary);

    return {
      ...area,
      entries: primaryPlaces.map((place) => ({
        place,
        children: areaPlaces.filter((candidate) => !candidate.primary && candidate.parentId === place.id)
      })),
      secondaryPlaces: areaPlaces.filter((place) => !place.primary && !place.parentId)
    };
  });

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((event) => {
        this.currentPath.set(this.pathFromUrl(event.urlAfterRedirects));
        this.close();
      });
  }

  protected isCurrent(route: string | null): boolean {
    return route === this.currentPath();
  }

  protected open(): void {
    this.dialogRef?.nativeElement.showModal();
  }

  protected close(): void {
    this.dialogRef?.nativeElement.close();
  }

  protected onDialogClick(event: MouseEvent): void {
    if (event.target === this.dialogRef?.nativeElement) this.close();
  }

  protected scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected scrollToBottom(): void {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  }

  private areaFor(place: WorldPlace): HomeAreaId {
    if (place.homeArea) return place.homeArea;

    if (place.parentId) {
      const parent = WORLD_PLACES.find((candidate) => candidate.id === place.parentId);
      if (parent?.homeArea) return parent.homeArea;
    }

    return FALLBACK_AREA_BY_GROUP[place.group];
  }

  private pathFromUrl(url: string): string {
    return url.split(/[?#]/, 1)[0] || '/';
  }
}
