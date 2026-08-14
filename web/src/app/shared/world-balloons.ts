import { Component, inject } from '@angular/core';
import { WorldSettingsService } from '../core/world-settings.service';
import { randomBetween } from './random';

const BALLOON_COUNT = 22;
const BALLOON_COLORS = ['#e0556f', '#f0a13c', '#3e9c6b', '#3f7fc1', '#a463c9', '#e8c94a'];
const BALLOON_SHAPES = ['round', 'heart', 'dog', 'penguin'] as const;
export type BalloonShape = (typeof BALLOON_SHAPES)[number];

interface Balloon {
  x: number;
  size: number;
  opacity: number;
  sway: number;
  duration: number;
  delay: number;
  color: string;
  shape: BalloonShape;
}

// Salgono verso l'alto con lo stesso zig-zag a 4 tratti delle lanterne (world-lanterns.ts,
// @keyframes balloon-rise), ma disegnate in SVG invece che con un'unica emoji, per avere
// davvero "forme diverse" (tondo classico, cuore, cane a palloncino, pinguino) e non solo una
// variazione di proporzioni. Una vera curva sinusoidale è stata provata e scartata (Rory,
// dopo averla vista muoversi: "fa cagare") — tornati al movimento a scatti delle lanterne,
// solo con `linear` invece di `ease-in-out` per restare fluido invece che a scatti.
@Component({
  selector: 'app-world-balloons',
  standalone: true,
  templateUrl: './world-balloons.html'
})
export class WorldBalloons {
  protected readonly worldSettingsService = inject(WorldSettingsService);
  protected readonly balloons: Balloon[] = Array.from({ length: BALLOON_COUNT }, () => this.createBalloon());

  private createBalloon(): Balloon {
    return {
      x: Number(randomBetween(2, 96).toFixed(2)),
      size: Number(randomBetween(2.6, 4.8).toFixed(2)),
      opacity: Number(randomBetween(0.75, 0.95).toFixed(2)),
      sway: Number(randomBetween(18, 42).toFixed(1)),
      duration: Number(randomBetween(16, 34).toFixed(2)),
      delay: Number(randomBetween(0, 34).toFixed(2)),
      color: BALLOON_COLORS[Math.floor(randomBetween(0, BALLOON_COLORS.length))],
      shape: BALLOON_SHAPES[Math.floor(randomBetween(0, BALLOON_SHAPES.length))]
    };
  }
}
