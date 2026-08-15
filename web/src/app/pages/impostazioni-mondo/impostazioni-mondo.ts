import { Component, computed, inject } from '@angular/core';
import { AppShell } from '../../shell/app-shell';
import { AuthService } from '../../core/auth.service';
import { CleanModeService } from '../../core/clean-mode.service';
import { WorldSettingKey, WorldSettingsService } from '../../core/world-settings.service';
import { MOON_PHASE_LABEL } from '../../shared/moon-phase';
import { PETAL_KIND_LABEL, PetalKind } from '../../shared/world-petals';
import { FISH_KIND_LABEL, FishKind } from '../../shared/world-fish';
import { ThemeSwitcher } from '../../shared/theme-switcher';
import { AppSelect, AppSelectOption } from '../../shared/app-select/app-select';
import { EditorialText } from '../../shared/editorial-text/editorial-text';
import { HEART_COLOR_LABEL, HeartColor } from '../../shared/world-hearts';
import { STICKER_KIND_LABEL, StickerKind, resolveStickerKinds } from '../../shared/world-stickers';
import { isLightTheme, ThemeService } from '../../core/theme.service';

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
  protected readonly themeService = inject(ThemeService);
  protected readonly authService = inject(AuthService);
  protected readonly cleanModeService = inject(CleanModeService);
  protected readonly themeOptions: readonly AppSelectOption[] = this.themeService.themes.map((theme) => ({
    value: theme.id,
    label: theme.label
  }));
  // #e13: nei temi chiari il toggle "luna" diventa "sole" (niente fasi, il sole non ne ha).
  protected readonly isSun = computed(() => isLightTheme(this.themeService.activeThemeId()));
  // Stessa lista di fasi già riusata da #a4, convertita nel formato del selettore condiviso.
  protected readonly moonPhaseOptions: readonly AppSelectOption[] = [
    { value: 'auto', label: 'Fase reale di oggi (automatica)' },
    ...MOON_PHASE_LABEL.map((label, index) => ({ value: String(index), label }))
  ];
  protected readonly petalKindOptions: readonly AppSelectOption[] = [
    { value: 'mix', label: 'Fiori misti' },
    ...Object.entries(PETAL_KIND_LABEL).map(([value, label]) => ({ value: value as PetalKind, label }))
  ];
  protected readonly fishKindOptions: readonly AppSelectOption[] = [
    { value: 'mix', label: 'Pesci misti' },
    ...Object.entries(FISH_KIND_LABEL).map(([value, label]) => ({ value: value as FishKind, label }))
  ];
  protected readonly heartColorOptions: readonly AppSelectOption[] = [
    { value: 'mix', label: 'Cuori misti' },
    ...Object.entries(HEART_COLOR_LABEL).map(([value, label]) => ({ value: value as HeartColor, label }))
  ];
  // Tutte le chiavi che sono un'animazione/effetto vero e proprio: esclude 'theme', che non è
  // un toggle di questa pagina (il tema si cambia con ThemeSwitcher, non con toggleSetting).
  private readonly effectKeys: readonly WorldSettingKey[] = [
    'lanterns', 'stars', 'shootingStars', 'moon', 'sparkles', 'leaves', 'waves', 'petals',
    'fish', 'bubbles', 'hearts', 'pearlShimmers', 'silk', 'stickers', 'balloons', 'fireworks'
  ];

  protected readonly stickerKinds: readonly StickerKind[] = Object.keys(STICKER_KIND_LABEL) as StickerKind[];
  protected readonly stickerKindLabel = STICKER_KIND_LABEL;
  protected readonly auroraColorOptions: readonly AppSelectOption[] = [
    { value: 'green', label: 'Verde' },
    { value: 'blue', label: 'Azzurra' },
    { value: 'magenta', label: 'Magenta' },
    { value: 'mix', label: 'Colori misti' }
  ];

  protected toggleCleanMode(event: Event): void {
    this.cleanModeService.setForced((event.target as HTMLInputElement).checked);
  }

  protected async disableAllEffects(): Promise<void> {
    await Promise.all(this.effectKeys.map((key) => this.worldSettingsService.set(key, false)));
  }

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

  protected setHeartColor(value: string): void {
    void this.worldSettingsService.setValue('hearts', value);
  }

  protected setAuroraColor(value: string): void {
    void this.worldSettingsService.setValue('pearlShimmers', value);
  }

  protected isStickerKindChecked(kind: StickerKind): boolean {
    return resolveStickerKinds(this.worldSettingsService.values().stickers).includes(kind);
  }

  protected areAllStickerKindsChecked(): boolean {
    return resolveStickerKinds(this.worldSettingsService.values().stickers).length === this.stickerKinds.length;
  }

  // Checkbox indipendenti, non un select "forma/mix" come i fiori: qui si può scegliere
  // qualunque sottoinsieme (#e3), "none" incluso — a differenza di petals/fish/hearts, dove
  // "vuoto" non è un valore rappresentabile, qui lo è esplicitamente (bottone "Tutte").
  protected toggleStickerKind(kind: StickerKind, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const current = resolveStickerKinds(this.worldSettingsService.values().stickers);
    const next = checked ? [...current, kind] : current.filter((existing) => existing !== kind);
    void this.worldSettingsService.setValue('stickers', this.stickerValueFor(next));
  }

  protected toggleAllStickerKinds(): void {
    const next = this.areAllStickerKindsChecked() ? [] : this.stickerKinds;
    void this.worldSettingsService.setValue('stickers', this.stickerValueFor([...next]));
  }

  private stickerValueFor(kinds: StickerKind[]): string {
    if (kinds.length === 0) return 'none';
    if (kinds.length === this.stickerKinds.length) return 'all';
    return kinds.join(',');
  }

}
