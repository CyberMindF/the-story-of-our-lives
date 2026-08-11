import { Component, computed, inject } from '@angular/core';
import { WorldSettingsService } from '../core/world-settings.service';
import { moonPhaseFraction, moonPhaseLabel, moonRenderParams } from './moon-phase';

// Un solo elemento fisso (non 150 come le stelle, non 50 come le lanterne): la luna è una
// sola. La fase reale di oggi si calcola una volta sola al render (non ha senso ricalcolarla
// più spesso di una volta per caricamento pagina); quella scelta manualmente invece è
// reattiva, segue il selettore nella pagina Impostazioni del Mondo.
@Component({
  selector: 'app-world-moon',
  standalone: true,
  templateUrl: './world-moon.html'
})
export class WorldMoon {
  protected readonly worldSettingsService = inject(WorldSettingsService);

  private readonly todayFraction = moonPhaseFraction(new Date());

  protected readonly phaseFraction = computed(() => {
    const selected = this.worldSettingsService.values().moon;
    if (selected && selected !== 'auto') {
      return Number(selected) / 8;
    }
    return this.todayFraction;
  });

  protected readonly label = computed(() => moonPhaseLabel(this.phaseFraction()));
  protected readonly render = computed(() => moonRenderParams(this.phaseFraction()));
}
