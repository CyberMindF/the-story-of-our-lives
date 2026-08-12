import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppShell } from '../../shell/app-shell';
import { EditorialText } from '../../shared/editorial-text/editorial-text';

// Porting di templates/pages/il-prezzo-della-verita.content.html — interamente statico.
@Component({
  selector: 'app-il-prezzo-della-verita',
  standalone: true,
  imports: [RouterLink, AppShell, EditorialText],
  styleUrls: ['../../../styles/pages/tavolo.css'],
  templateUrl: './il-prezzo-della-verita.html'
})
export class IlPrezzoDellaVerita {}
