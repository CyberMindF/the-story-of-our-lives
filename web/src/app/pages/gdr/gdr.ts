import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppShell } from '../../shell/app-shell';
import { EditorialText } from '../../shared/editorial-text/editorial-text';

// Porting di templates/pages/gdr.content.html — interamente statico.
@Component({
  selector: 'app-gdr',
  standalone: true,
  imports: [RouterLink, AppShell, EditorialText],
  styleUrls: ['../../../styles/pages/tavolo.css'],
  templateUrl: './gdr.html'
})
export class Gdr {}
