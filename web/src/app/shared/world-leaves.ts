import { Component, inject } from '@angular/core';
import { ThemeService } from '../core/theme.service';
import { WorldSettingsService } from '../core/world-settings.service';
import { randomBetween } from './random';

const LEAF_COUNT = 26;
// Secondo dei quattro effetti per tema di #b3-a (dopo i brillantini di Red of You): visibile
// solo su Green of Me, con il proprio interruttore condiviso — stessa regola di sparkles,
// non solo il tema come gate (vedi feedback di Rory dell'11/08/2026).
const LEAF_THEME_ID = 'green-of-me';

interface Leaf {
  x: number;
  size: number;
  opacity: number;
  sway: number;
  rotateStart: number;
  rotateEnd: number;
  fallDuration: number;
  fallDelay: number;
}

// "Ombre di foglia che cadono": non foglie colorate in caduta libera come coriandoli, ma
// sagome scure e semitrasparenti (filter: brightness(0), niente colore dell'emoji) — l'idea è
// l'ombra tremolante delle foglie mosse dal vento, non le foglie stesse.
@Component({
  selector: 'app-world-leaves',
  standalone: true,
  templateUrl: './world-leaves.html'
})
export class WorldLeaves {
  protected readonly themeService = inject(ThemeService);
  protected readonly worldSettingsService = inject(WorldSettingsService);
  protected readonly leafThemeId = LEAF_THEME_ID;
  protected readonly leaves: Leaf[] = Array.from({ length: LEAF_COUNT }, () => this.createLeaf());

  private createLeaf(): Leaf {
    const rotateStart = randomBetween(-40, 40);
    return {
      x: Number(randomBetween(2, 98).toFixed(2)),
      size: Number(randomBetween(1, 1.9).toFixed(2)),
      opacity: Number(randomBetween(0.25, 0.5).toFixed(2)),
      sway: Number(randomBetween(24, 56).toFixed(1)),
      rotateStart: Number(rotateStart.toFixed(1)),
      rotateEnd: Number((rotateStart + randomBetween(140, 260) * (randomBetween(0, 1) > 0.5 ? 1 : -1)).toFixed(1)),
      fallDuration: Number(randomBetween(9, 18).toFixed(2)),
      fallDelay: Number(randomBetween(0, 14).toFixed(2))
    };
  }
}
