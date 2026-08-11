import { Component, inject } from '@angular/core';
import { WorldSettingsService } from '../core/world-settings.service';

// Onde del mare (#b3-b): sostituisce le conchiglie di #b3-a, non piaciute a Rory. Tre livelli
// fissi (non N elementi casuali come gli altri effetti — un'onda non è un elemento che si
// ripete a caso, è una forma continua), stessa forma SVG per tutti e tre, differenziati da
// velocità/opacità/altezza per dare profondità. Non legato al tema Ocean (#b3-b): solo
// l'interruttore condiviso decide se si vede, su qualunque tema.
@Component({
  selector: 'app-world-waves',
  standalone: true,
  templateUrl: './world-waves.html'
})
export class WorldWaves {
  protected readonly worldSettingsService = inject(WorldSettingsService);
}
