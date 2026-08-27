import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';

export type WorldSettingKey = 'lanterns' | 'stars' | 'shootingStars' | 'moon' | 'theme' | 'sparkles' | 'leaves' | 'waves' | 'petals' | 'fish' | 'bubbles' | 'hearts' | 'pearlShimmers' | 'silk' | 'stickers' | 'balloons' | 'fireworks';

interface WorldSettingsResponse {
  settings?: Record<string, boolean>;
  values?: Record<string, string>;
  error?: string;
}

// v2 scarta la vecchia cache che poteva contenere tutti gli effetti accesi. In assenza di
// uno stato già caricato, la prima schermata deve essere calma: solo la Seta è visibile.
const CACHE_KEY = 'noi-world-settings-cache-v2';

interface SettingsCache {
  settings: Partial<Record<WorldSettingKey, boolean>>;
  values: Partial<Record<WorldSettingKey, string>>;
}

// Cache locale dell'ultimo stato noto (stesso principio di ThemeService.STORAGE_KEY): letta
// una sola volta, all'avvio, per evitare che al refresh gli effetti "flashino" tutti accesi
// per un istante (il default true di settings sotto) prima che arrivi la vera risposta dal
// server. Non è mai la fonte di verità, solo un valore di partenza plausibile.
function readCache(): SettingsCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as SettingsCache) : null;
  } catch {
    return null;
  }
}

function writeCache(cache: SettingsCache): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Storage pieno o non disponibile: la cache resta solo un'ottimizzazione, non un requisito.
  }
}

// Interruttori condivisi tra i due account (non per dispositivo come il tema, vedi
// ThemeService): chi li accende/spegne li vede cambiare anche per l'altro. Il bootstrap e il
// canale realtime rileggono entrambi questa stessa fonte, senza duplicare lo stato condiviso.
@Injectable({ providedIn: 'root' })
export class WorldSettingsService {
  private readonly api = inject(ApiService);

  // Stato visivo sicuro prima della risposta del server: White World usa soltanto la Seta.
  // La cache dell'ultimo stato condiviso può poi sostituirlo senza mostrare, al primo accesso,
  // tutti gli effetti contemporaneamente.
  readonly settings = signal<Record<WorldSettingKey, boolean>>({
    lanterns: false,
    stars: false,
    shootingStars: false,
    moon: false,
    theme: true,
    sparkles: false,
    leaves: false,
    waves: false,
    petals: false,
    fish: false,
    bubbles: false,
    hearts: false,
    pearlShimmers: false,
    silk: true,
    stickers: false,
    balloons: false,
    fireworks: false,
    ...readCache()?.settings
  });
  // Solo alcune chiavi hanno un value (es. la fase della luna o la forma dei fiori, "auto"/
  // "mix" di default finché non arriva la risposta del server).
  readonly values = signal<Partial<Record<WorldSettingKey, string>>>({
    moon: 'auto',
    petals: 'mix',
    fish: 'mix',
    hearts: 'mix',
    pearlShimmers: 'green',
    stickers: 'all',
    ...readCache()?.values
  });

  async load(): Promise<boolean> {
    try {
      const response = await fetch('/api/world-settings', {
        method: 'GET',
        credentials: 'same-origin',
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) return false;

      const result = (await this.api.readApiResponse<WorldSettingsResponse>(response)) as WorldSettingsResponse;
      if (result.settings) {
        this.settings.set({ ...this.settings(), ...result.settings } as Record<WorldSettingKey, boolean>);
      }
      if (result.values) {
        this.values.set({ ...this.values(), ...result.values });
      }
      writeCache({ settings: this.settings(), values: this.values() });
      return true;
    } catch (error) {
      console.warn('Impossibile caricare le impostazioni del mondo:', error);
      return false;
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
    } else {
      writeCache({ settings: this.settings(), values: this.values() });
    }
    return saved;
  }

  // Aggiorna il "value" di una chiave (es. la fase scelta per la luna) mantenendo invariato
  // enabled — il server tiene comunque enabled esplicito a ogni richiesta, quindi lo si rilegge
  // qui dallo stato corrente invece di lasciarlo implicito.
  async setValue(key: WorldSettingKey, value: string): Promise<boolean> {
    const previous = this.values();
    this.values.set({ ...previous, [key]: value });

    const saved = await this.api.sendAuthenticatedJson('/api/world-settings', {
      key,
      enabled: this.settings()[key],
      value
    });
    if (!saved) {
      this.values.set(previous);
    } else {
      writeCache({ settings: this.settings(), values: this.values() });
    }
    return saved;
  }
}
