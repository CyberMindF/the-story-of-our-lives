import { Component, inject } from '@angular/core';
import { WorldSettingsService } from '../core/world-settings.service';
import { randomBetween } from './random';

const STAR_COUNT = 150;

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  bright: boolean;
  twinkleDuration: number;
  twinkleDelay: number;
}

// Porting di assets/js/shared/world-atmosphere.js: stesso numero di stelle, stesse custom
// properties CSS (--star-x/--star-y/--star-size/--star-opacity) lette da world-atmosphere.css,
// generate una volta sola alla creazione del componente (come l'originale, che le crea una
// volta per caricamento pagina).
@Component({
  selector: 'app-world-stars',
  standalone: true,
  templateUrl: './world-stars.html'
})
export class WorldStars {
  protected readonly worldSettingsService = inject(WorldSettingsService);
  protected readonly stars: Star[] = Array.from({ length: STAR_COUNT }, () => this.createStar());

  private createStar(): Star {
    const size = randomBetween(0.6, 2.1);
    return {
      x: Number(randomBetween(0, 100).toFixed(3)),
      y: Number(randomBetween(0, 100).toFixed(3)),
      size: Number(size.toFixed(2)),
      opacity: Number(randomBetween(0.2, 0.82).toFixed(2)),
      bright: size > 1.65 && randomBetween(0, 1) > 0.45,
      // Durata/ritardo diversi per ogni stella (vedi world-atmosphere.css): senza questa
      // variazione tutte le 150 stelle pulserebbero in sincrono, un effetto palesemente finto.
      twinkleDuration: Number(randomBetween(3.6, 7.6).toFixed(2)),
      twinkleDelay: Number(randomBetween(0, 10).toFixed(2))
    };
  }
}
