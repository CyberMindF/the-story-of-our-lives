import { Component, inject } from '@angular/core';
import { WorldSettingsService } from '../core/world-settings.service';
import { randomBetween } from './random';

const LANTERN_COUNT = 50;

interface Lantern {
  x: number;
  size: number;
  opacity: number;
  sway: number;
  riseDuration: number;
  riseDelay: number;
}

// Non più legate a un tema: sono un effetto a sé, acceso/spento per tutti e due insieme da
// WorldSettingsService (vedi prossimi sviluppi.md #a3 — prima erano solo nel tema Notte,
// scelta poi rivista per renderle un interruttore indipendente dal tema).
@Component({
  selector: 'app-world-lanterns',
  standalone: true,
  templateUrl: './world-lanterns.html'
})
export class WorldLanterns {
  protected readonly worldSettingsService = inject(WorldSettingsService);
  protected readonly lanterns: Lantern[] = Array.from({ length: LANTERN_COUNT }, () => this.createLantern());

  private createLantern(): Lantern {
    return {
      x: Number(randomBetween(2, 98).toFixed(2)),
      size: Number(randomBetween(1, 3).toFixed(2)),
      opacity: Number(randomBetween(0.78, 1).toFixed(2)),
      sway: Number(randomBetween(18, 42).toFixed(1)),
      riseDuration: Number(randomBetween(20, 42).toFixed(2)),
      riseDelay: Number(randomBetween(0, 42).toFixed(2))
    };
  }
}
