import { Component, inject } from '@angular/core';
import { ThemeService } from '../core/theme.service';
import { WorldSettingsService } from '../core/world-settings.service';
import { randomBetween } from './random';

const SHELL_COUNT = 14;
// Terzo dei quattro effetti per tema di #b3-a: visibile solo su Ocean, con il proprio
// interruttore condiviso (stessa regola di sparkles/leaves).
const SHELL_THEME_ID = 'sea';

interface Shell {
  y: number;
  size: number;
  opacity: number;
  bob: number;
  driftDuration: number;
  driftDelay: number;
}

// "Conchiglie arancioni che passano": a differenza di lanterne/foglie (verticali), qui il
// movimento è orizzontale — attraversano lo schermo da sinistra a destra con un leggero
// dondolio, come trasportate da una corrente. Poche (14): un tocco, non uno sciame.
@Component({
  selector: 'app-world-shells',
  standalone: true,
  templateUrl: './world-shells.html'
})
export class WorldShells {
  protected readonly themeService = inject(ThemeService);
  protected readonly worldSettingsService = inject(WorldSettingsService);
  protected readonly shellThemeId = SHELL_THEME_ID;
  protected readonly shells: Shell[] = Array.from({ length: SHELL_COUNT }, () => this.createShell());

  private createShell(): Shell {
    return {
      y: Number(randomBetween(4, 92).toFixed(2)),
      size: Number(randomBetween(1.1, 2.1).toFixed(2)),
      opacity: Number(randomBetween(0.45, 0.8).toFixed(2)),
      bob: Number(randomBetween(10, 26).toFixed(1)),
      driftDuration: Number(randomBetween(16, 30).toFixed(2)),
      driftDelay: Number(randomBetween(0, 22).toFixed(2))
    };
  }
}
