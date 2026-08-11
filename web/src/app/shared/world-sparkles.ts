import { Component, inject } from '@angular/core';
import { WorldSettingsService } from '../core/world-settings.service';
import { randomBetween } from './random';

const SPARKLE_COUNT = 100;

interface Sparkle {
  x: number;
  y: number;
  size: number;
  flashDuration: number;
  flashDelay: number;
}

// "Brillantini": a differenza delle stelle (brillio lento, mai fino a sparire) qui il flash è
// rapido e va a zero — più vicino a un vero luccichio che a un cielo stellato, per non
// sembrare solo "le stelle ricolorate". Non più legati al tema Red of You (#b3-b, Rory: i
// temi sono preset che consigliano/accendono un effetto di default, non lo impongono in
// esclusiva) — solo l'interruttore condiviso decide se si vedono, su qualunque tema.
@Component({
  selector: 'app-world-sparkles',
  standalone: true,
  templateUrl: './world-sparkles.html'
})
export class WorldSparkles {
  protected readonly worldSettingsService = inject(WorldSettingsService);
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
