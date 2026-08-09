import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppShell } from '../../shell/app-shell';

// Porting di templates/pages/tavolo-da-gioco.content.html — interamente statico.
@Component({
  selector: 'app-tavolo-da-gioco',
  standalone: true,
  imports: [RouterLink, AppShell],
  styleUrls: ['../../../styles/pages/tavolo.css'],
  templateUrl: './tavolo-da-gioco.html'
})
export class TavoloDaGioco {}
