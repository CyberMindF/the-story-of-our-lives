import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppShell } from '../../shell/app-shell';

type SubmissionStatus = '' | 'success' | 'error';

// Porting fedele di assets/js/suggestions/main.js: stesso endpoint, stesso invio come
// FormData (non JSON, a differenza degli altri servizi già portati), stessi messaggi.
@Component({
  selector: 'app-suggerimenti',
  standalone: true,
  imports: [RouterLink, AppShell],
  styleUrls: ['../../../../asset-root/assets/css/pages/suggerimenti.css'],
  templateUrl: './suggerimenti.html'
})
export class Suggerimenti {
  protected readonly submitting = signal(false);
  protected readonly status = signal<SubmissionStatus>('');
  protected readonly statusMessage = signal('');

  protected async submit(form: HTMLFormElement): Promise<void> {
    this.submitting.set(true);
    this.status.set('');
    this.statusMessage.set('Sto conservando il tuo suggerimento...');

    try {
      const response = await fetch('/api/suggestions', {
        method: 'POST',
        credentials: 'same-origin',
        body: new FormData(form)
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || 'Invio non riuscito.');
      }

      form.reset();
      this.status.set('success');
      this.statusMessage.set(`Suggerimento ricevuto. Grazie, ${result.author}.`);
    } catch (error) {
      this.status.set('error');
      this.statusMessage.set(error instanceof Error ? error.message : 'Invio non riuscito.');
    } finally {
      this.submitting.set(false);
    }
  }
}
