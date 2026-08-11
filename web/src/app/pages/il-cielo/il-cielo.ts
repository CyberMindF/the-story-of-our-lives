import { Component } from '@angular/core';
import { AppShell } from '../../shell/app-shell';
import { MoonDisc } from '../../shared/moon-disc';
import { moonPhaseFraction } from '../../shared/moon-phase';

// Pagina minimale (#a4): solo fermarsi a guardare il cielo, "solo noi e la luna". Qui la fase
// è sempre quella reale di oggi, non quella scelta a mano in Impostazioni del Mondo — questa
// pagina guarda il cielo vero, non una luna personalizzabile (quella è la piccola di sfondo,
// nascosta qui apposta, vedi world-atmosphere.css `body.sky-view-page .world-moon`).
@Component({
  selector: 'app-il-cielo',
  standalone: true,
  imports: [AppShell, MoonDisc],
  styleUrls: ['../../../styles/pages/il-cielo.css'],
  templateUrl: './il-cielo.html'
})
export class IlCielo {
  protected readonly phaseFraction = moonPhaseFraction(new Date());
}
