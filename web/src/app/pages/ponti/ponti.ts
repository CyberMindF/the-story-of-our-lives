import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppShell } from '../../shell/app-shell';
import { EditorialText } from '../../shared/editorial-text/editorial-text';

// Porting di templates/pages/ponti.content.html — interamente statico, nessun JS di pagina.
@Component({
  selector: 'app-ponti',
  standalone: true,
  imports: [RouterLink, AppShell, EditorialText],
  styleUrls: ['../../../styles/pages/ponti.css'],
  templateUrl: './ponti.html'
})
export class Ponti {}
