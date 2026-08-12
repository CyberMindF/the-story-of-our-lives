import { Component, inject } from '@angular/core';
import { WorldSettingsService } from '../core/world-settings.service';
import { randomBetween } from './random';

interface Bubble { x: number; y: number; size: number; opacity: number; driftX: number; driftY: number; duration: number; delay: number; }

@Component({ selector: 'app-world-bubbles', standalone: true, templateUrl: './world-bubbles.html' })
export class WorldBubbles {
  protected readonly worldSettingsService = inject(WorldSettingsService);
  protected readonly bubbles: Bubble[] = Array.from({ length: 30 }, () => ({
    x: randomBetween(2, 98),
    y: randomBetween(8, 92),
    size: randomBetween(.7, 6.2),
    opacity: randomBetween(.46, .76),
    driftX: randomBetween(-150, 150),
    driftY: randomBetween(-100, 100),
    duration: randomBetween(10, 18),
    delay: randomBetween(-18, 0)
  }));
}
