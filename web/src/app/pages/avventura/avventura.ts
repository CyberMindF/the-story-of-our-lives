import { Component, OnInit, signal } from '@angular/core';
import { AppShell } from '../../shell/app-shell';
import { IpdvNavigation } from '../../shared/ipdv-navigation/ipdv-navigation';
import { ContentMessage } from '../../shared/content-message/content-message';

const ADVENTURE = 'il-prezzo-della-verita';

interface Turn {
  isMine: boolean;
  author: string;
  createdAt: string;
  body: string;
}

const dateFormatter = new Intl.DateTimeFormat('it-IT', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});

// Porting fedele di assets/js/gdr/avventura.js (il thread dei turni) + il testo narrativo
// statico di templates/pages/avventura.content.html. Endpoint invariato
// (/api/gdr/turns?adventure=il-prezzo-della-verita), stesso invio come FormData.
@Component({
  selector: 'app-avventura',
  standalone: true,
  imports: [AppShell, IpdvNavigation, ContentMessage],
  styleUrls: ['../../../styles/pages/tavolo.css'],
  templateUrl: './avventura.html'
})
export class Avventura implements OnInit {
  protected readonly turns = signal<Turn[]>([]);
  protected readonly loadError = signal(false);
  protected readonly submitting = signal(false);
  protected readonly statusMessage = signal('');

  async ngOnInit(): Promise<void> {
    await this.loadTurns();
  }

  protected formatDate(isoDate: string): string {
    return dateFormatter.format(new Date(isoDate));
  }

  private async loadTurns(): Promise<void> {
    try {
      const response = await fetch(`/api/gdr/turns?adventure=${ADVENTURE}`, { credentials: 'same-origin' });
      if (!response.ok) {
        throw new Error(`Caricamento fallito: ${response.status}`);
      }
      const data = (await response.json()) as { turns?: Turn[] };
      this.loadError.set(false);
      this.turns.set(data.turns || []);
    } catch (error) {
      console.error('Errore nel caricamento del turno:', error);
      this.loadError.set(true);
    }
  }

  protected async submitTurn(form: HTMLFormElement): Promise<void> {
    this.submitting.set(true);
    this.statusMessage.set('Sto inviando...');

    try {
      const formData = new FormData(form);
      formData.set('adventure', ADVENTURE);
      const response = await fetch('/api/gdr/turns', { method: 'POST', credentials: 'same-origin', body: formData });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || 'Invio non riuscito.');
      }

      form.reset();
      this.statusMessage.set('');
      await this.loadTurns();
    } catch (error) {
      this.statusMessage.set(error instanceof Error ? error.message : 'Invio non riuscito.');
    } finally {
      this.submitting.set(false);
    }
  }
}
