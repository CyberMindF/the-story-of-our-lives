import { Component, inject } from '@angular/core';
import { ThemeService } from '../core/theme.service';
import { randomBetween } from './random';

const LANTERN_COUNT = 8;
// Solo nel tema Notte: è il cielo storico del sito, lo stesso a cui appartiene il riferimento
// (festa notturna degli npc/lanterne di Terraria, la notte delle lanterne in Thailandia) — vedi
// prossimi sviluppi.md #a3.
const LANTERN_THEME_ID = 'the-white-world';

interface Lantern {
  x: number;
  size: number;
  opacity: number;
  sway: number;
  riseDuration: number;
  riseDelay: number;
}

// Poche lanterne (8) con ritardi molto distribuiti (fino a 50s su un ciclo di ~25-40s ciascuna):
// l'effetto voluto è "ogni tanto ne sale una", non un flusso continuo che distrarrebbe dal
// contenuto della pagina.
@Component({
  selector: 'app-world-lanterns',
  standalone: true,
  templateUrl: './world-lanterns.html'
})
export class WorldLanterns {
  protected readonly themeService = inject(ThemeService);
  protected readonly lanternThemeId = LANTERN_THEME_ID;
  protected readonly lanterns: Lantern[] = Array.from({ length: LANTERN_COUNT }, () => this.createLantern());

  private createLantern(): Lantern {
    return {
      x: Number(randomBetween(5, 95).toFixed(2)),
      size: Number(randomBetween(1.4, 2.4).toFixed(2)),
      opacity: Number(randomBetween(0.55, 0.9).toFixed(2)),
      sway: Number(randomBetween(18, 42).toFixed(1)),
      riseDuration: Number(randomBetween(24, 40).toFixed(2)),
      riseDelay: Number(randomBetween(0, 50).toFixed(2))
    };
  }
}
