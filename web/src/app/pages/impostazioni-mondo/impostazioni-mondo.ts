import { Component, inject } from '@angular/core';
import { AppShell } from '../../shell/app-shell';
import { WorldSettingKey, WorldSettingsService } from '../../core/world-settings.service';

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

  protected toggleSetting(key: WorldSettingKey, event: Event): void {
    const enabled = (event.target as HTMLInputElement).checked;
    void this.worldSettingsService.set(key, enabled);
  }
}
