import { Component, OnInit, inject, signal } from '@angular/core';
import { AppShell } from '../../shell/app-shell';
import { IpdvNavigation } from '../../shared/ipdv-navigation/ipdv-navigation';
import { ContentMessage } from '../../shared/content-message/content-message';
import { FormSubmission } from '../../shared/form-submission/form-submission';

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
  providers: [FormSubmission],
  styleUrls: ['../../../styles/pages/tavolo.css'],
  templateUrl: './avventura.html'
})
export class Avventura implements OnInit {
  protected readonly submission = inject(FormSubmission);
  protected readonly turns = signal<Turn[]>([]);
  protected readonly loadError = signal(false);

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
    await this.submission.submit(form, {
      url: '/api/gdr/turns',
      pendingMessage: 'Sto inviando...',
      successMessage: '',
      prepareData: (data) => data.set('adventure', ADVENTURE),
      afterSuccess: () => this.loadTurns()
    });
  }
}
