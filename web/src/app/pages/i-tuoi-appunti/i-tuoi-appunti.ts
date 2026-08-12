import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppShell } from '../../shell/app-shell';
import { IpdvNavigation } from '../../shared/ipdv-navigation/ipdv-navigation';
import { EditorialText } from '../../shared/editorial-text/editorial-text';

const ADVENTURE = 'il-prezzo-della-verita';
const SAVE_DEBOUNCE_MS = 800;

// Porting fedele dell'unico blocco di logica finora scritto come script inline nel vecchio
// manifest (scripts/world-pages.manifest.mjs, voce i-tuoi-appunti) invece che in un file .js
// vero — qui finalmente diventa un vero componente/servizio. Stesso comportamento: carica,
// poi salva in autosave con debounce di 800ms ad ogni input, stesso endpoint
// /api/gdr/notes?adventure=il-prezzo-della-verita.
@Component({
  selector: 'app-i-tuoi-appunti',
  standalone: true,
  imports: [FormsModule, AppShell, IpdvNavigation, EditorialText],
  styleUrls: ['../../../styles/pages/tavolo.css'],
  templateUrl: './i-tuoi-appunti.html'
})
export class ITuoiAppunti implements OnInit, OnDestroy {
  protected body = '';
  protected readonly disabled = signal(true);
  protected readonly statusMessage = signal('Sto caricando i tuoi appunti...');

  private saveTimeout: ReturnType<typeof setTimeout> | null = null;

  async ngOnInit(): Promise<void> {
    await this.loadNotes();
  }

  ngOnDestroy(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
  }

  private async loadNotes(): Promise<void> {
    this.disabled.set(true);
    this.statusMessage.set('Sto caricando i tuoi appunti...');

    try {
      const response = await fetch(`/api/gdr/notes?adventure=${ADVENTURE}`, { credentials: 'same-origin' });
      if (!response.ok) {
        throw new Error(`Caricamento fallito: ${response.status}`);
      }
      const data = (await response.json()) as { body?: string };
      this.body = data.body || '';
      this.statusMessage.set('');
    } catch (error) {
      console.error('Errore nel caricamento degli appunti:', error);
      this.statusMessage.set('Non è stato possibile caricare gli appunti salvati.');
    } finally {
      this.disabled.set(false);
    }
  }

  // Un input alla volta, con debounce — stesso ritmo dell'originale (nessun salvataggio ad
  // ogni singolo carattere, solo dopo 800ms di pausa nella digitazione).
  protected onInput(): void {
    this.statusMessage.set('Sto salvando...');
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => void this.saveNotes(), SAVE_DEBOUNCE_MS);
  }

  private async saveNotes(): Promise<void> {
    try {
      const formData = new FormData();
      formData.set('adventure', ADVENTURE);
      formData.set('body', this.body);
      const response = await fetch('/api/gdr/notes', { method: 'POST', credentials: 'same-origin', body: formData });
      if (!response.ok) {
        throw new Error(`Salvataggio fallito: ${response.status}`);
      }
      this.statusMessage.set('Salvato.');
    } catch (error) {
      console.error('Errore nel salvataggio degli appunti:', error);
      this.statusMessage.set('Non è stato possibile salvare, riprova.');
    }
  }
}
