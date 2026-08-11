import { Component, computed, inject } from '@angular/core';
import { WorldSettingsService } from '../core/world-settings.service';
import { MoonDisc } from './moon-disc';
import { moonPhaseLabel, resolveMoonPhaseFraction } from './moon-phase';

// Un solo elemento fisso (non 150 come le stelle, non 50 come le lanterne): la luna è una
// sola. La resa vera e propria (la sfera con la fase) vive in MoonDisc, condivisa con la
// pagina "Il Cielo" (#a4) — qui c'è solo il posizionamento fisso in un angolo e la lettura
// delle impostazioni condivise.
@Component({
  selector: 'app-world-moon',
  standalone: true,
  imports: [MoonDisc],
  templateUrl: './world-moon.html'
})
export class WorldMoon {
  protected readonly worldSettingsService = inject(WorldSettingsService);

  protected readonly phaseFraction = computed(() => resolveMoonPhaseFraction(this.worldSettingsService.values().moon));
  protected readonly label = computed(() => moonPhaseLabel(this.phaseFraction()));
}
