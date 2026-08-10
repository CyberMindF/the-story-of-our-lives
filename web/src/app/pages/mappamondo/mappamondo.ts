import { Component } from '@angular/core';
import { AppShell } from '../../shell/app-shell';
import { AudioPlayer } from '../../shared/audio-player/audio-player';

// Porting di templates/pages/mappamondo.content.html — interamente statico (assets/js/mappamondo/
// è vuota, confermato in Fase 4). Testo narrativo riportato parola per parola.
@Component({
  selector: 'app-mappamondo',
  standalone: true,
  imports: [AppShell, AudioPlayer],
  styleUrls: ['../../../styles/pages/mappamondo.css'],
  templateUrl: './mappamondo.html'
})
export class Mappamondo {
  protected readonly songUrl = '/api/media/mappamondo/audio/benjamin.mp3';
}
