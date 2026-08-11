import { Component, inject } from '@angular/core';
import { WorldSettingsService } from '../core/world-settings.service';
import { randomBetween } from './random';

const LEAF_COUNT = 26;

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

// "Ombre di foglia che cadono": sagome scure e semitrasparenti (filter: brightness(0), niente
// colore dell'emoji) — l'idea è l'ombra tremolante di una foglia, non la foglia stessa. Una
// sola foglia (🍂, non 🍃 "foglia nel vento" con due foglioline — feedback di Rory, quella si
// vedeva sdoppiata) e un'oscillazione più morbida, non un vero e proprio "vento". Non più
// legate al tema Green of Me (#b3-b): solo l'interruttore condiviso decide se si vedono.
@Component({
  selector: 'app-world-leaves',
  standalone: true,
  templateUrl: './world-leaves.html'
})
export class WorldLeaves {
  protected readonly worldSettingsService = inject(WorldSettingsService);
  protected readonly leaves: Leaf[] = Array.from({ length: LEAF_COUNT }, () => this.createLeaf());

  private createLeaf(): Leaf {
    const rotateStart = randomBetween(-20, 20);
    return {
      x: Number(randomBetween(2, 98).toFixed(2)),
      size: Number(randomBetween(1, 1.8).toFixed(2)),
      opacity: Number(randomBetween(0.25, 0.5).toFixed(2)),
      sway: Number(randomBetween(12, 28).toFixed(1)),
      rotateStart: Number(rotateStart.toFixed(1)),
      rotateEnd: Number((rotateStart + randomBetween(40, 90) * (randomBetween(0, 1) > 0.5 ? 1 : -1)).toFixed(1)),
      fallDuration: Number(randomBetween(11, 20).toFixed(2)),
      fallDelay: Number(randomBetween(0, 14).toFixed(2))
    };
  }
}
