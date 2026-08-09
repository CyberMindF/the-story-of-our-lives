import { Injectable, signal } from '@angular/core';

export interface ThemeDefinition {
  id: string;
  label: string;
  swatch: string;
  icon: string;
}

const STORAGE_KEY = 'noi-crossword-theme-v15';
const DEFAULT_THEME_ID = 'the-white-world';

// Stessi 5 temi, stessa storageKey di assets/js/shared/theme.js — condivisa con tutte le
// pagine vecchie e nuove finché la migrazione non è completa, per non perdere la scelta
// dell'utente durante il passaggio.
const THEMES: ThemeDefinition[] = [
  { id: 'the-white-world', label: 'Notte', swatch: '#17243a', icon: '🌙' },
  { id: 'sea', label: 'Ocean', swatch: '#467d77', icon: '🌊' },
  { id: 'velvet', label: 'Velvet', swatch: '#5d4452', icon: '💜' },
  { id: 'red-of-you', label: 'Red of You', swatch: '#bf3553', icon: '❤️' },
  { id: 'green-of-me', label: 'Green of Me', swatch: '#486a53', icon: '💚' }
];

// Porting di assets/js/shared/theme.js: stessa persistenza (localStorage) e stessa
// applicazione (document.body.dataset.theme, letto dalle custom properties in themes.css),
// ma stato esposto come signal invece che tramite manipolazione diretta del DOM dei bottoni.
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly themes: readonly ThemeDefinition[] = THEMES;
  readonly activeThemeId = signal<string>(DEFAULT_THEME_ID);

  // Applica il tema salvato senza riscrivere localStorage durante il caricamento.
  applySavedTheme(): void {
    const savedTheme = localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME_ID;
    this.applyTheme(savedTheme, { persist: false });
  }

  // Applica un tema noto, usando il tema di default come fallback e persistendo la scelta quando richiesto.
  applyTheme(themeId: string, options: { persist?: boolean } = {}): void {
    const theme =
      THEMES.find((entry) => entry.id === themeId) ??
      THEMES.find((entry) => entry.id === DEFAULT_THEME_ID) ??
      THEMES[0];

    document.body.dataset['theme'] = theme.id;
    this.activeThemeId.set(theme.id);

    if (options.persist !== false) {
      localStorage.setItem(STORAGE_KEY, theme.id);
    }
  }
}
