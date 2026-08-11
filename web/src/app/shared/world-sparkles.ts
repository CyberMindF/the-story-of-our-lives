import { Component, inject } from '@angular/core';
import { ThemeService } from '../core/theme.service';
import { WorldSettingsService } from '../core/world-settings.service';
import { randomBetween } from './random';

const SPARKLE_COUNT = 100;
// Visibile solo sul tema Red of You (#b3-a): un effetto per tema, non uno riparametrizzato per
// tutti — stelle/lanterne/luna restano gli elementi "neutri" comuni a ogni tema, questo è
// specifico. In più, come ogni effetto del cielo, ha il proprio interruttore condiviso in
// Impostazioni del Mondo (chiesto da Rory: ogni nuovo effetto deve averne uno, non solo
// quelli "neutri") — le due condizioni si sommano nel template.
const SPARKLE_THEME_ID = 'red-of-you';

interface Sparkle {
  x: number;
  y: number;
  size: number;
  flashDuration: number;
  flashDelay: number;
}

// "Brillantini": a differenza delle stelle (brillio lento, mai fino a sparire) qui il flash è
// rapido e va a zero — più vicino a un vero luccichio che a un cielo stellato, per non
// sembrare solo "le stelle ricolorate".
@Component({
  selector: 'app-world-sparkles',
  standalone: true,
  templateUrl: './world-sparkles.html'
})
export class WorldSparkles {
  protected readonly themeService = inject(ThemeService);
  protected readonly worldSettingsService = inject(WorldSettingsService);
  protected readonly sparkleThemeId = SPARKLE_THEME_ID;
  protected readonly sparkles: Sparkle[] = Array.from({ length: SPARKLE_COUNT }, () => this.createSparkle());

  private createSparkle(): Sparkle {
    return {
      x: Number(randomBetween(0, 100).toFixed(3)),
      y: Number(randomBetween(0, 100).toFixed(3)),
      size: Number(randomBetween(0.7, 2.4).toFixed(2)),
      flashDuration: Number(randomBetween(1.4, 3.2).toFixed(2)),
      flashDelay: Number(randomBetween(0, 6).toFixed(2))
    };
  }
}
