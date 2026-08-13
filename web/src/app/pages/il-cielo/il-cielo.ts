import { Component, computed, inject } from '@angular/core';
import { AppShell } from '../../shell/app-shell';
import { isLightTheme, ThemeService } from '../../core/theme.service';
import { MoonDisc } from '../../shared/moon-disc';
import { moonPhaseFraction } from '../../shared/moon-phase';
import { EditorialText } from '../../shared/editorial-text/editorial-text';

// Pagina minimale (#a4): solo fermarsi a guardare il cielo, "solo noi e la luna". Qui la fase
// è sempre quella reale di oggi, non quella scelta a mano in Impostazioni del Mondo — questa
// pagina guarda il cielo vero, non una luna personalizzabile (quella è la piccola di sfondo,
// nascosta qui apposta, vedi world-atmosphere.css `body.sky-view-page .world-moon`).
@Component({
  selector: 'app-il-cielo',
  standalone: true,
  imports: [AppShell, MoonDisc, EditorialText],
  styleUrls: ['../../../styles/pages/il-cielo.css'],
  templateUrl: './il-cielo.html'
})
export class IlCielo {
  private readonly themeService = inject(ThemeService);

  protected readonly phaseFraction = moonPhaseFraction(new Date());
  // #e13: nei temi chiari (White World, Ocean, Love) mostra il sole al posto della luna.
  protected readonly isSun = computed(() => isLightTheme(this.themeService.activeThemeId()));
}
