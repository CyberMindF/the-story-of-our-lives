import { Injectable, inject, signal } from '@angular/core';
import { WorldSettingKey, WorldSettingsService } from './world-settings.service';

export interface ThemeDefinition {
  id: string;
  label: string;
  swatch: string;
  icon: 'night' | 'ocean' | 'velvet' | 'letter' | 'pearl' | 'heart';
  iconText?: string;
  description: string;
}

const STORAGE_KEY = 'noi-crossword-theme-v15';
const DEFAULT_THEME_ID = 'the-white-world';

// Ogni tema è un vero preset (#b3-b, chiarito da Rory dopo il primo tentativo — "tipo ocean
// disattiva tutto tranne mare"): scegliere un tema accende i suoi effetti e spegne tutti gli
// altri, luna/stelle/lanterne comprese — non solo "riaccende il proprio lasciando il resto
// invariato" come nella prima versione. Restano comunque liberi da riaccendere a mano dopo,
// il preset decide solo lo stato iniziale al momento della scelta.
const ALL_EFFECT_KEYS: WorldSettingKey[] = ['lanterns', 'stars', 'shootingStars', 'moon', 'sparkles', 'leaves', 'waves', 'petals', 'fish', 'bubbles', 'hearts', 'pearlShimmers', 'silk'];
const THEME_PRESET: Record<string, WorldSettingKey[]> = {
  'the-white-world': ['lanterns', 'stars', 'shootingStars', 'moon', 'pearlShimmers'],
  'red-of-you': ['sparkles'],
  'green-of-me': ['leaves'],
  sea: ['waves', 'fish', 'bubbles'],
  velvet: ['petals'],
  'white-world': ['silk'],
  love: ['hearts']
};

// Unico registro dei temi mostrati dal selettore; la storageKey resta invariata per non
// perdere la scelta già salvata quando vengono aggiunti nuovi temi.
const THEMES: ThemeDefinition[] = [
  {
    id: 'the-white-world',
    label: 'Night Sky',
    swatch: '#141f32',
    icon: 'night',
    description: 'Blu profondo e cielo notturno.'
  },
  {
    id: 'sea',
    label: 'Ocean',
    swatch: '#467d77',
    icon: 'ocean',
    description: 'Luce chiara e colori marini.'
  },
  {
    id: 'velvet',
    label: 'Velvet',
    swatch: '#5d4452',
    icon: 'velvet',
    description: 'Viola scuro, tranquillo e notturno.'
  },
  {
    id: 'red-of-you',
    label: 'Red of You',
    swatch: '#bf3553',
    icon: 'letter',
    iconText: 'D',
    description: 'Il tuo rosso, caldo e acceso.'
  },
  {
    id: 'green-of-me',
    label: 'Green of Me',
    swatch: '#486a53',
    icon: 'letter',
    iconText: 'R',
    description: 'Il mio verde, calmo e profondo.'
  },
  {
    id: 'white-world',
    label: 'White World',
    swatch: '#eee9df',
    icon: 'pearl',
    description: 'Bianco perla, avorio e luce morbida.'
  },
  {
    id: 'love',
    label: 'Love',
    swatch: '#dc8294',
    icon: 'heart',
    description: 'Fragola, panna e rosa delicato.'
  }
];

// Porting di assets/js/shared/theme.js: stessa applicazione (document.body.dataset.theme,
// letto dalle custom properties in themes.css), stato esposto come signal.
//
// Il tema è condiviso tra i due account (#a8, 11/08/2026): world_settings è la fonte di
// verità, localStorage resta solo come cache dell'ultimo tema noto per applicarlo prima del
// primo paint (script inline in index.html, prima ancora che Angular carichi) — senza quella
// cache tornerebbe il lampo di colore sbagliato del bug #12. Nessun push in tempo reale:
// l'altro account vede il cambio al prossimo caricamento/navigazione (stesso schema di
// WorldSettingsService).
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly worldSettingsService = inject(WorldSettingsService);

  readonly themes: readonly ThemeDefinition[] = THEMES;
  readonly activeThemeId = signal<string>(DEFAULT_THEME_ID);

  // Applica il tema in cache locale, senza toccare localStorage né il server — chiamato
  // all'avvio, prima ancora di sapere se world_settings ha un valore più recente.
  applySavedTheme(): void {
    const savedTheme = localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME_ID;
    this.applyTheme(savedTheme, { persistLocal: false, persistRemote: false });
  }

  // Da chiamare dopo WorldSettingsService.load(): se il server ha un tema diverso da quello
  // appena applicato dalla cache locale (es. l'altro account l'ha cambiato dall'ultima
  // visita), lo applica e aggiorna la cache — senza rimandarlo al server, verrebbe da lì.
  applySharedTheme(): void {
    const shared = this.worldSettingsService.values()['theme'];
    if (shared && shared !== this.activeThemeId()) {
      this.applyTheme(shared, { persistRemote: false });
    }
  }

  // Applica soltanto la palette scelta. Gli effetti restano invariati: il selettore semplice
  // usa questo metodo, mentre le card richiamano applyPreset subito sotto.
  applyTheme(themeId: string, options: { persistLocal?: boolean; persistRemote?: boolean } = {}): void {
    const theme =
      THEMES.find((entry) => entry.id === themeId) ??
      THEMES.find((entry) => entry.id === DEFAULT_THEME_ID) ??
      THEMES[0];

    document.body.dataset['theme'] = theme.id;
    this.activeThemeId.set(theme.id);

    if (options.persistLocal !== false) {
      localStorage.setItem(STORAGE_KEY, theme.id);
    }
    if (options.persistRemote !== false) {
      void this.worldSettingsService.setValue('theme', theme.id);
    }
  }

  // Le card sono preset completi: cambiano la palette e riallineano tutti gli effetti alla
  // configurazione consigliata. È volutamente distinto da applyTheme.
  applyPreset(themeId: string): void {
    this.applyTheme(themeId);
    const preset = THEME_PRESET[this.activeThemeId()] ?? [];
    for (const key of ALL_EFFECT_KEYS) {
      void this.worldSettingsService.set(key, preset.includes(key));
    }
  }
}
