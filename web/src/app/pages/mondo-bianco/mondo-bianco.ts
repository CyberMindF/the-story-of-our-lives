import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppShell } from '../../shell/app-shell';
import { AudioPlayer } from '../../shared/audio-player/audio-player';
import { EditorialText } from '../../shared/editorial-text/editorial-text';

// Porting di templates/pages/mondo-bianco.content.html — pagina interamente statica
// nell'originale (nessun assets/js/hub/*.js: la cartella esiste ma è vuota, confermato
// durante la Fase 4; l'hub gira solo sulla logica condivisa già dentro AppShell).
@Component({
  selector: 'app-mondo-bianco',
  standalone: true,
  imports: [RouterLink, AppShell, AudioPlayer, EditorialText],
  styleUrls: ['../../../styles/pages/world.css'],
  templateUrl: './mondo-bianco.html'
})
export class MondoBianco {
  // Stessa chiave già usata dalle Cuffiette: "Il Cerchio" è la stessa canzone, non serve
  // caricarla due volte su R2.
  protected readonly songUrl = '/api/media/cuffiette/canzoni/il-cerchio.mp3';
}
