import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppShell } from '../../shell/app-shell';

// Porting di templates/pages/il-prezzo-della-verita.content.html — interamente statico.
@Component({
  selector: 'app-il-prezzo-della-verita',
  standalone: true,
  imports: [RouterLink, AppShell],
  styleUrls: ['../../../../asset-root/assets/css/pages/tavolo.css'],
  templateUrl: './il-prezzo-della-verita.html'
})
export class IlPrezzoDellaVerita {}
