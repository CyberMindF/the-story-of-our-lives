import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppShell } from '../../shell/app-shell';
import { WorldSettingsService } from '../../core/world-settings.service';
import { MoonDisc } from '../../shared/moon-disc';
import { moonPhaseLabel, resolveMoonPhaseFraction } from '../../shared/moon-phase';

// Pagina minimale (#a4): solo fermarsi a guardare il cielo del Mondo Bianco. Stelle e
// lanterne di sfondo sono già globali (app.html, sempre presenti); qui c'è solo la luna,
// grande, al centro — stessa fase condivisa di Impostazioni del Mondo (world-moon.ts usa la
// stessa identica regola, resolveMoonPhaseFraction).
@Component({
  selector: 'app-il-cielo',
  standalone: true,
  imports: [AppShell, RouterLink, MoonDisc],
  styleUrls: ['../../../styles/pages/il-cielo.css'],
  templateUrl: './il-cielo.html'
})
export class IlCielo {
  private readonly worldSettingsService = inject(WorldSettingsService);

  protected readonly phaseFraction = computed(() => resolveMoonPhaseFraction(this.worldSettingsService.values().moon));
  protected readonly label = computed(() => moonPhaseLabel(this.phaseFraction()));
  protected readonly isAuto = computed(() => (this.worldSettingsService.values().moon ?? 'auto') === 'auto');
}
