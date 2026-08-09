import { Component, inject } from '@angular/core';
import { ThemeService } from '../core/theme.service';

// Porting della parte visuale di assets/js/shared/theme.js (renderSwitcher/updateButtons),
// stesse classi CSS (.theme-switcher/.theme-chip/.is-selected) lette da world-shell.css.
//
// Deviazione nota rispetto all'originale: qui manca ancora il toast mobile ("Tema X" per
// 2.2s sotto i 640px) — funzione secondaria, rimandata a un passaggio successivo per non
// appesantire la Fase 2 (shell/temi di base). Il cambio tema funziona comunque in pieno.
@Component({
  selector: 'app-theme-switcher',
  standalone: true,
  templateUrl: './theme-switcher.html'
})
export class ThemeSwitcher {
  protected readonly themeService = inject(ThemeService);
}
