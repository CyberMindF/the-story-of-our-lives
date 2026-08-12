import { Component, inject } from '@angular/core';
import { WorldSettingsService } from '../core/world-settings.service';
import { randomBetween } from './random';

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  duration: number;
  delay: number;
  opacity: number;
}

@Component({
  selector: 'app-world-shooting-stars',
  standalone: true,
  templateUrl: './world-shooting-stars.html'
})
export class WorldShootingStars {
  protected readonly worldSettingsService = inject(WorldSettingsService);
  protected readonly shootingStars: ShootingStar[] = Array.from({ length: 7 }, (_, index) => ({
    x: Number(randomBetween(-8, 82).toFixed(2)),
    y: Number(randomBetween(-12, 48).toFixed(2)),
    length: Number(randomBetween(5.5, 11).toFixed(2)),
    duration: Number(randomBetween(12, 22).toFixed(2)),
    delay: Number((index * randomBetween(1.4, 3.2) + randomBetween(0, 4)).toFixed(2)),
    opacity: Number(randomBetween(0.45, 0.85).toFixed(2))
  }));
}
