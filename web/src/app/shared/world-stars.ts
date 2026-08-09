import { Component } from '@angular/core';

const STAR_COUNT = 150;

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  bright: boolean;
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
  protected readonly stars: Star[] = Array.from({ length: STAR_COUNT }, () => this.createStar());

  private createStar(): Star {
    const size = this.randomBetween(0.6, 2.1);
    return {
      x: Number(this.randomBetween(0, 100).toFixed(3)),
      y: Number(this.randomBetween(0, 100).toFixed(3)),
      size: Number(size.toFixed(2)),
      opacity: Number(this.randomBetween(0.2, 0.82).toFixed(2)),
      bright: size > 1.65 && this.randomBetween(0, 1) > 0.45
    };
  }

  // Usa casualità crittografica quando disponibile, con fallback per browser meno recenti.
  private randomBetween(minimum: number, maximum: number): number {
    let value = Math.random();
    if (globalThis.crypto?.getRandomValues) {
      const randomValue = new Uint32Array(1);
      globalThis.crypto.getRandomValues(randomValue);
      value = randomValue[0] / 4294967295;
    }
    return minimum + value * (maximum - minimum);
  }
}
