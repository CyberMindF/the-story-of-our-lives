import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';

export type WorldSettingKey = 'lanterns' | 'stars' | 'moon';

interface WorldSettingsResponse {
  settings?: Record<string, boolean>;
  error?: string;
}

// Interruttori condivisi tra i due account (non per dispositivo come il tema, vedi
// ThemeService): chi li accende/spegne li vede cambiare anche per l'altro, al prossimo
// caricamento della pagina — nessun push in tempo reale, solo lettura al bootstrap dell'app
// (stesso schema di ThemeService.applySavedTheme, chiamato da App).
@Injectable({ providedIn: 'root' })
export class WorldSettingsService {
  private readonly api = inject(ApiService);

  // true finché non si dimostra il contrario: gli effetti restano visibili durante il primo
  // caricamento invece di lampeggiare "spenti" mentre la richiesta è in volo.
  readonly settings = signal<Record<WorldSettingKey, boolean>>({ lanterns: true, stars: true, moon: true });

  async load(): Promise<void> {
    try {
      const response = await fetch('/api/world-settings', {
        method: 'GET',
        credentials: 'same-origin',
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) return;

      const result = (await this.api.readApiResponse<WorldSettingsResponse>(response)) as WorldSettingsResponse;
      if (result.settings) {
        this.settings.set({ ...this.settings(), ...result.settings } as Record<WorldSettingKey, boolean>);
      }
    } catch (error) {
      console.warn('Impossibile caricare le impostazioni del mondo:', error);
    }
  }

  // Applica subito lato client (ottimistico) e conferma sul server; in caso di errore torna
  // al valore precedente, così l'interruttore in pagina non mente su cosa è stato salvato.
  async set(key: WorldSettingKey, enabled: boolean): Promise<boolean> {
    const previous = this.settings();
    this.settings.set({ ...previous, [key]: enabled });

    const saved = await this.api.sendAuthenticatedJson('/api/world-settings', { key, enabled });
    if (!saved) {
      this.settings.set(previous);
    }
    return saved;
  }
}
