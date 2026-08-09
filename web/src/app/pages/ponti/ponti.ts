import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppShell } from '../../shell/app-shell';

// Porting di templates/pages/ponti.content.html — interamente statico, nessun JS di pagina.
@Component({
  selector: 'app-ponti',
  standalone: true,
  imports: [RouterLink, AppShell],
  styleUrls: ['../../../../asset-root/assets/css/pages/ponti.css'],
  templateUrl: './ponti.html'
})
export class Ponti {}
