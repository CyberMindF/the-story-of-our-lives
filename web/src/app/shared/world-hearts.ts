import { Component, inject } from '@angular/core';
import { WorldSettingsService } from '../core/world-settings.service';
import { randomBetween } from './random';

export type HeartColor = 'pink' | 'red' | 'yellow' | 'green' | 'gold' | 'fire';
export const HEART_COLOR_LABEL: Record<HeartColor, string> = {
  pink: 'Rosa',
  red: 'Rossi',
  yellow: 'Gialli',
  green: 'Verdi',
  gold: 'Dorati',
  fire: 'Nostri'
};

const HEART_COLORS: Record<HeartColor, string> = {
  pink: '#d86f8c',
  red: '#941d3b',
  yellow: '#f0bd35',
  green: '#389a5e',
  gold: '#d7a928',
  fire: '#b52b38'
};

interface Heart { x: number; y: number; size: number; opacity: number; driftX: number; driftY: number; rotation: number; duration: number; delay: number; shineDuration: number; shineDelay: number; colorIndex: number; }

@Component({ selector: 'app-world-hearts', standalone: true, templateUrl: './world-hearts.html' })
export class WorldHearts {
  protected readonly worldSettingsService = inject(WorldSettingsService);
  protected readonly hearts: Heart[] = Array.from({ length: 30 }, (_, index) => {
    // La maggior parte resta discreta; circa un cuore su dieci diventa volutamente enorme.
    const size = randomBetween(0, 1) < .1 ? randomBetween(8, 13) : randomBetween(.7, 6.4);
    // Sei colonne distribuiscono i cuori lungo tutto lo schermo;
    // il jitter mantiene comunque l'aspetto casuale ed evita una griglia riconoscibile.
    const column = index % 6;
    const row = Math.floor(index / 6);
    return {
      x: column * (100 / 6) + randomBetween(4, 12),
      y: row * 20 + randomBetween(5, 15),
      size,
      opacity: randomBetween(.2, .5),
      driftX: randomBetween(-105, 105), driftY: randomBetween(-70, 70), rotation: randomBetween(0, 360),
      duration: randomBetween(20, 34), delay: randomBetween(-34, 0),
      shineDuration: randomBetween(4.5, 8), shineDelay: randomBetween(-8, 0),
      colorIndex: index
    };
  });

  protected heartColor(index: number): string {
    const selected = this.heartKind(index);
    return HEART_COLORS[selected];
  }

  protected heartKind(index: number): HeartColor {
    const selected = this.worldSettingsService.values().hearts;
    if (selected && selected !== 'mix') {
      return selected in HEART_COLORS ? selected as HeartColor : 'pink';
    }
    const colors: HeartColor[] = ['pink', 'red', 'yellow', 'green', 'gold', 'fire'];
    return colors[index % colors.length];
  }
}
