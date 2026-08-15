import { Injectable, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

// Query param condiviso da AppShell (nasconde header/back-link) e dalle pagine che vogliono
// nascondere anche i propri bottoni/form in lettura pulita (es. Lettere). In più, un
// interruttore globale persistito (per ora attivabile solo da admin nella Stanza dei Bottoni)
// che forza la modalità su tutte le pagine senza dover aggiungere ?clean=1 a mano ogni volta.
const STORAGE_KEY = 'noi-clean-mode-v1';

@Injectable({ providedIn: 'root' })
export class CleanModeService {
  private readonly route = inject(ActivatedRoute);
  private readonly queryParamActive = this.route.snapshot.queryParamMap.get('clean') === '1';
  private readonly forced = signal(localStorage.getItem(STORAGE_KEY) === '1');

  readonly active = computed(() => this.queryParamActive || this.forced());

  setForced(enabled: boolean): void {
    this.forced.set(enabled);
    localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
  }
}
