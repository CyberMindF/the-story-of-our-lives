import { Component, inject } from '@angular/core';
import { AppShell } from '../../shell/app-shell';
import { FormStatus } from '../../shared/form-status/form-status';
import { FormSubmission } from '../../shared/form-submission/form-submission';

// Porting fedele di assets/js/suggestions/main.js: stesso endpoint, stesso invio come
// FormData (non JSON, a differenza degli altri servizi già portati), stessi messaggi.
@Component({
  selector: 'app-suggerimenti',
  standalone: true,
  imports: [AppShell, FormStatus],
  providers: [FormSubmission],
  styleUrls: ['../../../styles/pages/suggerimenti.css'],
  templateUrl: './suggerimenti.html'
})
export class Suggerimenti {
  protected readonly submission = inject(FormSubmission);

  protected async submit(form: HTMLFormElement): Promise<void> {
    await this.submission.submit(form, {
      url: '/api/suggestions',
      pendingMessage: 'Sto conservando il tuo suggerimento...',
      successMessage: (result) => `Suggerimento ricevuto. Grazie, ${String(result['author'] || '')}.`
    });
  }
}
