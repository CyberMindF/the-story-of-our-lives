import { Component, inject } from '@angular/core';
import { AppShell } from '../../shell/app-shell';
import { WorldSettingKey, WorldSettingsService } from '../../core/world-settings.service';
import { MOON_PHASE_LABEL } from '../../shared/moon-phase';
import { PETAL_KIND_LABEL, PetalKind } from '../../shared/world-petals';
import { ThemeSwitcher } from '../../shared/theme-switcher';

// Tutto ciò che si vede nel Mondo Bianco e che prima o poi è diventato condivisibile: gli
// effetti del cielo (#a3/#a5/#a6) e, da #a8, anche il tema stesso — chi li cambia qui li
// cambia per tutti e due, non è una preferenza per dispositivo.
@Component({
  selector: 'app-impostazioni-mondo',
  standalone: true,
  imports: [AppShell, ThemeSwitcher],
  styleUrls: ['../../../styles/pages/impostazioni-mondo.css'],
  templateUrl: './impostazioni-mondo.html'
})
export class ImpostazioniMondo {
  protected readonly worldSettingsService = inject(WorldSettingsService);
  // Indice + etichetta, per il <select> del selettore di fase — riusabile anche da #a4 in
  // futuro, stessa lista di MOON_PHASE_LABEL.
  protected readonly moonPhaseOptions = MOON_PHASE_LABEL.map((label, index) => ({ index, label }));
  protected readonly petalKindOptions = Object.entries(PETAL_KIND_LABEL) as [PetalKind, string][];

  protected toggleSetting(key: WorldSettingKey, event: Event): void {
    const enabled = (event.target as HTMLInputElement).checked;
    void this.worldSettingsService.set(key, enabled);
  }

  protected setMoonPhase(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    void this.worldSettingsService.setValue('moon', value);
  }

  protected setPetalKind(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    void this.worldSettingsService.setValue('petals', value);
  }
}
