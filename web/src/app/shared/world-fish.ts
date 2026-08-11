import { Component, computed, inject } from '@angular/core';
import { WorldSettingsService } from '../core/world-settings.service';
import { randomBetween } from './random';

const FISH_COUNT = 9;

export type FishKind = 'octopus' | 'goldfish';
export const FISH_KIND_LABEL: Record<FishKind, string> = {
  octopus: 'Polpi',
  goldfish: 'Pesci rossi'
};

interface Fish {
  kind: FishKind;
  reverse: boolean;
  y: number;
  size: number;
  opacity: number;
  bob: number;
  swimDuration: number;
  swimDelay: number;
}

// Pesci per Ocean (#c2): a differenza di foglie/petali (che cadono) e delle onde (fisse in
// fondo, un'unica forma continua), i pesci nuotano in orizzontale attraverso lo schermo, metà
// verso destra e metà verso sinistra, in una fascia bassa sopra il livello delle onde — non
// nel cielo come gli altri effetti. Due forme selezionabili (come i fiori: value in
// world_settings, non solo enabled) — polpi o pesci rossi — o "mix" di entrambe. Non legati al
// tema Ocean: solo l'interruttore condiviso decide se si vedono, su qualunque tema.
@Component({
  selector: 'app-world-fish',
  standalone: true,
  templateUrl: './world-fish.html'
})
export class WorldFish {
  protected readonly worldSettingsService = inject(WorldSettingsService);

  protected readonly fishes = computed<Fish[]>(() => {
    const selected = this.worldSettingsService.values().fish;
    const mode = selected && selected !== 'mix' ? (selected as FishKind) : null;
    return Array.from({ length: FISH_COUNT }, () => this.createFish(mode));
  });

  private createFish(mode: FishKind | null): Fish {
    return {
      kind: mode ?? (randomBetween(0, 1) > 0.5 ? 'octopus' : 'goldfish'),
      reverse: randomBetween(0, 1) > 0.5,
      y: Number(randomBetween(45, 88).toFixed(2)),
      size: Number(randomBetween(2.2, 3.8).toFixed(2)),
      opacity: Number(randomBetween(0.55, 0.9).toFixed(2)),
      bob: Number(randomBetween(10, 26).toFixed(1)),
      swimDuration: Number(randomBetween(18, 34).toFixed(2)),
      swimDelay: Number(randomBetween(0, 26).toFixed(2))
    };
  }
}
