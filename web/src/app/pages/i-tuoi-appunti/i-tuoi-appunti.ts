import { Component } from '@angular/core';
import { AppShell } from '../../shell/app-shell';
import { IpdvNavigation } from '../../shared/ipdv-navigation/ipdv-navigation';
import { EditorialText } from '../../shared/editorial-text/editorial-text';
import { GdrNotesEditor } from '../../shared/gdr-notes/gdr-notes-editor';

// La logica di autosalvataggio vive ora in GdrNotesEditor (shared/gdr-notes/), riusata anche
// dal pannello di gioco della seconda avventura: questa pagina resta solo la cornice (hero +
// introduzione editoriale) attorno al componente condiviso.
@Component({
  selector: 'app-i-tuoi-appunti',
  standalone: true,
  imports: [AppShell, IpdvNavigation, EditorialText, GdrNotesEditor],
  styleUrls: ['../../../styles/pages/tavolo.css'],
  templateUrl: './i-tuoi-appunti.html'
})
export class ITuoiAppunti {}
