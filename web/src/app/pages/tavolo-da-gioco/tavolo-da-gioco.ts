import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppShell } from '../../shell/app-shell';
import { EditorialText } from '../../shared/editorial-text/editorial-text';
import { SafeModeService, isSafeRoute } from '../../core/safe-mode.service';
import { WORLD_PLACES } from '../../core/world-places';

// Lo stesso elenco alimenta Tavolo, sidebar e Atlante.
@Component({
  selector: 'app-tavolo-da-gioco',
  standalone: true,
  imports: [RouterLink, AppShell, EditorialText],
  styleUrls: ['../../../styles/pages/tavolo.css'],
  templateUrl: './tavolo-da-gioco.html'
})
export class TavoloDaGioco {
  protected readonly safe = inject(SafeModeService);
  protected readonly games = computed(() => WORLD_PLACES.filter((place) => place.parentId === 'tavolo-da-gioco' && (!this.safe.enabled() || isSafeRoute(place.route || ''))));
}
