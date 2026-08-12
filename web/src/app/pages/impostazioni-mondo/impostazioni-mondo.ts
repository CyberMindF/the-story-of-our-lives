import { Component, inject } from '@angular/core';
import { AppShell } from '../../shell/app-shell';
import { WorldSettingKey, WorldSettingsService } from '../../core/world-settings.service';
import { MOON_PHASE_LABEL } from '../../shared/moon-phase';
import { PETAL_KIND_LABEL, PetalKind } from '../../shared/world-petals';
import { FISH_KIND_LABEL, FishKind } from '../../shared/world-fish';
import { ThemeSwitcher } from '../../shared/theme-switcher';
import { AppSelect, AppSelectOption } from '../../shared/app-select/app-select';
import { EditorialText } from '../../shared/editorial-text/editorial-text';

// Tutto ciò che si vede nel Mondo Bianco e che prima o poi è diventato condivisibile: gli
// effetti del cielo (#a3/#a5/#a6) e, da #a8, anche il tema stesso — chi li cambia qui li
// cambia per tutti e due, non è una preferenza per dispositivo.
@Component({
  selector: 'app-impostazioni-mondo',
  standalone: true,
  imports: [AppShell, ThemeSwitcher, AppSelect, EditorialText],
  styleUrls: ['../../../styles/pages/impostazioni-mondo.css'],
  templateUrl: './impostazioni-mondo.html'
})
export class ImpostazioniMondo {
  protected readonly worldSettingsService = inject(WorldSettingsService);
  // Stessa lista di fasi già riusata da #a4, convertita nel formato del selettore condiviso.
  protected readonly moonPhaseOptions: readonly AppSelectOption[] = [
    { value: 'auto', label: 'Fase reale di oggi (automatica)' },
    ...MOON_PHASE_LABEL.map((label, index) => ({ value: String(index), label }))
  ];
  protected readonly petalKindOptions: readonly AppSelectOption[] = Object.entries(PETAL_KIND_LABEL)
    .map(([value, label]) => ({ value: value as PetalKind, label }));
  protected readonly fishKindOptions: readonly AppSelectOption[] = Object.entries(FISH_KIND_LABEL)
    .map(([value, label]) => ({ value: value as FishKind, label }));

  protected toggleSetting(key: WorldSettingKey, event: Event): void {
    const enabled = (event.target as HTMLInputElement).checked;
    void this.worldSettingsService.set(key, enabled);
  }

  protected setMoonPhase(value: string): void {
    void this.worldSettingsService.setValue('moon', value);
  }

  protected setPetalKind(value: string): void {
    void this.worldSettingsService.setValue('petals', value);
  }

  protected setFishKind(value: string): void {
    void this.worldSettingsService.setValue('fish', value);
  }
}
