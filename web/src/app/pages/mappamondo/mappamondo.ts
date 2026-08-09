import { Component } from '@angular/core';
import { AppShell } from '../../shell/app-shell';

// Porting di templates/pages/mappamondo.content.html — interamente statico (assets/js/mappamondo/
// è vuota, confermato in Fase 4). Testo narrativo riportato parola per parola.
@Component({
  selector: 'app-mappamondo',
  standalone: true,
  imports: [AppShell],
  styleUrls: ['../../../styles/pages/mappamondo.css'],
  templateUrl: './mappamondo.html'
})
export class Mappamondo {}
