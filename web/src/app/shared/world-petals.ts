import { Component, computed, inject } from '@angular/core';
import { WorldSettingsService } from '../core/world-settings.service';
import { randomBetween } from './random';

const PETAL_COUNT = 22;

export type PetalKind = 'daisy' | 'pink' | 'rose';
export const PETAL_KIND_LABEL: Record<PetalKind, string> = {
  pink: 'Fiori rosa',
  daisy: 'Margherite',
  rose: 'Petali di rosa'
};

interface Petal {
  kind: PetalKind;
  x: number;
  size: number;
  opacity: number;
  sway: number;
  rotateStart: number;
  rotateEnd: number;
  fallDuration: number;
  fallDelay: number;
}

// Tre forme (feedback di Rory): fiori rosa (emoji 🌸), margherite (emoji 🌼) e petali di rosa
// veri, disegnati in CSS puro (nessuna emoji di petalo esiste in Unicode). Selezionabili in
// Impostazioni del Mondo — una sola forma o "mix" delle tre, come il selettore di fase della
// luna (stesso schema: value in world_settings, non solo enabled). Stessa meccanica di caduta
// delle foglie ma più lenta e morbida — un petalo scende leggero, non tumultuoso. Non legati
// al tema Velvet (#b3-b): solo l'interruttore condiviso decide se si vedono.
@Component({
  selector: 'app-world-petals',
  standalone: true,
  templateUrl: './world-petals.html'
})
export class WorldPetals {
  protected readonly worldSettingsService = inject(WorldSettingsService);

  // computed, non un campo fisso: cambiare selettore rigenera subito il mazzo (anche le
  // posizioni casuali), coerente con come already funziona la fase della luna.
  protected readonly petals = computed<Petal[]>(() => {
    const selected = this.worldSettingsService.values().petals;
    const mode = selected && selected !== 'mix' ? (selected as PetalKind) : null;
    return Array.from({ length: PETAL_COUNT }, () => this.createPetal(mode));
  });

  private createPetal(mode: PetalKind | null): Petal {
    const rotateStart = randomBetween(-25, 25);
    return {
      kind: mode ?? this.randomKind(),
      x: Number(randomBetween(2, 98).toFixed(2)),
      size: Number(randomBetween(0.9, 1.6).toFixed(2)),
      opacity: Number(randomBetween(0.5, 0.85).toFixed(2)),
      sway: Number(randomBetween(10, 24).toFixed(1)),
      rotateStart: Number(rotateStart.toFixed(1)),
      rotateEnd: Number((rotateStart + randomBetween(50, 100) * (randomBetween(0, 1) > 0.5 ? 1 : -1)).toFixed(1)),
      fallDuration: Number(randomBetween(15, 27).toFixed(2)),
      fallDelay: Number(randomBetween(0, 18).toFixed(2))
    };
  }

  private randomKind(): PetalKind {
    const roll = randomBetween(0, 3);
    if (roll < 1) return 'daisy';
    if (roll < 2) return 'pink';
    return 'rose';
  }
}
