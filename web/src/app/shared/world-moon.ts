import { Component, inject } from '@angular/core';
import { WorldSettingsService } from '../core/world-settings.service';
import { moonPhaseEmoji, moonPhaseFraction, moonPhaseLabel } from './moon-phase';

// Un solo elemento fisso (non 150 come le stelle, non 50 come le lanterne): la luna è una
// sola. Calcolata una volta sola al render, come le altre — non ha senso ricalcolarla più
// spesso di una volta per caricamento pagina, la fase cambia nell'ordine dei giorni.
@Component({
  selector: 'app-world-moon',
  standalone: true,
  templateUrl: './world-moon.html'
})
export class WorldMoon {
  protected readonly worldSettingsService = inject(WorldSettingsService);

  private readonly phaseFraction = moonPhaseFraction(new Date());
  protected readonly emoji = moonPhaseEmoji(this.phaseFraction);
  protected readonly label = moonPhaseLabel(this.phaseFraction);
}
