import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppShell } from '../../shell/app-shell';

// Porting di templates/pages/mondo-bianco.content.html — pagina interamente statica
// nell'originale (nessun assets/js/hub/*.js: la cartella esiste ma è vuota, confermato
// durante la Fase 4; l'hub gira solo sulla logica condivisa già dentro AppShell).
@Component({
  selector: 'app-mondo-bianco',
  standalone: true,
  imports: [RouterLink, AppShell],
  styleUrls: ['../../../styles/pages/world.css'],
  templateUrl: './mondo-bianco.html'
})
export class MondoBianco {}
