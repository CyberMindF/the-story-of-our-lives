import { Component, inject } from '@angular/core';
import { AppShell } from '../../shell/app-shell';
import { WorldSettingKey, WorldSettingsService } from '../../core/world-settings.service';
import { MOON_PHASE_LABEL } from '../../shared/moon-phase';

// Interruttori condivisi degli effetti del Mondo Bianco (backlog #a3/#a5): chi li accende o
// spegne li vede cambiare anche l'altro, non è una preferenza per dispositivo come il tema.
@Component({
  selector: 'app-impostazioni-mondo',
  standalone: true,
  imports: [AppShell],
  styleUrls: ['../../../styles/pages/impostazioni-mondo.css'],
  templateUrl: './impostazioni-mondo.html'
})
export class ImpostazioniMondo {
  protected readonly worldSettingsService = inject(WorldSettingsService);
  // Indice + etichetta, per il <select> del selettore di fase — riusabile anche da #a4 in
  // futuro, stessa lista di MOON_PHASE_LABEL.
  protected readonly moonPhaseOptions = MOON_PHASE_LABEL.map((label, index) => ({ index, label }));

  protected toggleSetting(key: WorldSettingKey, event: Event): void {
    const enabled = (event.target as HTMLInputElement).checked;
    void this.worldSettingsService.set(key, enabled);
  }

  protected setMoonPhase(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    void this.worldSettingsService.setValue('moon', value);
  }
}
