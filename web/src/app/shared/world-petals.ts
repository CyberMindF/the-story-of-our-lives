import { Component, inject } from '@angular/core';
import { ThemeService } from '../core/theme.service';
import { WorldSettingsService } from '../core/world-settings.service';
import { randomBetween } from './random';

const PETAL_COUNT = 22;
// Quarto e ultimo dei quattro effetti per tema di #b3-a: visibile solo su Velvet, con il
// proprio interruttore condiviso (stessa regola di sparkles/leaves/shells). Idea di Claude
// (non ancora confermata da Rory, vedi prossimi sviluppi.md #b3-a): petali di rosa, riprende
// il motivo delle rose già presente nel sito (il mazzo di rose nel calendario).
const PETAL_THEME_ID = 'velvet';

interface Petal {
  x: number;
  size: number;
  opacity: number;
  sway: number;
  rotateStart: number;
  rotateEnd: number;
  fallDuration: number;
  fallDelay: number;
}

// Cadono più lenti e dondolano più morbidi delle foglie di Green of Me: un petalo scende
// leggero, non tumultuoso come una foglia nel vento.
@Component({
  selector: 'app-world-petals',
  standalone: true,
  templateUrl: './world-petals.html'
})
export class WorldPetals {
  protected readonly themeService = inject(ThemeService);
  protected readonly worldSettingsService = inject(WorldSettingsService);
  protected readonly petalThemeId = PETAL_THEME_ID;
  protected readonly petals: Petal[] = Array.from({ length: PETAL_COUNT }, () => this.createPetal());

  private createPetal(): Petal {
    const rotateStart = randomBetween(-30, 30);
    return {
      x: Number(randomBetween(2, 98).toFixed(2)),
      size: Number(randomBetween(0.9, 1.6).toFixed(2)),
      opacity: Number(randomBetween(0.5, 0.85).toFixed(2)),
      sway: Number(randomBetween(16, 34).toFixed(1)),
      rotateStart: Number(rotateStart.toFixed(1)),
      rotateEnd: Number((rotateStart + randomBetween(60, 120) * (randomBetween(0, 1) > 0.5 ? 1 : -1)).toFixed(1)),
      fallDuration: Number(randomBetween(14, 26).toFixed(2)),
      fallDelay: Number(randomBetween(0, 18).toFixed(2))
    };
  }
}
